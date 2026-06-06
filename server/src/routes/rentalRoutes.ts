import { Router } from 'express';
import { createRental, getAllRentals, getMyRentals, updateRentalStatus } from '../controllers/rentalController';
import { protect } from '../middleware/authMiddleware';
import { validateOrigin } from '../middleware/csrfMiddleware';

const router = Router();

router.use(protect());

router.post('/', validateOrigin, createRental);
router.get('/mine', getMyRentals);
router.get('/', getAllRentals);
router.patch('/:id/status', validateOrigin, updateRentalStatus);

export default router;
