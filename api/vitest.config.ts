import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/test-db-url";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Tests share one Postgres database and clear it between tests, so they
    // can't run as separate parallel workers without racing each other.
    fileParallelism: false,
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: "test-secret",
      JWT_EXPIRES_IN: "7d",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "claude-haiku-4-5",
    },
    setupFiles: ["./tests/setup.ts"],
  },
});
