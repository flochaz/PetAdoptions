#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PetGenericresourcesStack } from '../lib/pet_genericresources-stack'
import {PetStatusUpdater} from '../lib/petstatusupdater'

const app = new cdk.App();
//new PetGenericresourcesStack(app, 'PetGenericresourcesStack');
new PetStatusUpdater(app, 'PetStatusUpdater');