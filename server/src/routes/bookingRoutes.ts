import { Router } from 'express';
import type { AuthenticatedRequest } from '../types/auth';
import {
  cancelBooking,
  createBooking,
  getAllBookings,
  getBookingById,
  getUserBookings,
  updateBookingStatus,
} from '../controllers/bookingController';
import { authorizeRoles, protect } from '../middleware/authMiddleware';
import { validateOrigin } from '../middleware/csrfMiddleware';

const router = Router();

router.use(protect());

router.post('/', validateOrigin, createBooking);

router.get('/', (req, res) => {
  const { user } = req as AuthenticatedRequest;
  if (user && ['admin', 'super_admin'].includes(user.role)) {
    return getAllBookings(req as AuthenticatedRequest, res);
  }
  return getUserBookings(req as AuthenticatedRequest, res);
});

router.get('/mine', getUserBookings);
router.get('/:id', getBookingById);
router.patch('/:id/status', validateOrigin, authorizeRoles('crew', 'staff', 'admin', 'super_admin'), updateBookingStatus);
router.patch('/:id/cancel', validateOrigin, cancelBooking);

export default router;
