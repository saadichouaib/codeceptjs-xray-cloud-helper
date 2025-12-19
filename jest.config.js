/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // The test environment that will be used for testing
  testEnvironment: "node",

  // REMOVED extensionsToTreatAsEsm: ['.js'] 
  // Because "type": "module" in package.json already handles this.
  
  // Since you are using ESM-only packages like Chalk 5+ and Faker 10+, 
  // we ensure Jest doesn't try to transform them incorrectly.
  transform: {},

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],

  // Ensure node_modules aren't accidentally ignored if they need ESM transformation
  transformIgnorePatterns: [
    "/node_modules/",
    String.raw`\\.pnp\\.[^\\/]+$`
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,
};