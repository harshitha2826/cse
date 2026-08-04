"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSwapStatus = exports.getUserSwaps = exports.createSwapRequest = void 0;
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
        const providerId = targetSkill?.user || targetUserId || req.body.providerId;
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
            provider: providerId || requesterId,
            requesterName: requester?.name || 'Skill Exchanger',
            providerName: provider?.name || targetSkill?.userName || req.body.providerName || 'Community Member',
            offeredSkill: myOfferedSkillId || skillIdToUse || requesterId,
            requestedSkill: skillIdToUse || requesterId,
            offeredSkillTitle: offeredSkill?.title || offeredSkillTitle || 'General Skill Swap',
            requestedSkillTitle: targetSkill?.title || requestedSkillTitle || 'Skill Swap Proposal',
            message: message || `Hi! I would love to swap skills with you.`,
            status: 'pending',
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
        // Verify user is requester or provider
        if (swap.requester.toString() !== userId && swap.provider.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized to modify this swap request.' });
        }
        swap.status = status;
        await swap.save();
        return res.json(swap);
    }
    catch (err) {
        console.error('updateSwapStatus error:', err);
        return res.status(500).json({ message: 'Failed to update swap status.' });
    }
};
exports.updateSwapStatus = updateSwapStatus;
