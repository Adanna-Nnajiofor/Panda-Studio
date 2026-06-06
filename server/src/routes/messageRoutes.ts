import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  markConversationRead,
  sendMessage,
  listConversation,
} from "../controllers/messageController";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

// All message routes require auth
router.use(protect());

// Send a message between two users (optionally scoped to a project)
router.post("/", validateOrigin, sendMessage as any);

// List conversation between two users (optionally scoped to a project)
router.get("/", listConversation as any);

// Mark all messages from otherUser as read for the current user (optionally scoped to project)
router.patch("/read", validateOrigin, markConversationRead as any);

// Admin helper (optional): admin can fetch any conversation
router.get(
  "/admin/conversation",
  authorizeRoles("admin", "super_admin"),
  listConversation as any,
);

export default router;
