module.exports = {
    /**
     * Handle axios errors
     * @param {Error | *} error 
     * @returns 
     */
    handle_axios_error(error) {
        let errorMessage = {};
        // Sanitizing error message from sensitive data
        error = this.sanitize_error(error);
        console.debug("Initial error : ",error);
        if (error.response) {
            // Request made but the server responded with an error
            errorMessage = error.response.data
            console.debug(error.response.status);
            console.debug(error.response.headers);
        } else if (error.request) {
            // Request made but no response is received from the server.

            errorMessage = {
                message : "No response from the server : ",
                error
            };
        } else {
            // Error occured while setting up the request
            errorMessage = {
                message:'Error while setting up the request' ,
                error: error
            };
        }
        return errorMessage;
    },
    /**
     * 
     * @param {*} error 
     * @returns 
     */
    sanitize_error(error){
        if (error.message) {
            error.message = error.message.replace(/("client_id":"[^"]+",|"client_secret":"[^"]+")/g, '"<hidden>"');
        }
        if (error.config && error.config.data) {
            error.config.data = error.config.data.replace(/"client_id":"[^"]+"/g, '"client_id":"*****"');
            error.config.data = error.config.data.replace(/"client_secret":"[^"]+"/g, '"client_secret":"*****"');
        }
        return error;
    }
}