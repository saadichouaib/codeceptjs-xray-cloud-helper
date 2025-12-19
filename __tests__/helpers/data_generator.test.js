// @ts-check
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import xray_import_execution_factory from '../../factories/xray_import_execution_factory.js';
import xray_info_factory from '../../factories/xray_info_factory.js';
import xray_tests_factory from '../../factories/xray_tests_factory.js';
import data_generator from '../../helpers/data_generator.js';

/** @typedef {import('../../helpers/data_generator.js').XrayInfoData} XrayInfoData */
/** @typedef {import('../../helpers/data_generator.js').XrayTestData} XrayTestData */

describe('data_generator', () => {
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('generate_info_data', () => {
        it('should delegate to xray_info_factory', () => {
            const spy = jest.spyOn(xray_info_factory, 'get_info_object').mockReturnValue(/** @type {any} */ ({ project: "MOCK" }));
            const customData = { project: "PROJ-1" };

            const result = data_generator.generate_info_data(customData);

            expect(spy).toHaveBeenCalledWith(customData);
            expect(result.project).toBe("MOCK");
        });
    });

    describe('generate_tests_data', () => {
        it('should delegate to xray_tests_factory', () => {
            const spy = jest.spyOn(xray_tests_factory, 'get_tests_object').mockReturnValue(/** @type {any} */ ({ status: "PASSED" }));
            const customData = { testKey: "TEST-123" };

            const result = data_generator.generate_tests_data(customData);

            expect(spy).toHaveBeenCalledWith(customData);
            expect(result.status).toBe("PASSED");
        });
    });

    describe('build_import_execution_data', () => {
        it('should delegate to xray_import_execution_factory with all parameters', () => {
            const spy = jest.spyOn(xray_import_execution_factory, 'build').mockReturnValue({ info: {}, tests: [] });
            
            /** @type {XrayInfoData} */
            // @ts-ignore - simplified for mock
            const info = { project: "PROJ" };
            /** @type {XrayTestData[]} */
            // @ts-ignore - simplified for mock
            const tests = [{ testKey: "T-1" }];
            const key = "EXEC-123";

            data_generator.build_import_execution_data("existing_test_execution", key, info, tests);

            expect(spy).toHaveBeenCalledWith("existing_test_execution", key, info, tests);
        });
    });
});