// src/routes/teacher.ts
import { Router } from 'express';
import { getTeacherCredits } from '../controllers/teacherController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken as any);

router.get('/:teacherId/credits', getTeacherCredits as any);

export default router;
