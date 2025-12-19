// @ts-check
import { event, output, recorder } from "codeceptjs";
import moment from "moment";
import xray_api from "./api/xray_api.js";
import conf_schema_checker from "./helpers/conf_schema_checker.js";
import data_generator from "./helpers/data_generator.js";
import xray_schema_checker from "./helpers/xray_schema_checker.js";
import bdd from "./lib/bdd.js";
import common from "./lib/common.js";
import generic from "./lib/generic.js";
import manual from "./lib/manual.js";

/** * @typedef {import('./helpers/conf_schema_checker.js').XrayPluginConfig} XrayPluginConfig
 * @typedef {import('./lib/common.js').XrayTestResult} XrayTestResult
 * @typedef {import('./lib/common.js').XrayEvidence} XrayEvidence
 * @typedef {import('./helpers/data_generator.js').XrayTestData} XrayTestData
 */

/**
 * @typedef {Object} XrayApiResponse
 * @property {number} status
 * @property {Object} data
 * @property {string} [data.key]
 */

/**
 * @typedef {Object} XrayPluginState
 * @property {string} start_date
 * @property {string|null} test_key
 * @property {string[]} test_comment
 * @property {XrayEvidence[]} test_evidences
 * @property {XrayTestResult[]} tests_results
 * @property {XrayTestData[]} tests_data
 * @property {string[]} bdd_examples
 * @property {any[][]} manual_steps_results
 * @property {number} iteration_number
 * @property {any[]} iterations_array
 * @property {Record<string, any>} manual_iteration
 */

/** @type {XrayPluginConfig} */
const defaultConfig = {
  require: "codeceptjs-xray-cloud-helper",
  enabled: true,
  debug: false,
  projectKey: "",
  importToExistingTestExecution: false,
  existingTestExecutionKey: "",
  testExecutionAssigneeUserId: "",
  testExecutionPlanKey: "",
  testExecutionVersion: "",
  testExecutionRevision: "",
  testExecutionEnvironments: ["QA"],
  testExecutionSummary: "Execution of automated tests",
  testExecutionDescription:
    "This execution is automatically created when importing execution results",
  testExecutionSendEvidenceOnFail: false,
  testExecutionCustomFields: [],
  createNewJiraTest: false,
  timeout: 12000,
  xrayCloudUrl: "https://xray.cloud.getxray.app",
  xrayClientId: "",
  xraySecret: "",
};

/** @type {XrayPluginState} */
const state = {
  start_date: "",
  test_key: null,
  test_comment: [],
  test_evidences: [],
  tests_results: [],
  tests_data: [],
  bdd_examples: [],
  manual_steps_results: [[]],
  iteration_number: 0,
  iterations_array: [],
  manual_iteration: {},
};

/**
 * CodeceptJS Xray Cloud Helper
 * @param {XrayPluginConfig} config
 */
