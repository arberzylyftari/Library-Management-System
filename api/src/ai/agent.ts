import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import type { TokenPayload } from "../utils/jwt";
import { createLibraryTools, createRecommendationTools, type ToolResult } from "./tools";

const RECOMMENDATION_SYSTEM_PROMPT = [
  "You are a book recommendation engine for a personal library app.",
  "Call get_my_library_profile to see this user's reading history: status/genre",
  "breakdown and every title they already own.",
  "Recommend exactly 5 books the user does not already own (check the owned titles",
  "list — never recommend a duplicate), favoring genres and authors that show up",
  "often in their completed or currently-reading books.",
  "If their library has little or no history, recommend acclaimed, broadly popular",
  "books spread across a few different genres, and say up front that these are",
  "general starter picks since there isn't much reading history yet.",
  "Format the response as a markdown numbered list. For each item: **Title** by",
  "Author (Genre) — one sentence on why it fits, tied to their history when",
  "possible. Keep the whole response concise.",
].join("\n");

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

export async function runRecommendations(user: TokenPayload): Promise<LibraryQueryResult> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const results: ToolResult[] = [];
  const tools = createRecommendationTools(user, results);

  const final = await client.beta.messages.toolRunner({
    model: env.anthropicModel,
    max_tokens: 1024,
    system: RECOMMENDATION_SYSTEM_PROMPT,
    tools,
    messages: [{ role: "user", content: "Recommend some books for me to read next." }],
    max_iterations: 3,
  });

  const answer = final.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return { answer, results };
}
