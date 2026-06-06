import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { breakdownScript, getSmartScheduleSuggestions, generateContract } from '../controllers/aiController';

const router = express.Router();

router.post('/script-breakdown', protect(), breakdownScript);
router.post('/smart-schedule', protect('admin', 'super_admin', 'staff'), getSmartScheduleSuggestions);
router.post('/generate-contract', protect('admin', 'super_admin', 'staff', 'crew'), generateContract);

export default router;
