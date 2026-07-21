import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  createInsightsTools,
  createLibraryTools,
  createRecommendationTools,
  type ToolResult,
} from "../src/ai/tools";
import { createUser } from "./helpers";

// These exercise the Prisma-backed tool functions the AI agents call
// directly — the actual data layer and scoping rules — without going
// through Claude at all. This is the safety boundary the model can't widen,
// so it's worth testing independent of whether an API key is configured.

function findTool(tools: { name: string; run: (input: never) => Promise<unknown> }[], name: string) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool;
}

describe("createLibraryTools", () => {
  it("list_books scopes a regular user to their own books only", async () => {
    const { user: owner } = await createUser({ email: "owner@example.com" });
    const { user: other } = await createUser({ email: "other@example.com" });
    await prisma.book.create({
      data: { title: "Mine", author: "A", genre: "Fiction", userId: owner.id },
    });
    await prisma.book.create({
      data: { title: "Not Mine", author: "A", genre: "Fiction", userId: other.id },
    });

    const collected: ToolResult[] = [];
    const tools = createLibraryTools({ userId: owner.id, role: "USER" }, collected);
    const listBooks = findTool(tools, "list_books");

    await listBooks.run({} as never);

    const rows = collected[0].data as { title: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Mine");
  });

  it("list_books lets an admin see every user's books", async () => {
    const { user: owner } = await createUser({ email: "owner2@example.com" });
    const { user: admin } = await createUser({ role: "ADMIN", email: "admin@example.com" });
    await prisma.book.create({
      data: { title: "Someone's Book", author: "A", genre: "Fiction", userId: owner.id },
    });

    const collected: ToolResult[] = [];
    const tools = createLibraryTools({ userId: admin.id, role: "ADMIN" }, collected);
    const listBooks = findTool(tools, "list_books");

    await listBooks.run({} as never);

    expect((collected[0].data as unknown[])).toHaveLength(1);
  });

  it("list_books sorts by price with nulls last", async () => {
    const { user } = await createUser();
    await prisma.book.create({
      data: { title: "No Price", author: "A", genre: "Fiction", userId: user.id },
    });
    await prisma.book.create({
      data: { title: "Cheap", author: "A", genre: "Fiction", userId: user.id, price: 5 },
    });
    await prisma.book.create({
      data: { title: "Pricey", author: "A", genre: "Fiction", userId: user.id, price: 50 },
    });

    const collected: ToolResult[] = [];
    const tools = createLibraryTools({ userId: user.id, role: "USER" }, collected);
    const listBooks = findTool(tools, "list_books");

    await listBooks.run({ sortBy: "price", order: "desc" } as never);

    const rows = collected[0].data as { title: string }[];
    expect(rows.map((r) => r.title)).toEqual(["Pricey", "Cheap", "No Price"]);
  });

  it("book_counts_by_owner only reflects the caller's own library for a regular user", async () => {
    const { user: a } = await createUser({ email: "a@example.com" });
    const { user: b } = await createUser({ email: "b@example.com" });
    await prisma.book.create({ data: { title: "A1", author: "A", genre: "F", userId: a.id } });
    await prisma.book.create({ data: { title: "A2", author: "A", genre: "F", userId: a.id } });
    await prisma.book.create({ data: { title: "B1", author: "A", genre: "F", userId: b.id } });

    const collected: ToolResult[] = [];
    const tools = createLibraryTools({ userId: a.id, role: "USER" }, collected);
    const tool = findTool(tools, "book_counts_by_owner");

    await tool.run({} as never);

    const rows = collected[0].data as { count: number }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(2);
  });

  it("library_summary aggregates status/genre/price for the scoped library", async () => {
    const { user } = await createUser();
    await prisma.book.create({
      data: { title: "One", author: "A", genre: "Fantasy", status: "COMPLETED", userId: user.id, price: 10 },
    });
    await prisma.book.create({
      data: { title: "Two", author: "A", genre: "Fantasy", status: "READING", userId: user.id, price: 20 },
    });

    const collected: ToolResult[] = [];
    const tools = createLibraryTools({ userId: user.id, role: "USER" }, collected);
    const tool = findTool(tools, "library_summary");

    await tool.run({} as never);

    const data = collected[0].data as {
      totalBooks: number;
      topGenres: { genre: string; count: number }[];
      price: { withPrice: number; min: string; max: string };
    };
    expect(data.totalBooks).toBe(2);
    expect(data.topGenres[0]).toEqual({ genre: "Fantasy", count: 2 });
    expect(data.price.withPrice).toBe(2);
  });
});

describe("createRecommendationTools", () => {
  it("is always self-scoped, even for an admin account", async () => {
    const { user: admin } = await createUser({ role: "ADMIN", email: "admin@example.com" });
    const { user: other } = await createUser({ email: "other@example.com" });
    await prisma.book.create({
      data: { title: "Admin's Own Book", author: "A", genre: "Fiction", userId: admin.id },
    });
    await prisma.book.create({
      data: { title: "Someone Else's Book", author: "A", genre: "Fiction", userId: other.id },
    });

    const collected: ToolResult[] = [];
    const tools = createRecommendationTools({ userId: admin.id, role: "ADMIN" }, collected);
    const tool = findTool(tools, "get_my_library_profile");

    await tool.run({} as never);

    const data = collected[0].data as { ownedTitles: { title: string }[] };
    expect(data.ownedTitles.map((b) => b.title)).toEqual(["Admin's Own Book"]);
  });
});

describe("createInsightsTools", () => {
  it("is always self-scoped, even for an admin account", async () => {
    const { user: admin } = await createUser({ role: "ADMIN", email: "admin2@example.com" });
    const { user: other } = await createUser({ email: "other2@example.com" });
    await prisma.book.create({
      data: { title: "Admin's Book", author: "A", genre: "Fiction", userId: admin.id },
    });
    await prisma.book.create({
      data: { title: "Other Book 1", author: "A", genre: "Fiction", userId: other.id },
    });
    await prisma.book.create({
      data: { title: "Other Book 2", author: "A", genre: "Fiction", userId: other.id },
    });

    const collected: ToolResult[] = [];
    const tools = createInsightsTools({ userId: admin.id, role: "ADMIN" }, collected);
    const tool = findTool(tools, "get_my_reading_stats");

    await tool.run({} as never);

    const data = collected[0].data as { totalBooks: number };
    expect(data.totalBooks).toBe(1);
  });
});
