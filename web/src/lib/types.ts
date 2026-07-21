export type Role = "USER" | "ADMIN";

export type ReadingStatus = "WANT_TO_READ" | "READING" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

// Admin user listing (GET /admin/users) — includes each user's book count.
export interface AdminUser extends User {
  bookCount: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: ReadingStatus;
  price: string | null;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
  // Present on admin listings.
  user?: Pick<User, "id" | "name" | "email">;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// AI query agent response (POST /ai/query).
export interface AiToolResult {
  tool: string;
  data: unknown;
}

export interface AiQueryResponse {
  answer: string;
  results: AiToolResult[];
}
