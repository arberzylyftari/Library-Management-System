import { api } from "@/lib/api";
import type { AiQueryResponse } from "@/lib/types";

export async function askLibrary(question: string): Promise<AiQueryResponse> {
  return api<AiQueryResponse>("/ai/query", { method: "POST", body: { question } });
}
