import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { authHeader, createUser } from "./helpers";

// No ANTHROPIC_API_KEY is set in the test environment (vitest.config.ts), so
// every /ai route should short-circuit with 503 rather than attempting a real
// (costly, non-deterministic) call to Claude. The scoped Prisma queries the
// agent's tools run are covered directly in ai-tools.test.ts instead.
describe("AI routes without an API key configured", () => {
  it("POST /ai/query returns 503", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/ai/query")
      .set(...authHeader(token))
      .send({ question: "Who owns the most books?" });
    expect(res.status).toBe(503);
  });

  it("POST /ai/recommendations returns 503", async () => {
    const { token } = await createUser();
    const res = await request(app).post("/ai/recommendations").set(...authHeader(token));
    expect(res.status).toBe(503);
  });

  it("POST /ai/insights returns 503", async () => {
    const { token } = await createUser();
    const res = await request(app).post("/ai/insights").set(...authHeader(token));
    expect(res.status).toBe(503);
  });

  it("still requires auth ahead of the 503", async () => {
    const res = await request(app).post("/ai/query").send({ question: "test" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty question", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/ai/query")
      .set(...authHeader(token))
      .send({ question: "" });
    expect(res.status).toBe(400);
  });
});
