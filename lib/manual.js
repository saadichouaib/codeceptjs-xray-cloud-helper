const moment = require('moment');
const common = require('./common');

module.exports = {
    save_manual_results(is_manual, tests_results, manual_steps_results, iterations_array, manual_iteration, iteration_number, test_key, test_comment, test_evidences, test_contains_iterations, test, status, config) {
        const is_data_driven = test.inject?.current !== undefined;
        //If actual test contains Manual steps
        if(is_manual){
            //build array steps to be sent if user wants to create jira Manual test
            const test_info_steps = build_test_info_steps(manual_steps_results);

            if (is_data_driven) {
                //Check if there is more than one iteration
                if(manual_iteration.length !== {} && tests_results[tests_results.length - 1]?.test_key === test_key){
                    //If its not the first iteration
                    iteration_number++;
                    manual_iteration = {
                        name: `Iteration ${iteration_number}`,
                        parameters: build_xray_iterations_parameters_array(test),
                        log: status.includes("FAILED") ? test_comment.toString() : "Iteration passed successfully",
                        status: status,
                        steps: manual_steps_results.length > 1 ? manual_steps_results.shift() && build_xray_steps_array(manual_steps_results) : []
                    };

                    test_contains_iterations = true;
                } else {
                    //If its the first iteration
                    iteration_number = 1;
                    manual_iteration = {};
                    iterations_array = [];
                    test_comment = [];
                    test_evidences = [];
                    manual_iteration = {
                        name: `Iteration ${iteration_number}`,
                        parameters: build_xray_iterations_parameters_array(test),
                        log: status.includes("FAILED") ? test_comment.toString() : "Iteration passed successfully",
                        status: status,
                        steps: manual_steps_results.length > 1 ? manual_steps_results.shift() && build_xray_steps_array(manual_steps_results) : []
                    };
                }
                manual_iteration.status = manual_iteration.steps !== [] && manual_iteration.steps.includes("FAILED") ? "FAILED" : status;
            }

            if(!test_contains_iterations){
                test_evidences = [];
                test_comment = [];
                if(test.state === "failed") {
                    test_comment.push(common.get_err_string(test));
                    if (config.testExecutionSendEvidenceOnFail) test_evidences.push(common.get_evidence_object(test));
                }
                common.push_test_state_to_results(tests_results, test_key, test_comment, test_evidences, test, "Manual", test_info_steps);
            }

            if (!is_data_driven){
                //will add steps to tests array because tests doesn't contain iterations
                manual_steps_results.shift();
                tests_results[tests_results.length - 1].steps = build_xray_steps_array(manual_steps_results);
            } else {
                //If actual test is data driven then push iterations array with its state to the actual result
                iterations_array.push(manual_iteration);
                tests_results[tests_results.length - 1].iterations = iterations_array;
                tests_results[tests_results.length - 1].status = JSON.stringify(iterations_array).includes("FAILED") ? "FAILED" : "PASSED";
                tests_results[tests_results.length - 1].comment = JSON.stringify(iterations_array).includes("FAILED") ? test_comment.toString() : "Test passed successfully";
                tests_results[tests_results.length - 1].evidences = JSON.stringify(iterations_array).includes("FAILED") ? test_evidences : [];
                tests_results[tests_results.length - 1].finish = moment().format()
            }
            manual_steps_results= [[]];
        }

        return [manual_steps_results, iterations_array, iteration_number, test_comment, test_evidences];
    },

    //Save steps results
    save_steps_status(step, manual_steps_results) {
        if (step.metaStep?.actor !== undefined) {
            if (manual_steps_results[manual_steps_results.length - 1][0]?.step === step.metaStep?.actor && manual_steps_results[manual_steps_results.length - 1][0]?.step !== undefined){
                manual_steps_results[manual_steps_results.length - 1].push({step: step.metaStep?.actor, name: `${step.name}(${step.args})`, status: step.status});
            } else {
                manual_steps_results.push([{step: step.metaStep?.actor, name: `${step.name}(${step.args})`, status: step.status}]);
            }
        }
    }
};

//Build array of steps to be sent in testInfo and used for test creation
function build_test_info_steps(manual_steps_results) {
    let test_info_steps_array = [];
    let action;
    let data = '';
    let result;

    manual_steps_results.forEach(step => {

        step.forEach(sub_step => {
            action = sub_step.step;
            result = result.concat([`${sub_step.name}`, ' ']);
        });

        test_info_steps_array.push({
            action: action,
            data: data,
            result: result
        })

        result = ``;
    });

    //Remove the first empty object
    test_info_steps_array.shift();

    return test_info_steps_array;
};

//Build xray steps array to be send for Manual tests with steps
function build_xray_steps_array(manual_steps_results) {
    let xray_steps_array = [];
    let status = "";
    let comment = ``;

    manual_steps_results.forEach(step => {

        step.forEach(sub_step => {
            comment = comment.concat([`${sub_step.name}`, ' ']);
            status = sub_step.status.includes("failed") ? "FAILED" : "PASSED";
        });

        xray_steps_array.push({
            status: status,
            actualResult: comment.slice(0, -2)
        })

        comment = ``;
    });

    return xray_steps_array;
};

//Build xray iterations parameters array to be send for Data driven Manual tests
function build_xray_iterations_parameters_array(test) {
    let parameters = [];

    for (const param in test.inject.current) {
        if (param !== 'toString'){
            parameters.push({
                name : param,
                value : test.inject.current[param]
            })
        }
    }

    return parameters;
};
