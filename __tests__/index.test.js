// @ts-check
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/** @typedef {import('../helpers/conf_schema_checker.js').XrayPluginConfig} XrayPluginConfig */
/** @typedef {(...args: any[]) => any} GenericFunction */

// 1. Mock External and Internal Dependencies
jest.unstable_mockModule('codeceptjs', () => ({
    event: {
        dispatcher: { on: jest.fn() },
        all: { before: 'all.before', after: 'all.after' },
        test: { after: 'test.after' },
        step: { finished: 'step.finished' }
    },
    output: { print: jest.fn() },
    recorder: { 
        add: jest.fn((name, fn) => {
            if (typeof fn === 'function') return fn();
        }) 
    }
}));

jest.unstable_mockModule('../api/xray_api.js', () => ({
    default: { authenticate: jest.fn(), execute_import: jest.fn() }
}));

jest.unstable_mockModule('../helpers/conf_schema_checker.js', () => ({
    default: { 
        validate: jest.fn(), 
        validate_option_testExecutionSendEvidenceOnFail: jest.fn() 
    }
}));

jest.unstable_mockModule('../helpers/data_generator.js', () => ({
    default: { 
        generate_info_data: jest.fn(), 
        generate_tests_data: jest.fn(), 
        build_import_execution_data: jest.fn() 
    }
}));

jest.unstable_mockModule('../helpers/xray_schema_checker.js', () => ({
    default: { validate: jest.fn() }
}));

const mockBdd = { save_bdd_results: jest.fn() };
const mockManual = { save_manual_results: jest.fn(), save_steps_status: jest.fn() };
const mockCommon = { 
    get_test_tags: jest.fn(), 
    get_test_state: jest.fn(), 
    get_err_string: jest.fn(), 
    get_evidence_object: jest.fn() 
};
const mockGeneric = { save_generic_results: jest.fn() };

jest.unstable_mockModule('../lib/bdd.js', () => ({ default: mockBdd }));
jest.unstable_mockModule('../lib/manual.js', () => ({ default: mockManual }));
jest.unstable_mockModule('../lib/common.js', () => ({ default: mockCommon }));
jest.unstable_mockModule('../lib/generic.js', () => ({ default: mockGeneric }));

// 2. Dynamic Imports
const { event, output } = await import('codeceptjs');
const { default: main } = await import('../index.js');
const { default: xray_api } = await import('../api/xray_api.js');
const { default: conf_schema_checker } = await import('../helpers/conf_schema_checker.js');
const { default: data_generator } = await import('../helpers/data_generator.js');
const { default: xray_schema_checker } = await import('../helpers/xray_schema_checker.js');



