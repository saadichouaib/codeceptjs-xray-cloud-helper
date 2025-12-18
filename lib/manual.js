import moment from 'moment';
import common from './common.js';

export default {
    /**
     * Save results for manual and data-driven tests
     */
    save_manual_results(is_manual, tests_results, manual_steps_results, iterations_array, manual_iteration, iteration_number, test_key, test_comment, test_evidences, test_contains_iterations, test, status, config) {
        const is_data_driven = test.inject?.current !== undefined;
        
        if (is_manual === true) {
            const test_info_steps = build_test_info_steps(manual_steps_results);
            const lastTest = tests_results[tests_results.length - 1];

            if (is_data_driven === true) {
                // Fixed: original used manual_iteration.length !== {} which is invalid logic.
                // Replaced with a check to see if we are continuing an existing test execution.
                const isContinuingTest = Object.keys(manual_iteration).length > 0 && lastTest?.test_key === test_key;

                if (isContinuingTest === true) {
                    iteration_number++;
                } else {
                    iteration_number = 1;
                    iterations_array = [];
                    test_comment = [];
                    test_evidences = [];
                }

                manual_iteration = {
                    name: `Iteration ${iteration_number}`,
                    parameters: build_xray_iterations_parameters_array(test),
                    log: status.toUpperCase().includes("FAILED") ? test_comment.toString() : "Iteration passed successfully",
                    status: status.toUpperCase(),
                    steps: manual_steps_results.length > 1 ? (manual_steps_results.shift(), build_xray_steps_array(manual_steps_results)) : []
                };

                test_contains_iterations = true;
                
                // Update status based on steps
                const hasStepFailed = JSON.stringify(manual_iteration.steps).includes("FAILED");
                manual_iteration.status = hasStepFailed ? "FAILED" : status.toUpperCase();
            }

            if (test_contains_iterations === false) {
                test_evidences = [];
                test_comment = [];
                if (status === "failed") {
                    test_comment.push(common.get_err_string(test));
                    if (config.testExecutionSendEvidenceOnFail) {
                        test_evidences.push(common.get_evidence_object(test));
                    }
                }
                common.push_test_state_to_results(tests_results, test_key, test_comment, test_evidences, test, "Manual", test_info_steps);
            }

            if (is_data_driven === false) {
                manual_steps_results.shift();
                lastTest.steps = build_xray_steps_array(manual_steps_results);
            } else {
                iterations_array.push(manual_iteration);
                const iterationsString = JSON.stringify(iterations_array);
                const hasFailedIteration = iterationsString.includes("FAILED");

                lastTest.iterations = iterations_array;
                lastTest.status = hasFailedIteration ? "FAILED" : "PASSED";
                lastTest.comment = hasFailedIteration ? test_comment.toString() : "Test passed successfully";
                lastTest.evidences = hasFailedIteration ? test_evidences : [];
                lastTest.finish = moment().format();
            }
            
            manual_steps_results = [[]];
        }

        return [manual_steps_results, iterations_array, iteration_number, test_comment, test_evidences];
    },

    /**
     * Save status of individual manual steps
     */
    save_steps_status(step, manual_steps_results) {
        if (step.metaStep?.actor !== undefined) {
            const lastGroup = manual_steps_results[manual_steps_results.length - 1];
            
            if (lastGroup[0]?.step === step.metaStep?.actor && lastGroup[0]?.step !== undefined) {
                lastGroup.push({ step: step.metaStep?.actor, name: `${step.name}(${step.args})`, status: step.status });
            } else {
                manual_steps_results.push([{ step: step.metaStep?.actor, name: `${step.name}(${step.args})`, status: step.status }]);
            }
        }
    }
};

/**
 * Internal helper to build test info steps
 */
function build_test_info_steps(manual_steps_results) {
    const test_info_steps_array = manual_steps_results.map(group => {
        let action = '';
        let result = '';

        group.forEach(sub_step => {
            action = sub_step.step;
            result += `${sub_step.name} `;
        });

        return {
            action: action,
            data: '',
            result: result.trim()
        };
    });

    test_info_steps_array.shift(); // Remove the initial empty group
    return test_info_steps_array;
}

/**
 * Internal helper to build Xray steps array
 */
function build_xray_steps_array(manual_steps_results) {
    return manual_steps_results.map(group => {
        let comment = '';
        let status = "PASSED";

        group.forEach(sub_step => {
            comment += `${sub_step.name} `;
            if (sub_step.status.includes("failed")) {
                status = "FAILED";
            }
        });

        return {
            status: status,
            actualResult: comment.trim()
        };
    });
}

/**
 * Internal helper to extract parameters for data-driven iterations
 */
function build_xray_iterations_parameters_array(test) {
    const parameters = [];
    const currentParams = test.inject?.current || {};

    for (const param in currentParams) {
        if (param !== 'toString') {
            parameters.push({
                name: param,
                value: currentParams[param]
            });
        }
    }

    return parameters;
}