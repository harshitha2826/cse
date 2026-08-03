// src/routes/messages.ts
import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/messageController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);
router.get('/:partnerId', getMessages as any);
router.post('/', sendMessage as any);

export default router;
