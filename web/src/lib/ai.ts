import { api } from "@/lib/api";
import type { AiQueryResponse } from "@/lib/types";

export async function askLibrary(
  question: string,
  conversationId?: string,
): Promise<AiQueryResponse> {
  return api<AiQueryResponse>("/ai/query", { method: "POST", body: { question, conversationId } });
}

export async function getRecommendations(): Promise<AiQueryResponse> {
  return api<AiQueryResponse>("/ai/recommendations", { method: "POST" });
}

export async function getInsights(): Promise<AiQueryResponse> {
  return api<AiQueryResponse>("/ai/insights", { method: "POST" });
}
