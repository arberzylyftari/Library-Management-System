import { betaTool } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import { Prisma, ReadingStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { TokenPayload } from "../utils/jwt";

// Each tool call the agent makes is recorded here so the API can return the
// raw rows to the frontend (which renders them as a table alongside the answer).
export interface ToolResult {
  tool: string;
  data: unknown;
}

// Server-side scoping: admins see all books; regular users only their own.
// This is the security boundary — the LLM cannot widen it.
function scopeWhere(user: TokenPayload): Prisma.BookWhereInput {
  return user.role === "ADMIN" ? {} : { userId: user.userId };
}

const STATUS_VALUES = ["WANT_TO_READ", "READING", "COMPLETED"] as const;

/**
 * Build the set of read-only, user-scoped tools the AI query agent may call.
 * Every tool runs a whitelisted Prisma query — the model never sees or writes SQL.
 */
export function createLibraryTools(user: TokenPayload, collected: ToolResult[]) {
  const scope = scopeWhere(user);
  const isAdmin = user.role === "ADMIN";

  const record = <T>(tool: string, data: T): string => {
    collected.push({ tool, data });
    return JSON.stringify(data);
  };

  const listBooks = betaTool({
    name: "list_books",
    description:
      "List books with optional filters and sorting. Use this for questions " +
      "like 'the five most expensive books' (sortBy=price, order=desc, limit=5), " +
      "'my fantasy books', or 'books I'm currently reading'.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: [...STATUS_VALUES] },
        genre: { type: "string", description: "Exact genre, case-insensitive" },
        author: { type: "string", description: "Author name, partial match" },
        search: {
          type: "string",
          description: "Case-insensitive match on title or author",
        },
        sortBy: { type: "string", enum: ["price", "title", "author", "createdAt"] },
        order: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
      additionalProperties: false,
    },
    run: async (input) => {
      const where: Prisma.BookWhereInput = { ...scope };
      if (input.status) where.status = input.status as ReadingStatus;
      if (input.genre) where.genre = { equals: input.genre, mode: "insensitive" };
      if (input.author) where.author = { contains: input.author, mode: "insensitive" };
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { author: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const limit = Math.min(input.limit ?? 10, 50);
      const order = input.order ?? "desc";
      const sortBy = input.sortBy ?? "createdAt";
      // Keep price-less books out of the way when ranking by price.
      const orderBy: Prisma.BookOrderByWithRelationInput =
        sortBy === "price"
          ? { price: { sort: order, nulls: "last" } }
          : ({ [sortBy]: order } as Prisma.BookOrderByWithRelationInput);

      const select: Prisma.BookSelect = {
        id: true,
        title: true,
        author: true,
        genre: true,
        status: true,
        price: true,
        createdAt: true,
      };
      if (isAdmin) {
        select.user = { select: { id: true, name: true, email: true } };
      }

      const books = await prisma.book.findMany({ where, orderBy, take: limit, select });
      return record("list_books", books);
    },
  });

  const bookCountsByOwner = betaTool({
    name: "book_counts_by_owner",
    description:
      "How many books each owner has, highest first. Use this for 'who owns the " +
      "most books?'. For a non-admin user this only reflects their own library.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", minimum: 1, maximum: 50 } },
      additionalProperties: false,
    },
    run: async (input) => {
      const limit = Math.min(input.limit ?? 10, 50);

      if (!isAdmin) {
        const count = await prisma.book.count({ where: { userId: user.userId } });
        const me = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { name: true, email: true },
        });
        return record("book_counts_by_owner", [
          { name: me?.name ?? "You", email: me?.email ?? "", count },
        ]);
      }

      const grouped = await prisma.book.groupBy({
        by: ["userId"],
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: limit,
      });
      const owners = await prisma.user.findMany({
        where: { id: { in: grouped.map((g) => g.userId) } },
        select: { id: true, name: true, email: true },
      });
      const byId = new Map(owners.map((o) => [o.id, o]));
      const rows = grouped.map((g) => ({
        name: byId.get(g.userId)?.name ?? "(unknown)",
        email: byId.get(g.userId)?.email ?? "",
        count: g._count._all,
      }));
      return record("book_counts_by_owner", rows);
    },
  });

  const titlePopularity = betaTool({
    name: "title_popularity",
    description:
      "Titles ranked by how many copies exist across the library, highest first. " +
      "Use this for 'which is the most popular book?'. 'owners' is the number of " +
      "book entries with that title in the (scoped) library.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", minimum: 1, maximum: 50 } },
      additionalProperties: false,
    },
    run: async (input) => {
      const limit = Math.min(input.limit ?? 10, 50);
      const grouped = await prisma.book.groupBy({
        by: ["title"],
        where: scope,
        _count: { title: true },
        orderBy: { _count: { title: "desc" } },
        take: limit,
      });
      const rows = grouped.map((g) => ({ title: g.title, owners: g._count.title }));
      return record("title_popularity", rows);
    },
  });

  const librarySummary = betaTool({
    name: "library_summary",
    description:
      "Aggregate stats for the (scoped) library: total books, counts by reading " +
      "status, top genres, distinct author count, and price min/max/average. Use " +
      "this for overview or 'insights' style questions.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: async () => {
      const [total, byStatus, topGenres, authors, price] = await Promise.all([
        prisma.book.count({ where: scope }),
        prisma.book.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
        prisma.book.groupBy({
          by: ["genre"],
          where: scope,
          _count: { genre: true },
          orderBy: { _count: { genre: "desc" } },
          take: 5,
        }),
        prisma.book.groupBy({ by: ["author"], where: scope }),
        prisma.book.aggregate({
          where: { ...scope, price: { not: null } },
          _min: { price: true },
          _max: { price: true },
          _avg: { price: true },
          _count: { price: true },
        }),
      ]);

      return record("library_summary", {
        totalBooks: total,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
        topGenres: topGenres.map((g) => ({ genre: g.genre, count: g._count.genre })),
        distinctAuthors: authors.length,
        price: {
          withPrice: price._count.price,
          min: price._min.price,
          max: price._max.price,
          avg: price._avg.price,
        },
      });
    },
  });

  return [listBooks, bookCountsByOwner, titlePopularity, librarySummary];
}
