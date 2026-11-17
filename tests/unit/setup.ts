// Runs before every unit test file.

// Device storage, kept in memory
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// No real Firebase in unit tests. Tests that need a signed-in user set
// `auth.currentUser` themselves.
jest.mock("@/src/services/firebase", () => ({
  auth: { currentUser: null },
  db: {},
  __esModule: true,
  default: {},
}));
