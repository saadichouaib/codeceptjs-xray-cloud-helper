// @ts-check
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import xray_tests_factory from '../../factories/xray_tests_factory.js';

/** @typedef {import('../../helpers/data_generator.js').XrayTestData} XrayTestData */

describe('tests factory', () => {
    const MOCK_DATE = '2025-12-19T14:00:00.000Z';

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(MOCK_DATE));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should return default tests object when no custom_data sent', () => {
        const body = {};
        const tests_data = xray_tests_factory.get_tests_object(body);
        
        expect(tests_data).toEqual({
            testKey: null,
            assignee: "",
            comment: "Default comment for the test run",
            customFields: [],
            evidence: [],
            status: "TODO",
            examples: null,
            executedBy:"",
            steps: null,
            iterations: null,
            finish: MOCK_DATE,
            start: MOCK_DATE,
            testInfo: {
                definition: "generic test definition here",
                labels: ["automated_test"],
                projectKey: "",
                requirementKeys: [],
                summary: "Test generated automatically",
                type: "Generic",
            }
        });
    });

    it('should return tests object without testInfo when testKey is present', () => {
        const body = {
            testKey: `POSDEV-1234`,
            assignee: faker.lorem.word(),
            status: "PASSED",
            comment: faker.lorem.sentence(),
            start: faker.date.recent().toISOString(),
            finish: faker.date.recent().toISOString(),
            executedBy: faker.string.numeric(7)
        };

        const tests_data = xray_tests_factory.get_tests_object(body);
        
        expect(tests_data.testKey).toBe(body.testKey);
        expect(tests_data.testInfo).toBeUndefined();
        
        expect(tests_data).toMatchObject({
            assignee: body.assignee,
            status: body.status,
            comment: body.comment,
            executedBy: "" // Hardcoded in setup_tests_data logic
        });
    });

    it('should return testInfo data when testKey is null', () => {
        const body = {
            testKey: null,
            testInfo_projectKey: `POSDEV`,
            testInfo_summary: "Summary",
            testInfo_type: "Generic",
            testInfo_labels: ["label"],
            testInfo_definition: "def",
            assignee: "user",
            status: "PASSED",
            comment: "comment"
        };

        const tests_data = xray_tests_factory.get_tests_object(body);
        const info = /** @type {any} */ (tests_data.testInfo);
        
        expect(info).toEqual({
            projectKey: body.testInfo_projectKey,
            summary: body.testInfo_summary,
            type: body.testInfo_type,
            requirementKeys: [],
            labels: body.testInfo_labels,
            definition: body.testInfo_definition
        });
    });

    it('should return valid body when test entry contains examples array', () => {
        const body = {
            testKey: `POSDEV-5678`,
            examples: ["PASSED", "FAILED"],
            status: "FAILED",
            start: MOCK_DATE,
            finish: MOCK_DATE
        };

        const tests_data = xray_tests_factory.get_tests_object(body);
        expect(tests_data.examples).toEqual(body.examples);
    });

    it('should return valid body when test entry contains steps array', () => {
        const body = {
            testKey: `POSDEV-9999`,
            steps: [{ status: "PASSED", actualResult: "Done" }],
            status: "PASSED",
            start: MOCK_DATE,
            finish: MOCK_DATE
        };

        const tests_data = xray_tests_factory.get_tests_object(body);
        expect(tests_data.steps).toEqual(body.steps);
    });
});