import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/testEnv.ts"],
  verbose: true,
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  silent: false,
};

export default config;
