// src/controllers/messageController.ts
import { Response } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

/** Fetch message conversation between authenticated user and partner */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    return res.json(messages);
  } catch (err: any) {
    console.error('getMessages error:', err);
    return res.status(500).json({ message: 'Failed to retrieve messages.' });
  }
};

/** Send a new chat message */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content, swapRequestId } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const sender = await User.findById(senderId);

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      senderName: sender?.name || 'User',
      swapRequestId,
      content,
      read: false,
    });

    await message.save();
    return res.status(201).json(message);
  } catch (err: any) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ message: 'Failed to send message.' });
  }
};
