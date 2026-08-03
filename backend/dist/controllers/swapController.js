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
        const { targetSkillId, myOfferedSkillId, message } = req.body;
        const requesterId = req.user?.id;
        if (!requesterId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const targetSkill = await Skill_1.default.findById(targetSkillId);
        if (!targetSkill) {
            return res.status(404).json({ message: 'Target skill listing not found.' });
        }
        const requester = await User_1.default.findById(requesterId);
        const provider = await User_1.default.findById(targetSkill.user);
        let offeredSkill = null;
        if (myOfferedSkillId) {
            offeredSkill = await Skill_1.default.findById(myOfferedSkillId);
        }
        const swapRequest = new SwapRequest_1.default({
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
