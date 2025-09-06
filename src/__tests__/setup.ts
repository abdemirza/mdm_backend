// Test setup file
// This file is run before each test file

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ENTERPRISE_ID = 'test-enterprise-id';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(10000);
