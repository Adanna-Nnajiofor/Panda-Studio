import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createConversation,
  getConversationById,
  listMyConversations,
  sendConversationMessage,
} from "../controllers/conversationController";

const router = Router();

router.get("/", protect(), listMyConversations as any);
router.post("/", protect(), createConversation as any);
router.get("/:id", protect(), getConversationById as any);
router.post("/:id/messages", protect(), sendConversationMessage as any);

export default router;
