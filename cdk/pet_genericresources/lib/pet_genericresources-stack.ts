import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns'
import * as sqs from '@aws-cdk/aws-sqs'
import * as subs from '@aws-cdk/aws-sns-subscriptions'
import * as ddb from '@aws-cdk/aws-dynamodb'
import * as s3 from '@aws-cdk/aws-s3'
import * as ddbseeder from 'aws-cdk-dynamodb-seeder'

export class PetGenericresourcesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SQS resource to send Pet adoption messages to
    const sqs_petadoption = new sqs.Queue(this, 'sqs_petadoption', {
      visibilityTimeout: cdk.Duration.seconds(300)
    })

    // Create SNS and an email topic to send notifications to
    const topic_petadoption = new sns.Topic(this, 'topic_petadoption');
    topic_petadoption.addSubscription(new subs.EmailSubscription("imayakumar@example.com"));

    // Creates an S3 bucket to store pet images
    const s3bucket = new s3.Bucket(this, 's3bucket_petadoption', {
      bucketName: 'observabilitypetadoptions2',
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
      },
      tableName: 'petadoptions'
    });

    // Seeds the petadoptions dynamodb table with all data required
    new ddbseeder.Seeder(this, "petadoption-ddb-seeder", {
      table: dynamodb_petadoption,
      setup: require("../resources/seed-data.json"),
      teardown: require("../resources/delete-seed-data.json"),
      refreshOnUpdate: true  // runs setup and teardown on every update, default false
    });


  }
}