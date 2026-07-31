import type { MessageRole } from "@prisma/client";
import type { ChatTurn } from "./agent";

// How many prior messages (not exchanges — each question/answer is two) get
// replayed to Claude as context. Caps token growth on long-running threads;
// the full history still lives in the database and renders in the UI either way.
const MAX_HISTORY_MESSAGES = 10;

export function buildHistory(messages: { role: MessageRole; content: string }[]): ChatTurn[] {
  return messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));
}
