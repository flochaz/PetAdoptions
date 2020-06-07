#!/bin/bash

echo ---------------------------------------------------------------------------------------------
This script destroys the CDK stack
echo ---------------------------------------------------------------------------------------------

STACK_NAME=$(aws ssm get-parameter --name '/petstore/petsiteurl' --region $AWS_REGION | jq .Parameter.Value)

cdk destory $STACK_NAME