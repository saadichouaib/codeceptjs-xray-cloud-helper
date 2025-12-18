/**
 * Factory to build the payload for Xray execution import
 */
const import_execution_factory = {

    /**
     * Get payload for /api/v2/import/execution
     *
     * @param {String} scenario
     * @param {String} testExecutionKey
     * @param {Object} info_data
     * @param {Array} tests_data
     * @returns {Object} import_execution_data
     */
    build: (scenario, testExecutionKey, info_data, tests_data) => {
        let import_execution_data;

        switch (scenario) {
            case "existing_test_execution":
                import_execution_data = existing_test_execution(testExecutionKey, info_data, tests_data);
                break;
            case "new_test_execution":
                import_execution_data = new_test_execution(info_data, tests_data);
                break;
            default:
                // Fallback for unexpected scenarios
                import_execution_data = new_test_execution(info_data, tests_data);
        }
        return import_execution_data;
    }
};

/**
 * Build payload for an already existing Test Execution in Jira
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
 */
const new_test_execution = (info, tests) => {
    return { 
        info, 
        tests 
    };
};

export default import_execution_factory;