// @ts-check
import moment from "moment";
import fs from "node:fs";

/**
 * @typedef {Object} XrayEvidence
 * @property {string} data - Base64 encoded string
 * @property {string} filename - Name of the file
 * @property {string} contentType - MIME type (e.g., image/png)
 */

/**
 * @typedef {Object} XrayTestResult
 * @property {string} title
 * @property {string} status
 * @property {string} comment
 * @property {string|null} test_key
 * @property {string} start
 * @property {string} finish
 * @property {string} [id]
 * @property {XrayEvidence[]} evidences
 * @property {string} test_type
 * @property {Object[]} [test_info_steps]
 * @property {string} [bdd_scenario]
 * @property {string[]} [examples]
 * @property {Object[]} [steps]
 * @property {Object[]} [iterations]
 */

/**
 * @typedef {Object} CommonContext
 * @property {XrayTestResult[]} tests_results - The global results array
 * @property {string|null} test_key - Jira Test Key
 * @property {string[]} test_comment - Array of error messages
 * @property {XrayEvidence[]} test_evidences - Array of screenshot objects
 * @property {any} test - The CodeceptJS test object
 * @property {string} test_type - Manual, Generic, or Cucumber
 * @property {Object[]} [test_info_steps] - Optional steps for Jira test creation
 * @property {string} [scenario] - Optional BDD scenario title
 */

export default {
  /**
   * Orchestrates pushing results to the global state.
   * Solves "Too many args" by delegating to specialized private helpers.
   * @param {CommonContext} ctx
   */
  push_test_state_to_results(ctx) {
    const { tests_results, test } = ctx;

    // 1. Guard Clause: Skip if it's a failing retry (not the final attempt)
    if (this._isFailingRetry(test)) return;

    // 2. Build the result object through a dedicated mapper
    const result = this._buildXrayResult(ctx);

    // 3. State update
    tests_results.push(result);
  },

  /**
   * Maps context data to a valid XrayTestResult object.
   * @private
   * @param {CommonContext} ctx
   * @returns {XrayTestResult}
   */
  _buildXrayResult(ctx) {
    const {
      test,
      test_comment,
      test_evidences,
      test_type,
      test_key,
      test_info_steps,
      scenario,
    } = ctx;

    const isPassed = this.get_test_state(test) === "passed";

    return {
      title: test.title,
      status: isPassed ? "PASSED" : "FAILED",
      comment: isPassed ? "Test passed successfully" : test_comment.toString(),
      test_key,
      start: moment(test.startedAt).format(),
      finish: moment().format(),
      id: test?.uid || test?.id,
      evidences: isPassed ? [] : test_evidences,
      test_type,
      test_info_steps: test_info_steps || undefined,
      bdd_scenario: scenario || undefined,
    };
  },

  /**
   * Logic to determine if the current failure should be ignored due to retries.
   * @private
   * @param {any} test
   * @returns {boolean}
   */
  _isFailingRetry(test) {
    const test_state = this.get_test_state(test);
    const test_have_retries = test._retries !== -1;
    const is_last_retry = test?._retries === test?._currentRetry;

    return test_state === "failed" && test_have_retries && is_last_retry === false;
  },

  /**
   * Sanitize error message and handle template-based errors
   * @param {any} test
   * @returns {string}
   */
  get_err_string(test) {
    if (test.err?.template) {
      return `${test.err?.params?.customMessage}expected ${test.err?.params?.jar} ${test.err?.params?.type} '${test.err?.params?.needle}'`;
    }

    return (test.err?.toString() || "")
      .replaceAll(`"`, "")
      .replaceAll("'", "")
      .replaceAll(/[éèê]/g, "e")
      .replaceAll("à", "a")
      .replaceAll("ù", "u");
  },

  /**
   * Prepare screenshot evidence for Xray
   * @param {any} test
   * @returns {XrayEvidence | Object}
   */
  get_evidence_object(test) {
    const test_artifacts = this.is_retry_test(test)
      ? test._retriedTest.artifacts
      : test.artifacts;
    const screenshot_file = test_artifacts.screenshot;

    if (screenshot_file === undefined) return {};

    const screenshot_encoded = this.base64_encode(screenshot_file);
    const screenshot_name = screenshot_file.split("/").pop() || "screenshot.png";

    return {
      data: screenshot_encoded,
      filename: screenshot_name,
      contentType: "image/png",
    };
  },

  /**
   * Modernized Base64 encoding
   * @param {string} file
   * @returns {string}
   */
  base64_encode(file) {
    const image = fs.readFileSync(file);
    return Buffer.from(image).toString("base64");
  },

  /** @param {any} test */
  is_retry_test(test) {
    return test?._retriedTest !== undefined;
  },

  /** @param {any} test */
  get_test_tags(test) {
    return this.is_retry_test(test) ? test._retriedTest.tags : test.tags;
  },

  /** @param {any} test */
  get_test_state(test) {
    const isRetry = this.is_retry_test(test);
    if (isRetry && test?._retriedTest?.state === undefined) {
      return test.state;
    }
    return isRetry ? test._retriedTest.state : test.state;
  },
};