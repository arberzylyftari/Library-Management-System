import { api } from "@/lib/api";
import type { AdminUser, Book, Role } from "@/lib/types";

interface RawAdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  _count: { books: number };
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const res = await api<{ users: RawAdminUser[] }>("/admin/users");
  return res.users.map(({ _count, ...user }) => ({ ...user, bookCount: _count.books }));
}

// The update response has no book count (unchanged by this call) — the
// caller merges it back in from the row it already has.
export async function updateAdminUser(
  id: string,
  input: UpdateUserInput,
): Promise<Omit<AdminUser, "bookCount">> {
  const res = await api<{ user: Omit<RawAdminUser, "_count"> }>(`/admin/users/${id}`, {
    method: "PATCH",
    body: input,
  });
  return res.user;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api<void>(`/admin/users/${id}`, { method: "DELETE" });
}

export async function listAdminBooks(): Promise<Book[]> {
  const res = await api<{ books: Book[] }>("/admin/books");
  return res.books;
}
