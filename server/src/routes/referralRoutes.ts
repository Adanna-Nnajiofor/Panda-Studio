import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getMyReferrals,
  getMyReferralCode,
  applyReferralCode,
  getAllReferrals,
} from '../controllers/referralController';

const router = express.Router();

router.get('/mine', protect(), getMyReferrals);
router.get('/my-code', protect(), getMyReferralCode);
router.post('/apply', protect(), applyReferralCode);
router.get('/all', protect('admin', 'super_admin'), getAllReferrals);

export default router;
