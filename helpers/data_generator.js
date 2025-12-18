import xray_import_execution_factory from '../factories/xray_import_execution_factory.js';
import xray_info_factory from '../factories/xray_info_factory.js';
import xray_tests_factory from '../factories/xray_tests_factory.js';

export default {

    /**
     * Generate payload for xray api /api/v2/import/execution
     *
     * @param {String} scenario
     * @param {String} testExecutionKey
     * @param {Object} info_data
     * @param {Array} tests_data
     * @returns {Object}
     */
    build_import_execution_data(scenario, testExecutionKey, info_data, tests_data) {
        return xray_import_execution_factory.build(scenario, testExecutionKey, info_data, tests_data);
    },

    /**
     * Generate info data for /api/v2/import/execution
     *
     * @param {Object} info_data_custom custom data to replace default values (ex. {project: "1234"})
     * @returns {Object} info_data
     */
    generate_info_data(info_data_custom) {
        return xray_info_factory.get_info_object(info_data_custom);
    },

    /**
     * Generate tests data for /api/v2/import/execution
     *
     * @param {Object} tests_data_custom custom data to replace default values (ex. {status: "PASSED", testInfo_projectKey: "M124"})
     * @returns {Object} tests_data
     */
    generate_tests_data(tests_data_custom) {
        return xray_tests_factory.get_tests_object(tests_data_custom);
    },
};