describe('Xray Cloud Helper - index.js Full Coverage', () => {
    /** @type {Record<string, Function>} */
    let eventHandlers = {};

    beforeEach(() => {
        eventHandlers = {};
        jest.clearAllMocks();
        
        /** @type {jest.Mock<GenericFunction>} */
        const mockOn = /** @type {any} */ (event.dispatcher.on);
        mockOn.mockImplementation((name, fn) => {
            const key = /** @type {string} */ (name);
            eventHandlers[key] = /** @type {Function} */ (fn);
        });

        // Bypass validators
        /** @type {jest.Mock<GenericFunction>} */ (conf_schema_checker.validate).mockReturnValue(true);
        /** @type {jest.Mock<GenericFunction>} */ (conf_schema_checker.validate_option_testExecutionSendEvidenceOnFail).mockReturnValue(true);
        /** @type {jest.Mock<GenericFunction>} */ (xray_schema_checker.validate).mockReturnValue(true);

        // Setup global context
        // @ts-ignore
        global.codeceptjs = {
            config: { get: () => ({ plugins: { xrayImport: { projectKey: 'PROJ' } } }) }
        };

        /** @type {XrayPluginConfig} */
        const fullConfig = {
            projectKey: "PROJ",
            testExecutionSendEvidenceOnFail: true,
            xrayCloudUrl: "https://xray.cloud.getxray.app",
            xrayClientId: "ID",
            xraySecret: "SECRET",
            timeout: 12000,
            require: "codeceptjs-xray-cloud-helper",
            enabled: true,
            debug: false,
            importToExistingTestExecution: false,
            existingTestExecutionKey: "",
            testExecutionAssigneeUserId: "",
            testExecutionPlanKey: "",
            testExecutionVersion: "",
            testExecutionRevision: "",
            testExecutionEnvironments: ["QA"],
            testExecutionSummary: "Execution of automated tests",
            testExecutionDescription: "Auto-generated",
            testExecutionCustomFields: [],
            createNewJiraTest: false
        };

        // @ts-ignore
        main(fullConfig);
    });

    it('should save step status if test is not BDD (Lines 98-100)', () => {
        const mockStep = { test: { file: 'normal_test.js' } };
        eventHandlers['step.finished'](mockStep);
        expect(mockManual.save_steps_status).toHaveBeenCalled();
    });

    it('should process BDD results for feature files (Lines 114-115)', () => {
        const mockTest = { file: 'test.feature' };
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_test_tags).mockReturnValue(['@TEST_BDD-1']);
        /** @type {jest.Mock<GenericFunction>} */ (mockBdd.save_bdd_results).mockReturnValue([['ex1'], ['comment'], []]);

        eventHandlers['test.after'](mockTest);
        expect(mockBdd.save_bdd_results).toHaveBeenCalled();
    });

    it('should collect evidence when a test fails (Lines 126-131)', () => {
        const mockTest = { file: 'test.js' };
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_test_tags).mockReturnValue(['@TEST_FAIL-1']);
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_test_state).mockReturnValue('failed');
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_err_string).mockReturnValue('Error stack');
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_evidence_object).mockReturnValue({ data: 'base64', filename: 'fail.png' });

        eventHandlers['test.after'](mockTest);
        expect(mockCommon.get_evidence_object).toHaveBeenCalled();
    });

    it('should process manual results (Lines 156-160)', () => {
        const mockTest = { file: 'manual_test.js' };
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_test_tags).mockReturnValue(['@TEST_MAN-1']);
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_test_state).mockReturnValue('passed');

        // Target: Increase manual_steps_results.length > 1
        /** @type {jest.Mock<GenericFunction>} */ (mockManual.save_steps_status)
            .mockImplementation((step, resultsArray) => {
                resultsArray.push(['mock result']);
            });

        /** @type {jest.Mock<GenericFunction>} */ (mockManual.save_manual_results).mockReturnValue([[], [], 1, [], []]);

        eventHandlers['step.finished']({ test: mockTest });
        eventHandlers['step.finished']({ test: mockTest });

        eventHandlers['test.after'](mockTest);
        expect(mockManual.save_manual_results).toHaveBeenCalled();
    });

    it('should process generic results (Lines 164-169)', () => {
        const mockTest = { file: 'generic_test.js' };
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_test_tags).mockReturnValue(['@TEST_GEN-1']);
        /** @type {jest.Mock<GenericFunction>} */ (mockCommon.get_test_state).mockReturnValue('passed');

        eventHandlers['test.after'](mockTest);
        expect(mockGeneric.save_generic_results).toHaveBeenCalled();
    });

    it('should build execution data and call Xray API on all.after (Lines 197-200)', async () => {
        /** @type {jest.Mock<GenericFunction>} */ (data_generator.build_import_execution_data).mockReturnValue({
            info: { startDate: '2025-01-01T00:00:00Z' },
            tests: [{ testKey: 'PROJ-1', status: 'PASSED' }]
        });

        /** @type {jest.Mock<(...args: any[]) => Promise<string>>} */
        const mAuth = /** @type {any} */ (xray_api.authenticate);
        /** @type {jest.Mock<(...args: any[]) => Promise<any>>} */
        const mExec = /** @type {any} */ (xray_api.execute_import);

        mAuth.mockResolvedValue('TOKEN');
        mExec.mockResolvedValue({ status: 200, data: { key: 'EXEC-1' } });

        eventHandlers['all.before']();
        await eventHandlers['all.after']();

        expect(mAuth).toHaveBeenCalled();
        expect(mExec).toHaveBeenCalled();
        
        const mPrint = /** @type {any} */ (output).print;
        expect(mPrint).toHaveBeenCalledWith(expect.stringContaining('EXEC-1'));
    });
});