/**
 * Factory to build the 'info' object for Xray execution import
 */
const info_factory = {

    /**
     * Get payload for /api/v2/import/execution (info object)
     *
     * @param {Object} info_data_custom
     * @returns {Object}
     */
    get_info_object: (info_data_custom) => {
        return setup_info_data(info_data_custom);
    }
};

/**
 * Setup info data with defaults if custom values are missing
 * @param {Object} info_data_custom 
 * @returns {Object}
 */
const setup_info_data = (info_data_custom) => {
    const info = {};

    // Using Nullish Coalescing (??) to allow empty strings as valid values
    info.project = info_data_custom.project ?? "";
    
    info.summary = info_data_custom.summary 
        ?? "Execution of automated tests";
    
    info.description = info_data_custom.description 
        ?? "This execution is automatically created when importing execution results from Gitlab";
    
    info.version = info_data_custom.version ?? "";
    info.revision = info_data_custom.revision ?? "";
    info.user = info_data_custom.user;
    
    // Default dates preserved from original code
    info.startDate = info_data_custom.startDate ?? "2022-08-30T11:47:35+01:00";
    info.finishDate = info_data_custom.finishDate ?? "2022-08-30T12:00:35+01:00";
    
    info.testPlanKey = info_data_custom.testPlanKey ?? "";
    info.testEnvironments = info_data_custom.testEnvironments ?? "";

    return info;
};

export default info_factory;