import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as eks from '@aws-cdk/aws-eks';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

export class PetSiteServiceEKS extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const clusterAdmin = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    const cluster = new eks.Cluster(this, 'petsite', {
      clusterName: `petsite`,
      mastersRole: clusterAdmin,
      version: '1.15',
      defaultCapacity: 2,
      kubectlEnabled: true
    });

   // this.readYamlFromDir('../../petsite/petsite/kubernetes/', cluster);
   // this.readYamlFromDir('../../petsite/petsite/kubernetes/xray-daemon/', cluster);
  }

  private readYamlFromDir(dir: string, cluster: eks.Cluster) {
    fs.readdirSync(dir, "utf8").forEach(file => {
      if (file != undefined && file.split('.').pop() == 'yaml') {
        let data = fs.readFileSync(dir + file, 'utf8');
        if (data != undefined) {
          let i = 0;
          yaml.loadAll(data).forEach((item) => {
            cluster.addResource(file.substr(0, file.length - 5) + i, item);
            i++;
          })
        }
      }
    })
  }
}