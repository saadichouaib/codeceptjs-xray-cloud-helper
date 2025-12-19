import colors from 'chalk';
import loading from 'loading-cli';
import fs from 'node:fs';
import process from 'node:process';
import api_errors from './api_errors.js';

let load_auth;
let load_import_execute;
let load_import_cucumber;

/**
 * Xray - authenticate
 * Returns the raw token string from Xray
 */
export async function authenticate(xray_url, client_id, client_secret, timeout = 120000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        load_auth = loading("Authentication ...").start();

        const response = await fetch(`${xray_url}/api/v2/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: client_id,
                client_secret: client_secret
            }),
            signal: controller.signal
        });

        // Refined: removed !response.ok
        if (response.ok === false) {
            throw response; 
        }

        const data = await response.text(); 
        load_auth.stop();
        return data;

    } catch (error) {
        load_auth.stop();
        const errorMessage = await api_errors.handle_fetch_error(error);
        console.error(`Authentication error while importing Xray results, reason :\n`, errorMessage);
        process.exit(1);
    } finally {
        clearTimeout(id);
    }
}

/**
 * Xray - execute import of results to Jira/Xray
 */
export async function execute_import(xray_url, body, token, timeout = 12000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        load_import_execute = loading("Importing results to Xray ...").start();

        const response = await fetch(`${xray_url}/api/v2/import/execution`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        if (response.ok === false) throw response;

        const data = await response.json();
        load_import_execute.stop();
        return { data };
    } catch (err) {
        load_import_execute.stop();
        const errorMessage = await api_errors.handle_fetch_error(err);
        console.error(`Error while importing Xray results, reason :\n`, errorMessage);
        process.exit(1);
    } finally {
        clearTimeout(id);
    }
}

/**
 * Xray - Create Cucumber tests on Xray from feature files
 */
export async function import_cucumber_feature(xray_url, file_path, project_key, project_source, token, timeout = 12000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        load_import_cucumber = loading(`Creating/Updating Cucumber tests on Xray from feature file ${file_path}...`).start();

        const formData = new FormData();
        const fileBuffer = fs.readFileSync(file_path);
        const blob = new Blob([fileBuffer]);
        formData.append('file', blob, 'file.feature');

        const response = await fetch(`${xray_url}/api/v2/import/feature?projectKey=${project_key}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
            signal: controller.signal
        });

        if (response.ok === false) throw response;

        const data = await response.json();
        load_import_cucumber.stop();

        console.log(colors.bold.green('\nTests were created/updated successfully!'));
        console.log('\nUpdated/created tests :');
        data.updatedOrCreatedTests.forEach(test => {
            console.log(colors.bold.green(`${test.key}\n`));
        });

        return { data };
    } catch (err) {
        load_import_cucumber.stop();
        const errorMessage = await api_errors.handle_fetch_error(err);
        console.error(`\nError while creating/updating Cucumber tests from feature file, reason :\n`, errorMessage);
        process.exit(1);
    } finally {
        clearTimeout(id);
    }
}

export default { authenticate, execute_import, import_cucumber_feature };