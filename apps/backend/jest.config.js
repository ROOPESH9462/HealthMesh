module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@healthcare/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
    '^@healthcare/shared-utils$': '<rootDir>/../../packages/shared-utils/src/index.ts'
  }
};
