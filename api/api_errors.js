/**
 * Error handling utility for Fetch API requests
 */
export async function handle_fetch_error(error) {
    let errorMessage = {};

    // 1. Handle Response objects (thrown manually when response.ok is false)
    if (error instanceof Response) {
        try {
            // Try to parse JSON error details from the Xray server
            errorMessage = await error.json();
        } catch (e) {
            // Fallback for non-JSON error responses (e.g., 502 Bad Gateway)
            errorMessage = {
                status: error.status,
                statusText: error.statusText,
                message: "Server returned an error without a JSON body"
            };
        }
    } 
    // 2. Handle Abort errors (specifically for the timeout logic)
    else if (error.name === 'AbortError') {
        errorMessage = {
            message: "The request timed out.",
            error: error.message
        };
    }
    // 3. Handle Network failures or general exceptions
    else {
        errorMessage = {
            message: error.message ?? "An unexpected error occurred",
            error: sanitize_error(error)
        };
    }

    return errorMessage;
}

/**
 * Sanitizes sensitive data like client_id and client_secret from logs
 * @param {*} error 
 * @returns {Object}
 */
export function sanitize_error(error) {
    const sanitized = { ...error };

    // Sanitize string-based messages
    if (error.message) {
        sanitized.message = error.message.replaceAll(
            /("client_id":"[^"]+",|"client_secret":"[^"]+")/g, 
            '"<hidden>"'
        );
    }

    // Sanitize body content if present
    const hasStringBody = error.body && typeof error.body === 'string';
    if (hasStringBody === true) {
        sanitized.body = error.body
            .replaceAll(/"client_id":"[^"]+"/g, '"client_id":"*****"')
            .replaceAll(/"client_secret":"[^"]+"/g, '"client_secret":"*****"');
    }

    return sanitized;
}

export default { handle_fetch_error, sanitize_error };