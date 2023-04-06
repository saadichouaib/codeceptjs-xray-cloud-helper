const moment = require('moment');
const common = require('./common');

module.exports = {
    save_bdd_results(is_bdd, tests_results, bdd_examples, test_key, test_comment, test_evidences, test_contains_examples, test, status, config) {
        const scenario = `Scenario: ${test.title}`;
        if (is_bdd) {
            //Check if it's a scenario outline with examples or a normal BDD scenario
            if(bdd_examples.length !== 0 && tests_results[tests_results.length - 1].test_key === test_key){
                bdd_examples.push(status);
                test_contains_examples = true;
            } else {
                bdd_examples = [];
                test_comment = [];
                test_evidences = [];
                bdd_examples.push(status);
            }

            if(!test_contains_examples){
                test_evidences = [];
                test_comment = [];
                if(test.state === "failed") {
                    test_comment.push(common.get_err_string(test));
                    if (config.testExecutionSendEvidenceOnFail) test_evidences.push(common.get_evidence_object(test));
                }
                common.push_test_state_to_results(tests_results, test_key, test_comment, test_evidences, test, "Cucumber",null, scenario);
            } else{
                //If actual test is scenario outline then push examples array with its state to the actual result
                tests_results[tests_results.length - 1].examples = bdd_examples;
                tests_results[tests_results.length - 1].status = bdd_examples.includes("FAILED") ? "FAILED" : "PASSED";
                tests_results[tests_results.length - 1].comment = bdd_examples.includes("FAILED") ? test_comment.toString() : "Test passed successfully";
                tests_results[tests_results.length - 1].finish = moment().format()
                tests_results[tests_results.length - 1].evidences = bdd_examples.includes("FAILED") ? test_evidences : [];
            }
        }

        return [bdd_examples, test_comment, test_evidences];
    }
};
