// src/controllers/swapController.ts
import { Response } from 'express';
import SwapRequest from '../models/SwapRequest';
import Skill from '../models/Skill';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

/** Create swap request */
export const createSwapRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { targetSkillId, skillId, myOfferedSkillId, message, offeredSkillTitle, requestedSkillTitle, targetUserId } = req.body;
    const requesterId = req.user?.id;

    if (!requesterId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const skillIdToUse = targetSkillId || skillId || req.body.id;

    let targetSkill = null;
    if (skillIdToUse) {
      try {
        targetSkill = await Skill.findById(skillIdToUse);
      } catch (e) {
        // Ignore invalid ObjectId format
      }
    }

    // Fallback: lookup by title if not found by ObjectId
    if (!targetSkill && (requestedSkillTitle || offeredSkillTitle)) {
      const searchTitle = requestedSkillTitle || offeredSkillTitle;
      targetSkill = await Skill.findOne({ title: { $regex: new RegExp(searchTitle, 'i') } });
    }

    const requester = await User.findById(requesterId);
    const onlyLearn = !!req.body.onlyLearn;
    const providerId = targetSkill?.user || targetUserId || req.body.providerId;
    const provider = providerId ? await User.findById(providerId) : null;

    let offeredSkill = null;
    if (myOfferedSkillId) {
      try {
        offeredSkill = await Skill.findById(myOfferedSkillId);
      } catch (e) {}
    }

    const swapRequest = new SwapRequest({
      requester: requesterId,
      provider: providerId,
      requesterName: requester?.name || 'Skill Exchanger',
      providerName: provider?.name || targetSkill?.userName || req.body.providerName || 'Community Member',
      offeredSkill: myOfferedSkillId || skillIdToUse || requesterId,
      requestedSkill: skillIdToUse || requesterId,
      offeredSkillTitle: offeredSkill?.title || offeredSkillTitle || 'General Skill Swap',
      requestedSkillTitle: targetSkill?.title || requestedSkillTitle || 'Skill Swap Proposal',
      message: message || `Hi! I would love to swap skills with you.`,
      status: 'pending',
      isLearnerOnly: onlyLearn,
    });

    await swapRequest.save();
    return res.status(201).json({
      message: 'Proposal sent successfully!',
      swapRequest,
    });
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

    // Verify user is requester or provider (provider may be null for learner‑only)
    if (swap.requester.toString() !== userId && (swap.provider ? swap.provider.toString() !== userId : false)) {
      return res.status(403).json({ message: 'Unauthorized to modify this swap request.' });
    }

    const previousStatus = swap.status;
    swap.status = status;

    // ── CREDIT EXCHANGE SYSTEM ────────────────────────────────────
    // When swap is accepted (enrollment):
    if (status === 'accepted' && previousStatus !== 'accepted') {
      const teacherId = swap.provider;
      const learnerId = swap.requester;
      
      if (teacherId && learnerId) {
        const teacher = await User.findById(teacherId);
        const learner = await User.findById(learnerId);

        if (teacher && learner) {
          let reqSkillCost = 10;
          if (swap.requestedSkill) {
            try {
              const skill = await Skill.findById(swap.requestedSkill);
              if (skill?.cost) reqSkillCost = skill.cost;
            } catch (e) {}
          }

          // Learner pays teacher for the requested skill
          learner.credits = Math.max(0, (learner.credits ?? 100) - reqSkillCost);
          teacher.credits = (teacher.credits ?? 100) + reqSkillCost;

          // If it's a 2-way swap, teacher pays learner for the offered skill
          if (!swap.isLearnerOnly && swap.offeredSkill) {
            let offSkillCost = 10;
            try {
              const skill = await Skill.findById(swap.offeredSkill);
              if (skill?.cost) offSkillCost = skill.cost;
            } catch (e) {}
            
            teacher.credits = Math.max(0, teacher.credits - offSkillCost);
            learner.credits = learner.credits + offSkillCost;
          }

          await teacher.save();
          await learner.save();
          console.log(`🎉 Credits exchanged! Teacher: ${teacher.credits}, Learner: ${learner.credits}`);
        }
      }
    }

    // When course is marked completed:
    if (status === 'completed' && previousStatus !== 'completed') {
      const teacherId = swap.provider;
      const teacher = teacherId ? await User.findById(teacherId) : null;
      const learnerId = swap.requester;
      const learner = await User.findById(learnerId);

      if (teacher) {
        const bonus = 15;
        teacher.credits = (teacher.credits ?? 100) + bonus;
        await teacher.save();
      }
      if (!swap.isLearnerOnly && learner) {
        const bonus = 15;
        learner.credits = (learner.credits ?? 100) + bonus;
        await learner.save();
      }
    }

    await swap.save();
    
    // Fetch the updated credits to return to the frontend
    const updatedTeacher = swap.provider ? await User.findById(swap.provider) : null;
    const updatedLearner = await User.findById(swap.requester);

    return res.json({
      message: status === 'accepted'
        ? 'Swap accepted! Credits have been exchanged.'
        : status === 'completed'
        ? 'Swap completed! Completion bonus awarded.'
        : `Status updated to ${status}`,
      swap,
      teacherCredits: updatedTeacher ? updatedTeacher.credits : undefined,
      learnerCredits: updatedLearner ? updatedLearner.credits : undefined
    });
  } catch (err: any) {
    console.error('updateSwapStatus error:', err);
    return res.status(500).json({ message: 'Failed to update swap status.' });
  }
};

/** Teacher update learner progress & milestones */
export const updateLearnerProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { progress, progressStatus, teacherNotes, milestones } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const swap = await SwapRequest.findById(id);
    if (!swap) {
      return res.status(404).json({ message: 'Swap request not found.' });
    }

    // Verify user is requester or provider in this swap
    if (swap.requester.toString() !== userId && (swap.provider ? swap.provider.toString() !== userId : true)) {
      return res.status(403).json({ message: 'Unauthorized to modify learner progress.' });
    }
    // Disallow progress updates for learner-only swaps (no teacher)
    if (!swap.provider) {
      return res.status(400).json({ message: 'Cannot update progress for learner-only swap.' });
    }

    if (progress !== undefined) {
      swap.progress = Math.min(Math.max(Number(progress), 0), 100);
      if (swap.progress >= 90) swap.progressStatus = 'Mastered';
      else if (swap.progress >= 50) swap.progressStatus = 'Practicing';
      else swap.progressStatus = 'In Progress';
    }

    if (progressStatus && ['In Progress', 'Practicing', 'Mastered'].includes(progressStatus)) {
      swap.progressStatus = progressStatus;
    }

    if (teacherNotes !== undefined) {
      swap.teacherNotes = teacherNotes;
    }

    if (Array.isArray(milestones)) {
      swap.milestones = milestones.map((m: any) => ({
        title: String(m.title || '').trim(),
        completed: Boolean(m.completed),
        completedAt: m.completed ? m.completedAt || new Date() : undefined,
      }));
    }

    swap.lastUpdatedByTeacher = new Date();

    // Automatically mark swap as completed if progress is set to 100%
    if (swap.progress === 100 && swap.status !== 'completed') {
      swap.status = 'completed';
    }

    await swap.save();
    return res.json({
      message: 'Learner progress updated successfully!',
      swap,
    });
  } catch (err: any) {
    console.error('updateLearnerProgress error:', err);
    return res.status(500).json({ message: 'Failed to update learner progress.' });
  }
};
