import { Resend } from 'resend';
import 'dotenv/config';

// Lazy-initialize Resend client so it doesn't throw at import time (e.g. tests)
let _resend: Resend | null = null;
const getResend = () => {
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || '');
    return _resend;
};

/**
 * Generic Email Sender via Resend API
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  const fromValue = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!process.env.RESEND_API_KEY) {
    console.error('[🚨 RESEND FAILED]: RESEND_API_KEY is missing in .env');
    return false;
  }

  console.log(`[📩 SENDING EMAIL]: to: ${to}, subject: ${subject}, from: ${fromValue}`);

  try {
    const { data, error } = await getResend().emails.send({
      from: `Proven <${fromValue}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[🚨 RESEND API ERROR]: recipient: ${to}, from: ${fromValue}`, error);
      return false;
    }

    console.log(`[✅ EMAIL SENT successfully]: recipient: ${to}, id: ${data?.id}`);
    return true;
  } catch (error: any) {
    console.error(`[🚨 RESEND UNEXPECTED ERROR]: recipient: ${to}`, error);
    return false;
  }
};

/**
 * Sends a stylized OTP email to the user.
 */
export const sendOTPEmail = async (to: string, otp: string) => {
  const subject = `🔐 Your Proven Verification Code: ${otp}`;
  const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5; text-align: center;">Welcome to Proven</h2>
        <p>Hello,</p>
        <p>Your one-time password (OTP) for registration is:</p>
        <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">
          Powered by Proven
        </p>
      </div>
    `;
  return await sendEmail(to, subject, html);
};
