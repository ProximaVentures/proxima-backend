import nodemailer from 'nodemailer';
import 'dotenv/config';

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.resend.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Generic Email Sender via Nodemailer
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  const from = process.env.EMAIL_FROM || '"ProProven" <onboarding@resend.dev>';

  console.log(`[🚀 ATTEMPTING EMAIL VIA NODEMAILER]: To: ${to}, Subject: ${subject}`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[🚨 NODEMAILER FAILED]: EMAIL_USER or EMAIL_PASS is missing in .env');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`[✅ EMAIL SENT]: Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[🚨 NODEMAILER UNEXPECTED ERROR]: recipient: ${to}`, error);
    return false;
  }
};

/**
 * Sends a stylized OTP email to the user.
 */
export const sendOTPEmail = async (to: string, otp: string) => {
  const subject = `🔐 Your ProProven Verification Code: ${otp}`;
  const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5; text-align: center;">Welcome to ProProven</h2>
        <p>Hello,</p>
        <p>Your one-time password (OTP) for registration is:</p>
        <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">
          Powered by ProProven
        </p>
      </div>
    `;
  return await sendEmail(to, subject, html);
};
