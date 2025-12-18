import common from './common.js';

export default {
    /**
     * Save results for generic (non-BDD, non-Manual) tests
     * * @param {boolean} is_generic 
     * @param {Array} tests_results 
     * @param {string} test_key 
     * @param {Array} test_comment 
     * @param {Array} test_evidences 
     * @param {Object} test 
     * @param {Object} config 
     * @param {string} status 
     */
    save_generic_results(is_generic, tests_results, test_key, test_comment, test_evidences, test, config, status) {
        if (is_generic === true) {
            // Reset local arrays for the fresh test result
            let current_evidences = [];
            let current_comment = [];

            if (status === "failed") {
                current_comment.push(common.get_err_string(test));
                
                if (config.testExecutionSendEvidenceOnFail === true) {
                    current_evidences.push(common.get_evidence_object(test));
                }
            }

            common.push_test_state_to_results(
                tests_results, 
                test_key, 
                current_comment, 
                current_evidences, 
                test, 
                "Generic"
            );
        }
    }
};