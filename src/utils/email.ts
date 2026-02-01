import nodemailer from 'nodemailer';
import 'dotenv/config';

// 🏫 Professor's Tip: Use a shared transporter to avoid 
// opening new connections for every single email.

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || process.env.EMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
  },
});

/**
 * Sends a stylized OTP email to the user.
 */
export const sendOTPEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"ProProven Support" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `🔐 Your ProProven Verification Code: ${otp}`,
    html: `
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
          Powered by Proxima Ventures
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[📧 EMAIL SENT]: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[🚨 EMAIL FAILED]:`, error);
    return false;
  }
};
