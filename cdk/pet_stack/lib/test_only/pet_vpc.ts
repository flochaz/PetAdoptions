import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class PetVPC extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Microservices', {
      cidr: this.node.tryGetContext('vpc_cidr'),
      natGateways: 1,
      maxAzs: 2
      // subnetConfiguration: [
      //   {
      //     cidrMask: 24,
      //     name: 'ingress',
      //     subnetType: ec2.SubnetType.PUBLIC,
      //   },
      //   {
      //     cidrMask: 24,
      //     name: 'application',
      //     subnetType: ec2.SubnetType.PRIVATE,
      //   },
      //   {
      //     cidrMask: 28,
      //     name: 'rds',
      //     subnetType: ec2.SubnetType.ISOLATED,
      //   }
      // ]
    });
  }
}