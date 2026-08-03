// src/routes/auth.ts
import { Router } from 'express';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
