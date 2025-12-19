// @ts-check
import colors from 'chalk';
import codeceptjs from 'codeceptjs';
import { getConfig, getTestRoot, updateConfig } from 'codeceptjs/lib/command/utils';
import inquirer from 'inquirer';
/**
 * @typedef {Object} CodeceptOutput
 * @property {function(string=): void} print
 * @property {function(string=): void} debug
 * @property {function(string=): void} error
 */

/** @type {CodeceptOutput} */
// @ts-ignore to ignore the print error
const { output } = codeceptjs;

/**
 * @typedef {import('../conf_schema_checker.js').XrayPluginConfig} XrayPluginConfig
 */

/**
 * CLI tool to initialize and configure the Xray Cloud Helper plugin
 */
const init = {
    questions: () => {
        output.print();
        output.print(`  Welcome to ${colors.magenta.bold('codeceptjs-xray-cloud-helper')} initialization tool.`);
        output.print('  It will prepare and configure the plugin for you.');
        output.print();

        const testsPath = getTestRoot();
        const config = getConfig(testsPath);

        // Check if xrayImport is already initialized
        if (config.plugins?.xrayImport !== undefined) {
            output.print(colors.whiteBright.bgRed.bold(' xrayImport is already initialized in this project. See `xrayImport` in plugins section in codecept.conf.js file. '));
            output.print();
            process.exit(1);
        }

        inquirer.prompt([
            {
                name: 'debug',
                type: 'confirm',
                message: 'Do you want to use debug mode to see sent data through XRAY API?',
                default: false,
            },
            {
                name: 'importTestExecution',
                type: 'confirm',
                message: 'Do you want to import test results to a specific Test Execution?',
                default: false,
            },
            {
                name: 'testExecutionKey',
                type: 'input',
                message: 'Enter your Test Execution Key (ex: POSDEV-1110):',
                default: '',
                when: (result) => result.importTestExecution === true
            },
            {
                name: 'assignee',
                type: 'input',
                message: 'Enter an assignee userId if you want to assign Test Execution to a user:',
                default: ''
            },
            {
                name: 'planKey',
                type: 'input',
                message: 'Enter a plan Key if you want to assign Test Execution to a Test Plan:',
                default: ''
            },
            {
                name: 'version',
                type: 'input',
                message: 'Enter the version to be shown on the Test Execution:',
                default: ''
            },
            {
                name: 'revision',
                type: 'input',
                message: 'Enter the revision to be shown on the Test Execution:',
                default: ''
            },
            {
                name: 'environments',
                type: 'input',
                message: 'Enter the environments:',
                default: 'QA'
            },
            {
                name: 'testExecutionSendEvidenceOnFail',
                type: 'confirm',
                message: 'Do you want to send screenshots to test execution when tests fail?',
                default: false,
            },
            {
                name: 'createNewJiraTest',
                type: 'confirm',
                message: 'Do you want to use this helper to create Generic and Manual Jira Tests for you?',
                default: false,
            },
            {
                name: 'projectKey',
                type: 'input',
                message: 'In which projectId you want to create Jira Test (ex. 11022):',
                default: '',
                when: (result) => result.createNewJiraTest === true
            },
            {
                name: 'xrayClientId',
                type: 'input',
                message: 'What is your xray client id (ask your Jira admin)',
                default: '',
            },
            {
                name: 'xraySecret',
                type: 'input',
                message: 'What is your xray client secret (ask your Jira admin)',
                default: '',
            },
        ]).then((result) => {
            /** @type {XrayPluginConfig} */
            const xrayConfig = {
                require: "codeceptjs-xray-cloud-helper",
                enabled: true,
                debug: result.debug,
                projectKey: result.projectKey || '',
                importToExistingTestExecution: result.importTestExecution,
                existingTestExecutionKey: result.testExecutionKey || '',
                testExecutionAssigneeUserId: result.assignee,
                testExecutionPlanKey: result.planKey,
                testExecutionVersion: result.version,
                testExecutionRevision: result.revision,
                testExecutionEnvironments: [result.environments],
                testExecutionSummary: "Execution of automated tests",
                testExecutionDescription: "This execution is automatically created when importing execution results from Gitlab",
                testExecutionSendEvidenceOnFail: result.testExecutionSendEvidenceOnFail,
                createNewJiraTest: result.createNewJiraTest,
                timeout: 60000,
                xrayCloudUrl: 'https://xray.cloud.getxray.app',
                xrayClientId: result.xrayClientId,
                xraySecret: result.xraySecret
            };

            output.print();
            
            // Ensure plugins object exists before assignment
            if (config.plugins === undefined) {
                config.plugins = {};
            }
            
            config.plugins.xrayImport = xrayConfig;
            updateConfig(testsPath, config);

            output.print();
            output.print(colors.whiteBright.bgGreen.bold(' Last step before running your tests : '));
            output.print(colors.whiteBright.bgYellow.bold(' Add tag(@TEST_) to your codecept scenarios to link them with Jira Tests. (Example: tag @TEST_POSDEV-1110 will link the execution test to POSDEV-1110 within Jira) '));
            output.print();
            output.print(colors.bold.green('XrayImport is configured! Enjoy!'));
            output.print();
        });
    }
};

export default init;