const { event, recorder, output } = require('codeceptjs');
const moment = require('moment');
const data_generator = require('./helpers/data_generator');
const conf_schema_checker = require('./helpers/conf_schema_checker');
const xray_schema_checker = require('./helpers/xray_schema_checker');
const xray_api = require('./api/xray_api');
const bdd = require('./lib/bdd');
const manual = require('./lib/manual');
const generic = require('./lib/generic');
const common = require('./lib/common');

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
let tests_results = [];
let tests_data = [];
let bdd_examples = [];
let manual_steps_results = [[]];
let manual_iteration = {};
let iteration_number;
let iterations_array = [];

module.exports = function (config) {
    //Validate config input with default schema
    event.dispatcher.on(event.all.before, function () {
        start_date = moment().format();
        config = Object.assign(defaultConfig, config);
        //Validate configuration with defined schema
        conf_schema_checker.validate(config);
        //Check existence of screenshotOnFail plugin if testExecutionSendEvidenceOnFail option is true
        conf_schema_checker.validate_option_testExecutionSendEvidenceOnFail(codeceptjs, config);
    });

    //If test contains manual steps save status of each step
    event.dispatcher.on(event.step.finished, (step) => {
        //Check if actual test contains manual test integration and save each step status
        if (!step.test?.file?.includes(`.feature`)) {
            manual.save_steps_status(step, manual_steps_results);
        }
    });

    //Get results after each test and push it to tests_results[]
    event.dispatcher.on(event.test.after, function (test) {
        recorder.add('Get test results', function () {
            // Check if current test is a scenario retry
            const is_retry_test = test?._retriedTest !== undefined;

            //Get test status
            const status = is_retry_test ? test._retriedTest.state.toUpperCase() : test.state.toUpperCase();

            let test_contains_examples = false;
            let test_contains_iterations = false;

            //Get tag from test, this tag will be used as a testKey in the api to link the test execution with a JIRA test (if createNewJiraTest is false)
            const test_tags = is_retry_test ? test._retriedTest.tags : test.tags;

            test_tags.every(tag => {
                if (tag.toString().includes("@TEST_")) {
                    test_key = tag.split("@TEST_")[1];
                    return false;
                } else {
                    test_key = "no_xray_tag";
                }
                return true;
            });

            //Reset evidences array if test is neither manual with iterations nor bdd with examples
            if (tests_results[tests_results.length - 1]?.test_key !== test_key) {
                test_evidences = [];
            }

            //Update comment array if test failed
            //Update evidences array if config.testExecutionSendEvidenceOnFail is true
            const test_state = is_retry_test ? test._retriedTest.state : test.state;

            if (test_state === "failed") {
                test_comment.push(common.get_err_string(test));
                if (config.testExecutionSendEvidenceOnFail) test_evidences.push(common.get_evidence_object(test));
            }

            //Check if actual test is BDD or normal test
            const is_bdd = test.file.includes(`.feature`);
            [bdd_examples, test_comment, test_evidences] = bdd.save_bdd_results(is_bdd, tests_results, bdd_examples, test_key, test_comment, test_evidences, test_contains_examples, test, status, config);

            //Check if actual test is manual or data driven test
            const is_manual = manual_steps_results.length > 1 && !is_bdd;
            [manual_steps_results, iterations_array, iteration_number, test_comment, test_evidences] = manual.save_manual_results(is_manual, tests_results, manual_steps_results, iterations_array, manual_iteration, iteration_number, test_key, test_comment, test_evidences, test_contains_iterations, test, status, config);

            //Check if actual test is generic
            const is_generic = !is_manual && !is_bdd;
            generic.save_generic_results(is_generic, tests_results, test_key, test_comment, test_evidences, test, config);
        });
    });

    //Build payload and send it through XRAY API
    event.dispatcher.on(event.all.after, async function (suite) {
        //Reassign last config if edited programmatically
        config = codeceptjs.config.get().plugins.xrayImport;
        config = Object.assign(defaultConfig, config);
        //Validate configuration with defined schema
        conf_schema_checker.validate(config);

        //Generate info object from config
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

        //Generate tests array from tests_results[]
        for (const test_result of tests_results) {
            //Ignore codecept scenario and dont send its result to JIRA if its tag doesnt start with "@TEST_" and config.createNewJiraTest is false
            //But if @TEST_ tag doesnt exist and config.createNewJiraTest is true, testInfo object is added and Xray will try to create a new test in JIRA
            if (test_result.test_key === "no_xray_tag" && !config.createNewJiraTest) {
                if (config.debug) output.print(`A test was ignored because its tag doesn\'t start with '@TEST_' and config option 'createNewJiraTest = false'`);
            } else {
                tests_data.push(await data_generator.generate_tests_data({
                    testKey: test_result.test_key !== "no_xray_tag" ? test_result.test_key : null,
                    testInfo_projectKey: config.projectKey !== null ? config.projectKey : " ",
                    testInfo_summary: test_result.title,
                    testInfo_type: test_result.test_type,
                    testInfo_labels: ["test_created_automatically"],
                    testInfo_definition: test_result.id,
                    testInfo_steps: test_result.test_info_steps,
                    testInfo_scenario: test_result.bdd_scenario,
                    assignee: config.testExecutionAssigneeUserId,
                    status: test_result.status,
                    comment: test_result.comment,
                    examples: test_result.examples?.length !== 0 ? test_result.examples : null,
                    steps: test_result.steps?.length !== 0 ? test_result.steps : null,
                    iterations: test_result.iterations?.length !== 0 ? test_result.iterations : null,
                    evidence: test_result.evidences,
                    start: test_result.start,
                    finish: test_result.finish,
                    customFields: config.testExecutionCustomFields
                }));
            }
        }

        //Merge testExecutionKey, info and tests in one body
        const import_execution_data = config.importToExistingTestExecution ?
            await data_generator.build_import_execution_data("existing_test_execution", config.existingTestExecutionKey, info_data, tests_data) :
            await data_generator.build_import_execution_data("new_test_execution", null, info_data, tests_data);

        if (config.debug) output.print(`Send results to JIRA : \n${JSON.stringify(import_execution_data, null, 2)}`);

        //Validate XRAY execute import body before calling API
        xray_schema_checker.validate(import_execution_data);

        //Send created body to XRAY JIRA CLOUD through XRAY API
        const token = await xray_api.authenticate(config.xrayCloudUrl, config.xrayClientId, config.xraySecret, config.timeout);
        const response = await xray_api.execute_import(config.xrayCloudUrl, import_execution_data, token, config.timeout);

        if (config.debug) output.print(`Response FROM XRAY API: \n${JSON.stringify(response.data, null, 2)}`);
        if (response.status === 200) output.print(`\n> Tests results were sent to XRAY on TestExecution : ${response.data.key}\n`);
    });
};
