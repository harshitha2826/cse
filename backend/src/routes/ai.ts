// src/routes/ai.ts
import { Router } from 'express';
import { askDoubt } from '../controllers/aiController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/doubt', authenticateToken as any, askDoubt as any);

export default router;
