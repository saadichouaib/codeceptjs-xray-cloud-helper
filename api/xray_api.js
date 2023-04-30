const axios = require('axios').default;
const axiosFormData = require('axios-form-data');
const colors = require('chalk');
const process = require('process');
const loading = require('loading-cli');
const fs = require('fs');
let load_auth;
let load_import_execute;
let load_import_cucumber;

module.exports = {

    /**
     * Xray - authenticate
     *
     * @param {String} xray_url
     * @param {String} client_id
     * @param {String} client_secret
     * @returns {String} token
     */
    async authenticate(xray_url, client_id, client_secret, timeout = 120000) {
        let response;

        const headers = {
            'Content-Type': 'application/json',
        };

        const body = {
            client_id: client_id,
            client_secret: client_secret
        }

        try {
            load_auth = loading("Authentication ...").start();
            response = await axios.post(`${xray_url}/api/v2/authenticate`, body, {headers: headers, timeout: timeout});
        } catch (error) {
            load_auth.stop();
            let errorMessage = "";
            if (error.response) {
                // Request made but the server responded with an error
                errorMessage = error.response.data
                console.debug(error.response.status);
                console.debug(error.response.headers);
            } else if (error.request) {
                // Request made but no response is received from the server.
                errorMessage = "No response from the server : " + error.request;
            } else {
                // Error occured while setting up the request
                errorMessage = 'Error' + error.message;
            }
            console.error(`Authentication error while importing Xray results, reason :\n`, errorMessage);
            process.exit(1);
        }

        load_auth.stop();
        return response.data;
    },

    /**
     * Xray - execute import of results to Jira/Xray
     *
     * @param {String} xray_url
     * @param {Object} body
     * @param {String} token
     * @returns {Object} response
     */
    async execute_import(xray_url, body, token, timeout = 12000) {
        let response;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        try {
            load_import_execute = loading("Importing results to Xray ...").start();
            response = await axios.post(`${xray_url}/api/v2/import/execution`, body, {headers: headers, timeout: timeout});
        } catch (err) {
            load_import_execute.stop();
            console.error(`Error while importing Xray results, reason :\n`, err.response.data);
            process.exit(1);
        }

        load_import_execute.stop();
        return response;
    },

    /**
     * Xray - Create Cucumber tests on Xray from feature files
     *
     * @param {String} xray_url
     * @param {String} file_path
     * @param {String} project_key
     * @param {String} project_source
     * @param {String} token
     * @returns {Object} response
     */
    async import_cucumber_feature(xray_url, file_path, project_key, project_source, token, timeout = 12000) {
        axios.interceptors.request.use(axiosFormData);
        let response;

        const headers = {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        };

        try {
            load_import_cucumber = loading(`Creating/Updating Cucumber tests on Xray from feature file ${file_path}...`).start();
            response = await axios.post(`${xray_url}/api/v2/import/feature?projectKey=${project_key}`, {file: fs.createReadStream(file_path)}, {headers: headers, timeout: timeout});
        } catch (err) {
            load_import_cucumber.stop();
            console.error(`\nError while creating/updating Cucumber tests from feature file, reason :\n`, err.cause);
            process.exit(1);
        }

        load_import_cucumber.stop();

        console.log(colors.bold.green('\nTests were created/updated syccessfully!'));
        console.log('\nUpdated/created tests :');
        response.data.updatedOrCreatedTests.forEach(test => {
            console.log(colors.bold.green(`${test.key}\n`));
        });

        return response;
    }
};
