// Shared between vitest.config.ts and global-setup.ts so the test database
// URL can't drift between "what migrations get applied to" and "what the
// tests actually connect to".
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/library_test?schema=public";
