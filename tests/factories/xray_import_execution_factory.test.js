const xray_import_execution_factory = require('../../factories/xray_import_execution_factory');
const { faker } = require('@faker-js/faker');

describe('xray import execution factory', () => {
    it('should return only info and tests objects if testExecutionKey not provided', () => {

        const info_data = {
            project: `POSDEV-${faker.random.numeric(4)}`,
            summary: faker.lorem.lines(1),
            description: faker.lorem.lines(1),
            version: `${faker.random.numeric(1)}.${faker.random.numeric(1)}`,
            revision: `${faker.random.numeric(1)}.${faker.random.numeric(1)}`,
            testPlanKey: `POSDEV-${faker.random.numeric(4)}`,
            testEnvironments: faker.helpers.arrayElement(['DEV', 'QA', 'STAGE']),
            startDate: faker.date.recent(),
            finishDate: faker.date.recent(),
        };

        const tests_data = {
            testKey: `POSDEV-${faker.random.numeric(4)}`,
            assignee: faker.random.numeric(7),
            status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
            comment: faker.lorem.lines(1),
            start : faker.date.recent(),
            finish: faker.date.recent()
        };

        let entry_data = new Object();
        entry_data.info = info_data;
        entry_data.tests = [tests_data];

        const import_execution_data = xray_import_execution_factory.build("new_test_execution", null, info_data, [tests_data]);
        expect(import_execution_data).toEqual(entry_data);

    });

    it('should return testExecutionKey, info and tests objects if testExecutionKey is provided', () => {

        const testExecutionKey = `POSDEV-${faker.random.numeric(4)}`;

        const info_data = {
            project: `POSDEV-${faker.random.numeric(4)}`,
            summary: faker.lorem.lines(1),
            description: faker.lorem.lines(1),
            version: `${faker.random.numeric(1)}.${faker.random.numeric(1)}`,
            revision: `${faker.random.numeric(1)}.${faker.random.numeric(1)}`,
            testPlanKey: `POSDEV-${faker.random.numeric(4)}`,
            testEnvironments: faker.helpers.arrayElement(['DEV', 'QA', 'STAGE']),
            startDate: faker.date.recent(),
            finishDate: faker.date.recent(),
        };

        const tests_data = {
            testKey: `POSDEV-${faker.random.numeric(4)}`,
            assignee: faker.random.numeric(7),
            status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
            comment: faker.lorem.lines(1),
            start : faker.date.recent(),
            finish: faker.date.recent()
        };

        let entry_data = new Object();
        entry_data.info = info_data;
        entry_data.tests = [tests_data];

        const import_execution_data = xray_import_execution_factory.build("new_test_execution", testExecutionKey, info_data, [tests_data]);
        expect(import_execution_data).toEqual(entry_data);

    });

});
