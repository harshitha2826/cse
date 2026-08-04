"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLearnerProgress = exports.updateSwapStatus = exports.getUserSwaps = exports.createSwapRequest = void 0;
const SwapRequest_1 = __importDefault(require("../models/SwapRequest"));
const Skill_1 = __importDefault(require("../models/Skill"));
const User_1 = __importDefault(require("../models/User"));
/** Create swap request */
const createSwapRequest = async (req, res) => {
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
                targetSkill = await Skill_1.default.findById(skillIdToUse);
            }
            catch (e) {
                // Ignore invalid ObjectId format
            }
        }
        // Fallback: lookup by title if not found by ObjectId
        if (!targetSkill && (requestedSkillTitle || offeredSkillTitle)) {
            const searchTitle = requestedSkillTitle || offeredSkillTitle;
            targetSkill = await Skill_1.default.findOne({ title: { $regex: new RegExp(searchTitle, 'i') } });
        }
        const requester = await User_1.default.findById(requesterId);
        const onlyLearn = !!req.body.onlyLearn;
        const providerId = onlyLearn ? null : (targetSkill?.user || targetUserId || req.body.providerId);
        const provider = providerId ? await User_1.default.findById(providerId) : null;
        let offeredSkill = null;
        if (myOfferedSkillId) {
            try {
                offeredSkill = await Skill_1.default.findById(myOfferedSkillId);
            }
            catch (e) { }
        }
        const swapRequest = new SwapRequest_1.default({
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
    }
    catch (err) {
        console.error('createSwapRequest error:', err);
        return res.status(500).json({ message: 'Failed to submit swap proposal.' });
    }
};
exports.createSwapRequest = createSwapRequest;
/** Get user's incoming and outgoing swap requests */
const getUserSwaps = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const swaps = await SwapRequest_1.default.find({
            $or: [{ requester: userId }, { provider: userId }],
        }).sort({ createdAt: -1 });
        return res.json(swaps);
    }
    catch (err) {
        console.error('getUserSwaps error:', err);
        return res.status(500).json({ message: 'Failed to fetch swap requests.' });
    }
};
exports.getUserSwaps = getUserSwaps;
/** Update swap request status (accepted, rejected, completed) */
const updateSwapStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user?.id;
        if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const swap = await SwapRequest_1.default.findById(id);
        if (!swap) {
            return res.status(404).json({ message: 'Swap request not found.' });
        }
        // Verify user is requester or provider (provider may be null for learner‑only)
        if (swap.requester.toString() !== userId && (swap.provider ? swap.provider.toString() !== userId : false)) {
            return res.status(403).json({ message: 'Unauthorized to modify this swap request.' });
        }
        const previousStatus = swap.status;
        swap.status = status;
        // ── TEACHER CREDIT REWARD SYSTEM ────────────────────────────────────
        // When swap is accepted (learner enrolled into course):
        if (status === 'accepted' && previousStatus !== 'accepted' && !swap.isLearnerOnly) {
            const teacherId = swap.provider; // The teacher providing the skill course
            const teacher = await User_1.default.findById(teacherId);
            if (teacher) {
                let skillCost = 10;
                if (swap.requestedSkill) {
                    try {
                        const skill = await Skill_1.default.findById(swap.requestedSkill);
                        if (skill?.cost)
                            skillCost = skill.cost;
                    }
                    catch (e) { }
                }
                teacher.credits = (teacher.credits ?? 100) + skillCost;
                await teacher.save();
                console.log(`🎉 Teacher ${teacher.name} earned +${skillCost} credits for student enrollment! New balance: ${teacher.credits}`);
            }
        }
        // When course is marked completed:
        if (status === 'completed' && previousStatus !== 'completed' && !swap.isLearnerOnly) {
            const teacherId = swap.provider;
            const teacher = await User_1.default.findById(teacherId);
            if (teacher) {
                const bonus = 15;
                teacher.credits = (teacher.credits ?? 100) + bonus;
                await teacher.save();
                console.log(`🏆 Teacher ${teacher.name} earned +${bonus} completion bonus credits! New balance: ${teacher.credits}`);
            }
        }
        await swap.save();
        return res.json({
            message: status === 'accepted'
                ? 'Swap accepted! Teacher earned credits for student enrollment.'
                : status === 'completed'
                    ? 'Swap completed! Teacher earned +15 completion bonus credits.'
                    : `Status updated to ${status}`,
            swap,
        });
    }
    catch (err) {
        console.error('updateSwapStatus error:', err);
        return res.status(500).json({ message: 'Failed to update swap status.' });
    }
};
exports.updateSwapStatus = updateSwapStatus;
/** Teacher update learner progress & milestones */
const updateLearnerProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, progressStatus, teacherNotes, milestones } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const swap = await SwapRequest_1.default.findById(id);
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
            if (swap.progress >= 90)
                swap.progressStatus = 'Mastered';
            else if (swap.progress >= 50)
                swap.progressStatus = 'Practicing';
            else
                swap.progressStatus = 'In Progress';
        }
        if (progressStatus && ['In Progress', 'Practicing', 'Mastered'].includes(progressStatus)) {
            swap.progressStatus = progressStatus;
        }
        if (teacherNotes !== undefined) {
            swap.teacherNotes = teacherNotes;
        }
        if (Array.isArray(milestones)) {
            swap.milestones = milestones.map((m) => ({
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
    }
    catch (err) {
        console.error('updateLearnerProgress error:', err);
        return res.status(500).json({ message: 'Failed to update learner progress.' });
    }
};
exports.updateLearnerProgress = updateLearnerProgress;
