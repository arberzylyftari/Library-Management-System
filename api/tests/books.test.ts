import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { authHeader, createUser } from "./helpers";

describe("POST /books", () => {
  it("creates a book owned by the current user", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .post("/books")
      .set(...authHeader(token))
      .send({ title: "Dune", author: "Frank Herbert", genre: "Sci-Fi", price: 12.99 });

    expect(res.status).toBe(201);
    expect(res.body.book).toMatchObject({
      title: "Dune",
      userId: user.id,
      status: "WANT_TO_READ",
    });
  });

  it("requires title/author/genre", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post("/books")
      .set(...authHeader(token))
      .send({ title: "Dune" });

    expect(res.status).toBe(400);
  });

  it("requires auth", async () => {
    const res = await request(app)
      .post("/books")
      .send({ title: "Dune", author: "Frank Herbert", genre: "Sci-Fi" });

    expect(res.status).toBe(401);
  });
});

describe("GET /books", () => {
  it("only returns the current user's books", async () => {
    const { token: tokenA } = await createUser({ email: "a@example.com" });
    const { token: tokenB } = await createUser({ email: "b@example.com" });

    await request(app)
      .post("/books")
      .set(...authHeader(tokenA))
      .send({ title: "A's Book", author: "Author", genre: "Fiction" });
    await request(app)
      .post("/books")
      .set(...authHeader(tokenB))
      .send({ title: "B's Book", author: "Author", genre: "Fiction" });

    const res = await request(app).get("/books").set(...authHeader(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe("A's Book");
  });

  it("filters by status and search", async () => {
    const { token } = await createUser();
    await request(app)
      .post("/books")
      .set(...authHeader(token))
      .send({ title: "The Hobbit", author: "Tolkien", genre: "Fantasy", status: "COMPLETED" });
    await request(app)
      .post("/books")
      .set(...authHeader(token))
      .send({ title: "Dune", author: "Herbert", genre: "Sci-Fi", status: "WANT_TO_READ" });

    const byStatus = await request(app)
      .get("/books?status=COMPLETED")
      .set(...authHeader(token));
    expect(byStatus.body.books).toHaveLength(1);
    expect(byStatus.body.books[0].title).toBe("The Hobbit");

    const bySearch = await request(app)
      .get("/books?search=dune")
      .set(...authHeader(token));
    expect(bySearch.body.books).toHaveLength(1);
    expect(bySearch.body.books[0].title).toBe("Dune");
  });

  it("an admin sees every user's books", async () => {
    const { token: userToken } = await createUser({ email: "owner@example.com" });
    const { token: adminToken } = await createUser({ role: "ADMIN", email: "admin@example.com" });

    await request(app)
      .post("/books")
      .set(...authHeader(userToken))
      .send({ title: "Owned Book", author: "Author", genre: "Fiction" });

    const res = await request(app).get("/books").set(...authHeader(adminToken));
    expect(res.body.books).toHaveLength(1);
  });
});

describe("PATCH/DELETE /books/:id ownership", () => {
  it("404s when a regular user touches someone else's book", async () => {
    const { token: ownerToken } = await createUser({ email: "owner2@example.com" });
    const { token: otherToken } = await createUser({ email: "other@example.com" });

    const created = await request(app)
      .post("/books")
      .set(...authHeader(ownerToken))
      .send({ title: "Private Book", author: "Author", genre: "Fiction" });
    const bookId = created.body.book.id;

    const updateRes = await request(app)
      .patch(`/books/${bookId}`)
      .set(...authHeader(otherToken))
      .send({ title: "Hijacked" });
    expect(updateRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/books/${bookId}`)
      .set(...authHeader(otherToken));
    expect(deleteRes.status).toBe(404);
  });

  it("lets the owner update and delete their own book", async () => {
    const { token } = await createUser();
    const created = await request(app)
      .post("/books")
      .set(...authHeader(token))
      .send({ title: "Original", author: "Author", genre: "Fiction" });
    const bookId = created.body.book.id;

    const updateRes = await request(app)
      .patch(`/books/${bookId}`)
      .set(...authHeader(token))
      .send({ title: "Updated" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.book.title).toBe("Updated");

    const deleteRes = await request(app)
      .delete(`/books/${bookId}`)
      .set(...authHeader(token));
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/books/${bookId}`)
      .set(...authHeader(token));
    expect(getRes.status).toBe(404);
  });

  it("lets an admin update someone else's book", async () => {
    const { token: ownerToken } = await createUser({ email: "owner3@example.com" });
    const { token: adminToken } = await createUser({ role: "ADMIN", email: "admin2@example.com" });

    const created = await request(app)
      .post("/books")
      .set(...authHeader(ownerToken))
      .send({ title: "Someone's Book", author: "Author", genre: "Fiction" });
    const bookId = created.body.book.id;

    const res = await request(app)
      .patch(`/books/${bookId}`)
      .set(...authHeader(adminToken))
      .send({ status: "COMPLETED" });
    expect(res.status).toBe(200);
    expect(res.body.book.status).toBe("COMPLETED");
  });

  it("rejects a negative price", async () => {
    const { token } = await createUser();
    const created = await request(app)
      .post("/books")
      .set(...authHeader(token))
      .send({ title: "Book", author: "Author", genre: "Fiction" });

    const res = await request(app)
      .patch(`/books/${created.body.book.id}`)
      .set(...authHeader(token))
      .send({ price: -5 });
    expect(res.status).toBe(400);
  });

  it("can clear price with null on update", async () => {
    const { token } = await createUser();
    const created = await request(app)
      .post("/books")
      .set(...authHeader(token))
      .send({ title: "Book", author: "Author", genre: "Fiction", price: 9.99 });

    const res = await request(app)
      .patch(`/books/${created.body.book.id}`)
      .set(...authHeader(token))
      .send({ price: null });
    expect(res.status).toBe(200);
    expect(res.body.book.price).toBeNull();
  });
});
