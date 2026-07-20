import { Router } from "express";
import { query } from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { aiQuerySchema } from "../schemas/ai.schema";

export const aiRouter = Router();

// The AI query agent is available to any logged-in user; results are scoped
// to that user (admins see the whole library) inside the tools.
aiRouter.use(requireAuth);

aiRouter.post("/query", validateBody(aiQuerySchema), query);
