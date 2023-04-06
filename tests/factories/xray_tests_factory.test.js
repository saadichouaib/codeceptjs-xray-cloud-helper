const xray_tests_factory = require('../../factories/xray_tests_factory');
const { faker } = require('@faker-js/faker');

describe('tests factory', () => {
    it('should return default tests object when no custom_data sent', () => {
        const body = {};

        const tests_data = xray_tests_factory.get_tests_object(body);
        expect(tests_data).toEqual({
            assignee: "",
            comment: "Default comment for the test run",
            customFields: [],
            defects: [],
            evidence: [],
            executedBy: "",
            finish: "2022-08-30T12:00:35+01:00",
            start: "2022-08-30T11:47:35+01:00",
            status: "TODO"
        });
    });

    it('should return testInfo data when testKey is null', () => {
        const body = {
            testKey: null,
            testInfo_projectKey: `POSDEV`,
            testInfo_summary: faker.lorem.lines(1),
            testInfo_type: "Generic",
            testInfo_labels: [faker.lorem.word()],
            testInfo_definition: faker.lorem.word(),
            examples: null,
            steps: null,
            iterations: null,
            assignee: faker.lorem.word(),
            status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
            comment: faker.lorem.lines(1)
        };

        const tests_data = xray_tests_factory.get_tests_object(body);

        expect(tests_data.testInfo).toEqual({
            projectKey: body.testInfo_projectKey,
            summary: body.testInfo_summary,
            type: body.testInfo_type,
            requirementKeys: [],
            labels: body.testInfo_labels,
            definition: body.testInfo_definition
        });

    });

    it('should return tests object without testInfo when testKey is present', () => {

        const body = {
            testKey: `POSDEV-${faker.random.numeric(4)}`,
            examples: null,
            assignee: faker.lorem.word(),
            status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
            comment: faker.lorem.lines(1),
            start: faker.date.recent(),
            finish: faker.date.recent(),
            executedBy: faker.random.numeric(7)
        };

        const tests_data = xray_tests_factory.get_tests_object(body);
        expect(tests_data).toEqual({
            testKey: body.testKey,
            assignee: body.assignee,
            status: body.status,
            comment: body.comment,
            start: body.start,
            finish: body.finish,
            evidence: [],
            defects: [],
            customFields: [],
            executedBy: body.executedBy
        });
    });

    it('should return valid body when test is neither Cucumber nor Manual (Generic test)', () => {
        const body = {
            testKey: `POSDEV-${faker.random.numeric(4)}`,
            assignee: faker.lorem.word(),
            status: "PASSED",
            comment: faker.lorem.lines(1),
            start: faker.date.recent(),
            finish: faker.date.recent(),
            executedBy: faker.random.numeric(7)
        };

        const tests_data = xray_tests_factory.get_tests_object(body);
        expect(tests_data).toEqual({
            testKey: body.testKey,
            assignee: body.assignee,
            status: body.status,
            comment: body.comment,
            start: body.start,
            finish: body.finish,
            evidence: [],
            defects: [],
            customFields: [],
            executedBy: body.executedBy
        });

    });

    it('should return valid body when test entry contains examples array (cucumber test)', () => {
        const body = {
            testKey: `POSDEV-${faker.random.numeric(4)}`,
            examples: ["PASSED", "PASSED", faker.helpers.arrayElement(["PASSED", "FAILED"])],
            assignee: faker.lorem.word(),
            status: "PASSED",
            comment: faker.lorem.lines(1),
            start: faker.date.recent(),
            finish: faker.date.recent(),
            executedBy: faker.random.numeric(7)
        };

        body.status = body.examples.includes("FAILED") ? "FAILED" : "PASSED";

        const tests_data = xray_tests_factory.get_tests_object(body);
        expect(tests_data).toEqual({
            testKey: body.testKey,
            examples: body.examples,
            assignee: body.assignee,
            status: body.status,
            comment: body.comment,
            start: body.start,
            finish: body.finish,
            evidence: [],
            defects: [],
            customFields: [],
            executedBy: body.executedBy
        });

    });

    it('should return valid body when test entry contains steps array (Manual test)', () => {
        const body = {
            testKey: `POSDEV-${faker.random.numeric(4)}`,
            steps: [
                {
                    status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
                    actualResult: "setRequestTimeout(3000), assertEqual(true,true)"
                },
                {
                    status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
                    actualResult: "setRequestTimeout(3000), assertEqual(true,true)"
                },
                {
                    status: faker.helpers.arrayElement(["PASSED", "FAILED"]),
                    actualResult: "setRequestTimeout(3000), assertEqual(true,true)"
                }
            ],
            assignee: faker.lorem.word(),
            status: "PASSED",
            comment: faker.lorem.lines(1),
            start: faker.date.recent(),
            finish: faker.date.recent(),
            executedBy: faker.random.numeric(7)
        };

        body.status = body.steps.includes("FAILED") ? "FAILED" : "PASSED";

        const tests_data = xray_tests_factory.get_tests_object(body);
        expect(tests_data).toEqual({
            testKey: body.testKey,
            steps: body.steps,
            assignee: body.assignee,
            status: body.status,
            comment: body.comment,
            start: body.start,
            finish: body.finish,
            evidence: [],
            defects: [],
            customFields: [],
            executedBy: body.executedBy
        });

    });
});
