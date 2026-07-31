import { api } from "@/lib/api";
import type { ConversationDetail, ConversationSummary } from "@/lib/types";

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await api<{ conversations: ConversationSummary[] }>("/conversations");
  return res.conversations;
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const res = await api<{ conversation: ConversationDetail }>(`/conversations/${id}`);
  return res.conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  await api<void>(`/conversations/${id}`, { method: "DELETE" });
}
