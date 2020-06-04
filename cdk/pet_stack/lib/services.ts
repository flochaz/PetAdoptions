import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as sns from '@aws-cdk/aws-sns'
import * as sqs from '@aws-cdk/aws-sqs'
import * as subs from '@aws-cdk/aws-sns-subscriptions'
import * as ddb from '@aws-cdk/aws-dynamodb'
import * as s3 from '@aws-cdk/aws-s3'
import * as ddbseeder from 'aws-cdk-dynamodb-seeder'
import * as s3seeder from '@aws-cdk/aws-s3-deployment'
import * as rds from '@aws-cdk/aws-rds';
import * as ssm from '@aws-cdk/aws-ssm';
import * as eks from '@aws-cdk/aws-eks';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';

import { SqlSeeder } from './sql-seeder'
import { PayForAdoptionService } from './services/pay-for-adoption-service'
import { ListAdoptionsService } from './services/list-adoptions-service'
import { PetSiteService } from './services/pet-site-service'
import { SearchService } from './services/search-service'
import { TrafficGeneratorService } from './services/traffic-generator-service'
import { StatusUpdaterService } from './services/status-updater-service'
import path = require('path');

// https://stackoverflow.com/questions/59710635/how-to-connect-aws-ecs-applicationloadbalancedfargateservice-private-ip-to-rds

