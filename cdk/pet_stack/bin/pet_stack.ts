#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PetGenericresourcesStack } from '../lib/pet_genericresources-stack'
import { PetStatusUpdater } from '../lib/petstatusupdater'
import { PetVPC } from '../lib/pet_vpc';
import { PayForAdoption } from '../lib/pet_payforadoption'
import { TransactionsDb } from '../lib/pet_transactions_sqldb';
import { PetListAdoptions } from '../lib/pet_petlistadoption';
import { PetSearch } from '../lib/pet_petsearch';
import { PetSite } from '../lib/pet_petsite';
import { Services } from '../lib/services';

const app = new cdk.App();
new PetGenericresourcesStack(app, 'PetGenericresourcesStack');
new PetStatusUpdater(app, 'PetStatusUpdater');
new PetVPC(app, 'PetVPC');
new PayForAdoption(app, 'PayForAdoptions');
new TransactionsDb(app, 'PetTransactionsDb');
new PetListAdoptions(app, 'PetListAdoptions');
new PetSearch(app, 'PetSearch');
new PetSite(app, 'PetSite');

new Services(app,'Services');