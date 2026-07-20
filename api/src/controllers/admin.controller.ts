import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type { UpdateUserInput } from "../schemas/admin.schema";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: { ...publicUserSelect, _count: { select: { books: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const data = req.body as UpdateUserInput;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Don't let an admin strip their own admin role and lock themselves out.
  if (id === req.user!.userId && data.role && data.role !== "ADMIN") {
    res.status(400).json({ error: "You cannot change your own role" });
    return;
  }

  // If email is changing, make sure it isn't taken by someone else.
  if (data.email && data.email !== existing.email) {
    const clash = await prisma.user.findUnique({ where: { email: data.email } });
    if (clash) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: publicUserSelect,
  });
  res.json({ user });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  if (id === req.user!.userId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Deleting a user cascades to their books (see Prisma schema relation).
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}

export async function listAllBooks(_req: Request, res: Response): Promise<void> {
  const books = await prisma.book.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ books });
}
