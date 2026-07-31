import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listConversations(req: Request, res: Response): Promise<void> {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  res.json({ conversations });
}

export async function getConversation(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  // 404 rather than 403 for a conversation belonging to someone else — same
  // reasoning as book ownership elsewhere: don't reveal that it exists.
  if (!conversation || conversation.userId !== req.user!.userId) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json({ conversation });
}

export async function deleteConversation(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const conversation = await prisma.conversation.findUnique({ where: { id } });

  if (!conversation || conversation.userId !== req.user!.userId) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await prisma.conversation.delete({ where: { id } });
  res.status(204).send();
}
