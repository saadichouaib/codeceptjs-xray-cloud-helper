const xray_info_factory = require('../../factories/xray_info_factory');
const { faker } = require('@faker-js/faker');

describe('info factory', () => {
    it('should return info object with sent values', () => {
        const body = {
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

        const info_data = xray_info_factory.get_info_object(body);
        expect(info_data).toEqual(body);

    });

    it('should return default info object when no custom_data sent', () => {
        const body = {};

        const info_data = xray_info_factory.get_info_object(body);
        expect(info_data).toEqual({
            project: "",
            summary: "Execution of automated tests",
            description: "This execution is automatically created when importing execution results from Gitlab",
            version: "",
            revision: "",
            testPlanKey: "",
            testEnvironments: "",
            startDate: "2022-08-30T11:47:35+01:00",
            finishDate: "2022-08-30T12:00:35+01:00",
        });

    });
});
