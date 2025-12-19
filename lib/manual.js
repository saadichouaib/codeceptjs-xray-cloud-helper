// @ts-check
import moment from 'moment';
import common from './common.js';

/**
 * @typedef {import('./common.js').XrayTestResult} XrayTestResult
 * @property {XrayIteration[]} [iterations]
 * @property {XrayStep[]} [steps]
 * * @typedef {import('./common.js').XrayEvidence} XrayEvidence
 * @typedef {import('./common.js').CommonContext} CommonContext
 * @typedef {import('../helpers/conf_schema_checker.js').XrayPluginConfig} XrayPluginConfig
 */

/**
 * @typedef {Object} XrayStep
 * @property {string} status
 * @property {string} [actualResult]
 * @property {string} [comment]
 */

/**
 * @typedef {Object} XrayIteration
 * @property {string} name
 * @property {Object[]} parameters
 * @property {string} log
 * @property {string} status
 * @property {XrayStep[]} steps
 */

/**
 * @typedef {Object} ManualContext
 * @property {boolean} is_manual
 * @property {XrayTestResult[]} tests_results
 * @property {any[][]} manual_steps_results
 * @property {XrayIteration[]} iterations_array
 * @property {Object} manual_iteration
 * @property {number} iteration_number
 * @property {string[]} test_comment
 * @property {XrayEvidence[]} test_evidences
 * @property {string|null} test_key
 * @property {any} test
 * @property {string} status
 * @property {XrayPluginConfig} config
 */

export default {
    /**
     * @param {ManualContext} ctx
     */
    save_manual_results(ctx) {
        if (ctx.is_manual !== true) {
            return [ctx.manual_steps_results, ctx.iterations_array, ctx.iteration_number, ctx.test_comment, ctx.test_evidences];
        }

        const is_data_driven = ctx.test.inject?.current !== undefined;

        if (is_data_driven) {
            return this._handle_data_driven_results(ctx);
        }

        return this._handle_simple_manual_results(ctx);
    },

    /**
     * @private
     * @param {ManualContext} ctx
     */
    _handle_data_driven_results(ctx) {
        const { tests_results, manual_steps_results, test_key, test } = ctx;
        
        const lastTest = tests_results.at(-1);
        const isContinuing = Object.keys(ctx.manual_iteration).length > 0 && lastTest?.test_key === test_key;

        if (isContinuing === true) {
            ctx.iteration_number++;
        } else {
            ctx.iteration_number = 1;
            ctx.iterations_array = [];
            ctx.test_comment = [];
            ctx.test_evidences = [];
            
            common.push_test_state_to_results({
                tests_results,
                test_key,
                test_comment: [],
                test_evidences: [],
                test,
                test_type: "Manual",
                test_info_steps: build_test_info_steps(manual_steps_results)
            });
        }

        const current_iteration = {
            name: `Iteration ${ctx.iteration_number}`,
            parameters: build_xray_iterations_parameters_array(test),
            log: ctx.status.toUpperCase().includes("FAILED") ? ctx.test_comment.toString() : "Iteration passed successfully",
            status: ctx.status.toUpperCase(),
            steps: manual_steps_results.length > 1 ? (manual_steps_results.shift(), build_xray_steps_array(manual_steps_results)) : []
        };

        if (JSON.stringify(current_iteration.steps).includes("FAILED")) {
            current_iteration.status = "FAILED";
        }

        ctx.iterations_array.push(current_iteration);

        const activeTest = tests_results.at(-1);
        if (activeTest) {
            const hasFailedIteration = JSON.stringify(ctx.iterations_array).includes("FAILED");
            activeTest.iterations = ctx.iterations_array;
            activeTest.status = hasFailedIteration ? "FAILED" : "PASSED";
            activeTest.comment = hasFailedIteration ? ctx.test_comment.toString() : "Test passed successfully";
            activeTest.evidences = hasFailedIteration ? ctx.test_evidences : [];
            activeTest.finish = moment().format();
        }

        return [[[]], ctx.iterations_array, ctx.iteration_number, ctx.test_comment, ctx.test_evidences];
    },

    /**
     * @private
     * @param {ManualContext} ctx
     */
    _handle_simple_manual_results(ctx) {
        const { tests_results, manual_steps_results, test_key, test, status, config } = ctx;
        /** @type {string[]} */
        let current_comment = [];
        /** @type {XrayEvidence[]} */
        let current_evidences = [];

        if (status === "failed") {
            current_comment.push(common.get_err_string(test));
            if (config.testExecutionSendEvidenceOnFail === true) {
                const evidence = common.get_evidence_object(test);
                if ('data' in evidence) current_evidences.push(evidence);
            }
        }

        common.push_test_state_to_results({
            tests_results,
            test_key,
            test_comment: current_comment,
            test_evidences: current_evidences,
            test,
            test_type: "Manual",
            test_info_steps: build_test_info_steps(manual_steps_results)
        });
        
        manual_steps_results.shift();
        const activeTest = tests_results.at(-1);
        if (activeTest) {
            activeTest.steps = build_xray_steps_array(manual_steps_results);
        }

        return [[[]], ctx.iterations_array, ctx.iteration_number, current_comment, current_evidences];
    },

    /**
     * @param {any} step
     * @param {any[][]} manual_steps_results
     */
    save_steps_status(step, manual_steps_results) {
        if (step.metaStep?.actor === undefined) return;
        
        const lastGroup = manual_steps_results.at(-1);
        const isSameActor = lastGroup && lastGroup[0]?.step === step.metaStep?.actor;

        if (isSameActor && lastGroup[0]?.step !== undefined) {
            lastGroup.push({ step: step.metaStep?.actor, name: `${step.name}(${step.args})`, status: step.status });
        } else {
            manual_steps_results.push([{ step: step.metaStep?.actor, name: `${step.name}(${step.args})`, status: step.status }]);
        }
    }
};

/** --- Internal Helpers --- */

/** @param {any[][]} manual_steps_results */
function build_test_info_steps(manual_steps_results) {
    const test_info_steps_array = manual_steps_results.map(group => {
        let action = '';
        let result = '';
        group.forEach(sub_step => {
            action = sub_step.step;
            result += `${sub_step.name} `;
        });
        return { action, data: '', result: result.trim() };
    });
    test_info_steps_array.shift(); 
    return test_info_steps_array;
}

/** @param {any[][]} manual_steps_results */
function build_xray_steps_array(manual_steps_results) {
    return manual_steps_results.map(group => {
        let comment = '';
        let status = "PASSED";
        group.forEach(sub_step => {
            comment += `${sub_step.name} `;
            if (sub_step.status.includes("failed")) status = "FAILED";
        });
        return { status, actualResult: comment.trim() };
    });
}

/** @param {any} test */
function build_xray_iterations_parameters_array(test) {
    const parameters = [];
    const currentParams = test.inject?.current || {};
    for (const param in currentParams) {
        if (param !== 'toString') {
            parameters.push({ name: param, value: currentParams[param] });
        }
    }
    return parameters;
}