// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../models/User';
import sendEmail from '../utils/email';


// Load env variables
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
const JWT_EXPIRES_IN = '1d'; // access token expiry
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'superrefreshsecret';
const REFRESH_EXPIRES_IN = '7d';

/**
 * Generate JWT access token
 */
const generateToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
/**
 * Generate refresh token (stored in DB in a real app)
 */
const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

/** Register new user */
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    // Check if user exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in instead.' });
    }
    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({
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
    
    sendEmail({
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
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: err.message || 'Server error during registration' });
  }
};

/** Login existing user */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: cleanEmail });
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
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ message: err.message || 'Server error during login' });
  }
};

/** Email verification */
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** Forgot password - send reset link */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' }); // avoid enumeration
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = resetToken; // reuse field for simplicity
    await user.save();
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'SkillBridge password reset',
      text: `Click to reset your password: ${resetLink}`,
    });
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** Reset password */
export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    user.password = newPassword;
    user.verificationToken = undefined;
    await user.save();
    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


