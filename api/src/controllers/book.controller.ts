import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { CreateBookInput, UpdateBookInput } from "../schemas/book.schema";
import { listBooksQuerySchema } from "../schemas/book.schema";

// Admins operate on all books; regular users are scoped to their own.
function isAdmin(req: Request): boolean {
  return req.user?.role === "ADMIN";
}

export async function listBooks(req: Request, res: Response): Promise<void> {
  const parsed = listBooksQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  const { status, genre, search } = parsed.data;

  const where: Prisma.BookWhereInput = {};
  if (!isAdmin(req)) {
    where.userId = req.user!.userId;
  }
  if (status) where.status = status;
  if (genre) where.genre = { equals: genre, mode: "insensitive" };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }

  const books = await prisma.book.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json({ books });
}

export async function getBook(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const book = await prisma.book.findUnique({ where: { id } });

  if (!book || (!isAdmin(req) && book.userId !== req.user!.userId)) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json({ book });
}

export async function createBook(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateBookInput;

  const book = await prisma.book.create({
    data: { ...data, userId: req.user!.userId },
  });

  res.status(201).json({ book });
}

export async function updateBook(req: Request, res: Response): Promise<void> {
  const data = req.body as UpdateBookInput;
  const id = String(req.params.id);

  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing || (!isAdmin(req) && existing.userId !== req.user!.userId)) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const book = await prisma.book.update({
    where: { id: existing.id },
    data,
  });

  res.json({ book });
}

export async function deleteBook(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing || (!isAdmin(req) && existing.userId !== req.user!.userId)) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  await prisma.book.delete({ where: { id: existing.id } });
  res.status(204).send();
}
