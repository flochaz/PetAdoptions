#!/bin/bash

echo ENTER value for /petstore/petsiteurl
echo This is the value of  Services.PetSiteserviceServiceURL  from Outputs
read userinput
aws ssm put-parameter --name "/petstore/petsiteurl" --value $userinput --type "SecureString"
echo -----DONE--------

echo ENTER value for /petstore/cleanupadoptionsurl
echo This is the value of Services.PayForAdoptionserviceServiceURL from Outputs
read userinput
aws ssm put-parameter --name "/petstore/cleanupadoptionsurl" --value $userinput"/api/home/cleanupadoptions" --type "SecureString"
echo -----DONE--------

echo ENTER value for /petstore/paymentapiurl
echo This is the value of Services.PayForAdoptionserviceServiceURL from Outputs
read userinput
aws ssm put-parameter --name "/petstore/paymentapiurl" --value $userinput"api/home/completeadoption" --type "SecureString"
echo -----DONE--------

echo ENTER value for /petstore/petlistadoptionsurl
echo This is the value of Services.PetListAdoptionserviceServiceURL from Outputs
read userinput
aws ssm put-parameter --name "/petstore/petlistadoptionsurl" --value $userinput"/api/adoptionlist/" --type "SecureString"
echo -----DONE--------

echo ENTER value for /petstore/searchapiurl
echo This is the value of Services.PetSearchserviceServiceURL from Outputs
read userinput
aws ssm put-parameter --name "/petstore/searchapiurl" --value $userinput"/api/search?" --type "SecureString"
echo -----DONE--------

echo ENTER value for /petstore/queueurl
read userinput
aws ssm put-parameter --name "/petstore/queueurl" --value $userinput --type "SecureString"
echo -----DONE--------

echo ENTER value for /petstore/snsarn
read userinput
aws ssm put-parameter --name "/petstore/snsarn" --value $userinput --type "SecureString"
echo -----DONE--------

echo ENTER value for /petstore/updateadoptionstatusurl
read userinput
aws ssm put-parameter --name "/petstore/updateadoptionstatusurl" --value $userinput --type "SecureString"
echo -----DONE--------

echo ENTER value for /petstore/rdsconnectionstring
echo ENTER RDS Server Name
read rdsServerName

rdsUserName=$(jq .context.rdsusername ../cdk.json)
rdsPassword=$(jq .context.rdspassword ../cdk.json)
aws ssm put-parameter --name "/petstore/rdsconnectionstring" --value "Server="$rdsServerName";Database=adoptions;User Id="$rdsUserName";Password="$rdsPassword --type "SecureString"
echo -----DONE--------

s3bucket_name=$(jq .context.s3bucket_name ../cdk.json)
aws ssm put-parameter --name "/petstore/s3bucketname" --value $s3bucket_name --type "SecureString"
echo Created /petstore/s3bucketname -------------

ddbtable_name=$(jq .context.ddbtable_name ../cdk.json)
aws ssm put-parameter --name "/petstore/dynamodbtablename" --value $ddbtable_name --type "SecureString"
echo Created /petstore/dynamodbtablename -------------

echo ------ALL DONE---------