import { z } from "zod";
import { ReadingStatus } from "@prisma/client";

const statusEnum = z.nativeEnum(ReadingStatus);

export const createBookSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  genre: z.string().trim().min(1, "Genre is required"),
  status: statusEnum.optional(),
});

// Partial update — at least one field must be present.
export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    author: z.string().trim().min(1, "Author is required"),
    genre: z.string().trim().min(1, "Genre is required"),
    status: statusEnum,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listBooksQuerySchema = z.object({
  status: statusEnum.optional(),
  genre: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;
