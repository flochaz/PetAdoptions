import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import { Tracing } from '@aws-cdk/aws-lambda';


export class PetStatusUpdater extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const petstatusupdater = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,    // execution environment
      code: lambda.Code.fromAsset('../../petstatusupdater/function.zip'),  // code loaded from "lambda" directory
      handler: 'exports.handler',
      tracing: Tracing.ACTIVE,
      environment:
      {
        "TABLE_NAME": "petadoptions"
      }
    });

    // defines an API Gateway REST API resource backed by our "hello" function.
    new apigw.LambdaRestApi(this, 'PetAdoptionStatusUpdater', {
      handler: petstatusupdater
    });

  }
}