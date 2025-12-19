import colors from 'chalk';
import codeceptjs from 'codeceptjs';
import { getConfig, getTestRoot } from 'codeceptjs/lib/command/utils';
import inquirer from 'inquirer';
import fs from 'node:fs';
import xray_api from '../../api/xray_api.js';
const { output } = codeceptjs;

/**
 * CLI helper to import Cucumber feature files to Xray
 */
const import_cucumber_feature = {
    questions: () => {
        output.print();
        output.print(`  This CLI will help you to create or update Jira tests from a ${colors.magenta.bold('Cucumber feature file')}.`);
        output.print(`  Tests with ${colors.green.bold('@TEST_')} prefix will be updated on Jira.`);
        output.print(`  Tests without ${colors.green.bold('@TEST_')} prefix will be created automatically on Jira.`);
        output.print();

        const testsPath = getTestRoot();
        const config = getConfig(testsPath);
        const xrayImportConfig = config.plugins?.xrayImport;

        // Check if xrayImport is initialized
        if (xrayImportConfig === undefined) {
            output.print(colors.whiteBright.bgRed.bold(' xrayImport is not initialized in this project. Please run `npx xrayImport init` to setup the plugin. '));
            output.print();
            process.exit(1);
        }

        inquirer.prompt([
            {
                name: 'projectKey',
                type: 'input',
                message: 'Enter your project Key:',
                default: xrayImportConfig.projectKey ?? ''
            },
            {
                name: 'featuresFolderPath',
                type: 'input',
                message: 'Where are your .feature files stored?',
                default: config.gherkin?.features ? `${config.gherkin.features.split('features/')[0]}features` : './features'
            },
            {
                name: 'featureFilePath',
                type: 'list',
                message: 'Which feature file you want to import into Xray/Jira?',
                choices: (result) => get_files_from_dir(result.featuresFolderPath)
            }
        ]).then(async (result) => {
            const token = await xray_api.authenticate(
                "https://xray.cloud.getxray.app", 
                xrayImportConfig.xrayClientId, 
                xrayImportConfig.xraySecret, 
                xrayImportConfig.timeout
            );

            const response = await xray_api.import_cucumber_feature(
                "https://xray.cloud.getxray.app", 
                result.featureFilePath, 
                result.projectKey, 
                config.name, 
                token, 
                xrayImportConfig.timeout
            );

            if (xrayImportConfig.debug) {
                output.print(`Response FROM XRAY API: \n${JSON.stringify(response.data, null, 2)}`);
            }
        });
    }
};

/**
 * Helper to list files from directory
 * @param {string} dir 
 * @returns {string[]}
 */
const get_files_from_dir = (dir) => {
    try {
        const files = fs.readdirSync(dir);

        if (files.length === 0) {
            output.error('No files found in directory: ' + dir);
            process.exit(1);
        }

        return files.map(file => `${dir}/${file}`);
    } catch (err) {
        output.error(`Error reading directory ${dir}: ${err.message}`);
        process.exit(1);
    }
};

export default import_cucumber_feature;