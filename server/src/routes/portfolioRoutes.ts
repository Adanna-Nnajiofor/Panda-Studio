import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getAllPortfolios,
  getPortfolioByUserId,
  getMyPortfolio,
  updateMyPortfolio,
  addPortfolioItem,
  removePortfolioItem,
  incrementPortfolioItemView,
  getCrewDirectory,
} from '../controllers/portfolioController';

const router = express.Router();

// Public
router.get('/', getAllPortfolios);
router.get('/user/:userId', getPortfolioByUserId);

// Crew directory (enriched)
router.get('/crew/directory', protect(), getCrewDirectory);

// Authenticated crew actions
router.get('/mine', protect('crew'), getMyPortfolio);
router.put('/mine', protect('crew'), updateMyPortfolio);
router.post('/mine/items', protect('crew'), addPortfolioItem);
router.delete('/mine/items/:itemId', protect('crew'), removePortfolioItem);
router.post('/items/:itemId/view', incrementPortfolioItemView);

export default router;
