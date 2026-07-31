import { Router } from "express";
import {
  deleteConversation,
  getConversation,
  listConversations,
} from "../controllers/conversation.controller";
import { requireAuth } from "../middleware/auth";

export const conversationRouter = Router();

// Ask AI chat history is always personal — there's no admin view of other
// users' conversations, same as recommendations/insights.
conversationRouter.use(requireAuth);

conversationRouter.get("/", listConversations);
conversationRouter.get("/:id", getConversation);
conversationRouter.delete("/:id", deleteConversation);
