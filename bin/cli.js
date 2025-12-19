#!/usr/bin/env node
// @ts-check

import { program } from 'commander';
import { createRequire } from 'node:module';
import process from 'node:process';
import cucumber from '../helpers/cli/import_cucumber_feature.js';
import init from '../helpers/cli/init.js';

// Helper to allow importing JSON in ESM
const require = createRequire(import.meta.url);
const packageJSON = require('../package.json');

program
    .version(packageJSON.version);

program
    .command('init')
    .description('Adds xrayImport config in codecept.conf.js')
    .action(() => init.questions());

program
    .command('cucumber')
    .description('Create/Update tests on Jira/Xray from .feature file')
    .action(() => cucumber.questions());

program.parse(process.argv);