export default function main(config) {
  event.dispatcher.on(event.all.before, () => {
    state.start_date = moment().format();
    config = Object.assign(defaultConfig, config);
    conf_schema_checker.validate(config);
    // @ts-ignore
    conf_schema_checker.validate_option_testExecutionSendEvidenceOnFail(
      codeceptjs,
      config
    );
  });

  event.dispatcher.on(event.step.finished, (step) => {
    const isBdd = step.test?.file?.includes(".feature");
    if (isBdd === false) {
      manual.save_steps_status(step, state.manual_steps_results);
    }
  });

  event.dispatcher.on(event.test.after, (test) => {
    recorder.add("Get test results", () => {
      const test_tags = common.get_test_tags(test);

      test_tags.every((/** @type {string} */ tag) => {
        const tagStr = tag.toString();
        if (tagStr.includes("@TEST_")) {
          state.test_key = tagStr.split("@TEST_")[1];
          return false;
        }
        state.test_key = "no_xray_tag";
        return true;
      });

      // Clear evidences if we move to a new test
      if (state.tests_results.at(-1)?.test_key !== state.test_key) {
        state.test_evidences = [];
      }

      const status = common.get_test_state(test);

      if (status === "failed") {
        state.test_comment.push(common.get_err_string(test));
        if (config.testExecutionSendEvidenceOnFail) {
          const evidence = common.get_evidence_object(test);
          // Type guard for evidence object
          if (evidence && "data" in evidence) {
            state.test_evidences.push(/** @type {XrayEvidence} */ (evidence));
          }
        }
      }

      const is_bdd = test.file.includes(".feature");
      const is_manual =
        state.manual_steps_results.length > 1 && is_bdd === false;
      const is_generic = is_manual === false && is_bdd === false;

      const ctx = {
        ...state,
        test,
        status,
        config,
        is_bdd,
        is_manual,
        is_generic,
      };

      if (is_bdd) {
        // We cast the function result to a specific Tuple type
        /** @type {[string[], string[], XrayEvidence[]]} */
        // @ts-ignore
        const [newExamples, newComments, newEvidences] =
          bdd.save_bdd_results(ctx);

        state.bdd_examples = newExamples;
        state.test_comment = newComments;
        state.test_evidences = newEvidences;
      }

      if (is_manual) {
        const manualRes = manual.save_manual_results(ctx);
        state.manual_steps_results = /** @type {any[][]} */ (manualRes[0]);
        state.iterations_array = /** @type {any[]} */ (manualRes[1]);
        state.iteration_number = /** @type {number} */ (manualRes[2]);
        state.test_comment = /** @type {string[]} */ (manualRes[3]);
        state.test_evidences = /** @type {XrayEvidence[]} */ (manualRes[4]);
      }

      if (is_generic) {
        generic.save_generic_results(ctx);
      }
    });
  });

  event.dispatcher.on(event.all.after, async () => {
    // @ts-ignore
    const currentConf = codeceptjs.config.get().plugins.xrayImport;
    /** @type {XrayPluginConfig} */
    const finalConfig = Object.assign(defaultConfig, currentConf);

    const info_data = data_generator.generate_info_data({
      project: finalConfig.projectKey,
      summary: finalConfig.testExecutionSummary,
      description: finalConfig.testExecutionDescription,
      version: finalConfig.testExecutionVersion,
      revision: finalConfig.testExecutionRevision,
      testPlanKey: finalConfig.testExecutionPlanKey,
      testEnvironments: finalConfig.testExecutionEnvironments,
      startDate: state.start_date,
      finishDate: moment().format(),
    });

    for (const res of state.tests_results) {
      const hasXrayTag = res.test_key !== "no_xray_tag";

      if (hasXrayTag || finalConfig.createNewJiraTest) {
        state.tests_data.push(
          data_generator.generate_tests_data({
            testKey: hasXrayTag ? res.test_key : null,
            testInfo_projectKey: finalConfig.projectKey || "",
            testInfo_summary: res.title,
            testInfo_type: res.test_type,
            testInfo_labels: ["test_created_automatically"],
            testInfo_definition: res.id || "",
            testInfo_steps: res.test_info_steps || [],
            testInfo_scenario: res.bdd_scenario || "",
            assignee: finalConfig.testExecutionAssigneeUserId,
            status: res.status,
            comment: res.comment,
            examples:
              res.examples && res.examples.length > 0 ? res.examples : null,
            steps: res.steps && res.steps.length > 0 ? res.steps : null,
            iterations:
              res.iterations && res.iterations.length > 0
                ? res.iterations
                : null,
            evidence: res.evidences,
            start: res.start,
            finish: res.finish,
            customFields: finalConfig.testExecutionCustomFields,
          })
        );
      }
    }

    // Ensure existingTestExecutionKey is never undefined by using ?? ""
    const import_execution_data = finalConfig.importToExistingTestExecution
      ? data_generator.build_import_execution_data(
          "existing_test_execution",
          finalConfig.existingTestExecutionKey ?? "",
          info_data,
          state.tests_data
        )
      : data_generator.build_import_execution_data(
          "new_test_execution",
          "",
          info_data,
          state.tests_data
        );

    xray_schema_checker.validate(import_execution_data);

    const token = await xray_api.authenticate(
      finalConfig.xrayCloudUrl,
      finalConfig.xrayClientId,
      finalConfig.xraySecret,
      finalConfig.timeout
    );

    /** @type {XrayApiResponse} */
    const response = /** @type {any} */ (
      await xray_api.execute_import(
        finalConfig.xrayCloudUrl,
        import_execution_data,
        token,
        finalConfig.timeout
      )
    );

    if (response.data && (response.status === 200 || response.status === 201)) {
      // Fix for output.print casting
      const outputCast = /** @type {any} */ (output);
      outputCast.print(
        `\n> Tests results sent to XRAY TestExecution: ${response.data.key}\n`
      );
    }
  });
}
