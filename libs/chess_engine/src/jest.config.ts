import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "react-native",
  rootDir: ".",
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest",
  },
  modulePathIgnorePatterns: ["<rootDir>/node_modules/react-native/"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
};

export default config;
