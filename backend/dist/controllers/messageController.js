"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getMessages = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
/** Fetch message conversation between authenticated user and partner */
const getMessages = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const messages = await Message_1.default.find({
            $or: [
                { sender: userId, receiver: partnerId },
                { sender: partnerId, receiver: userId },
            ],
        }).sort({ createdAt: 1 });
        return res.json(messages);
    }
    catch (err) {
        console.error('getMessages error:', err);
        return res.status(500).json({ message: 'Failed to retrieve messages.' });
    }
};
exports.getMessages = getMessages;
/** Send a new chat message */
const sendMessage = async (req, res) => {
    try {
        const { receiverId, content, swapRequestId } = req.body;
        const senderId = req.user?.id;
        if (!senderId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const sender = await User_1.default.findById(senderId);
        const message = new Message_1.default({
            sender: senderId,
            receiver: receiverId,
            senderName: sender?.name || 'User',
            swapRequestId,
            content,
            read: false,
        });
        await message.save();
        return res.status(201).json(message);
    }
    catch (err) {
        console.error('sendMessage error:', err);
        return res.status(500).json({ message: 'Failed to send message.' });
    }
};
exports.sendMessage = sendMessage;
