import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getMyMoodBoards,
  getPublicMoodBoards,
  getMoodBoardById,
  createMoodBoard,
  updateMoodBoard,
  deleteMoodBoard,
  addItemToMoodBoard,
} from "../controllers/moodboardController";

const router = express.Router();

// Public browse (public boards only)
router.get("/public", getPublicMoodBoards as any);
router.get("/", getPublicMoodBoards as any);

// Auth-only operations
router.get("/mine", protect(), getMyMoodBoards);
router.get("/:id", getMoodBoardById as any);
router.post("/", protect(), createMoodBoard);
router.put("/:id", protect(), updateMoodBoard);
router.delete("/:id", protect(), deleteMoodBoard);
router.post("/:id/items", protect(), addItemToMoodBoard);

export default router;
