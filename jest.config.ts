module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  preset: "ts-jest",
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
  moduleNameMapper: {"^@/(.*)$": "<rootDir>/src/$1"},
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.history/"
  ],
};