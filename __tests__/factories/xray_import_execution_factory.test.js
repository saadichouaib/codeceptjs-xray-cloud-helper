/// <reference types="jest" />
import { faker } from '@faker-js/faker';
import { describe, expect, it } from '@jest/globals';
import xray_import_execution_factory from '../../factories/xray_import_execution_factory.js';

/**
 * @typedef {import('../../factories/xray_info_factory.js').XrayInfoData} XrayInfoData
 * @typedef {import('../../helpers/data_generator.js').XrayTestData} XrayTestData
 */

describe('xray import execution factory', () => {
    
    /** @type {XrayInfoData} */
    const info_data = {
        project: `POSDEV-${faker.string.numeric(4)}`,
        summary: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        version: `${faker.string.numeric(1)}.${faker.string.numeric(1)}`,
        revision: `${faker.string.numeric(1)}.${faker.string.numeric(1)}`,
        testPlanKey: `POSDEV-${faker.string.numeric(4)}`,
        testEnvironments: [faker.helpers.arrayElement(['DEV', 'QA', 'STAGE'])], // Must be an array
        startDate: faker.date.recent().toISOString(), // Must be string
        finishDate: faker.date.recent().toISOString(),
    };

    /** @type {XrayTestData} */
    const tests_data = {
        testKey: `POSDEV-${faker.string.numeric(4)}`,
        assignee: faker.string.numeric(7),
        status: faker.helpers.arrayElement(["PASSED", "FAILED", "TODO"]),
        comment: faker.lorem.sentence(),
        start: faker.date.recent().toISOString(),
        finish: faker.date.recent().toISOString(),
        evidence: [],
        customFields: [],
        examples: [],
        steps: null,
        iterations: null
    };

    it('should return only info and tests objects if scenario is new_test_execution', () => {
        const entry_data = {
            info: info_data,
            tests: [tests_data]
        };

        const import_execution_data = xray_import_execution_factory.build(
            "new_test_execution", 
            null, 
            info_data, 
            [tests_data]
        );

        expect(import_execution_data).toEqual(entry_data);
    });

    it('should return testExecutionKey, info and tests if scenario is existing_test_execution', () => {
        const testExecutionKey = `POSDEV-${faker.string.numeric(4)}`;

        const entry_data = {
            testExecutionKey,
            info: info_data,
            tests: [tests_data]
        };

        const import_execution_data = xray_import_execution_factory.build(
            "existing_test_execution", 
            testExecutionKey, 
            info_data, 
            [tests_data]
        );

        expect(import_execution_data).toEqual(entry_data);
        expect(import_execution_data).toHaveProperty('testExecutionKey', testExecutionKey);
    });
});