// @ts-check
import moment from 'moment';
import common from './common.js';

/**
 * @typedef {import('./common.js').CommonContext} CommonContext
 * @typedef {import('./common.js').XrayTestResult} XrayTestResult
 * @typedef {import('./common.js').XrayEvidence} XrayEvidence
 * @typedef {import('../helpers/conf_schema_checker.js').XrayPluginConfig} XrayPluginConfig
 */

/**
 * @typedef {Object} BDDContext
 * @property {boolean} is_bdd
 * @property {XrayTestResult[]} tests_results
 * @property {string[]} bdd_examples
 * @property {string|null} test_key
 * @property {string[]} test_comment
 * @property {XrayEvidence[]} test_evidences
 * @property {any} test
 * @property {string} status
 * @property {XrayPluginConfig} config
 */

export default {
    /**
     * @param {BDDContext} ctx
     */
    save_bdd_results(ctx) {
        const { is_bdd, tests_results, test_key, test, status, config } = ctx;
        let { bdd_examples, test_comment, test_evidences } = ctx;

        if (is_bdd === false) {
            return [bdd_examples, test_comment, test_evidences];
        }

        const lastTest = tests_results.at(-1);
        const scenario = `Scenario: ${test.title}`;
        
        const isScenarioOutline = bdd_examples.length > 0 && lastTest?.test_key === test_key;

        if (isScenarioOutline === true && lastTest) {
            bdd_examples.push(status.toUpperCase());
            const isFailed = bdd_examples.includes("FAILED");

            lastTest.examples = bdd_examples;
            lastTest.status = isFailed ? "FAILED" : "PASSED";
            lastTest.comment = isFailed ? test_comment.toString() : "Test passed successfully";
            lastTest.finish = moment().format();
            lastTest.evidences = isFailed ? test_evidences : [];
            
            return [bdd_examples, test_comment, test_evidences];
        }

        const new_bdd_examples = [status.toUpperCase()];
        /** @type {string[]} */
        const new_test_comment = [];
        /** @type {XrayEvidence[]} */
        const new_test_evidences = [];

        if (status === "failed") {
            new_test_comment.push(common.get_err_string(test));
            if (config.testExecutionSendEvidenceOnFail === true) {
                // @ts-ignore - common helper returns Evidence or {}
                new_test_evidences.push(common.get_evidence_object(test));
            }
        }

        // Convert null to undefined for strict type compatibility
        common.push_test_state_to_results({
            tests_results,
            test_key: test_key ?? null,
            test_comment: new_test_comment,
            test_evidences: new_test_evidences,
            test,
            test_type: "Cucumber",
            scenario: scenario ?? undefined
        });

        return [new_bdd_examples, new_test_comment, new_test_evidences];
    }
};