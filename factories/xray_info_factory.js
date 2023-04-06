
const info_factory = () => ({

    /**
     * Get payload for /api/v2/import/execution (info object)
     *
     * @param {Object} info_data_custom
     * @returns {Object}
     */
    get_info_object: (info_data_custom) => {
        return  setup_info_data(info_data_custom);
    }
});

const setup_info_data = (info_data_custom) => {
    let import_execution_info_data = {};

    import_execution_info_data.project = info_data_custom.project ? info_data_custom.project : "";
    import_execution_info_data.summary = info_data_custom.summary || info_data_custom.summary === "" ? info_data_custom.summary : "Execution of automated tests";
    import_execution_info_data.description = info_data_custom.description  || info_data_custom.description === "" ? info_data_custom.description : "This execution is automatically created when importing execution results from Gitlab";
    import_execution_info_data.version = info_data_custom.version ? info_data_custom.version : "";
    import_execution_info_data.revision = info_data_custom.revision ? info_data_custom.revision : "";
    import_execution_info_data.user = info_data_custom.user;
    import_execution_info_data.startDate = info_data_custom.startDate ? info_data_custom.startDate : "2022-08-30T11:47:35+01:00";
    import_execution_info_data.finishDate = info_data_custom.finishDate ? info_data_custom.finishDate : "2022-08-30T12:00:35+01:00";
    import_execution_info_data.testPlanKey = info_data_custom.testPlanKey ? info_data_custom.testPlanKey : "";
    import_execution_info_data.testEnvironments = info_data_custom.testEnvironments ? info_data_custom.testEnvironments : "";

    return import_execution_info_data;
};

module.exports = info_factory();
