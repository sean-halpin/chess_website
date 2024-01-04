// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^chess_game/(.*)$": "<rootDir>/path/to/chess_game/dist/$1",
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ],
};
