"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherCredits = void 0;
const User_1 = __importDefault(require("../models/User"));
/** Get teacher's credit balance */
const getTeacherCredits = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const teacher = await User_1.default.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        return res.json({ credits: teacher.credits ?? 0 });
    }
    catch (err) {
        console.error('getTeacherCredits error:', err);
        return res.status(500).json({ message: 'Failed to fetch teacher credits' });
    }
};
exports.getTeacherCredits = getTeacherCredits;
