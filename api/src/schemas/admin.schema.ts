import { z } from "zod";
import { Role } from "@prisma/client";

// Admin editing another user. All fields optional, but at least one required.
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().toLowerCase().email("Invalid email"),
    role: z.nativeEnum(Role),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
