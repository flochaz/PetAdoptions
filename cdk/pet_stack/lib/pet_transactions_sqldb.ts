import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import { Vpc } from '@aws-cdk/aws-ec2';
import * as secrets from '@aws-cdk/aws-secretsmanager';

// https://stackoverflow.com/questions/59710635/how-to-connect-aws-ecs-applicationloadbalancedfargateservice-private-ip-to-rds

export class TransactionsDb extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'pet_microservices_vpc', {
            cidr: '10.0.0.0/16',
            natGateways: 1,
            maxAzs: 2,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'ingress',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'application',
                    subnetType: ec2.SubnetType.PRIVATE,
                },
                {
                    cidrMask: 28,
                    name: 'rds',
                    subnetType: ec2.SubnetType.ISOLATED,
                }
            ]
        });

        const rdssecuritygroup = new ec2.SecurityGroup(this, 'rdsSecurityGroup',
            {
                vpc: vpc, securityGroupName: 'rdssecurityGroup'
            });

        rdssecuritygroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(1433), 'allow ssh access from the world');

        const rdspassword = new cdk.SecretValue('P37@d0pti0npwd');

        const instance = new rds.DatabaseInstance(this, 'Instance', {
            engine: rds.DatabaseInstanceEngine.SQL_SERVER_WEB,
            instanceClass: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
            masterUsername: 'admin',
            masterUserPassword: rdspassword,
            deletionProtection: false,
            vpc: vpc,
            licenseModel: rds.LicenseModel.LICENSE_INCLUDED,
            securityGroups:[rdssecuritygroup]
        });



        //       var x = ec2.Vpc.fromVpcAttributes(this, 'id', { vpcId: vpc.vpcId, availabilityZones: vpc.availabilityZones });
    }
}