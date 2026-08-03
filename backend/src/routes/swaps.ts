// src/routes/swaps.ts
import { Router } from 'express';
import { createSwapRequest, getUserSwaps, updateSwapStatus } from '../controllers/swapController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);
router.get('/', getUserSwaps as any);
router.post('/', createSwapRequest as any);
router.patch('/:id/status', updateSwapStatus as any);

export default router;
