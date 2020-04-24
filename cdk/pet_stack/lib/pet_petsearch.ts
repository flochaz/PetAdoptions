import * as cdk from '@aws-cdk/core';
import * as eb from '@aws-cdk/aws-elasticbeanstalk';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
// https://stackoverflow.com/questions/59710635/how-to-connect-aws-ecs-applicationloadbalancedfargateservice-private-ip-to-rds

export class PetSearch extends cdk.Stack {
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

        const petsearch = new eb.CfnEnvironment(this, 'petsearch-eb',{
            applicationName:'petsearch-api',
            environmentName:'petsearch-api',
            solutionStackName:'64bit Windows Server 2019 v2.5.2 running IIS 10.0'
        });

    }
}