// src/controllers/swapController.ts
import { Response } from 'express';
import SwapRequest from '../models/SwapRequest';
import Skill from '../models/Skill';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

/** Create swap request */
export const createSwapRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { targetSkillId, myOfferedSkillId, message } = req.body;
    const requesterId = req.user?.id;

    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const targetSkill = await Skill.findById(targetSkillId);
    if (!targetSkill) {
      return res.status(404).json({ message: 'Target skill listing not found.' });
    }

    const requester = await User.findById(requesterId);
    const provider = await User.findById(targetSkill.user);

    let offeredSkill = null;
    if (myOfferedSkillId) {
      offeredSkill = await Skill.findById(myOfferedSkillId);
    }

    const swapRequest = new SwapRequest({
      requester: requesterId,
      provider: targetSkill.user,
      requesterName: requester?.name || 'Skill Exchanger',
      providerName: provider?.name || targetSkill.userName || 'Community Member',
      offeredSkill: myOfferedSkillId || targetSkillId,
      requestedSkill: targetSkillId,
      offeredSkillTitle: offeredSkill?.title || 'General Skill Swap',
      requestedSkillTitle: targetSkill.title,
      message: message || `Hi! I would love to swap skills with you regarding "${targetSkill.title}".`,
      status: 'pending',
    });

    await swapRequest.save();
    return res.status(201).json(swapRequest);
  } catch (err: any) {
    console.error('createSwapRequest error:', err);
    return res.status(500).json({ message: 'Failed to submit swap proposal.' });
  }
};

/** Get user's incoming and outgoing swap requests */
export const getUserSwaps = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const swaps = await SwapRequest.find({
      $or: [{ requester: userId }, { provider: userId }],
    }).sort({ createdAt: -1 });

    return res.json(swaps);
  } catch (err: any) {
    console.error('getUserSwaps error:', err);
    return res.status(500).json({ message: 'Failed to fetch swap requests.' });
  }
};

/** Update swap request status (accepted, rejected, completed) */
export const updateSwapStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const swap = await SwapRequest.findById(id);
    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found.' });
    }

    // Verify user is requester or provider
    if (swap.requester.toString() !== userId && swap.provider.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to modify this swap request.' });
    }

    swap.status = status;
    await swap.save();
    return res.json(swap);
  } catch (err: any) {
    console.error('updateSwapStatus error:', err);
    return res.status(500).json({ message: 'Failed to update swap status.' });
  }
};
