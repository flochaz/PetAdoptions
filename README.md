
## Setup Cloud9 environment for our project


### Install/Upgrade AWS CLI v2
> https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html
```
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```
To make sure AWS CLI v2 is installed properly, check the version by running

```
aws --version
```
### Install jq

> About jq - https://stedolan.github.io/jq/
```
sudo yum install jq
```
### Upgrade CDK
```
sudo npm i -g aws-cdk
```

### Install Typescript
```
npm install -g typescript
```
---------------------------

## Clone the repo
```
git clone https://github.com/awsimaya/PetAdoptions.git
```
Once cloned successfully navigate to the following folder

```
cd PetAdoptions/cdk/pet_stack
```
Install all npm packages

```
npm install
```

### Edit config parameters
> You can use the cdk.json file to customize certain resources such as VPC CIDR, DynamoDB table name, S3 bucket name etc.

Execute the following command to open the file and make changes if needed. Ideally, you would want to change the CIDR range to suit your environment in case the given one already exists.

```
vi cdk.json
```

### Install Petadoption app resources

Synthesize CDK app

```
cdk synth
```
Bootstrap CDK 

```
cdk bootstrap
```

Deploy the stack

> It will take a few minutes for the stack to be deployed, so just go get a ☕️

```
cdk deploy Services
```
Once complete, copy paste the values of Outputs somewhere. Or if you're working on Cloud9, just open a new Terminal by simply clicking the **+** sign 

Execute the following command while at the pet_stack folder
```
./resources/setup_parameterstore.sh 
```


## [INCOMPLETE] How to create Petsearch ElasticBeanstalk deployment package
[Instructions here](petsearch/README.md)