import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./test-db-url";

// Runs once before the whole test run, in the main Vitest process — before
// `test.env` has been injected into any worker — so the test DB URL must be
// resolved here too, rather than trusting process.env.DATABASE_URL, which at
// this point would still be whatever the shell/`.env` set (the real dev DB).
export default function globalSetup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
