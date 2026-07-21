import type { Request, Response } from "express";
import { isAiConfigured, runLibraryQuery, runRecommendations } from "../ai/agent";
import type { AiQueryInput } from "../schemas/ai.schema";

export async function query(req: Request, res: Response): Promise<void> {
  if (!isAiConfigured()) {
    res.status(503).json({
      error: "AI query agent is not configured (missing ANTHROPIC_API_KEY)",
    });
    return;
  }

  const { question } = req.body as AiQueryInput;
  const result = await runLibraryQuery(req.user!, question);
  res.json(result);
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
