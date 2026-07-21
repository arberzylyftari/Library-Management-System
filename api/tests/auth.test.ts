import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { authHeader, createUser } from "./helpers";

describe("POST /auth/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Ada Lovelace", email: "ada@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com", role: "USER" });
    expect(res.body.user.password).toBeUndefined();
  });

  it("lowercases and trims the email", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Ada", email: "  Ada@Example.com  ", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("ada@example.com");
  });

  it("rejects a duplicate email", async () => {
    await createUser({ email: "taken@example.com" });

    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Someone Else", email: "taken@example.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Ada", email: "ada2@example.com", password: "short" });

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("logs in with correct credentials", async () => {
    await createUser({ email: "login@example.com" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects a wrong password", async () => {
    await createUser({ email: "login2@example.com" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login2@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("requires a token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user for a valid token", async () => {
    const { user, token } = await createUser({ email: "me@example.com" });

    const res = await request(app).get("/auth/me").set(...authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.email).toBe("me@example.com");
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get("/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
