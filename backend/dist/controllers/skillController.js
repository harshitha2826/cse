"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSkill = exports.learnSkill = exports.createSkill = exports.getSkills = void 0;
const Skill_1 = __importDefault(require("../models/Skill"));
const User_1 = __importDefault(require("../models/User"));
// Seed sample skills if collection is empty
const seedSampleSkillsIfEmpty = async () => {
    const count = await Skill_1.default.countDocuments();
    if (count === 0) {
        const dummyUser = await User_1.default.findOne();
        const dummyId = dummyUser?._id || '6a6b72bd9d844061aa44c9ef';
        await Skill_1.default.insertMany([
            {
                title: 'Full-Stack React & Node.js Mentorship',
                description: 'Offering 1-on-1 pair programming and code reviews for modern web development stack (React, Node, Express, MongoDB).',
                category: 'Technology',
                type: 'offered',
                proficiency: 'Expert',
                user: dummyId,
                userName: dummyUser?.name || 'Alex Chen',
                tags: ['React', 'TypeScript', 'Node.js', 'WebDev'],
            },
            {
                title: 'UI/UX Mobile App Design with Figma',
                description: 'I can create interactive prototypes, design systems, and wireframes for mobile or web apps using Figma.',
                category: 'Design',
                type: 'offered',
                proficiency: 'Expert',
                user: dummyId,
                userName: 'Sarah Jenkins',
                tags: ['Figma', 'UI/UX', 'Design', 'Mobile'],
            },
            {
                title: 'Conversational Spanish Practice',
                description: 'Native Spanish speaker willing to help with intermediate/advanced conversational fluency in exchange for coding or guitar lessons.',
                category: 'Languages',
                type: 'offered',
                proficiency: 'Expert',
                user: dummyId,
                userName: 'Carlos Rodriguez',
                tags: ['Spanish', 'Language', 'Culture'],
            },
            {
                title: 'Acoustic Guitar & Music Theory Lessons',
                description: 'Seeking someone to teach me Python / Data Science in exchange for acoustic guitar lessons & music theory basics.',
                category: 'Music',
                type: 'wanted',
                proficiency: 'Intermediate',
                user: dummyId,
                userName: 'Elena Rostova',
                tags: ['Guitar', 'Music', 'Acoustic'],
            },
            {
                title: 'Digital Marketing & SEO Strategy',
                description: 'Learn how to optimize your landing pages, conduct keyword research, and launch social media ad campaigns.',
                category: 'Business',
                type: 'offered',
                proficiency: 'Intermediate',
                user: dummyId,
                userName: 'Marcus Vance',
                tags: ['SEO', 'Marketing', 'Growth'],
            },
        ]);
    }
};
/** Get all skill listings with search and category filters */
const getSkills = async (req, res) => {
    try {
        await seedSampleSkillsIfEmpty();
        const { category, type, mode, search } = req.query;
        const query = {};
        if (category && category !== 'All') {
            query.category = category;
        }
        if (type && type !== 'All') {
            query.type = type;
        }
        if (mode && mode !== 'All') {
            query.mode = { $in: [mode, 'Both'] };
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } },
                { 'location.address': { $regex: search, $options: 'i' } },
            ];
        }
        const skills = await Skill_1.default.find(query).sort({ createdAt: -1 });
        return res.json(skills);
    }
    catch (err) {
        console.error('getSkills error:', err);
        return res.status(500).json({ message: 'Failed to retrieve skills.' });
    }
};
exports.getSkills = getSkills;
/** Create a new skill listing */
const createSkill = async (req, res) => {
    try {
        const { title, description, category, type, proficiency, tags, mode, location } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await User_1.default.findById(userId);
        // Determine cost based on proficiency
        const proficiencyCostMap = {
            Beginner: 5,
            Intermediate: 10,
            Expert: 20,
        };
        const cost = proficiencyCostMap[proficiency] || 10;
        const newSkill = new Skill_1.default({
            title,
            description,
            category,
            type,
            proficiency,
            mode: mode || 'Both',
            location: location || {},
            user: userId,
            userName: user?.name || 'Anonymous User',
            userEmail: user?.email,
            tags: typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags,
            cost,
        });
        await newSkill.save();
        // Reward the creator with credits for teaching
        if (user) {
            user.credits = (user.credits || 0) + 10; // earn 10 credits per skill posting
            await user.save();
        }
        return res.status(201).json({ ...newSkill.toObject(), credits: user?.credits });
    }
    catch (err) {
        console.error('createSkill error:', err);
        return res.status(500).json({ message: 'Failed to create skill listing.' });
    }
};
exports.createSkill = createSkill;
/** Learn a skill (spend credits) */
const learnSkill = async (req, res) => {
    try {
        const skillId = req.params.id;
        const learnerId = req.user?.id;
        if (!learnerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const skill = await Skill_1.default.findById(skillId);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }
        const learner = await User_1.default.findById(learnerId);
        if (!learner) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (learner.credits === undefined || learner.credits === null) {
            learner.credits = 100;
        }
        const cost = skill.cost ?? 0;
        if (learner.credits < cost) {
            return res.status(400).json({
                message: `Insufficient credits! You need ${cost} credits, but currently have ${learner.credits}. Teach skills to earn +10 credits!`,
            });
        }
        // Deduct credits from learner
        learner.credits -= cost;
        await learner.save();
        // Optionally reward the skill owner
        const teacher = await User_1.default.findById(skill.user);
        if (teacher) {
            teacher.credits = (teacher.credits || 0) + cost; // teacher gains same amount
            await teacher.save();
        }
        return res.json({ message: 'Skill learned successfully', remainingCredits: learner.credits });
    }
    catch (err) {
        console.error('learnSkill error:', err);
        return res.status(500).json({ message: 'Failed to learn skill' });
    }
};
exports.learnSkill = learnSkill;
/** Delete owned skill listing */
const deleteSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const skill = await Skill_1.default.findById(id);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found.' });
        }
        if (skill.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this skill.' });
        }
        await Skill_1.default.findByIdAndDelete(id);
        return res.json({ message: 'Skill deleted successfully.' });
    }
    catch (err) {
        console.error('deleteSkill error:', err);
        return res.status(500).json({ message: 'Failed to delete skill.' });
    }
};
exports.deleteSkill = deleteSkill;
