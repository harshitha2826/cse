"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const email_1 = __importDefault(require("../utils/email"));
// Load env variables
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
const JWT_EXPIRES_IN = '1d'; // access token expiry
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'superrefreshsecret';
const REFRESH_EXPIRES_IN = '7d';
/**
 * Generate JWT access token
 */
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
/**
 * Generate refresh token (stored in DB in a real app)
 */
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};
/** Register new user */
const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        if (!cleanEmail || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        // Check if user exists
        const existing = await User_1.default.findOne({ email: cleanEmail });
        if (existing) {
            return res.status(400).json({ message: 'An account with this email already exists. Please sign in instead.' });
        }
        // Create verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const user = new User_1.default({
            name: name ? name.trim() : 'User',
            email: cleanEmail,
            password,
            verificationToken,
            isVerified: true, // Default to verified for seamless testing
            credits: 100,
        });
        await user.save();
        // Send verification email (placeholder/async)
        const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${verificationToken}`;
        console.log(`🔗 Verification link for ${cleanEmail}: ${verificationLink}`);
        (0, email_1.default)({
            to: cleanEmail,
            subject: 'Verify your SkillBridge account',
            text: `Click the link to verify: ${verificationLink}`,
        }).catch((err) => console.error('Background email sending failed:', err));
        const payload = { id: user._id, email: user.email };
        const accessToken = generateToken(payload);
        const refreshToken = generateRefreshToken(payload);
        return res.status(201).json({
            message: 'Registration successful! Welcome to SkillBridge.',
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, credits: user.credits },
        });
    }
    catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: err.message || 'Server error during registration' });
    }
};
exports.register = register;
/** Login existing user */
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        if (!cleanEmail || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const user = await User_1.default.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(400).json({ message: 'No account found with this email. Please register first.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password. Please try again.' });
        }
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }
        if (user.credits === undefined || user.credits === null) {
            user.credits = 100;
            await user.save();
        }
        const payload = { id: user._id, email: user.email };
        const accessToken = generateToken(payload);
        const refreshToken = generateRefreshToken(payload);
        return res.json({ accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, credits: user.credits } });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: err.message || 'Server error during login' });
    }
};
exports.login = login;
/** Email verification */
const verifyEmail = async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User_1.default.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        return res.json({ message: 'Email verified successfully. You can now log in.' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.verifyEmail = verifyEmail;
/** Forgot password - send reset link */
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' }); // avoid enumeration
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        user.verificationToken = resetToken; // reuse field for simplicity
        await user.save();
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        await (0, email_1.default)({
            to: email,
            subject: 'SkillBridge password reset',
            text: `Click to reset your password: ${resetLink}`,
        });
        return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.forgotPassword = forgotPassword;
/** Reset password */
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    try {
        const user = await User_1.default.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        user.password = newPassword;
        user.verificationToken = undefined;
        await user.save();
        return res.json({ message: 'Password reset successful' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.resetPassword = resetPassword;
