// Two test suites:
//   npm test            → unit tests (tests/unit), no network or emulator
//   npm run test:rules  → Firestore rules tests (tests/rules), run inside the
//                         Firebase emulator against a demo project
// Both cover plain logic, not screens, so they run in Node with Expo's Babel
// preset for TypeScript and the "@/" import alias.
const shared = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^expo/virtual/env$": "<rootDir>/tests/stubs/expoEnv.js",
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "\\.[jt]sx?$": ["babel-jest", { presets: ["babel-preset-expo"] }],
  },
};

module.exports = {
  projects: [
    {
      ...shared,
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
      setupFiles: ["<rootDir>/tests/unit/setup.ts"],
    },
    {
      ...shared,
      displayName: "rules",
      testMatch: ["<rootDir>/tests/rules/**/*.test.ts"],
    },
  ],
};
