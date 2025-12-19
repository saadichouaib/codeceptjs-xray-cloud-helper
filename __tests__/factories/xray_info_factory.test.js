// @ts-check
import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import xray_info_factory from '../../factories/xray_info_factory.js';

describe('info factory', () => {
    const MOCK_DATE = '2025-12-19T10:00:00.000Z';

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(MOCK_DATE));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should return info object with sent values', () => {
        const body = {
            project: `POSDEV-${faker.string.numeric(4)}`,
            summary: faker.lorem.sentence(),
            description: faker.lorem.sentence(),
            version: "1.0",
            revision: "1.1",
            user: faker.person.fullName(), // Added this to match factory output
            testPlanKey: `POSDEV-${faker.string.numeric(4)}`,
            testEnvironments: [faker.helpers.arrayElement(['DEV', 'QA', 'STAGE'])],
            startDate: faker.date.recent().toISOString(),
            finishDate: faker.date.recent().toISOString(),
        };

        const info_data = xray_info_factory.get_info_object(body);
        
        // Now they will be identical
        expect(info_data).toEqual(body);
    });

    it('should return default info object when no custom_data sent', () => {
        const info_data = xray_info_factory.get_info_object({});
        
        expect(info_data).toEqual({
            project: "",
            summary: "Execution of automated tests",
            description: "This execution is automatically created when importing execution results from Gitlab",
            version: "",
            revision: "",
            user: "", // This is what the factory returns by default
            testPlanKey: "",
            testEnvironments: [],
            startDate: MOCK_DATE,
            finishDate: MOCK_DATE,
        });
    });
});