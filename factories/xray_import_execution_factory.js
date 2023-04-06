
const import_execution_factory = () => ({

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
        }
        return import_execution_data;
    }
});

const existing_test_execution = (testExecutionKey, info, tests) => {
    const import_execution_data = {testExecutionKey: testExecutionKey, info, tests};

    return import_execution_data
};

const new_test_execution = (info, tests) => {
    const import_execution_data = {info, tests};

    return import_execution_data
};

module.exports = import_execution_factory();