const common = require('./common');

module.exports = {
    save_generic_results(is_generic, tests_results, test_key, test_comment, test_evidences, test, config) {
        if(is_generic){
            test_evidences = [];
            test_comment = [];
            if(test.state === "failed") {
                test_comment.push(common.get_err_string(test));
                if (config.testExecutionSendEvidenceOnFail) test_evidences.push(common.get_evidence_object(test));
            }
            common.push_test_state_to_results(tests_results, test_key, test_comment, test_evidences, test, "Generic");
        }
    }
};
