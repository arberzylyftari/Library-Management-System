import { api } from "@/lib/api";
import type { Book, ReadingStatus } from "@/lib/types";

export interface BookFilters {
  status?: ReadingStatus;
  genre?: string;
  search?: string;
}

export interface BookInput {
  title: string;
  author: string;
  genre: string;
  status?: ReadingStatus;
  price?: number | null;
}

function toQueryString(filters: BookFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listBooks(filters: BookFilters = {}): Promise<Book[]> {
  const res = await api<{ books: Book[] }>(`/books${toQueryString(filters)}`);
  return res.books;
}

export async function createBook(input: BookInput): Promise<Book> {
  const res = await api<{ book: Book }>("/books", { method: "POST", body: input });
  return res.book;
}

export async function updateBook(id: string, input: Partial<BookInput>): Promise<Book> {
  const res = await api<{ book: Book }>(`/books/${id}`, { method: "PATCH", body: input });
  return res.book;
}

export async function deleteBook(id: string): Promise<void> {
  await api<void>(`/books/${id}`, { method: "DELETE" });
}
