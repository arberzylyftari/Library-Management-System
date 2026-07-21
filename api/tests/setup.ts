import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";

// Books before users — Book.userId has an FK to User.
beforeEach(async () => {
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
