import { Resend } from 'resend';
import 'dotenv/config';

// Lazy-initialize Resend client so it doesn't throw at import time (e.g. tests)
let _resend: Resend | null = null;
const getResend = () => {
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || '');
    return _resend;
};

/**
 * Email Sender Types
 */
export enum EmailSender {
  INFO = 'INFO',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT'
}

/**
 * Generic Email Sender via Resend API
 */
export const sendEmail = async (to: string, subject: string, html: string, sender: EmailSender = EmailSender.INFO) => {
  let fromValue = '';
  
  switch (sender) {
    case EmailSender.ADMIN:
      fromValue = process.env.EMAIL_FROM_ADMIN || process.env.EMAIL_FROM || 'admin@provenworld.com';
      break;
    case EmailSender.SUPPORT:
      fromValue = process.env.EMAIL_FROM_SUPPORT || process.env.EMAIL_FROM || 'support@provenworld.com';
      break;
    default:
      fromValue = process.env.EMAIL_FROM_INFO || process.env.EMAIL_FROM || 'info@provenworld.com';
  }
  
  if (!process.env.RESEND_API_KEY) {
    console.error('[🚨 RESEND FAILED]: RESEND_API_KEY is missing in .env');
    return false;
  }

  console.log(`[📩 SENDING EMAIL]: to: ${to}, subject: ${subject}, from: ${fromValue} (${sender})`);

  try {
    const { data, error } = await getResend().emails.send({
      from: fromValue,
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
export const sendOTPEmail = async (to: string, otp: string, sender: EmailSender = EmailSender.INFO) => {
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
  return await sendEmail(to, subject, html, sender);
};

/**
 * Sends a stylized Meeting Invitation email to the user.
 */
export const sendMeetingEmail = async (to: string, meetingTitle: string, startTime: Date, meetingLink: string, sender: EmailSender = EmailSender.SUPPORT) => {
  const dateStr = startTime.toLocaleString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const subject = `📅 New Meeting Scheduled: ${meetingTitle}`;
  const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f1f1f1; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #0F172A; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Meeting Invitation</h1>
          <p style="color: #64748B; font-size: 14px; margin-top: 0;">You've been invited to a session on Proven</p>
        </div>
        
        <div style="background: #FFF7ED; padding: 25px; border-radius: 12px; border: 1px solid #FFEDD5; margin-bottom: 25px;">
          <h2 style="color: #9A3412; font-size: 18px; font-weight: 700; margin-top: 0; border-bottom: 1px solid #FED7AA; padding-bottom: 12px; margin-bottom: 15px;">
            ${meetingTitle}
          </h2>
          <div style="color: #431407; font-size: 15px; font-weight: 600; margin-bottom: 8px;">
            📅 ${dateStr}
          </div>
          <div style="color: #7C2D12; font-size: 13px; font-weight: 500;">
            Duration: 30-45 minutes
          </div>
        </div>
 
        <div style="text-align: center;">
          <a href="${meetingLink}" style="display: inline-block; background-color: #FF6B00; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px; transition: background-color 0.2s;">
            Join Google Meet
          </a>
        </div>
 
        <p style="color: #475569; font-size: 13px; line-height: 1.6; margin-top: 25px; text-align: center;">
          Please join on time to ensure we cover all project objectives. If you need to reschedule, please contact the administrator in the chat.
        </p>
 
        <hr style="border: 0; border-top: 1px solid #f1f1f1; margin: 30px 0;" />
        <p style="font-size: 11px; color: #94A3B8; text-align: center; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          Powered by Proven Platform
        </p>
      </div>
    `;
  return await sendEmail(to, subject, html, sender);
};
