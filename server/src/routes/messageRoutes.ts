import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import {
  markConversationRead,
  sendMessage,
  listConversation,
  uploadMessageAttachments,
} from "../controllers/messageController";
import { validateOrigin } from "../middleware/csrfMiddleware";
import { addClient, removeClient } from "../utils/sseHub";
import type { AuthRequest } from "../types/auth";
import type { Response } from "express";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

// SSE stream — client connects here to receive real-time messages
router.get("/stream", protect(), (req, res: Response) => {
  const userId = (req as AuthRequest).user?.id;
  if (!userId) {
    res.status(401).end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send a heartbeat every 25s to keep connection alive
  const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 25000);

  addClient(userId, res);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(res);
  });
});

// All other message routes require auth
router.use(protect());

router.post("/", validateOrigin, sendMessage as any);
router.post(
  "/attachments",
  validateOrigin,
  upload.array("files", 10),
  uploadMessageAttachments as any,
);
router.get("/", listConversation as any);
router.patch("/read", validateOrigin, markConversationRead as any);
router.get(
  "/admin/conversation",
  authorizeRoles("admin", "super_admin"),
  listConversation as any,
);

export default router;
