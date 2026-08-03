"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sendEmail;
// src/utils/email.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
// In production you'd secure credentials via env vars.
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465
    auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
    },
});
async function sendEmail(options) {
    const mailOptions = {
        from: process.env.SMTP_FROM || 'SkillBridge <no-reply@skillbridge.com>',
        ...options,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Email sent to', options.to);
    }
    catch (err) {
        console.error('❌ Email sending error:', err);
        // In a real app, you might queue or retry.
    }
}
