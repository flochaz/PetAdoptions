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
            vpc: vpc,
        });

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
                "logs:PutLogEvents"
            ]
        });

        const taskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef", {
            taskRole: taskRole
        });

        taskDef.addToExecutionRolePolicy(executionRolePolicy);

        const container = taskDef.addContainer('flask-app', {
            image: ecs.ContainerImage.fromRegistry("nikunjv/flask-image:blue"),
            memoryLimitMiB: 256,
            cpu: 256,
            logging
        });

        
        container.addPortMappings({
            containerPort: 5000,
            protocol: ecs.Protocol.TCP
        });

        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "ecs-service", {
            cluster: cluster,
            taskDefinition: taskDef,
            publicLoadBalancer: true,
            desiredCount: 2,
            listenerPort: 80
        });
       
    }
}