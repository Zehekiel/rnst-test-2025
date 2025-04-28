module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true, // Explicitly use ESM
      tsconfig: 'tsconfig.json'
    }],
  },
  preset: 'ts-jest/presets/default-esm',
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node",
  ],
  testRegex: '(tests/.*|(\\.|/)(test|spec))\\.(ts|js)x?$',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/.history/"
],
  moduleNameMapper: {"^@/(.*)$": "<rootDir>/src/$1"},
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.history/",
    "/dist/",
  ],
};