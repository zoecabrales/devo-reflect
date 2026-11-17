// Stand-in for Expo's expo/virtual/env, which babel-preset-expo imports
// for process.env.EXPO_PUBLIC_* but which Jest cannot load (ES module).
module.exports = { env: process.env };
