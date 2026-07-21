import type { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { signToken } from "../src/utils/jwt";
import { hashPassword } from "../src/utils/password";

let counter = 0;

export async function createUser(opts: { role?: Role; email?: string } = {}) {
  counter += 1;
  const user = await prisma.user.create({
    data: {
      name: `Test User ${counter}`,
      email: opts.email ?? `test-user-${counter}@example.com`,
      password: await hashPassword("password123"),
      role: opts.role ?? "USER",
    },
  });
  const token = signToken({ userId: user.id, role: user.role });
  return { user, token };
}

export function authHeader(token: string): [string, string] {
  return ["Authorization", `Bearer ${token}`];
}
