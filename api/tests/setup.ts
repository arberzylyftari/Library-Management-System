import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";

// Children before parents — Message -> Conversation -> User, Book -> User.
beforeEach(async () => {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
