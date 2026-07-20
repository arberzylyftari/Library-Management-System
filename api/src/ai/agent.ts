import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import type { TokenPayload } from "../utils/jwt";
import { createLibraryTools, type ToolResult } from "./tools";

const SYSTEM_PROMPT = [
  "You are the Library Assistant for a personal library management app.",
  "Answer the user's natural-language question about the library's data by calling the provided tools.",
  "Rules:",
  "- Always use tools to get real data; never invent numbers, titles, authors, or prices.",
  "- The tools are already scoped to what this user may see (a regular user sees only their own books; an admin sees everyone's). Do not mention internal user IDs.",
  "- Prices may be null (unknown) for some books; say so rather than guessing.",
  "- Answer concisely in plain language. The UI also shows the raw rows as a table, so don't repeat every row — summarize.",
  "- If the tools return no data, say so plainly.",
].join("\n");

export function isAiConfigured(): boolean {
  return Boolean(env.anthropicApiKey);
}

export interface LibraryQueryResult {
  answer: string;
  results: ToolResult[];
}

export async function runLibraryQuery(
  user: TokenPayload,
  question: string,
): Promise<LibraryQueryResult> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const results: ToolResult[] = [];
  const tools = createLibraryTools(user, results);

  const final = await client.beta.messages.toolRunner({
    model: env.anthropicModel,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools,
    messages: [{ role: "user", content: question }],
    max_iterations: 6,
  });

  const answer = final.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return { answer, results };
}
