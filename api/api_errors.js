// @ts-check

/**
 * @typedef {Object} XrayErrorBody
 * @property {string} [message]
 * @property {string} [error]
 * @property {number} [status]
 * @property {string} [statusText]
 * @property {any} [body]
 */

/**
 * Error handling utility for Fetch API requests
 * @param {any} error
 * @returns {Promise<XrayErrorBody>}
 */
export async function handle_fetch_error(error) {
    /** @type {XrayErrorBody} */
    let errorMessage;

    // 1. Handle Response objects
    if (error instanceof Response) {
        try {
            errorMessage = await error.json();
        } catch (e) {
            errorMessage = {
                status: error.status,
                statusText: error.statusText,
                message: "Server returned an error without a JSON body"
            };
        }
    } 
    // 2. Handle Abort errors or standard Error objects
    else if (error instanceof Error) {
        if (error.name === 'AbortError') {
            errorMessage = {
                message: "The request timed out.",
                error: error.message
            };
        } else {
            errorMessage = {
                message: error.message || "An unexpected error occurred",
                error: JSON.stringify(sanitize_error(error))
            };
        }
    }
    // 3. Fallback for unknown error types
    else {
        errorMessage = {
            message: "An unknown error occurred",
            error: String(error)
        };
    }

    return errorMessage;
}

/**
 * Sanitizes sensitive data like client_id and client_secret from logs
 * @param {any} error 
 * @returns {Record<string, any>}
 */
export function sanitize_error(error) {
    const sanitized = { 
        name: error?.name,
        message: error?.message || "",
        body: error?.body
    };

    if (typeof sanitized.message === 'string') {
        // This regex handles both "client_id":"value" and escaped \"client_id\":\"value\"
        sanitized.message = sanitized.message.replaceAll(
            /\\?"(client_id|client_secret)\\?":\\?"[^"]+\\?"/g, 
            '"$1":"<hidden>"'
        );
    }

    if (typeof sanitized.body === 'string') {
        sanitized.body = sanitized.body
            .replaceAll(/"client_id":"[^"]+"/g, '"client_id":"*****"')
            .replaceAll(/"client_secret":"[^"]+"/g, '"client_secret":"*****"');
    }

    return sanitized;
}

export default { handle_fetch_error, sanitize_error };