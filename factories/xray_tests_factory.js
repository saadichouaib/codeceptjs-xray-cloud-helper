const tests_factory = () => ({

    /**
     * Get payload for /api/v2/import/execution (tests object)
     *
     * @param {String} scenario
     * @param {Object} custom_data
     * @returns {Object}
     */
    get_tests_object: (tests_data_custom) => {
        return setup_tests_data(tests_data_custom);
    }
});

const setup_tests_data = (tests_data_custom) => {
    let import_execution_tests_data = {};

    if (tests_data_custom.testKey !== null) import_execution_tests_data.testKey = tests_data_custom.testKey;
    if (tests_data_custom.testKey === null) import_execution_tests_data.testInfo = setup_testInfo_data(tests_data_custom);
    import_execution_tests_data.start = tests_data_custom.start ? tests_data_custom.start : "2022-08-30T11:47:35+01:00";
    import_execution_tests_data.finish = tests_data_custom.finish ? tests_data_custom.finish : "2022-08-30T12:00:35+01:00";
    import_execution_tests_data.comment = tests_data_custom.comment ? tests_data_custom.comment : "Default comment for the test run";
    import_execution_tests_data.executedBy = tests_data_custom.executedBy ? tests_data_custom.executedBy : "";
    import_execution_tests_data.assignee = tests_data_custom.assignee ? tests_data_custom.assignee : "";
    import_execution_tests_data.status = tests_data_custom.status ? tests_data_custom.status : "TODO";
    import_execution_tests_data.examples = tests_data_custom.examples ? tests_data_custom.examples : null;
    import_execution_tests_data.steps = tests_data_custom.steps ? tests_data_custom.steps : null;
    import_execution_tests_data.iterations = tests_data_custom.iterations ? tests_data_custom.iterations : null;
    import_execution_tests_data.defects = tests_data_custom.defects ? tests_data_custom.defects : [];
    import_execution_tests_data.evidence = tests_data_custom.evidence ? tests_data_custom.evidence : [];
    import_execution_tests_data.customFields = tests_data_custom.customFields ? tests_data_custom.customFields : [];

    switch (import_execution_tests_data.examples){
        case null:
        case undefined:
            delete import_execution_tests_data.examples;
            break;
        default:
            delete import_execution_tests_data.steps;
            delete import_execution_tests_data.iterations;
            break;
    }

    switch (import_execution_tests_data.steps){
        case null:
        case undefined:
            delete import_execution_tests_data.steps;
            break;
        default:
            delete import_execution_tests_data.examples;
            delete import_execution_tests_data.iterations;
            break;
    }

    switch (import_execution_tests_data.iterations){
        case null:
        case undefined:
            delete import_execution_tests_data.iterations;
            break;
        default:
            delete import_execution_tests_data.examples;
            delete import_execution_tests_data.steps;
            break;
    }

    return import_execution_tests_data;
};

const setup_testInfo_data = (tests_data_custom) => {
    let testInfo_data = {};

    testInfo_data.projectKey = tests_data_custom.testInfo_projectKey ? tests_data_custom.testInfo_projectKey : "";
    testInfo_data.summary = tests_data_custom.testInfo_summary ? tests_data_custom.testInfo_summary : "Test generated automatically";
    testInfo_data.type = tests_data_custom.testInfo_type ? tests_data_custom.testInfo_type : "Generic";
    testInfo_data.requirementKeys = tests_data_custom.testInfo_requirementKeys ? tests_data_custom.testInfo_requirementKeys : [];
    testInfo_data.labels = tests_data_custom.testInfo_labels ? tests_data_custom.testInfo_labels : "automated_test";
    testInfo_data.steps = tests_data_custom.testInfo_steps ? tests_data_custom.testInfo_steps : [];
    testInfo_data.scenario = tests_data_custom.testInfo_scenario ? tests_data_custom.testInfo_scenario : "";
    testInfo_data.definition = tests_data_custom.testInfo_definition ? tests_data_custom.testInfo_definition : "generic test definition here";

    switch (testInfo_data.type){
        case "Generic":
            delete testInfo_data.steps;
            delete testInfo_data.scenario;
            break;
        case "Manual":
            delete testInfo_data.definition;
            delete testInfo_data.scenario
            break;
        case "Cucumber":
            delete testInfo_data.steps;
            delete testInfo_data.definition;
            break;
    }

    return testInfo_data;
};

module.exports = tests_factory();
