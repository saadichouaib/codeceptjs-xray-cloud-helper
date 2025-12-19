// @ts-check

/** * @typedef {import('./xray_info_factory.js').XrayInfoData} XrayInfoData
 * @typedef {import('../helpers/data_generator.js').XrayTestData} XrayTestData
 */

/**
 * @typedef {Object} XrayImportPayload
 * @property {string} [testExecutionKey] - Required only for existing executions
 * @property {XrayInfoData} info - Metadata about the execution
 * @property {XrayTestData[]} tests - Array of test results
 */

/**
 * Factory to build the payload for Xray execution import
 */
const import_execution_factory = {

    /**
     * Get payload for /api/v2/import/execution
     *
     * @param {"existing_test_execution" | "new_test_execution"} scenario
     * @param {string|null} testExecutionKey
     * @param {XrayInfoData} info_data
     * @param {XrayTestData[]} tests_data
     * @returns {XrayImportPayload}
     */
    build: (scenario, testExecutionKey, info_data, tests_data) => {
        switch (scenario) {
            case "existing_test_execution":
                return existing_test_execution(testExecutionKey || "", info_data, tests_data);
            case "new_test_execution":
                return new_test_execution(info_data, tests_data);
            default:
                // Type safety fallback
                return new_test_execution(info_data, tests_data);
        }
    }
};

/**
 * Build payload for an already existing Test Execution in Jira
 * @param {string} testExecutionKey
 * @param {XrayInfoData} info
 * @param {XrayTestData[]} tests
 * @returns {XrayImportPayload}
 */
const existing_test_execution = (testExecutionKey, info, tests) => {
    return { 
        testExecutionKey, 
        info, 
        tests 
    };
};

/**
 * Build payload for a new Test Execution
 * @param {XrayInfoData} info
 * @param {XrayTestData[]} tests
 * @returns {XrayImportPayload}
 */
const new_test_execution = (info, tests) => {
    return { 
        info, 
        tests 
    };
};

export default import_execution_factory;