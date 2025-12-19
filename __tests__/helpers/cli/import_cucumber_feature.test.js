// @ts-check
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// 1. Mock the modules
jest.unstable_mockModule('codeceptjs/lib/command/utils', () => ({
    getTestRoot: jest.fn(),
    getConfig: jest.fn(),
}));

jest.unstable_mockModule('codeceptjs', () => {
    const mockOutput = { print: jest.fn(), error: jest.fn() };
    return {
        output: mockOutput,
        default: { output: mockOutput }
    };
});

jest.unstable_mockModule('inquirer', () => ({
    default: { prompt: jest.fn(() => Promise.resolve({})) }
}));

jest.unstable_mockModule('node:fs', () => ({
    default: { readdirSync: jest.fn(), readFileSync: jest.fn() },
    readdirSync: jest.fn(),
    readFileSync: jest.fn()
}));

// 2. Dynamic imports
const { getTestRoot, getConfig } = await import('codeceptjs/lib/command/utils');
const { default: inquirer } = await import('inquirer');
const { default: fs } = await import('node:fs');
const { default: xray_api } = await import('../../../api/xray_api.js');
const { default: import_cucumber_feature } = await import('../../../helpers/cli/import_cucumber_feature.js');



describe('import_cucumber_feature cli helper', () => {
    /** @type {any} */
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            plugins: {
                xrayImport: {
                    projectKey: 'PROJ',
                    xrayClientId: 'ID',
                    xraySecret: 'SECRET',
                    timeout: 10000
                }
            },
            gherkin: { features: './features' },
            name: 'MyProject'
        };

        // @ts-ignore
        getTestRoot.mockReturnValue('/root');
        // @ts-ignore
        getConfig.mockReturnValue(mockConfig);

        // Trap process.exit to throw a catchable error
        jest.spyOn(process, 'exit').mockImplementation((code) => {
            const err = new Error(`Process exited with code ${code}`);
            // @ts-ignore - attaching code for easier identification
            err.code = code;
            throw err;
        });

        jest.spyOn(xray_api, 'authenticate').mockResolvedValue('MOCK_TOKEN');
        jest.spyOn(xray_api, 'import_cucumber_feature').mockResolvedValue({ data: {} });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('should exit if xrayImport plugin is not initialized', () => {
        // @ts-ignore
        getConfig.mockReturnValue({ plugins: {} }); 
        
        // This is a synchronous check in your source code, so it throws directly
        expect(() => import_cucumber_feature.questions()).toThrow('Process exited with code 1');
    });

    it('should prompt the user and call Xray API on success', async () => {
        const promptResult = {
            projectKey: 'NEWPROJ',
            featuresFolderPath: './features',
            featureFilePath: './features/test.feature'
        };

        // @ts-ignore
        inquirer.prompt.mockResolvedValue(promptResult);
        // @ts-ignore
        fs.readdirSync.mockReturnValue(['test.feature']);

        import_cucumber_feature.questions();

        // Wait for the .then() block to execute
        await new Promise(resolve => setImmediate(resolve));

        expect(xray_api.authenticate).toHaveBeenCalled();
    });

    describe('get_files_from_dir helper', () => {
        it('should exit if directory is empty', () => {
            // @ts-ignore
            fs.readdirSync.mockReturnValue([]);
            
            // Set up the mock to catch the error when Inquirer calls choices()
            // @ts-ignore
            inquirer.prompt.mockImplementation((questions) => {
                const fileChoice = questions.find((/** @type {{name:string}} */ q) => q.name === 'featureFilePath');
                
                // This call triggers get_files_from_dir synchronously
                return fileChoice.choices({ featuresFolderPath: './empty' });
            });

            // Since Inquirer evaluates 'choices' during the 'prompt()' call,
            // it throws synchronously.
            expect(() => {
                import_cucumber_feature.questions();
            }).toThrow('Process exited with code 1');
        });
    });
});