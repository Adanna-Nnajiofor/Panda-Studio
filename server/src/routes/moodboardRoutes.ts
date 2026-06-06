import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getMyMoodBoards,
  getMoodBoardById,
  createMoodBoard,
  updateMoodBoard,
  deleteMoodBoard,
  addItemToMoodBoard,
} from '../controllers/moodboardController';

const router = express.Router();

router.get('/mine', protect(), getMyMoodBoards);
router.get('/:id', protect(), getMoodBoardById);
router.post('/', protect(), createMoodBoard);
router.put('/:id', protect(), updateMoodBoard);
router.delete('/:id', protect(), deleteMoodBoard);
router.post('/:id/items', protect(), addItemToMoodBoard);

export default router;
