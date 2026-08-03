// src/utils/email.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// In production you'd secure credentials via env vars.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

export default async function sendEmail(options: EmailOptions) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'SkillBridge <no-reply@skillbridge.com>',
    ...options,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Email sent to', options.to);
  } catch (err) {
    console.error('❌ Email sending error:', err);
    // In a real app, you might queue or retry.
  }
}
