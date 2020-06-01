#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';

import { Services } from '../lib/services';
import { PetSiteServiceEKS } from '../lib/eks-test';



const app = new cdk.App();

new Services(app,'Services');
//new PetSiteServiceEKS(app,'PetSiteServiceEKS');