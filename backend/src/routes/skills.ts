// src/routes/skills.ts
import { Router } from 'express';
import { getSkills, createSkill, deleteSkill, learnSkill } from '../controllers/skillController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getSkills);
router.post('/', authenticateToken as any, createSkill as any);
router.post('/:id/learn', authenticateToken as any, learnSkill as any);
router.delete('/:id', authenticateToken as any, deleteSkill as any);

export default router;

