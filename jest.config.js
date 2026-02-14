/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  moduleNameMapper: {
    "\\.(scss|css)$": "<rootDir>/src/__mocks__/styleMock.ts",
    "\\.(png|jpg|jpeg|gif|svg|webp)$": "<rootDir>/src/__mocks__/fileMock.ts",
  },
};
