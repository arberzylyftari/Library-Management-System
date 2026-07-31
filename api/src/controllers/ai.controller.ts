import type { Request, Response } from "express";
import { isAiConfigured, runInsights, runLibraryQuery, runRecommendations } from "../ai/agent";
import { buildHistory } from "../ai/history";
import { prisma } from "../lib/prisma";
import type { AiQueryInput } from "../schemas/ai.schema";

const TITLE_MAX_LENGTH = 60;

function titleFromQuestion(question: string): string {
  return question.length > TITLE_MAX_LENGTH
    ? `${question.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`
    : question;
}

export async function query(req: Request, res: Response): Promise<void> {
  const { question, conversationId } = req.body as AiQueryInput;

  // Validate the conversation (if any) before checking AI configuration, so
  // a bad/foreign conversationId 404s regardless of whether the service is
  // otherwise available.
  let conversation = conversationId
    ? await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  if (conversationId && (!conversation || conversation.userId !== req.user!.userId)) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  if (!isAiConfigured()) {
    res.status(503).json({
      error: "AI query agent is not configured (missing ANTHROPIC_API_KEY)",
    });
    return;
  }

  const history = buildHistory(conversation?.messages ?? []);
  const result = await runLibraryQuery(req.user!, question, history);

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId: req.user!.userId, title: titleFromQuestion(question) },
      include: { messages: true },
    });
  }

  // JSON round-trip: the tool results can contain Prisma Decimal/Date values,
  // which need their own toJSON() to run before landing in a plain Json column.
  const storedResults = JSON.parse(JSON.stringify(result.results));

  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: conversation.id, role: "USER", content: question },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: result.answer,
        results: storedResults,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  res.json({ ...result, conversationId: conversation.id, title: conversation.title });
}

export async function recommend(req: Request, res: Response): Promise<void> {
  if (!isAiConfigured()) {
    res.status(503).json({
      error: "AI recommendation engine is not configured (missing ANTHROPIC_API_KEY)",
    });
    return;
  }

  const result = await runRecommendations(req.user!);
  res.json(result);
}

export async function insights(req: Request, res: Response): Promise<void> {
  if (!isAiConfigured()) {
    res.status(503).json({
      error: "AI insights panel is not configured (missing ANTHROPIC_API_KEY)",
    });
    return;
  }

  const result = await runInsights(req.user!);
  res.json(result);
}
