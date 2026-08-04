import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

/** Get teacher's credit balance */
export const getTeacherCredits = async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId } = req.params;
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    return res.json({ credits: teacher.credits ?? 0 });
  } catch (err: any) {
    console.error('getTeacherCredits error:', err);
    return res.status(500).json({ message: 'Failed to fetch teacher credits' });
  }
};
