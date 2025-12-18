import moment from 'moment';
import common from './common.js';

export default {
    /**
     * Save BDD results to tests_results array
     */
    save_bdd_results(is_bdd, tests_results, bdd_examples, test_key, test_comment, test_evidences, test_contains_examples, test, status, config) {
        const scenario = `Scenario: ${test.title}`;
        
        if (is_bdd) {
            const lastTest = tests_results[tests_results.length - 1];
            
            // Check if it's a scenario outline with examples or a normal BDD scenario
            if (bdd_examples.length > 0 && lastTest?.test_key === test_key) {
                bdd_examples.push(status.toUpperCase());
                test_contains_examples = true;
            } else {
                bdd_examples = [];
                test_comment = [];
                test_evidences = [];
                bdd_examples.push(status.toUpperCase());
            }

            if (test_contains_examples === false) {
                test_evidences = [];
                test_comment = [];
                if (status === "failed") {
                    test_comment.push(common.get_err_string(test));
                    if (config.testExecutionSendEvidenceOnFail) {
                        test_evidences.push(common.get_evidence_object(test));
                    }
                }
                common.push_test_state_to_results(tests_results, test_key, test_comment, test_evidences, test, "Cucumber", null, scenario);
            } else {
                // If actual test is scenario outline then push examples array with its state to the actual result
                const isFailed = bdd_examples.includes("FAILED");
                
                lastTest.examples = bdd_examples;
                lastTest.status = isFailed ? "FAILED" : "PASSED";
                lastTest.comment = isFailed ? test_comment.toString() : "Test passed successfully";
                lastTest.finish = moment().format();
                lastTest.evidences = isFailed ? test_evidences : [];
            }
        }

        return [bdd_examples, test_comment, test_evidences];
    }
};