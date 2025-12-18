import { event, output, recorder } from 'codeceptjs';
import moment from 'moment';
import xray_api from './api/xray_api.js';
import conf_schema_checker from './helpers/conf_schema_checker.js';
import data_generator from './helpers/data_generator.js';
import xray_schema_checker from './helpers/xray_schema_checker.js';
import bdd from './lib/bdd.js';
import common from './lib/common.js';
import generic from './lib/generic.js';
import manual from './lib/manual.js';

const defaultConfig = {
    debug: false,
    projectKey: null,
    importToExistingTestExecution: false,
    existingTestExecutionKey: "",
    testExecutionAssigneeUserId: "",
    testExecutionPlanKey: "",
    testExecutionVersion: "",
    testExecutionRevision: "",
    testExecutionEnvironments: ["QA"],
    testExecutionSummary: "Execution of automated tests",
    testExecutionDescription: "This execution is automatically created when importing execution results from Gitlab",
    testExecutionSendEvidenceOnFail: false,
    testExecutionCustomFields: [],
    createNewJiraTest: false,
    timeout: 12000,
    xrayCloudUrl: 'https://xray.cloud.getxray.app',
    xrayClientId: '',
    xraySecret: ''
};

let start_date;
let test_key;
let test_comment = [];
let test_evidences = [];
const tests_results = [];
const tests_data = [];
let bdd_examples = [];
let manual_steps_results = [[]];
const manual_iteration = {};
let iteration_number;
let iterations_array = [];

/**
 * CodeceptJS Xray Cloud Helper
 * @param {Object} config 
 */
export default function (config) {
    event.dispatcher.on(event.all.before, () => {
        start_date = moment().format();
        config = Object.assign(defaultConfig, config);
        conf_schema_checker.validate(config);
        conf_schema_checker.validate_option_testExecutionSendEvidenceOnFail(codeceptjs, config);
    });

    event.dispatcher.on(event.step.finished, (step) => {
        const isBdd = step.test?.file?.includes('.feature');
        if (isBdd === false) {
            manual.save_steps_status(step, manual_steps_results);
        }
    });

    event.dispatcher.on(event.test.after, (test) => {
        recorder.add('Get test results', () => {
            const test_contains_examples = false;
            const test_contains_iterations = false;

            const test_tags = common.get_test_tags(test);

            test_tags.every(tag => {
                if (tag.toString().includes("@TEST_")) {
                    test_key = tag.split("@TEST_")[1];
                    return false;
                } 
                test_key = "no_xray_tag";
                return true;
            });

            if (tests_results[tests_results.length - 1]?.test_key !== test_key) {
                test_evidences = [];
            }

            const test_state = common.get_test_state(test);

            if (test_state === "failed") {
                test_comment.push(common.get_err_string(test));
                if (config.testExecutionSendEvidenceOnFail) {
                    test_evidences.push(common.get_evidence_object(test));
                }
            }

            const is_bdd = test.file.includes('.feature');
            [bdd_examples, test_comment, test_evidences] = bdd.save_bdd_results(is_bdd, tests_results, bdd_examples, test_key, test_comment, test_evidences, test_contains_examples, test, test_state, config);

            const is_manual = manual_steps_results.length > 1 && is_bdd === false;
            [manual_steps_results, iterations_array, iteration_number, test_comment, test_evidences] = manual.save_manual_results(is_manual, tests_results, manual_steps_results, iterations_array, manual_iteration, iteration_number, test_key, test_comment, test_evidences, test_contains_iterations, test, test_state, config);

            const is_generic = is_manual === false && is_bdd === false;
            generic.save_generic_results(is_generic, tests_results, test_key, test_comment, test_evidences, test, config, test_state);
        });
    });

    event.dispatcher.on(event.all.after, async () => {
        config = codeceptjs.config.get().plugins.xrayImport;
        config = Object.assign(defaultConfig, config);
        conf_schema_checker.validate(config);

        const info_data = await data_generator.generate_info_data({
            project: config.projectKey,
            summary: config.testExecutionSummary,
            description: config.testExecutionDescription,
            version: config.testExecutionVersion,
            revision: config.testExecutionRevision,
            testPlanKey: config.testExecutionPlanKey,
            testEnvironments: config.testExecutionEnvironments,
            startDate: start_date,
            finishDate: moment().format(),
        });

        for (const test_result of tests_results) {
            const hasXrayTag = test_result.test_key !== "no_xray_tag";
            
            // Cleaned up logic: If it has a tag OR we are allowed to create new tests, process it.
            if (hasXrayTag || config.createNewJiraTest) {
                tests_data.push(await data_generator.generate_tests_data({
                    testKey: hasXrayTag ? test_result.test_key : null,
                    testInfo_projectKey: config.projectKey ?? " ",
                    testInfo_summary: test_result.title,
                    testInfo_type: test_result.test_type,
                    testInfo_labels: ["test_created_automatically"],
                    testInfo_definition: test_result.id,
                    testInfo_steps: test_result.test_info_steps,
                    testInfo_scenario: test_result.bdd_scenario,
                    assignee: config.testExecutionAssigneeUserId,
                    status: test_result.status,
                    comment: test_result.comment,
                    examples: test_result.examples?.length > 0 ? test_result.examples : null,
                    steps: test_result.steps?.length > 0 ? test_result.steps : null,
                    iterations: test_result.iterations?.length > 0 ? test_result.iterations : null,
                    evidence: test_result.evidences,
                    start: test_result.start,
                    finish: test_result.finish,
                    customFields: config.testExecutionCustomFields
                }));
            } else if (config.debug) {
                output.print("A test was ignored because its tag doesn't start with '@TEST_' and config option 'createNewJiraTest = false'");
            }
        }

        const import_execution_data = config.importToExistingTestExecution ?
            await data_generator.build_import_execution_data("existing_test_execution", config.existingTestExecutionKey, info_data, tests_data) :
            await data_generator.build_import_execution_data("new_test_execution", null, info_data, tests_data);

        if (config.debug) {
            output.print(`Send results to JIRA : \n${JSON.stringify(import_execution_data, null, 2)}`);
        }

        xray_schema_checker.validate(import_execution_data);

        const token = await xray_api.authenticate(config.xrayCloudUrl, config.xrayClientId, config.xraySecret, config.timeout);
        const response = await xray_api.execute_import(config.xrayCloudUrl, import_execution_data, token, config.timeout);

        if (config.debug) {
            output.print(`Response FROM XRAY API: \n${JSON.stringify(response.data, null, 2)}`);
        }

        const isSuccess = response.status === 200 || response.status === 201;
        if (isSuccess && response.data) {
            output.print(`\n> Tests results from ${import_execution_data.tests.length} tests were sent to XRAY on TestExecution : ${response.data.key}\n`);
        }
    });
}