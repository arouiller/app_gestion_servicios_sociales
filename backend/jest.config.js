module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
  ],
  testMatch: [
    '**/__tests__/**/*.spec.js',
    '**/__tests__/**/*.test.js',
  ],
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 10000,
  bail: false,
  verbose: true,
};
