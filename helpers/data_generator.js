// @ts-check
import xray_import_execution_factory from '../factories/xray_import_execution_factory.js';
import xray_info_factory from '../factories/xray_info_factory.js';
import xray_tests_factory from '../factories/xray_tests_factory.js';

/**
 * @typedef {Object} XrayInfoData
 * @property {string} project
 * @property {string} summary
 * @property {string} description
 * @property {string} version
 * @property {string} revision
 * @property {string} testPlanKey
 * @property {string[]} testEnvironments
 * @property {string} startDate
 * @property {string} finishDate
 */

/**
 * @typedef {Object} XrayTestInfo
 * @property {string} [projectKey]
 * @property {string} [summary]
 * @property {string} [type]
 * @property {string[]} [labels]
 * @property {string} [definition]
 * @property {Object[]} [steps]
 * @property {string} [scenario]
 */

/**
 * @typedef {Object} XrayTestData
 * @property {string|null} testKey
 * @property {string} [testInfo_projectKey]
 * @property {string} [testInfo_summary]
 * @property {string} [testInfo_type]
 * @property {string[]} [testInfo_labels]
 * @property {string} [testInfo_definition]
 * @property {Object[]} [testInfo_steps]
 * @property {string} [testInfo_scenario]
 * @property {string} assignee
 * @property {string} status
 * @property {string} comment
 * @property {string[]|null} examples
 * @property {Object[]|null} steps
 * @property {Object[]|null} iterations
 * @property {Object[]} evidence
 * @property {string} start
 * @property {string} finish
 * @property {Object[]} customFields
 * @property {XrayTestInfo} [testInfo]
 * @property {string} executedBy
 */



export default {

    /**
     * Generate payload for xray api /api/v2/import/execution
     *
     * @param {"existing_test_execution" | "new_test_execution"} scenario
     * @param {string} testExecutionKey
     * @param {XrayInfoData} info_data
     * @param {XrayTestData[]} tests_data
     * @returns {Object}
     */
    build_import_execution_data(scenario, testExecutionKey, info_data, tests_data) {
        return xray_import_execution_factory.build(scenario, testExecutionKey, info_data, tests_data);
    },

    /**
     * Generate info data for /api/v2/import/execution
     *
     * @param {Partial<XrayInfoData>} info_data_custom custom data to replace default values
     * @returns {XrayInfoData} info_data
     */
    generate_info_data(info_data_custom) {
        // @ts-ignore - Factory handles defaults
        return xray_info_factory.get_info_object(info_data_custom);
    },

    /**
     * Generate tests data for /api/v2/import/execution
     *
     * @param {Partial<XrayTestData>} tests_data_custom custom data to replace default values
     * @returns {XrayTestData} tests_data
     */
    generate_tests_data(tests_data_custom) {
        // @ts-ignore - Factory handles defaults
        return xray_tests_factory.get_tests_object(tests_data_custom);
    },
};