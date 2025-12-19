// @ts-check

/**
 * @typedef {import('../helpers/data_generator.js').XrayTestData} XrayTestData
 */

/**
 * Factory to build the 'tests' array items for Xray execution import
 */
const tests_factory = {
    /**
     * Get payload for /api/v2/import/execution (tests object)
     *
     * @param {Partial<XrayTestData>} tests_data_custom
     * @returns {XrayTestData} - Now returns the specific type instead of generic Object
     */
    get_tests_object: (tests_data_custom) => {
        return setup_tests_data(tests_data_custom);
    }
};

/**
 * Setup main test data entry
 * @param {Partial<XrayTestData>} custom 
 * @returns {XrayTestData} 
 */
const setup_tests_data = (custom) => {
    // We initialize with defaults to satisfy the XrayTestData interface immediately
    /** @type {XrayTestData} */
    const testEntry = {
        testKey: custom.testKey ?? null,
        status: custom.status ?? "TODO",
        comment: custom.comment ?? "Default comment for the test run",
        assignee: custom.assignee ?? "",
        start: custom.start ?? new Date().toISOString(),
        finish: custom.finish ?? new Date().toISOString(),
        evidence: custom.evidence ?? [],
        customFields: custom.customFields ?? [],
        executedBy: "",
        examples: null,
        steps: null,
        iterations: null
    };

    // Logic for Test Key vs New Test Info
    if (testEntry.testKey === null) {
        // @ts-ignore - setup_testInfo_data will return the required Object shape
        testEntry.testInfo = setup_testInfo_data(custom);
    }

    // Mutual exclusivity logic for Xray payload
    if (custom.examples && custom.examples.length > 0) {
        testEntry.examples = custom.examples;
    } else if (custom.steps && custom.steps.length > 0) {
        testEntry.steps = custom.steps;
    } else if (custom.iterations && custom.iterations.length > 0) {
        testEntry.iterations = custom.iterations;
    }

    return testEntry;
};

/**
 * Setup testInfo data for creating new tests in Jira
 * @param {Partial<XrayTestData>} custom 
 * @returns {Object}
 */
const setup_testInfo_data = (custom) => {
    /** @type {Record<string, any>} */
    const info = {};

    info.projectKey = custom.testInfo_projectKey ?? "";
    info.summary = custom.testInfo_summary ?? "Test generated automatically";
    info.type = custom.testInfo_type ?? "Generic";
    info.requirementKeys = [];
    info.labels = custom.testInfo_labels ?? ["automated_test"];

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