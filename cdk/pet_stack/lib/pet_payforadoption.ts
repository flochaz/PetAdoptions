import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';

// https://stackoverflow.com/questions/59710635/how-to-connect-aws-ecs-applicationloadbalancedfargateservice-private-ip-to-rds

export class PayForAdoptions extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const clusterAdmin = new iam.Role(this, 'AdminRole', {
            assumedBy: new iam.AccountRootPrincipal()
        });

        const vpc = new ec2.Vpc(this, 'pet_microservices_vpc', {
            cidr: '10.0.0.0/16',
            natGateways: 1,
            maxAzs: 2
        });

        const cluster = new ecs.Cluster(this, "pet-payforadoptions-cluster", {
            vpc: ec2.Vpc.fromVpcAttributes(this, 'petvpc', {
                vpcId: 'vpc-0129e52a9a8ccfbfa', availabilityZones: ['us-east-2a', 'us-east-2b'],
                publicSubnetIds: ['subnet-06432d897480d9154', 'subnet-0854709330a0834b1']
            }),
        });

        // const cluster = new ecs.Cluster(this, "pet-payforadoptions-cluster", {
        //     vpc: vpc
        // });

        const logging = new ecs.AwsLogDriver({
            streamPrefix: "ecs-logs"
        });

        const taskRole = new iam.Role(this, `ecs-taskRole-${this.stackName}`, {
            roleName: `ecs-taskRole-${this.stackName}`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        });

        // ***ECS Contructs***

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

        const taskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef", {
            taskRole: taskRole,
            cpu: 1024,
            memoryLimitMiB: 2048
        });

        taskDef.addToExecutionRolePolicy(executionRolePolicy);
        taskDef.addToTaskRolePolicy(executionRolePolicy);

        taskDef.executionRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonSQSFullAccess', 'arn:aws:iam::aws:policy/AmazonSQSFullAccess'));
        taskDef.executionRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonSNSFullAccess', 'arn:aws:iam::aws:policy/AmazonSNSFullAccess'));
        taskDef.executionRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonECSTaskExecutionRolePolicy', 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'));

        const payforadoptioncontainer = taskDef.addContainer('payforadoption', {
            image: ecs.ContainerImage.fromRegistry("831210339789.dkr.ecr.us-east-2.amazonaws.com/payforadoption:latest"),
            memoryLimitMiB: 256,
            cpu: 256,
            logging
        });

        // const payforadoptioncontainer = taskDef.addContainer('flask-app', {
        //     image: ecs.ContainerImage.fromRegistry("nikunjv/flask-image:blue"),
        //     memoryLimitMiB: 256,
        //     cpu: 256,
        //     logging
        //   });

        // const xraycontainer = taskDef.addContainer('xraydaemon', {
        //     image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
        //     memoryLimitMiB: 256,
        //     cpu: 256,
        //     logging
        // });

        payforadoptioncontainer.addPortMappings({
            containerPort: 80,
            protocol: ecs.Protocol.TCP
        });

        // xraycontainer.addPortMappings({
        //     containerPort: 2000,
        //     protocol: ecs.Protocol.TCP
        // });

        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "ecs-service", {
            cluster: cluster,
            taskDefinition: taskDef,
            publicLoadBalancer: true,
            desiredCount: 2,
            listenerPort: 80
        });

    }
}