import express from 'express';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect(), async (req, res) => {
  const { getMyQuotes } = await import('../controllers/quoteController');
  return getMyQuotes(req, res);
});
router.get('/:id', protect(), async (req, res) => {
  const { getQuoteById } = await import('../controllers/quoteController');
  return getQuoteById(req, res);
});
router.post('/', protect('admin', 'super_admin', 'staff'), async (req, res) => {
  const { createQuote } = await import('../controllers/quoteController');
  return createQuote(req, res);
});
router.put('/:id', protect('admin', 'super_admin', 'staff'), async (req, res) => {
  const { updateQuote } = await import('../controllers/quoteController');
  return updateQuote(req, res);
});
router.patch('/:id/status', protect(), async (req, res) => {
  const { updateQuoteStatus } = await import('../controllers/quoteController');
  return updateQuoteStatus(req, res);
});
router.delete('/:id', protect('admin', 'super_admin'), async (req, res) => {
  const { deleteQuote } = await import('../controllers/quoteController');
  return deleteQuote(req, res);
});

export default router;
