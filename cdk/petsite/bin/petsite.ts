#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PetsiteStack } from '../lib/petsite-stack';

const app = new cdk.App();
new PetsiteStack(app, 'PetsiteStack');
