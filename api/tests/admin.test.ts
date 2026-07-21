import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { authHeader, createUser } from "./helpers";

describe("admin route guard", () => {
  it("rejects a regular user", async () => {
    const { token } = await createUser();
    const res = await request(app).get("/admin/users").set(...authHeader(token));
    expect(res.status).toBe(403);
  });

  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/admin/users");
    expect(res.status).toBe(401);
  });
});

describe("GET /admin/users", () => {
  it("lists users with their book counts", async () => {
    const { token: adminToken } = await createUser({ role: "ADMIN", email: "admin@example.com" });
    const { token: userToken, user } = await createUser({ email: "reader@example.com" });

    await request(app)
      .post("/books")
      .set(...authHeader(userToken))
      .send({ title: "Book 1", author: "Author", genre: "Fiction" });
    await request(app)
      .post("/books")
      .set(...authHeader(userToken))
      .send({ title: "Book 2", author: "Author", genre: "Fiction" });

    const res = await request(app).get("/admin/users").set(...authHeader(adminToken));

    expect(res.status).toBe(200);
    const reader = res.body.users.find((u: { id: string }) => u.id === user.id);
    expect(reader._count.books).toBe(2);
    expect(reader.password).toBeUndefined();
  });
});

describe("PATCH /admin/users/:id", () => {
  it("updates another user's name/role", async () => {
    const { token: adminToken } = await createUser({ role: "ADMIN", email: "admin2@example.com" });
    const { user } = await createUser({ email: "target@example.com" });

    const res = await request(app)
      .patch(`/admin/users/${user.id}`)
      .set(...authHeader(adminToken))
      .send({ name: "Renamed", role: "ADMIN" });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: "Renamed", role: "ADMIN" });
  });

  it("blocks an admin from demoting themself", async () => {
    const { token, user } = await createUser({ role: "ADMIN", email: "self@example.com" });

    const res = await request(app)
      .patch(`/admin/users/${user.id}`)
      .set(...authHeader(token))
      .send({ role: "USER" });

    expect(res.status).toBe(400);
  });

  it("rejects an email already taken by someone else", async () => {
    const { token: adminToken } = await createUser({ role: "ADMIN", email: "admin3@example.com" });
    await createUser({ email: "existing@example.com" });
    const { user: target } = await createUser({ email: "target2@example.com" });

    const res = await request(app)
      .patch(`/admin/users/${target.id}`)
      .set(...authHeader(adminToken))
      .send({ email: "existing@example.com" });

    expect(res.status).toBe(409);
  });
});

describe("DELETE /admin/users/:id", () => {
  it("blocks an admin from deleting themself", async () => {
    const { token, user } = await createUser({ role: "ADMIN", email: "self2@example.com" });

    const res = await request(app).delete(`/admin/users/${user.id}`).set(...authHeader(token));

    expect(res.status).toBe(400);
  });

  it("deletes a user and cascades to their books", async () => {
    const { token: adminToken } = await createUser({ role: "ADMIN", email: "admin4@example.com" });
    const { token: userToken, user } = await createUser({ email: "todelete@example.com" });

    await request(app)
      .post("/books")
      .set(...authHeader(userToken))
      .send({ title: "Doomed Book", author: "Author", genre: "Fiction" });

    const res = await request(app)
      .delete(`/admin/users/${user.id}`)
      .set(...authHeader(adminToken));
    expect(res.status).toBe(204);

    const booksRes = await request(app).get("/admin/books").set(...authHeader(adminToken));
    expect(booksRes.body.books).toHaveLength(0);
  });
});

describe("GET /admin/books", () => {
  it("lists every book with owner info", async () => {
    const { token: adminToken } = await createUser({ role: "ADMIN", email: "admin5@example.com" });
    const { token: userToken, user } = await createUser({ email: "owner@example.com" });

    await request(app)
      .post("/books")
      .set(...authHeader(userToken))
      .send({ title: "Book", author: "Author", genre: "Fiction" });

    const res = await request(app).get("/admin/books").set(...authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].user).toMatchObject({ id: user.id, email: "owner@example.com" });
  });
});
