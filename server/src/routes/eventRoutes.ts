import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getPublishedEvents,
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
} from '../controllers/eventController';

const router = express.Router();

// Public
router.get('/', getPublishedEvents);
router.get('/:id', getEventById);

// Admin only
router.get('/admin/all', protect('admin', 'super_admin'), getAllEvents);
router.post('/', protect('admin', 'super_admin'), createEvent);
router.put('/:id', protect('admin', 'super_admin'), updateEvent);
router.delete('/:id', protect('admin', 'super_admin'), deleteEvent);

// Auth users
router.post('/:id/register', protect(), registerForEvent);
router.delete('/:id/register', protect(), cancelEventRegistration);

export default router;
