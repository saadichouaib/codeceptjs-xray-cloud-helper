// @ts-check
import Joi from 'joi';
import process from 'node:process';

/**
 * @typedef {Object} XrayPluginConfig
 * @property {string} require
 * @property {boolean} enabled
 * @property {boolean} debug
 * @property {string} projectKey
 * @property {string} [testExecutionAssigneeUserId]
 * @property {boolean} importToExistingTestExecution
 * @property {string} [existingTestExecutionKey]
 * @property {string} [testExecutionPlanKey]
 * @property {string} [testExecutionVersion]
 * @property {string} [testExecutionRevision]
 * @property {string[]} [testExecutionEnvironments]
 * @property {string} [testExecutionSummary]
 * @property {string} [testExecutionDescription]
 * @property {boolean} testExecutionSendEvidenceOnFail
 * @property {Object[]} [testExecutionCustomFields]
 * @property {boolean} createNewJiraTest
 * @property {number} timeout
 * @property {string} xrayCloudUrl
 * @property {string} xrayClientId
 * @property {string} xraySecret
 */

const xray_import_schema = Joi.object({
    require: Joi.string().required(),
    enabled: Joi.boolean().required(),
    debug: Joi.boolean().required(),
    projectKey: Joi.string().required().allow(''),
    testExecutionAssigneeUserId: Joi.string().allow(''),
    importToExistingTestExecution: Joi.boolean().required(),
    existingTestExecutionKey: Joi.when('importToExistingTestExecution', { 
        is: true, 
        then: Joi.string().required(),
        otherwise: Joi.string().allow('') 
    }),
    testExecutionPlanKey: Joi.string().allow(''),
    testExecutionVersion: Joi.string().allow(''),
    testExecutionRevision: Joi.string().allow(''),
    testExecutionEnvironments: Joi.array(),
    testExecutionSummary: Joi.when('importToExistingTestExecution', { 
        is: true, 
        then: Joi.string().allow(''), // NOSONAR
        otherwise: Joi.string().required() 
    }),
    testExecutionDescription: Joi.when('importToExistingTestExecution', { 
        is: true, 
        then: Joi.string().allow(''),// NOSONAR
        otherwise: Joi.string().required() 
    }),
    testExecutionSendEvidenceOnFail: Joi.boolean().required(),
    testExecutionCustomFields: Joi.array(),
    createNewJiraTest: Joi.boolean().required(),
    timeout: Joi.number().min(10000).required(),
    xrayCloudUrl: Joi.string().required(),
    xrayClientId: Joi.string().required(),
    xraySecret: Joi.string().required()
});

const conf_schema_checker = {
    /**
     * Validate xrayImport plugin configuration
     * @param {XrayPluginConfig} config 
     */
    validate: (config) => {
        const result = xray_import_schema.validate(config);
        if (result.error) {
            console.error('Error in xrayImport config parameters, reason : ', result.error.details);
            process.exit(1);
        }
    },

    /**
     * Ensure screenshotOnFail plugin is correctly configured if evidence sending is enabled
     * @param {any} codeceptjs 
     * @param {XrayPluginConfig} config 
     */
    validate_option_testExecutionSendEvidenceOnFail: (codeceptjs, config) => {
        const pluginsConfig = codeceptjs.config.get().plugins;
        const screenshotPlugin = pluginsConfig.screenshotOnFail;
        
        const is_plugin_exist = screenshotPlugin !== undefined;
        const is_plugin_enabled = is_plugin_exist && screenshotPlugin.enabled === true;
        const is_unique_names_enabled = is_plugin_exist && screenshotPlugin.uniqueScreenshotNames === true;

        if (config.testExecutionSendEvidenceOnFail === true) {
            if (is_plugin_exist === false || is_plugin_enabled === false) {
                console.error(`Error in xrayImport config (testExecutionSendEvidenceOnFail): screenshotOnFail plugin must be enabled.\nExample:\n${JSON.stringify({ screenshotOnFail: { enabled: true, uniqueScreenshotNames: true } }, null, 2)}`);
                process.exit(1);
            }
            
            if (is_unique_names_enabled === false) {
                console.error(`Error in xrayImport config (testExecutionSendEvidenceOnFail): uniqueScreenshotNames must be true in screenshotOnFail plugin.\nExample:\n${JSON.stringify({ screenshotOnFail: { enabled: true, uniqueScreenshotNames: true } }, null, 2)}`);
                process.exit(1);
            }
        }
    }
};

export default conf_schema_checker;