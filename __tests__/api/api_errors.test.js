// @ts-check
import { describe, expect, it } from '@jest/globals';
import api_errors from '../../api/api_errors.js';

describe('api_errors utility', () => {
    
    describe('handle_fetch_error', () => {
        it('should extract JSON from a Response object', async () => {
            const mockResponse = new Response(JSON.stringify({ error: 'Xray Error' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await api_errors.handle_fetch_error(mockResponse);
            expect(result.error).toBe('Xray Error');
        });

        it('should fallback if Response object has no JSON body', async () => {
            const mockResponse = new Response('Internal Server Error', {
                status: 500,
                statusText: 'Internal Server Error'
            });

            const result = await api_errors.handle_fetch_error(mockResponse);
            expect(result.status).toBe(500);
            expect(result.message).toBe('Server returned an error without a JSON body');
        });

        it('should handle AbortError (timeouts)', async () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';

            const result = await api_errors.handle_fetch_error(abortError);
            expect(result.message).toBe('The request timed out.');
        });

        it('should handle standard Error objects and sanitize them', async () => {
            // Input simulates a common auth error message
            const error = new Error('Failed with secret "client_id":"123"');
            
            const result = await api_errors.handle_fetch_error(error);
            // The result.error property contains the JSON string of the sanitized object
            expect(result.error).toContain('<hidden>');
            expect(result.error).not.toContain('123');
        });

        it('should handle unknown error types (string)', async () => {
            const result = await api_errors.handle_fetch_error('Literal string error');
            expect(result.message).toBe('An unknown error occurred');
            expect(result.error).toBe('Literal string error');
        });
    });

    describe('sanitize_error', () => {
        it('should redact client_id and client_secret from messages', () => {
            const rawMessage = 'Auth failed for "client_id":"MY_ID","client_secret":"MY_SECRET"';
            const error = new Error(rawMessage);
            
            const sanitized = api_errors.sanitize_error(error);
            
            // Note: the logic preserves keys but replaces values
            expect(sanitized.message).toBe('Auth failed for "client_id":"<hidden>","client_secret":"<hidden>"');
            expect(sanitized.message).not.toContain('MY_ID');
            expect(sanitized.message).not.toContain('MY_SECRET');
        });

        it('should redact client_id and client_secret from body strings', () => {
            const error = {
                message: 'Error',
                body: '{"client_id":"999","client_secret":"xyz"}'
            };
            
            const sanitized = api_errors.sanitize_error(error);
            expect(sanitized.body).toContain('"client_id":"*****"');
            expect(sanitized.body).toContain('"client_secret":"*****"');
        });
    });
});