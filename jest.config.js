module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    moduleFileExtensions: ['ts', 'js'],
    testMatch: ['**/*.test.ts', '**/*.spec.ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.ts'],
    globalSetup: '<rootDir>/tests/utils/global-setup.ts',
    globalTeardown: '<rootDir>/tests/utils/global-teardown.ts',
    collectCoverageFrom: [
      'src/**/*.{js,ts}',
      '!src/presentation/server.ts',
      '!src/app.ts',
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    testTimeout: 30000,
  };