import fs from 'fs';
import moment from 'moment';

export default {
    /**
     * Push the current test state and metadata to the results array
     */
    push_test_state_to_results(tests_results, test_key, test_comment, test_evidences, test, test_type, test_info_steps = null, scenario = null) {
        // Check if actual test have retries to push only the last result when it fails
        const test_have_retries = test._retries !== -1;
        const is_last_retry = test?._retries === test?._currentRetry;
        const test_state = this.get_test_state(test);

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
        } else if (test_state === "failed") {
            // Logic improvement: Only push if (retries enabled AND last retry reached) OR (retries disabled)
            const shouldPushFailure = (test_have_retries && is_last_retry) || test_have_retries === false;
            
            if (shouldPushFailure) {
                tests_results.push({
                    title: test.title,
                    status: "FAILED",
                    comment: test_comment.toString(),
                    test_key: test_key,
                    start: moment(test.startedAt).format(),
                    finish: moment().format(),
                    id: test.id,
                    evidences: test_evidences,
                    test_type: test_type,
                    test_info_steps: test_info_steps,
                    bdd_scenario: scenario
                });
            }
        }
    },

    /**
     * Sanitize error message and handle template-based errors
     */
    get_err_string(test) {
        if (test.err?.template) {
            return `${test.err?.params?.customMessage}expected ${test.err?.params?.jar} ${test.err?.params?.type} '${test.err?.params?.needle}'`;
        }
        
        // Sanitize string and remove special characters/accents
        return test.err?.toString()
            .replaceAll(/"/g, "")
            .replaceAll(/'/g, "")
            .replaceAll(/é/g, "e")
            .replaceAll(/è/g, "e")
            .replaceAll(/ê/g, "e")
            .replaceAll(/à/g, "a")
            .replaceAll(/ù/g, "u");
    },

    /**
     * Prepare screenshot evidence for Xray
     */
    get_evidence_object(test) {
        const test_artifacts = this.is_retry_test(test) ? test._retriedTest.artifacts : test.artifacts;

        const screenshot_file = test_artifacts.screenshot;
        const screenshot_encoded = this.base64_encode(screenshot_file);
        const screenshot_name = screenshot_file.split('/').pop();

        return {
            data: screenshot_encoded,
            filename: `${screenshot_name}`,
            contentType: "image/png"
        };
    },

    /**
     * Modernized Base64 encoding
     */
    base64_encode(file) {
        const image = fs.readFileSync(file);
        return Buffer.from(image).toString('base64');
    },

    is_retry_test(test) {
        return test?._retriedTest !== undefined;
    },

    get_test_tags(test) {
        return this.is_retry_test(test) ? test._retriedTest.tags : test.tags;
    },

    get_test_state(test) {
        const isRetry = this.is_retry_test(test);
        if (isRetry && test?._retriedTest?.state === undefined) {
            return test.state;
        }
        return isRetry ? test._retriedTest.state : test.state;
    }
};