export class Services extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const randomNumber = Math.floor((Math.random() * 1000) + 1);


        // Create SQS resource to send Pet adoption messages to
        const sqsQueue = new sqs.Queue(this, 'sqs_petadoption', {
            visibilityTimeout: cdk.Duration.seconds(300)
        });

        // Create SNS and an email topic to send notifications to
        const topic_petadoption = new sns.Topic(this, 'topic_petadoption');
        topic_petadoption.addSubscription(new subs.EmailSubscription(this.node.tryGetContext('snstopic_email')));

        // Creates an S3 bucket to store pet images
        const s3_observabilitypetadoptions = new s3.Bucket(this, 's3bucket_petadoption', {
            publicReadAccess: false
        });

        // Creates the DynamoDB table for Petadoption data
        const dynamodb_petadoption = new ddb.Table(this, 'ddb_petadoption', {
            partitionKey: {
                name: 'pettype',
                type: ddb.AttributeType.STRING
            },
            sortKey: {
                name: 'petid',
                type: ddb.AttributeType.STRING
            }
        });

        // Seeds the petadoptions dynamodb table with all data required
        new ddbseeder.Seeder(this, "ddb_seeder_petadoption", {
            table: dynamodb_petadoption,
            setup: require("../resources/seed-data.json"),
            teardown: require("../resources/delete-seed-data.json"),
            refreshOnUpdate: true  // runs setup and teardown on every update, default false
        });

        // Seeds the S3 bucket with pet images
        new s3seeder.BucketDeployment(this, "s3seeder_petadoption", {
            destinationBucket: s3_observabilitypetadoptions,
            sources: [s3seeder.Source.asset('./resources/kitten.zip'), s3seeder.Source.asset('./resources/puppies.zip'), s3seeder.Source.asset('./resources/bunnies.zip')]
        });


        // The VPC where all the microservices will be deployed into
        const theVPC = new ec2.Vpc(this, 'Microservices', {
            cidr: this.node.tryGetContext('vpc_cidr'),
            natGateways: 1,
            maxAzs: 2
        });

        // Create RDS SQL Server DB instance

        const rdssecuritygroup = new ec2.SecurityGroup(this, 'petadoptionsrdsSG', {
            vpc: theVPC
        });

        rdssecuritygroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(1433), 'allow MSSQL access from the world');

        const rdsUsername = this.node.tryGetContext('rdsusername');
        const rdsPassword = this.node.tryGetContext('rdspassword');
        const rdsPasswordSecret = new cdk.SecretValue(rdsPassword);

        const instance = new rds.DatabaseInstance(this, 'Instance', {
            engine: rds.DatabaseInstanceEngine.SQL_SERVER_WEB,
            instanceClass: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
            masterUsername: rdsUsername,
            masterUserPassword: rdsPasswordSecret,
            deletionProtection: false,
            vpc: theVPC,
            licenseModel: rds.LicenseModel.LICENSE_INCLUDED,
            securityGroups: [rdssecuritygroup]
        });

        var sqlSeeder = new SqlSeeder(this, "sql-seeder", {
            vpc: theVPC,
            database: instance,
            port: 1433,
            username: rdsUsername,
            password: rdsPassword
        })

        const readSSMParamsPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ssm:GetParametersByPath',
                'ssm:GetParameters',
                'ssm:GetParameter'
            ],
            resources: ['*']
        });

        // const ecsCluster = new ecs.Cluster(this, "PetSite-PetListAdoptions-PayForAdoption-PetSearchAPI", {
        //     vpc: theVPC,
        //     containerInsights: true
        // });

        const rdsAccessPolicy = iam.ManagedPolicy.fromManagedPolicyArn(this, 'AmazonRDSFullAccess', 'arn:aws:iam::aws:policy/AmazonRDSFullAccess');

        // PayForAdoption service definitions-----------------------------------------------------------------------
        const payForAdoptionService = new PayForAdoptionService(this, 'pay-for-adoption-service', {
            cluster: new ecs.Cluster(this, "PayForAdoption"+randomNumber, {
                vpc: theVPC,
                containerInsights: true}),
            cpu: 1024,
            memoryLimitMiB: 2048,
            healthCheck: '/health/status'
        });
        payForAdoptionService.taskDefinition.taskRole?.addManagedPolicy(rdsAccessPolicy);
        payForAdoptionService.taskDefinition.taskRole?.addToPolicy(readSSMParamsPolicy);

        // PetListAdoptions service definitions-----------------------------------------------------------------------
        const listAdoptionsService = new ListAdoptionsService(this, 'list-adoptions-service', {
            cluster: new ecs.Cluster(this, "PetListAdoptions"+randomNumber, {
                vpc: theVPC,
                containerInsights: true}),
            cpu: 1024,
            memoryLimitMiB: 2048,
            healthCheck: '/health/status'
        });
        listAdoptionsService.taskDefinition.taskRole?.addManagedPolicy(rdsAccessPolicy);
        listAdoptionsService.taskDefinition.taskRole?.addToPolicy(readSSMParamsPolicy);

        const isEKS = this.node.tryGetContext('petsite_on_eks');

        // Check if PetSite needs to be deployed on an EKS cluster
        if (isEKS === 'true') {
            const asset = new DockerImageAsset(this, 'petsiteecrimage', {
                directory: path.join('../../petsite/', 'petsite')
            });

            const cluster = new eks.Cluster(this, 'petsite', {
                kubectlEnabled: true,
                clusterName: 'PetSite'
            });

            this.createOuputs(new Map(Object.entries({
                'PetSiteECRImageURL': asset.imageUri
            })));
        }
        else {
            // PetSite service definitions-----------------------------------------------------------------------
            const petSiteService = new PetSiteService(this, 'pet-site-service', {
                cluster: new ecs.Cluster(this, "PetSite"+randomNumber, {
                    vpc: theVPC,
                    containerInsights: true}),
                cpu: 1024,
                memoryLimitMiB: 2048,
                healthCheck: '/health/status'
            })
            petSiteService.taskDefinition.taskRole?.addToPolicy(readSSMParamsPolicy);

            this.createSsmParameters(new Map(Object.entries({
                '/petstore/petsiteurl': `http://${petSiteService.service.loadBalancer.loadBalancerDnsName}`
            })));
        }

        // PetSearch service definitions-----------------------------------------------------------------------
        const searchService = new SearchService(this, 'search-service', {
            cluster: new ecs.Cluster(this, "PetSearch"+randomNumber, {
                vpc: theVPC,
                containerInsights: true}),
            cpu: 1024,
            memoryLimitMiB: 2048,
            healthCheck: '/health/status'
        })
        searchService.taskDefinition.taskRole?.addToPolicy(readSSMParamsPolicy);

        // Traffic Generator task definition.
        const trafficGeneratorService = new TrafficGeneratorService(this, 'traffic-generator-service', {
            cluster: new ecs.Cluster(this, "TrafficGen"+randomNumber, {
                     vpc: theVPC,
                }),
            cpu: 256,
            memoryLimitMiB: 512,
            disableXRay: true,
            disableService: true // Only creates a task definition. Doesn't deploy a service or start a task. That's left to the user.     
        })
        trafficGeneratorService.taskDefinition.taskRole?.addToPolicy(readSSMParamsPolicy);

        //PetStatusUpdater Lambda Function and APIGW--------------------------------------
        const statusUpdaterService = new StatusUpdaterService(this, 'status-updater-service', {
            tableName: dynamodb_petadoption.tableName
        });

        this.createSsmParameters(new Map(Object.entries({
            '/petstore/updateadoptionstatusurl': statusUpdaterService.api.url,
            '/petstore/queueurl': sqsQueue.queueUrl,
            '/petstore/snsarn': topic_petadoption.topicArn,
            '/petstore/dynamodbtablename': dynamodb_petadoption.tableName,
            '/petstore/s3bucketname': s3_observabilitypetadoptions.bucketName,
            '/petstore/searchapiurl': `http://${searchService.service.loadBalancer.loadBalancerDnsName}/api/search?`,
            '/petstore/petlistadoptionsurl': `http://${listAdoptionsService.service.loadBalancer.loadBalancerDnsName}/api/adoptionlist/`,
            '/petstore/paymentapiurl': `http://${payForAdoptionService.service.loadBalancer.loadBalancerDnsName}/api/home/completeadoption`,
            '/petstore/cleanupadoptionsurl': `http://${payForAdoptionService.service.loadBalancer.loadBalancerDnsName}/api/home/cleanupadoptions`,
            '/petstore/rdsconnectionstring': `Server=${instance.dbInstanceEndpointAddress};Database=adoptions;User Id=${rdsUsername};Password=${rdsPassword}`
        })));

        this.createOuputs(new Map(Object.entries({
            'QueueURL': sqsQueue.queueUrl,
            'UpdateAdoptionStatusurl': statusUpdaterService.api.url,
            'SNSTopicARN': topic_petadoption.topicArn,
            'RDSServerName': instance.dbInstanceEndpointAddress
        })));
    }

    private createSsmParameters(params: Map<string, string>) {
        params.forEach((value, key) => {
            //const id = key.replace('/', '_');
            new ssm.StringParameter(this, key, { parameterName: key, stringValue: value });
        });
    }

    private createOuputs(params: Map<string, string>) {
        params.forEach((value, key) => {
            new cdk.CfnOutput(this, key, { value: value })
        });
    }
}