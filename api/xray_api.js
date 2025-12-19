// @ts-check
import colors from "chalk";
import loading from "loading-cli";
import fs from "node:fs";
import process from "node:process";
import api_errors from "./api_errors.js";

/** * @typedef {import('./api_errors.js').XrayErrorBody} XrayErrorBody
 */

/** @type {any} */
let load_auth;
/** @type {any} */
let load_import_execute;
/** @type {any} */
let load_import_cucumber;

/**
 * Xray - authenticate
 * @param {string} xray_url
 * @param {string} client_id
 * @param {string} client_secret
 * @param {number} [timeout]
 * @returns {Promise<string>} Raw token string
 */
export async function authenticate(
  xray_url,
  client_id,
  client_secret,
  timeout = 120000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    load_auth = loading("Authentication ...").start();

    const response = await fetch(`${xray_url}/api/v2/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id, client_secret }),
      signal: controller.signal,
    });

    if (response.ok === false) throw response;

    const data = await response.text();
    // Xray returns a quoted string in some versions, clean it if necessary
    const token = data.replace(/^"|"$/g, "");

    load_auth.stop();
    return token;
  } catch (error) {
    if (load_auth) load_auth.stop();
    const errorMessage = await api_errors.handle_fetch_error(error);
    console.error(
      `Authentication error while importing Xray results, reason :\n`,
      errorMessage
    );
    process.exit(1);
  } finally {
    clearTimeout(id);
  }
}

/**
 * Xray - execute import of results to Jira/Xray
 * @param {string} xray_url
 * @param {Object} body
 * @param {string} token
 * @param {number} [timeout]
 * @returns {Promise<{data: any}>}
 */
export async function execute_import(xray_url, body, token, timeout = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    load_import_execute = loading("Importing results to Xray ...").start();

    const response = await fetch(`${xray_url}/api/v2/import/execution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.ok === false) throw response;

    const data = await response.json();
    load_import_execute.stop();
    return { data };
  } catch (err) {
    if (load_import_execute) load_import_execute.stop();
    const errorMessage = await api_errors.handle_fetch_error(err);
    console.error(
      `Error while importing Xray results, reason :\n`,
      errorMessage
    );
    process.exit(1);
  } finally {
    clearTimeout(id);
  }
}

/**
 * Xray - Create Cucumber tests on Xray from feature files
 * @param {string} xray_url
 * @param {string} file_path
 * @param {string} project_key
 * @param {string} project_source
 * @param {string} token
 * @param {number} [timeout]
 * @returns {Promise<{data: any}>}
 */
export async function import_cucumber_feature(
  xray_url,
  file_path,
  project_key,
  project_source,
  token,
  timeout = 12000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    load_import_cucumber = loading(
      `Creating/Updating Cucumber tests on Xray from feature file ${file_path}...`
    ).start();

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(file_path);
    const blob = new Blob([fileBuffer]);
    formData.append("file", blob, "file.feature");

    const response = await fetch(
      `${xray_url}/api/v2/import/feature?projectKey=${project_key}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      }
    );

    if (response.ok === false) throw response;

    const data = await response.json();
    load_import_cucumber.stop();

    console.log(
      colors.bold.green("\nTests were created/updated successfully!")
    );

    // Define the expected shape of the Xray response
    /** @type {{ updatedOrCreatedTests: Array<{key: string}> }} */
    const result = data;

    if (
      result.updatedOrCreatedTests &&
      Array.isArray(result.updatedOrCreatedTests)
    ) {
      console.log("\nUpdated/created tests :");
      result.updatedOrCreatedTests.forEach((test) => {
        // 'test' is now correctly inferred as { key: string }
        console.log(colors.bold.green(`${test.key}\n`));
      });
    }

    return { data };
  } catch (err) {
    if (load_import_cucumber) load_import_cucumber.stop();
    const errorMessage = await api_errors.handle_fetch_error(err);
    console.error(
      `\nError while creating/updating Cucumber tests from feature file, reason :\n`,
      errorMessage
    );
    process.exit(1);
  } finally {
    clearTimeout(id);
  }
}

export default { authenticate, execute_import, import_cucumber_feature };
