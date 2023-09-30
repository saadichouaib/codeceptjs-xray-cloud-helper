const moment = require('moment');
const fs = require('fs');

module.exports = {
    push_test_state_to_results(tests_results, test_key, test_comment, test_evidences, test, test_type, test_info_steps = null, scenario = null) {
        // Check if actual test have retries to push only the last result when it fails
        const test_have_retries = test._retries !== -1;
        const is_retry_test = test?._retriedTest !== undefined;
        const is_last_retry = test?._retries === test?._currentRetry;
        const test_state = is_retry_test ? test._retriedTest.state : test.state;

        if (test_state === "passed") {
            tests_results.push({
                title: test.title,
                status: "PASSED",
                comment: "Test passed successfully",
                test_key: test_key,
                start: moment(test.startedAt).format(),
                finish: moment().format(),
                id: test?.uid,
                evidences: [],
                test_type: test_type,
                test_info_steps: test_info_steps,
                bdd_scenario: scenario
            });
        } else if (test_state === "failed" && (test_have_retries && is_last_retry || !test_have_retries)) {
            tests_results.push({
                title: test.title,
                status: "FAILED",
                comment: test_comment.toString(),
                test_key: test_key,
                start: moment(test.startedAt).format(),
                finish: moment().format(),
                id: test?.uid,
                evidences: test_evidences,
                test_type: test_type,
                test_info_steps: test_info_steps,
                bdd_scenario: scenario
            });
        }
    },

    get_err_string(test) {
        if (test.err?.template) {
            return `${test.err?.params?.customMessage}expected ${test.err?.params?.jar} ${test.err?.params?.type} '${test.err?.params?.needle}'`;
        } else {
            return test.err?.toString().replace(/\"/g, "").replace(/\'/g, "").replace(/\é/g, "e").replace(/\è/g, "e").replace(/\ê/g, "e").replace(/\à/g, "a").replace(/\ù/g, "u");
        }
    },

    get_evidence_object(test) {
        // Check if current test is a scenario retry
        const is_retry_test = test?._retriedTest !== undefined;
        const test_artifacts = is_retry_test ? test._retriedTest.artifacts : test.artifacts;

        // Get screenshot file name
        const screenshot_file = test_artifacts.screenshot;
        const screenshot_encoded = this.base64_encode(screenshot_file);
        const screenshot_name = screenshot_file.split('/').pop();

        return {
            data: screenshot_encoded,
            filename: `${screenshot_name}`,
            contentType: "image/png"
        }
    },

    base64_encode(file) {
        const image = fs.readFileSync(file);
        return new Buffer(image).toString('base64');
    }
};
