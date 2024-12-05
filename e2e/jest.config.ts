

export default {
  displayName: 'e2e',
  preset: '../jest.preset.js',
  setupFiles: [],
  globalSetup: '<rootDir>/src/global-setup.ts',
  globalTeardown: '<rootDir>/src/global-teardown.ts',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/e2e',
};
