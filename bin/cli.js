#!/usr/bin/env node
const { program } = require('commander');
const init = require('../helpers/cli/init');
const cucumber = require('../helpers/cli/import_cucumber_feature');
const package = require('../package.json');

program
    .version(package.version);

program
    .command('init')
    .description('Adds xrayImport config in codecept.conf.js')
    .action(init.questions);

program
    .command('cucumber')
    .description('Create/Update tests on Jira/Xray from .feature file')
    .action(cucumber.questions);

program.parse(process.argv);
