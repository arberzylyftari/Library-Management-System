import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import type { TokenPayload } from "../utils/jwt";
import {
  createInsightsTools,
  createLibraryTools,
  createRecommendationTools,
  type ToolResult,
} from "./tools";

const INSIGHTS_SYSTEM_PROMPT = [
  "You are the Library Insights panel for a personal library management app.",
  "Call get_my_reading_stats to see this user's own library stats, then write a",
  "short 'Library Insights' summary of their reading habits.",
  "Rules:",
  "- Use only the numbers from the tool; never invent a stat.",
  "- Write 3-5 short bullet points, each a concrete, specific observation (e.g.",
  "  a dominant genre, a completion rate, price spread, author diversity) —",
  "  not vague filler like 'you enjoy reading'.",
  "- If a stat is a tie or there isn't enough data for it (e.g. no priced books,",
  "  or an empty library), say so plainly instead of forcing an insight.",
  "- Format as a markdown bullet list. Keep it concise.",
].join("\n");

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
  "- Earlier turns in this conversation may be included for context. Use them to resolve follow-ups like 'what about the least ones?', but always call tools again for any new data the follow-up needs — never answer from memory of an earlier tool result alone.",
].join("\n");

export function isAiConfigured(): boolean {
  return Boolean(env.anthropicApiKey);
}

export interface LibraryQueryResult {
  answer: string;
  results: ToolResult[];
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function runLibraryQuery(
  user: TokenPayload,
  question: string,
  history: ChatTurn[] = [],
): Promise<LibraryQueryResult> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const results: ToolResult[] = [];
  const tools = createLibraryTools(user, results);

  const final = await client.beta.messages.toolRunner({
    model: env.anthropicModel,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools,
    messages: [...history, { role: "user", content: question }],
    max_iterations: 6,
  });

  const answer = final.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return { answer, results };
}

export async function runInsights(user: TokenPayload): Promise<LibraryQueryResult> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const results: ToolResult[] = [];
  const tools = createInsightsTools(user, results);

  const final = await client.beta.messages.toolRunner({
    model: env.anthropicModel,
    max_tokens: 1024,
    system: INSIGHTS_SYSTEM_PROMPT,
    tools,
    messages: [{ role: "user", content: "Summarize my reading habits." }],
    max_iterations: 3,
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
