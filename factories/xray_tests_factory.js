/**
 * Factory to build the 'tests' array items for Xray execution import
 */
const tests_factory = {
    /**
     * Get payload for /api/v2/import/execution (tests object)
     *
     * @param {Object} tests_data_custom
     * @returns {Object}
     */
    get_tests_object: (tests_data_custom) => {
        return setup_tests_data(tests_data_custom);
    }
};

/**
 * Setup main test data entry
 * @param {Object} custom 
 * @returns {Object}
 */
const setup_tests_data = (custom) => {
    const testEntry = {};

    // Logic for Test Key vs New Test Info
    if (custom.testKey === null || custom.testKey === undefined) {
        testEntry.testInfo = setup_testInfo_data(custom);
    } else {
        testEntry.testKey = custom.testKey;
    }

    testEntry.start = custom.start ?? "2022-08-30T11:47:35+01:00";
    testEntry.finish = custom.finish ?? "2022-08-30T12:00:35+01:00";
    testEntry.comment = custom.comment ?? "Default comment for the test run";
    testEntry.executedBy = custom.executedBy ?? "";
    testEntry.assignee = custom.assignee ?? "";
    testEntry.status = custom.status ?? "TODO";
    
    // Defaulting to empty arrays for these fields
    testEntry.defects = custom.defects ?? [];
    testEntry.evidence = custom.evidence ?? [];
    testEntry.customFields = custom.customFields ?? [];

    // Mutual exclusivity logic for Xray (Examples vs Steps vs Iterations)
    if (custom.examples) {
        testEntry.examples = custom.examples;
    } else if (custom.steps) {
        testEntry.steps = custom.steps;
    } else if (custom.iterations) {
        testEntry.iterations = custom.iterations;
    }

    return testEntry;
};

/**
 * Setup testInfo data for creating new tests in Jira
 * @param {Object} custom 
 * @returns {Object}
 */
const setup_testInfo_data = (custom) => {
    const info = {};

    info.projectKey = custom.testInfo_projectKey ?? "";
    info.summary = custom.testInfo_summary ?? "Test generated automatically";
    info.type = custom.testInfo_type ?? "Generic";
    info.requirementKeys = custom.testInfo_requirementKeys ?? [];
    info.labels = custom.testInfo_labels ?? "automated_test";

    // Scenario logic based on test type
    if (info.type === "Generic") {
        info.definition = custom.testInfo_definition ?? "generic test definition here";
    }

    if (info.type === "Manual") {
        info.steps = custom.testInfo_steps ?? [];
    }

    if (info.type === "Cucumber") {
        info.scenario = custom.testInfo_scenario ?? "";
    }

    return info;
};

export default tests_factory;