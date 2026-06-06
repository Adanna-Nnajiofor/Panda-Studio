import { Router } from 'express';
import { createHireRequest, getMyHireRequests, respondToHireRequest } from '../controllers/hireController';
import { protect } from '../middleware/authMiddleware';
import { validateOrigin } from '../middleware/csrfMiddleware';

const router = Router();

router.use(protect());

router.post('/', validateOrigin, createHireRequest);
router.get('/mine', getMyHireRequests);
router.patch('/:id/respond', validateOrigin, respondToHireRequest);

export default router;
