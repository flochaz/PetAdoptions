import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';

// https://stackoverflow.com/questions/59710635/how-to-connect-aws-ecs-applicationloadbalancedfargateservice-private-ip-to-rds

export class PetListAdoptions extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // const clusterAdmin = new iam.Role(this, 'AdminRole', {
        //     assumedBy: new iam.AccountRootPrincipal()
        // });

        const theVPC = ec2.Vpc.fromVpcAttributes(this, 'petvpc', {
            vpcId: 'vpc-0129e52a9a8ccfbfa', availabilityZones: ['us-east-2a', 'us-east-2b'],
            publicSubnetIds: ['subnet-06432d897480d9154', 'subnet-0854709330a0834b1'],
            privateSubnetIds: ['subnet-04cd24ae468133970', 'subnet-0fa73a4e266c8f166']
        });

        const taskRole = new iam.Role(this, `ecs-taskRole-${this.stackName}`, {
            roleName: `ecs-taskRole-${this.stackName}`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        });

        const logging = new ecs.AwsLogDriver({
            streamPrefix: "ecs-logs"
        });

        const executionRolePolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ['*'],
            actions: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ]
        });

        const readSSMParamsPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ssm:GetParametersByPath',
                'ssm:GetParameters',
                'ssm:GetParameter'],
            resources: ['*']
        });

        // PetListAdoptions service definitions-----------------------------------------------------------------------

        const petListAdoptionsTaskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef", {
            taskRole: taskRole,
            cpu: 1024,
            memoryLimitMiB: 2048
        });

        petListAdoptionsTaskDef.addToExecutionRolePolicy(executionRolePolicy);

        petListAdoptionsTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonSQSFullAccess', 'arn:aws:iam::aws:policy/AmazonSQSFullAccess'));
        petListAdoptionsTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonSNSFullAccess', 'arn:aws:iam::aws:policy/AmazonSNSFullAccess'));
        petListAdoptionsTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonECSTaskExecutionRolePolicy', 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'));
        petListAdoptionsTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AWSXrayWriteOnlyAccess', 'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess'));
        petListAdoptionsTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonRDSFullAccess', 'arn:aws:iam::aws:policy/AmazonRDSFullAccess'));
        petListAdoptionsTaskDef.taskRole?.addToPolicy(readSSMParamsPolicy);
        
        petListAdoptionsTaskDef.addContainer('petlistadoption', {
            image: ecs.ContainerImage.fromRegistry("awsimaya/petlistadoptions:latest"),
            memoryLimitMiB: 256,
            cpu: 256,
            logging
        }).addPortMappings({
            containerPort: 80,
            protocol: ecs.Protocol.TCP
        });

        petListAdoptionsTaskDef.addContainer('xraydaemon', {
            image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
            memoryLimitMiB: 256,
            cpu: 256,
            logging
        }).addPortMappings({
            containerPort: 2000,
            protocol: ecs.Protocol.UDP
        });

        new ecs_patterns.ApplicationLoadBalancedFargateService(this, "PetListAdoption-service", {
            cluster: new ecs.Cluster(this, "PetListAdoption-cluster", {
                vpc: theVPC,
                containerInsights: true
            }),
            taskDefinition: petListAdoptionsTaskDef,
            publicLoadBalancer: true,
            desiredCount: 2,
            listenerPort: 80
        }).targetGroup.configureHealthCheck({
            path: '/health/status'
        });
    }
}