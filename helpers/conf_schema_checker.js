const Joi = require('joi');
const process = require('process');

const xray_import_schema = Joi.object({
    require: Joi.string().required(),
    enabled: Joi.boolean().required(),
    debug: Joi.boolean().required(),
    projectKey: Joi.string().required().allow(''),
    testExecutionAssigneeUserId: Joi.string().allow(''),
    importToExistingTestExecution: Joi.boolean().required(),
    existingTestExecutionKey: Joi.when('importToExistingTestExecution', { is: true, then: Joi.string().required(), otherwise: Joi.string().allow('') }),
    testExecutionPlanKey: Joi.string().allow(''),
    testExecutionVersion: Joi.string().allow(''),
    testExecutionRevision: Joi.string().allow(''),
    testExecutionEnvironments: Joi.array(),
    testExecutionSummary: Joi.when('importToExistingTestExecution', { is: true, then: Joi.string().allow(''), otherwise: Joi.string().required() }),
    testExecutionDescription: Joi.when('importToExistingTestExecution', { is: true, then: Joi.string().allow(''), otherwise: Joi.string().required() }),
    testExecutionSendEvidenceOnFail: Joi.boolean().required(),
    testExecutionCustomFields: Joi.array(),
    createNewJiraTest: Joi.boolean().required(),
    timeout: Joi.number().min(10000).required(),
    xrayCloudUrl: Joi.string().required(),
    xrayClientId: Joi.string().required(),
    xraySecret: Joi.string().required()
})

const conf_schema_checker = () => ({

    validate : (config) => {
        const result = xray_import_schema.validate(config);
        if (result.error) {
            console.error(`Error in xrayImport config parameters, reason : `, result.error.details);
            process.exit(1);
        }
    },

    validate_option_testExecutionSendEvidenceOnFail : (codeceptjs, config) => {
        const is_screenshot_on_fail_plugin_exist = codeceptjs.config.get().plugins.screenshotOnFail;
        const is_screenshot_on_fail_plugin_enabled = is_screenshot_on_fail_plugin_exist && codeceptjs.config.get().plugins.screenshotOnFail?.enabled === true;
        const is_screenshot_on_fail_plugin_unique_names_enabled = is_screenshot_on_fail_plugin_exist && codeceptjs.config.get().plugins.screenshotOnFail?.uniqueScreenshotNames === true;

        if(config.testExecutionSendEvidenceOnFail){
            if (!is_screenshot_on_fail_plugin_exist || !is_screenshot_on_fail_plugin_enabled) {
                console.error(`Error in xrayImport config parameters (testExecutionSendEvidenceOnFail), reason : should enable screenshotOnFail plugin\nExample:\n${JSON.stringify({screenshotOnFail: { enabled: true, uniqueScreenshotNames: true }}, null, 2)}`);
                process.exit(1);
            }
            if (!is_screenshot_on_fail_plugin_unique_names_enabled) {
                console.error(`Error in xrayImport config parameters (testExecutionSendEvidenceOnFail), reason : should enable uniqueScreenshotNames on plugin screenshotOnFail\nExample:\n${JSON.stringify({screenshotOnFail: { enabled: true, uniqueScreenshotNames: true }}, null, 2)}`);
                process.exit(1);
            }
        }
    }
});

module.exports = conf_schema_checker();
