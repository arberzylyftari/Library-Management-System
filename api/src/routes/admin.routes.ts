import { Router } from "express";
import {
  deleteUser,
  listAllBooks,
  listUsers,
  updateUser,
} from "../controllers/admin.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { updateUserSchema } from "../schemas/admin.schema";

export const adminRouter = Router();

// Every admin route requires a logged-in admin.
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", listUsers);
adminRouter.patch("/users/:id", validateBody(updateUserSchema), updateUser);
adminRouter.delete("/users/:id", deleteUser);

adminRouter.get("/books", listAllBooks);
