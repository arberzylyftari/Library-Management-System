import { z } from "zod";

export const aiQuerySchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
  // Omitted -> a new conversation is created. Provided -> the question is
  // appended to that existing thread, with its prior messages replayed as
  // context so follow-up questions work.
  conversationId: z.string().uuid().optional(),
});

export type AiQueryInput = z.infer<typeof aiQuerySchema>;
