// @ts-check
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// 1. Mock external UI/CLI dependencies
jest.unstable_mockModule('loading-cli', () => ({
    default: jest.fn(() => ({
        start: jest.fn().mockReturnThis(),
        stop: jest.fn()
    }))
}));

jest.unstable_mockModule('chalk', () => ({
    default: {
        bold: {
            green: jest.fn((text) => text)
        }
    }
}));

// 2. Dynamic Imports
const { default: xray_api } = await import('../../api/xray_api.js');
const { default: fs } = await import('node:fs');



describe('xray_api', () => {
    const MOCK_URL = 'https://xray.cloud.getxray.app';
    const MOCK_TOKEN = 'mock_jwt_token';

    beforeEach(() => {
        // Mock global fetch
        // @ts-ignore
        globalThis.fetch = jest.fn();
        
        // Mock process.exit to prevent crashing the test runner
        jest.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`Process exited with code ${code}`);
        });

        // Mock console.error to keep test output clean
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        it('should return a token on successful authentication', async () => {
            // @ts-ignore
            globalThis.fetch.mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(`"${MOCK_TOKEN}"`) // Xray often returns quoted strings
            });

            const token = await xray_api.authenticate(MOCK_URL, 'id', 'secret');

            expect(token).toBe(MOCK_TOKEN);
            expect(globalThis.fetch).toHaveBeenCalledWith(
                `${MOCK_URL}/api/v2/authenticate`,
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should exit process on authentication failure', async () => {
            // @ts-ignore
            globalThis.fetch.mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });

            await expect(xray_api.authenticate(MOCK_URL, 'id', 'secret'))
                .rejects.toThrow('Process exited with code 1');
        });
    });

    describe('execute_import', () => {
        it('should send results and return data on success', async () => {
            const mockData = { testExecutionKey: 'PROJ-1' };
            // @ts-ignore
            globalThis.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const result = await xray_api.execute_import(MOCK_URL, { tests: [] }, MOCK_TOKEN);

            expect(result.data).toEqual(mockData);
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/import/execution'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: `Bearer ${MOCK_TOKEN}`
                    })
                })
            );
        });
    });

    describe('import_cucumber_feature', () => {
        it('should upload a feature file and log created tests', async () => {
            const mockResponse = {
                updatedOrCreatedTests: [{ key: 'TEST-1' }, { key: 'TEST-2' }]
            };

            // Mock File System
            jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('Feature: test'));
            
            // @ts-ignore
            globalThis.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await xray_api.import_cucumber_feature(
                MOCK_URL, 
                'test.feature', 
                'PROJ', 
                'source', 
                MOCK_TOKEN
            );

            expect(result.data).toEqual(mockResponse);
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('projectKey=PROJ'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should exit if the file upload fails', async () => {
            jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('data'));
            // @ts-ignore
            globalThis.fetch.mockResolvedValue({ ok: false });

            await expect(xray_api.import_cucumber_feature(MOCK_URL, 'path', 'PROJ', 'src', 'token'))
                .rejects.toThrow('Process exited with code 1');
        });
    });
});