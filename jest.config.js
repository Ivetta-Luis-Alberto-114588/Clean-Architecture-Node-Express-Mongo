module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.ts'],
  globalSetup: '<rootDir>/tests/utils/global-setup.ts',
  globalTeardown: '<rootDir>/tests/utils/global-teardown.ts',
  // Excluir tests de performance del run por defecto
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/performance/',
    '/tests/performance/'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/presentation/server.ts',
    '!src/app.ts',
  ],
  // Configuración global de timeout
  testTimeout: 30000,
  // Configuración para evitar problemas de timing
  maxWorkers: 1, // Forzar ejecución secuencial
  // Configuración de proyectos separados
  projects: [
    {
      displayName: 'unit-integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/test', '<rootDir>/tests'],
      testMatch: [
        '**/test/unit/**/*.test.ts',
        '**/test/integration/**/*.test.ts',
        '**/tests/unit/**/*.test.ts',
        '**/tests/integration/**/*.test.ts',
        '**/tests/smoke/**/*.test.ts'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.ts'],
      globalSetup: '<rootDir>/tests/utils/global-setup.ts',
      globalTeardown: '<rootDir>/tests/utils/global-teardown.ts',
      maxWorkers: 1,
    },
    {
      displayName: 'performance',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/test', '<rootDir>/tests'],
      testMatch: [
        '**/test/performance/**/*.test.ts',
        '**/tests/performance/**/*.test.ts'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.ts'],
      globalSetup: '<rootDir>/tests/utils/global-setup.ts',
      globalTeardown: '<rootDir>/tests/utils/global-teardown.ts',
      maxWorkers: 1,
    }
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  reporters: [
    'default', // Para mostrar los resultados en la consola
    [
      'jest-html-reporter',
      {
        outputPath: './test-report.html', // Ruta del informe HTML
        includeFailureMsg: true, // Incluir mensajes de error en el informe
        includeSuiteFailure: true, // Incluir fallos en suites
        // Opcional:
        // pageTitle: 'Test Report',
        // expand: false,
      },
    ],
  ],
};