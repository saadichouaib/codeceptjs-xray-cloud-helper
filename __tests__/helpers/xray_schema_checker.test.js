// @ts-check
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import xray_schema_checker from '../../helpers/xray_schema_checker.js';

describe('xray_schema_checker', () => {
    /** @type {any} */
    let validPayload;

    beforeEach(() => {
        // Mock process.exit and console.error to prevent test termination
        jest.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`Process exited with code ${code}`);
        });
        jest.spyOn(console, 'error').mockImplementation(() => {});

        // Build a minimal valid Xray payload
        validPayload = {
            info: {
                project: "PROJ",
                summary: "Execution Summary",
                startDate: "2025-12-19T10:00:00Z",
                finishDate: "2025-12-19T11:00:00Z"
            },
            tests: [
                {
                    testKey: "PROJ-123",
                    status: "PASSED",
                    comment: "All good"
                }
            ]
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should pass with a valid minimal payload', () => {
        expect(() => xray_schema_checker.validate(validPayload)).not.toThrow();
    });

    it('should pass with complex manual test steps', () => {
        validPayload.tests[0].steps = [
            { status: "PASSED", actualResult: "Step 1 passed" },
            { status: "FAILED", comment: "Step 2 failed" }
        ];
        expect(() => xray_schema_checker.validate(validPayload)).not.toThrow();
    });

    it('should exit process if the root structure is invalid (e.g. tests is not an array)', () => {
        validPayload.tests = {}; // Should be an array

        expect(() => xray_schema_checker.validate(validPayload)).toThrow('Process exited with code 1');
        expect(console.error).toHaveBeenCalled();
    });

    it('should exit if mandatory fields are missing (e.g. test status)', () => {
        delete validPayload.tests[0].status;

        expect(() => xray_schema_checker.validate(validPayload)).toThrow('Process exited with code 1');
    });

    it('should enforce mutual exclusivity between steps and examples', () => {
        // A test cannot have both manual steps and BDD examples
        validPayload.tests[0].steps = [{ status: "PASSED" }];
        validPayload.tests[0].examples = ["PASSED"];

        expect(() => xray_schema_checker.validate(validPayload)).toThrow('Process exited with code 1');
    });

    it('should validate date-time formats for info dates', () => {
        validPayload.info.startDate = "not-a-date";

        expect(() => xray_schema_checker.validate(validPayload)).toThrow('Process exited with code 1');
    });

    it('should pass with valid new testInfo object', () => {
        validPayload.tests = [{
            testInfo: {
                summary: "New Test",
                projectKey: "PROJ",
                type: "Generic",
                definition: "some.path.to.test"
            },
            status: "PASSED"
        }];
        expect(() => xray_schema_checker.validate(validPayload)).not.toThrow();
    });
});