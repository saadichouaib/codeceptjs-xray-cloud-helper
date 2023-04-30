module.exports = {
    /**
     * 
     * @param {Error | *} error 
     * @returns 
     */
    handle_axios_error(error) {
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
        return errorMessage;
    }
}