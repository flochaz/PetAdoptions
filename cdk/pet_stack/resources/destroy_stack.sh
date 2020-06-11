#!/bin/bash

echo ---------------------------------------------------------------------------------------------
echo This script destroys the CDK stack
echo ---------------------------------------------------------------------------------------------

# Fetch the name of the S3 bucket created by CDKToolkit for bootstrap
CDK_S3_BUCKET_NAME=$(aws cloudformation describe-stacks  --stack-name CDKToolkit | jq '.Stacks[0].Outputs[] | select(.OutputKey == "BucketName").OutputValue' -r)

# Empty the S3 bucket CDKToolkit created
aws s3 rm s3://$CDK_S3_BUCKET_NAME --recursive   

# Delete resources such as S3 buckets etc createed by CDKToolkit
aws cloudformation delete-stack --stack-name CDKToolkit

# Get the mail stack name
STACK_NAME=$(aws ssm get-parameter --name '/petstore/petsiteurl' --region $AWS_REGION | jq .Parameter.Value -r)

# Get rid of all resources
cdk destory $STACK_NAME

# Sometimes the Sqlseeder doesn't get deleted cleanly. This helps clean up the environment completely including Sqlseeder
aws cloudformation delete-stack --stack-name $STACK_NAME

echo ----- ✅ DONE --------