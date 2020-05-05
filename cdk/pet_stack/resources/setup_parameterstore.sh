#!/bin/bash

echo 1 of 8 - TYPE in value for /petstore/petsiteurl or Press ENTER key to skip
echo This is the value of  Services.PetSiteserviceServiceURL  from Outputs
read userinput
aws ssm put-parameter --name "/petstore/petsiteurl" --value $userinput --type "SecureString"
echo -----DONE--------

echo 2 of 8 - TYPE in value for /petstore/paymentapiurl or Press ENTER key to skip
echo This is the value of Services.PayForAdoptionserviceServiceURL from Outputs
read userinput
aws ssm put-parameter --name "/petstore/paymentapiurl" --value $userinput"api/home/completeadoption" --type "SecureString"
echo -----DONE--------

aws ssm put-parameter --name "/petstore/cleanupadoptionsurl" --value $userinput"/api/home/cleanupadoptions" --type "SecureString"
echo -----Also created /petstore/cleanupadoptionsurl--------

echo 3 of 8 - TYPE in value for /petstore/petlistadoptionsurl or Press ENTER key to skip
echo This is the value of Services.PetListAdoptionserviceServiceURL from Outputs
read userinput
aws ssm put-parameter --name "/petstore/petlistadoptionsurl" --value $userinput"/api/adoptionlist/" --type "SecureString"
echo -----DONE--------

echo 4 of 8 -TYPE in value for /petstore/searchapiurl or Press ENTER key to skip
echo This is the value of Services.PetSearchserviceServiceURL from Outputs
read userinput
aws ssm put-parameter --name "/petstore/searchapiurl" --value $userinput"/api/search?" --type "SecureString"
echo -----DONE--------

echo 5 of 8 -TYPE in value for /petstore/queueurl or Press ENTER key to skip
echo This is the value of QueueURL from Outputs
read userinput
aws ssm put-parameter --name "/petstore/queueurl" --value $userinput --type "SecureString"
echo -----DONE--------

echo 6 of 8 -TYPE in value for /petstore/snsarn or Press ENTER key to skip
echo This is the value of SNSTopicARN from Outputs
read userinput
aws ssm put-parameter --name "/petstore/snsarn" --value $userinput --type "SecureString"
echo -----DONE--------

echo 7 of 8 -TYPE in value for /petstore/updateadoptionstatusurl or Press ENTER key to skip
echo This is the value of UpdateAdoptionStatusurl from Outputs
read userinput
aws ssm put-parameter --name "/petstore/updateadoptionstatusurl" --value $userinput --type "SecureString"
echo -----DONE--------

echo 8 of 8 -ENTER values for /petstore/rdsconnectionstring or Press ENTER key to skip
echo ENTER RDS Server Name or Press ENTER key to skip
read rdsServerName

echo ENTER RDS User Name or Press ENTER key to skip
read rdsUserName

echo ENTER RDS Password Name or Press ENTER key to skip
read rdsPassword

aws ssm put-parameter --name "/petstore/rdsconnectionstring" --value "Server="$rdsServerName";Database=adoptions;User Id="$rdsUserName";Password="$rdsPassword --type "SecureString"
echo -----DONE--------

s3bucket_name=$(jq -r .context.s3bucket_name cdk.json)
aws ssm put-parameter --name "/petstore/s3bucketname" --value $s3bucket_name --type "SecureString"
echo Created /petstore/s3bucketname -------------

ddbtable_name=$(jq -r .context.ddbtable_name cdk.json)
aws ssm put-parameter --name "/petstore/dynamodbtablename" --value $ddbtable_name --type "SecureString"
echo Created /petstore/dynamodbtablename -------------

echo ------ALL DONE---------