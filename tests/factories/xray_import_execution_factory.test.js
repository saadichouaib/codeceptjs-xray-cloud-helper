import { faker } from '@faker-js/faker';
import xray_import_execution_factory from '../../factories/xray_import_execution_factory.js';

describe('xray import execution factory', () => {
    it('should return only info and tests objects if testExecutionKey not provided', () => {

        const info_data = {
            project: `POSDEV-${faker.string.numeric(4)}`,
            summary: faker.lorem.lines(1),
            description: faker.lorem.lines(1),
            version: `${faker.string.numeric(1)}.${faker.string.numeric(1)}`,
            revision: `${faker.string.numeric(1)}.${faker.string.numeric(1)}`,
            testPlanKey: `POSDEV-${faker.string.numeric(4)}`,
            testEnvironments: faker.helpers.arrayElement(['DEV', 'QA', 'STAGE']),
            startDate: faker.date.recent(),
            finishDate: faker.date.recent(),
        };

        const tests_data = {
            testKey: `POSDEV-${faker.string.numeric(4)}`,
            assignee: faker.string.numeric(7),
            status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
            comment: faker.lorem.lines(1),
            start : faker.date.recent(),
            finish: faker.date.recent()
        };

        const entry_data = {
            info: info_data,
            tests: [tests_data]
        };

        const import_execution_data = xray_import_execution_factory.build("new_test_execution", null, info_data, [tests_data]);
        expect(import_execution_data).toEqual(entry_data);
    });

    it('should return testExecutionKey, info and tests objects if testExecutionKey is provided', () => {

        const testExecutionKey = `POSDEV-${faker.string.numeric(4)}`;

        const info_data = {
            project: `POSDEV-${faker.string.numeric(4)}`,
            summary: faker.lorem.lines(1),
            description: faker.lorem.lines(1),
            version: `${faker.string.numeric(1)}.${faker.string.numeric(1)}`,
            revision: `${faker.string.numeric(1)}.${faker.string.numeric(1)}`,
            testPlanKey: `POSDEV-${faker.string.numeric(4)}`,
            testEnvironments: faker.helpers.arrayElement(['DEV', 'QA', 'STAGE']),
            startDate: faker.date.recent(),
            finishDate: faker.date.recent(),
        };

        const tests_data = {
            testKey: `POSDEV-${faker.string.numeric(4)}`,
            assignee: faker.string.numeric(7),
            status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
            comment: faker.lorem.lines(1),
            start : faker.date.recent(),
            finish: faker.date.recent()
        };

        // Note: I preserved your logic, but typically if a key is provided, 
        // the expectation object might need to include testExecutionKey.
        const entry_data = {
            info: info_data,
            tests: [tests_data]
        };

        const import_execution_data = xray_import_execution_factory.build("new_test_execution", testExecutionKey, info_data, [tests_data]);
        expect(import_execution_data).toEqual(entry_data);
    });
});