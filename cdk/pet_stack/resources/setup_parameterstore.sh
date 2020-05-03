#!/bin/bash

    #Ask the user for their name

echo ENTER value for /petstore/cleanupadoptionsurl
read userinput
aws ssm put-parameter --name "/petstore/cleanupadoptionsurl" --value $userinput"/api/home/cleanupadoptions" --type "SecureString"
echo -------------

echo ENTER value for /petstore/dynamodbtablename
read userinput
aws ssm put-parameter --name "/petstore/dynamodbtablename" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/paymentapiurl
read userinput
aws ssm put-parameter --name "/petstore/paymentapiurl" --value $userinput"api/home/completeadoption" --type "SecureString"
echo -------------

echo ENTER value for /petstore/petlistadoptionsurl
read userinput
aws ssm put-parameter --name "/petstore/petlistadoptionsurl" --value $userinput"/api/adoptionlist/" --type "SecureString"
echo -------------

echo ENTER value for /petstore/queueurl
read userinput
aws ssm put-parameter --name "/petstore/queueurl" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/s3bucketname
read userinput
aws ssm put-parameter --name "/petstore/s3bucketname" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/searchapiurl
read userinput
aws ssm put-parameter --name "/petstore/searchapiurl" --value $userinput"/api/search?" --type "SecureString"
echo -------------

echo ENTER value for /petstore/snsarn
read userinput
aws ssm put-parameter --name "/petstore/snsarn" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/updateadoptionstatusurl
read userinput
aws ssm put-parameter --name "/petstore/updateadoptionstatusurl" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/rdsconnectionstring
echo ENTER RDS Server Name
read rdsServerName

rdsUserName=$(jq .context.rdsusername ../cdk.json)
rdsPassword=$(jq .context.rdspassword ../cdk.json)
aws ssm put-parameter --name "/petstore/rdsconnectionstring" --value "Server="$rdsServerName";Database=adoptions;User Id="$rdsUserName";Password="$rdsPassword --type "SecureString"
echo ------ALL DONE---------
