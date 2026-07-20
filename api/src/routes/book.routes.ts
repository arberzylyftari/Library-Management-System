import { Router } from "express";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  updateBook,
} from "../controllers/book.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createBookSchema, updateBookSchema } from "../schemas/book.schema";

export const bookRouter = Router();

// Every book route requires a logged-in user.
bookRouter.use(requireAuth);

bookRouter.get("/", listBooks);
bookRouter.post("/", validateBody(createBookSchema), createBook);
bookRouter.get("/:id", getBook);
bookRouter.patch("/:id", validateBody(updateBookSchema), updateBook);
bookRouter.delete("/:id", deleteBook);
