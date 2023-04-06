const inquirer = require('inquirer');
const colors = require('chalk');
const { output } = require('codeceptjs');
const xray_api = require('../../api/xray_api');
const fs = require('fs')
const path = require('path')
const { updateConfig, getConfig, getTestRoot } = require('codeceptjs/lib/command/utils');

const import_cucumber_feature = () => ({

    questions : () => {
        output.print();
        output.print(`  This CLI will help you to create or update Jira tests from a ${colors.magenta.bold('Cucumber feature file')}.`);
        output.print(`  Tests with ${colors.green.bold('@TEST_')} prefix will be updated on Jira.`);
        output.print(`  Tests without ${colors.green.bold('@TEST_')} prefix will be created automatically on Jira.`);
        output.print();

        const testsPath = getTestRoot();
        const config = getConfig(testsPath);
        const xrayImportConfig = config.plugins.xrayImport;

        //Check if xrayImport is initialized
        if (!xrayImportConfig) {
            output.print(colors.whiteBright.bgRed.bold(' xrayImport is not initialized in this project. Please run `npx xrayImport init` to setup the plugin. '));
            output.print();
            process.exit(1);
        }

        inquirer.prompt([
            {
                name: 'projectKey',
                type: 'input',
                message: 'Enter your project Key:',
                default: xrayImportConfig.projectKey ? xrayImportConfig.projectKey : ''
            },
            {
                name: 'featuresFolderPath',
                type: 'input',
                message: 'Where you .feature files are stored?',
                default: config.gherkin?.features ? `${config.gherkin?.features.split('features/')[0]}features` : './features'
            },
            {
                name: 'featureFilePath',
                type: 'list',
                message: 'Which feature file you want to import into Xray/Jira?',
                choices: (result) => get_files_from_dir(result.featuresFolderPath)
            }
        ]).then(async (result) => {

            const token = await xray_api.authenticate("https://xray.cloud.getxray.app", xrayImportConfig.xrayClientId, xrayImportConfig.xraySecret, xrayImportConfig.timeout);
            const response = await xray_api.import_cucumber_feature("https://xray.cloud.getxray.app", result.featureFilePath, result.projectKey, config.name, token, xrayImportConfig.timeout);

            if(xrayImportConfig.debug) output.print(`Response FROM XRAY API: \n${JSON.stringify(response.data, null, 2)}`);
        });
    }
});

const get_files_from_dir = (dir) => {
    let files_array = [];
    try{
        const files = fs.readdirSync(dir);

        if (files.length === 0){
            output.error('No files found ');
            process.exit(1);
        }

        for (const file of files) {
            files_array.push(`${dir}/${file}`);
        }
    } catch(err) {
        output.error(err);
        process.exit(1);
    }

    return files_array;
};

module.exports = import_cucumber_feature();
