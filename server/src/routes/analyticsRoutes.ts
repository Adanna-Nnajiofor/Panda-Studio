import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getRevenueAnalytics,
  getPlatformStats,
  getClientLTV,
  getCrewPerformance,
  getBookingTrends,
} from '../controllers/analyticsController';

const router = express.Router();

const adminOnly = protect('admin', 'super_admin');

router.get('/revenue', adminOnly, getRevenueAnalytics);
router.get('/stats', adminOnly, getPlatformStats);
router.get('/ltv', adminOnly, getClientLTV);
router.get('/crew-performance', adminOnly, getCrewPerformance);
router.get('/booking-trends', adminOnly, getBookingTrends);

export default router;
