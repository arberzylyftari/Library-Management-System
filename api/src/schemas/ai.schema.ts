import { z } from "zod";

export const aiQuerySchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
});

export type AiQueryInput = z.infer<typeof aiQuerySchema>;
