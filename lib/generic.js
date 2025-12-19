// @ts-check
import common from './common.js';

/**
 * @typedef {import('./common.js').XrayTestResult} XrayTestResult
 * @typedef {import('./common.js').XrayEvidence} XrayEvidence
 * @typedef {import('./common.js').CommonContext} CommonContext
 */

/**
 * @typedef {Object} GenericContext
 * @property {boolean} is_generic - Whether the current test is a generic automated test
 * @property {XrayTestResult[]} tests_results - The global results array to be updated
 * @property {string|null} test_key - Jira Test Key
 * @property {any} test - The CodeceptJS test object
 * @property {import('../helpers/conf_schema_checker.js').XrayPluginConfig} config - Plugin configuration
 * @property {string} status - Test status (passed/failed)
 */

export default {
    /**
     * Save results for generic (non-BDD, non-Manual) tests
     * @param {GenericContext} ctx - The execution context containing state and config.
     */
    save_generic_results(ctx) {
        const { is_generic, tests_results, test_key, test, config, status } = ctx;

        // Guard Clause: Exit early if not a generic test
        if (is_generic !== true) {
            return;
        }

        /** @type {XrayEvidence[]} */
        let current_evidences = [];
        /** @type {string[]} */
        let current_comment = [];

        if (status === "failed") {
            current_comment.push(common.get_err_string(test));
            
            if (config.testExecutionSendEvidenceOnFail === true) {
                const evidence = common.get_evidence_object(test);
                // @ts-ignore - Handle empty object return from helper
                if (evidence.data) current_evidences.push(evidence);
            }
        }

        // Fix: Pass a single object (CommonContext) instead of 6 args
        /** @type {CommonContext} */
        const commonCtx = {
            tests_results,
            test_key,
            test_comment: current_comment,
            test_evidences: current_evidences,
            test,
            test_type: "Generic"
        };

        common.push_test_state_to_results(commonCtx);
    }
};