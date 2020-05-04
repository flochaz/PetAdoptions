#!/bin/bash

echo ENTER value for /petstore/petsiteurl
echo Leave out the 'http://' part. Just enter the domain name. For example, if the ALB URL is http://alb_name.us-east-2.elb.amazonaws.com/, only enter alb_name.us-east-2.elb.amazonaws.com

read userinput
aws ssm put-parameter --name "/petstore/petsiteurl" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/cleanupadoptionsurl
echo Leave out the 'http://' part. Just enter the domain name. For example, if the ALB URL is http://alb_name.us-east-2.elb.amazonaws.com/, only enter alb_name.us-east-2.elb.amazonaws.com

read userinput
aws ssm put-parameter --name "/petstore/cleanupadoptionsurl" --value $userinput"/api/home/cleanupadoptions" --type "SecureString"
echo -------------

echo ENTER value for /petstore/dynamodbtablename
read userinput
aws ssm put-parameter --name "/petstore/dynamodbtablename" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/paymentapiurl
echo Leave out the 'http://' part. Just enter the domain name. For example, if the ALB URL is http://alb_name.us-east-2.elb.amazonaws.com/, only enter alb_name.us-east-2.elb.amazonaws.com

read userinput
aws ssm put-parameter --name "/petstore/paymentapiurl" --value $userinput"api/home/completeadoption" --type "SecureString"
echo -------------

echo ENTER value for /petstore/petlistadoptionsurl
echo Leave out the 'http://' part. Just enter the domain name. For example, if the ALB URL is http://alb_name.us-east-2.elb.amazonaws.com/, only enter alb_name.us-east-2.elb.amazonaws.com

read userinput
aws ssm put-parameter --name "/petstore/petlistadoptionsurl" --value $userinput"/api/adoptionlist/" --type "SecureString"
echo -------------

echo ENTER value for /petstore/queueurl
echo Leave out the 'http://' part. Just enter the domain name. For example, if the ALB URL is http://alb_name.us-east-2.elb.amazonaws.com/, only enter alb_name.us-east-2.elb.amazonaws.com

read userinput
aws ssm put-parameter --name "/petstore/queueurl" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/s3bucketname
read userinput
aws ssm put-parameter --name "/petstore/s3bucketname" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/searchapiurl
echo Leave out the 'http://' part. Just enter the domain name. For example, if the ALB URL is http://alb_name.us-east-2.elb.amazonaws.com/, only enter alb_name.us-east-2.elb.amazonaws.com
read userinput
aws ssm put-parameter --name "/petstore/searchapiurl" --value $userinput"/api/search?" --type "SecureString"
echo -------------

echo ENTER value for /petstore/snsarn
read userinput
aws ssm put-parameter --name "/petstore/snsarn" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/updateadoptionstatusurl
read userinput
echo Leave out the 'http://' part. Just enter the domain name. For example, if the ALB URL is http://alb_name.us-east-2.elb.amazonaws.com/, only enter alb_name.us-east-2.elb.amazonaws.com
aws ssm put-parameter --name "/petstore/updateadoptionstatusurl" --value $userinput --type "SecureString"
echo -------------

echo ENTER value for /petstore/rdsconnectionstring
echo ENTER RDS Server Name
read rdsServerName

rdsUserName=$(jq .context.rdsusername ../cdk.json)
rdsPassword=$(jq .context.rdspassword ../cdk.json)
aws ssm put-parameter --name "/petstore/rdsconnectionstring" --value "Server="$rdsServerName";Database=adoptions;User Id="$rdsUserName";Password="$rdsPassword --type "SecureString"
echo ------ALL DONE---------