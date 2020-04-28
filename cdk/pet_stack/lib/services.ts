import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';

// https://stackoverflow.com/questions/59710635/how-to-connect-aws-ecs-applicationloadbalancedfargateservice-private-ip-to-rds

export class Services extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const theVPC = ec2.Vpc.fromVpcAttributes(this, 'petvpc', {
            vpcId: 'vpc-0129e52a9a8ccfbfa', availabilityZones: ['us-east-2a', 'us-east-2b'],
            publicSubnetIds: ['subnet-06432d897480d9154', 'subnet-0854709330a0834b1'],
            privateSubnetIds: ['subnet-04cd24ae468133970', 'subnet-0fa73a4e266c8f166']
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

        // PayForAdoption service definitions-----------------------------------------------------------------------

        const taskRole_PayForAdoption = new iam.Role(this, `ecs-TaskRole-PayForAdoption-${this.stackName}`, {
            roleName: `ecs-taskRole-PayForAdoption-${this.stackName}`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        });
        
        const payForAdoptionTaskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef-payforadoption", {
            taskRole: taskRole_PayForAdoption,
            cpu: 1024,
            memoryLimitMiB: 2048
        });

        payForAdoptionTaskDef.addToExecutionRolePolicy(executionRolePolicy);

        payForAdoptionTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PayForAdoption-AmazonECSTaskExecutionRolePolicy', 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'));
        payForAdoptionTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PayForAdoption-AWSXrayWriteOnlyAccess', 'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess'));
        payForAdoptionTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PayForAdoption-AmazonRDSFullAccess', 'arn:aws:iam::aws:policy/AmazonRDSFullAccess'));
        payForAdoptionTaskDef.taskRole?.addToPolicy(readSSMParamsPolicy);

        payForAdoptionTaskDef.addContainer('payforadoption', {
            image: ecs.ContainerImage.fromRegistry("awsimaya/payforadoption:latest"),
            memoryLimitMiB: 256,
            cpu: 256,
            logging
        }).addPortMappings({
            containerPort: 80,
            protocol: ecs.Protocol.TCP
        });

        payForAdoptionTaskDef.addContainer('xraydaemon', {
            image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
            memoryLimitMiB: 256,
            cpu: 256,
            logging
        }).addPortMappings({
            containerPort: 2000,
            protocol: ecs.Protocol.UDP
        });

        new ecs_patterns.ApplicationLoadBalancedFargateService(this, "PayForAdoption-service", {
            cluster: new ecs.Cluster(this, "PayForAdoption-cluster", {
                vpc: theVPC,
                containerInsights: true
            }),
            taskDefinition: payForAdoptionTaskDef,
            publicLoadBalancer: true,
            desiredCount: 2,
            listenerPort: 80
        }).targetGroup.configureHealthCheck({
            path: '/health/status'
        });


        // PetListAdoptions service definitions-----------------------------------------------------------------------

        const taskRole_PetListAdoptions = new iam.Role(this, `ecs-taskRole-PayListAdoptions-${this.stackName}`, {
            roleName: `ecs-taskRole-PayListAdoptions-${this.stackName}`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        });
        
        const petListAdoptionsTaskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef-petlist", {
            cpu: 1024,
            taskRole: taskRole_PetListAdoptions,
            memoryLimitMiB: 2048
        });

        petListAdoptionsTaskDef.addToExecutionRolePolicy(executionRolePolicy);

        petListAdoptionsTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PayListAdoptions-AmazonECSTaskExecutionRolePolicy', 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'));
        petListAdoptionsTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PayListAdoptions-AWSXrayWriteOnlyAccess', 'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess'));
        petListAdoptionsTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PayListAdoptions-AmazonRDSFullAccess', 'arn:aws:iam::aws:policy/AmazonRDSFullAccess'));
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


        // PetSite service definitions-----------------------------------------------------------------------

        const taskRole_PetSite = new iam.Role(this, `ecs-taskRole-PetSite-${this.stackName}`, {
            roleName: `ecs-taskRole-PetSite-${this.stackName}`,
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        });
       
        const PetSiteTaskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef-petsite", {
            taskRole: taskRole_PetSite,
            cpu: 1024,
            memoryLimitMiB: 2048
        });

        PetSiteTaskDef.addToExecutionRolePolicy(executionRolePolicy);

        PetSiteTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PetSite-AmazonSQSFullAccess', 'arn:aws:iam::aws:policy/AmazonSQSFullAccess'));
        PetSiteTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PetSite-AmazonSNSFullAccess', 'arn:aws:iam::aws:policy/AmazonSNSFullAccess'));
        PetSiteTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PetSite-AmazonECSTaskExecutionRolePolicy', 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'));
        PetSiteTaskDef.taskRole?.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'PetSite-AWSXrayWriteOnlyAccess', 'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess'));
        PetSiteTaskDef.taskRole?.addToPolicy(readSSMParamsPolicy);

        PetSiteTaskDef.addContainer('PetSite', {
            image: ecs.ContainerImage.fromRegistry("awsimaya/petsite:latest"),
            memoryLimitMiB: 256,
            cpu: 256,
            logging
        }).addPortMappings({
            containerPort: 80,
            protocol: ecs.Protocol.TCP
        });

        PetSiteTaskDef.addContainer('xraydaemon', {
            image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
            memoryLimitMiB: 256,
            cpu: 256,
            logging
        }).addPortMappings({
            containerPort: 2000,
            protocol: ecs.Protocol.UDP
        });

        new ecs_patterns.ApplicationLoadBalancedFargateService(this, "PetSite-service", {
            cluster: new ecs.Cluster(this, "PetSite-cluster", {
                vpc: theVPC,
                containerInsights: true
            }),
            taskDefinition: PetSiteTaskDef,
            publicLoadBalancer: true,
            desiredCount: 2,
            listenerPort: 80
        }).targetGroup.configureHealthCheck({
            path: '/health/status'
        });


        //PetStatusUpdater Lambda Function and APIGW--------------------------------------

        var iamrole_PetStatusUpdater = new iam.Role(this, 'lambdaexecutionrole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromManagedPolicyArn(this, 'first', 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess'),
            iam.ManagedPolicy.fromManagedPolicyArn(this, 'second', 'arn:aws:iam::aws:policy/AWSLambdaFullAccess')],
            roleName: 'PetStatusUpdaterRole'
          });
      
          var lambda_petstatusupdater = new lambda.Function(this, 'lambdafn', {
            runtime: lambda.Runtime.NODEJS_12_X,    // execution environment
            code: lambda.Code.fromAsset('../../petstatusupdater/function.zip'),  // code loaded from "lambda" directory
            handler: 'index.handler',
            tracing: lambda.Tracing.ACTIVE,
            role: iamrole_PetStatusUpdater,
            description: 'Update Pet availability status',
            environment:
            {
              "TABLE_NAME": "petadoptions"
            }
          });
      
          //defines an API Gateway REST API resource backed by our "petstatusupdater" function.
          const apigateway = new apigw.LambdaRestApi(this, 'PetAdoptionStatusUpdater', {
            handler: lambda_petstatusupdater,
            proxy: true,
            endpointConfiguration: {
              types: [apigw.EndpointType.REGIONAL]
            }, deployOptions: {
              tracingEnabled: true,
              stageName: 'prod'
            }, options: { defaultMethodOptions: { methodResponses: [] } }
            //defaultIntegration: new apigw.Integration({ integrationHttpMethod: 'PUT', type: apigw.IntegrationType.AWS })
          });
    }
}