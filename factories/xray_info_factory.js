// @ts-check

/**
 * @typedef {Object} XrayInfoData
 * @property {string} [project] - Jira project key
 * @property {string} [summary] - Summary of the Test Execution
 * @property {string} [description] - Detailed description
 * @property {string} [version] - Project version
 * @property {string} [revision] - Revision version
 * @property {string} [user] - The user who executed the tests
 * @property {string} [startDate] - Start time in ISO format
 * @property {string} [finishDate] - End time in ISO format
 * @property {string} [testPlanKey] - Key of the Test Plan in Jira
 * @property {string[]} [testEnvironments] - List of environments (e.g., ['QA', 'Prod'])
 */

/**
 * Factory to build the 'info' object for Xray execution import
 */
const info_factory = {

    /**
     * Get payload for /api/v2/import/execution (info object)
     *
     * @param {XrayInfoData} info_data_custom
     * @returns {XrayInfoData}
     */
    get_info_object: (info_data_custom) => {
        return setup_info_data(info_data_custom);
    }
};

/**
 * Setup info data with defaults if custom values are missing
 * @param {XrayInfoData} info_data_custom 
 * @returns {XrayInfoData}
 */
const setup_info_data = (info_data_custom) => {
    /** * We initialize the object with the explicit type.
     * This allows the IDE to catch missing properties or type mismatches immediately.
     * @type {XrayInfoData} 
     */
    const info = {
        project: info_data_custom.project ?? "",
        summary: info_data_custom.summary ?? "Execution of automated tests",
        description: info_data_custom.description ?? "This execution is automatically created when importing execution results from Gitlab",
        version: info_data_custom.version ?? "",
        revision: info_data_custom.revision ?? "",
        user: info_data_custom.user ?? "",
        startDate: info_data_custom.startDate ?? new Date().toISOString(),
        finishDate: info_data_custom.finishDate ?? new Date().toISOString(),
        testPlanKey: info_data_custom.testPlanKey ?? "",
        // Ensure environments is always an array to match the typedef
        testEnvironments: Array.isArray(info_data_custom.testEnvironments) ? info_data_custom.testEnvironments : []
    };

    return info;
};

export default info_factory;