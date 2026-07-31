import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { authHeader, createUser } from "./helpers";

async function seedConversation(userId: string, title: string) {
  return prisma.conversation.create({
    data: {
      userId,
      title,
      messages: {
        create: [
          { role: "USER", content: "Who owns the most books?" },
          {
            role: "ASSISTANT",
            content: "You own the most books.",
            results: [{ tool: "book_counts_by_owner", data: [{ name: "You", count: 3 }] }],
          },
        ],
      },
    },
  });
}

describe("GET /conversations", () => {
  it("requires auth", async () => {
    const res = await request(app).get("/conversations");
    expect(res.status).toBe(401);
  });

  it("starts empty for a new user", async () => {
    const { token } = await createUser();
    const res = await request(app).get("/conversations").set(...authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.conversations).toEqual([]);
  });

  it("only lists the caller's own conversations, newest first", async () => {
    const { token, user } = await createUser({ email: "mine@example.com" });
    const { user: other } = await createUser({ email: "other@example.com" });

    await seedConversation(other.id, "Someone else's chat");
    const mine1 = await seedConversation(user.id, "First chat");
    await new Promise((r) => setTimeout(r, 5));
    const mine2 = await seedConversation(user.id, "Second chat");

    const res = await request(app).get("/conversations").set(...authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.conversations.map((c: { id: string }) => c.id)).toEqual([mine2.id, mine1.id]);
  });
});

describe("GET /conversations/:id", () => {
  it("returns the conversation with its messages in order", async () => {
    const { token, user } = await createUser();
    const conversation = await seedConversation(user.id, "My chat");

    const res = await request(app)
      .get(`/conversations/${conversation.id}`)
      .set(...authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.conversation.title).toBe("My chat");
    expect(res.body.conversation.messages).toHaveLength(2);
    expect(res.body.conversation.messages[0].role).toBe("USER");
    expect(res.body.conversation.messages[1].role).toBe("ASSISTANT");
    expect(res.body.conversation.messages[1].results).toBeTruthy();
  });

  it("404s for another user's conversation", async () => {
    const { token } = await createUser({ email: "requester@example.com" });
    const { user: owner } = await createUser({ email: "owner@example.com" });
    const conversation = await seedConversation(owner.id, "Not yours");

    const res = await request(app)
      .get(`/conversations/${conversation.id}`)
      .set(...authHeader(token));

    expect(res.status).toBe(404);
  });

  it("404s for a nonexistent id", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/conversations/00000000-0000-0000-0000-000000000000")
      .set(...authHeader(token));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /conversations/:id", () => {
  it("deletes the caller's own conversation and its messages", async () => {
    const { token, user } = await createUser();
    const conversation = await seedConversation(user.id, "To delete");

    const res = await request(app)
      .delete(`/conversations/${conversation.id}`)
      .set(...authHeader(token));
    expect(res.status).toBe(204);

    const remaining = await prisma.conversation.findUnique({ where: { id: conversation.id } });
    expect(remaining).toBeNull();
    const remainingMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
    });
    expect(remainingMessages).toHaveLength(0);
  });

  it("404s when deleting another user's conversation", async () => {
    const { token } = await createUser({ email: "requester2@example.com" });
    const { user: owner } = await createUser({ email: "owner2@example.com" });
    const conversation = await seedConversation(owner.id, "Not yours");

    const res = await request(app)
      .delete(`/conversations/${conversation.id}`)
      .set(...authHeader(token));
    expect(res.status).toBe(404);

    const stillThere = await prisma.conversation.findUnique({ where: { id: conversation.id } });
    expect(stillThere).not.toBeNull();
  });
});

describe("POST /ai/query with a conversationId", () => {
  it("404s for a conversationId that doesn't exist, even without an API key configured", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/ai/query")
      .set(...authHeader(token))
      .send({
        question: "What about the least ones?",
        conversationId: "00000000-0000-0000-0000-000000000000",
      });
    // Ownership/existence is validated before the AI-configured check, so
    // this is a 404, not the usual 503.
    expect(res.status).toBe(404);
  });

  it("404s for another user's conversationId", async () => {
    const { token } = await createUser({ email: "asker@example.com" });
    const { user: owner } = await createUser({ email: "owner3@example.com" });
    const conversation = await seedConversation(owner.id, "Not yours");

    const res = await request(app)
      .post("/ai/query")
      .set(...authHeader(token))
      .send({ question: "What about the least ones?", conversationId: conversation.id });
    expect(res.status).toBe(404);
  });

  it("still 503s for a valid, owned conversationId when no API key is configured", async () => {
    const { token, user } = await createUser();
    const conversation = await seedConversation(user.id, "Mine");

    const res = await request(app)
      .post("/ai/query")
      .set(...authHeader(token))
      .send({ question: "What about the least ones?", conversationId: conversation.id });
    expect(res.status).toBe(503);
  });

  it("rejects a conversationId that isn't a valid uuid", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/ai/query")
      .set(...authHeader(token))
      .send({ question: "test", conversationId: "not-a-uuid" });
    expect(res.status).toBe(400);
  });
});
