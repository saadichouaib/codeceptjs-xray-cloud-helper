// @ts-check
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import conf_schema_checker from '../../helpers/conf_schema_checker.js';

/** @typedef {import('../../helpers/conf_schema_checker.js').XrayPluginConfig} XrayPluginConfig */

describe('conf_schema_checker', () => {
    /** @type {XrayPluginConfig} */
    let validConfig;

    beforeEach(() => {
        // Mock process.exit and console.error to prevent test termination
        jest.spyOn(process, 'exit').mockImplementation((/** @type {any} */ code) => { 
            throw new Error(`Process exited with code ${code}`); 
        });
        jest.spyOn(console, 'error').mockImplementation(() => {});

        validConfig = {
            require: "codeceptjs-xray-cloud-helper",
            enabled: true,
            debug: false,
            projectKey: "PROJ",
            importToExistingTestExecution: false,
            testExecutionSendEvidenceOnFail: false,
            createNewJiraTest: true,
            timeout: 15000,
            xrayCloudUrl: "https://xray.cloud.getxray.app",
            xrayClientId: "ID",
            xraySecret: "SECRET",
            testExecutionSummary: "Summary",
            testExecutionDescription: "Description"
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('validate', () => {
        it('should pass with a valid configuration', () => {
            expect(() => conf_schema_checker.validate(validConfig)).not.toThrow();
        });

        it('should exit process if a required field is missing', () => {
            // @ts-ignore - purposefully deleting required field
            delete validConfig.xrayClientId;

            expect(() => conf_schema_checker.validate(validConfig)).toThrow('Process exited with code 1');
            expect(console.error).toHaveBeenCalled();
        });

        it('should validate that existingTestExecutionKey is required if importToExistingTestExecution is true', () => {
            validConfig.importToExistingTestExecution = true;
            validConfig.existingTestExecutionKey = ""; // Empty string not allowed when true

            expect(() => conf_schema_checker.validate(validConfig)).toThrow('Process exited with code 1');
        });

        it('should validate timeout minimum value', () => {
            validConfig.timeout = 5000; // Min is 10000

            expect(() => conf_schema_checker.validate(validConfig)).toThrow('Process exited with code 1');
        });
    });

    describe('validate_option_testExecutionSendEvidenceOnFail', () => {
        /** @type {any} */
        let mockCodecept;

        beforeEach(() => {
            mockCodecept = {
                config: {
                    get: jest.fn().mockReturnValue({
                        plugins: {
                            screenshotOnFail: {
                                enabled: true,
                                uniqueScreenshotNames: true
                            }
                        }
                    })
                }
            };
        });

        it('should pass if evidence is enabled and screenshot plugin is correctly configured', () => {
            validConfig.testExecutionSendEvidenceOnFail = true;
            expect(() => conf_schema_checker.validate_option_testExecutionSendEvidenceOnFail(mockCodecept, validConfig)).not.toThrow();
        });

        it('should exit if evidence is enabled but screenshot plugin is disabled', () => {
            validConfig.testExecutionSendEvidenceOnFail = true;
            mockCodecept.config.get.mockReturnValue({
                plugins: {
                    screenshotOnFail: { enabled: false }
                }
            });

            expect(() => conf_schema_checker.validate_option_testExecutionSendEvidenceOnFail(mockCodecept, validConfig)).toThrow('Process exited with code 1');
        });

        it('should exit if evidence is enabled but uniqueScreenshotNames is false', () => {
            validConfig.testExecutionSendEvidenceOnFail = true;
            mockCodecept.config.get.mockReturnValue({
                plugins: {
                    screenshotOnFail: { enabled: true, uniqueScreenshotNames: false }
                }
            });

            expect(() => conf_schema_checker.validate_option_testExecutionSendEvidenceOnFail(mockCodecept, validConfig)).toThrow('Process exited with code 1');
        });
    });
});