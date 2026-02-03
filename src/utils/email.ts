import nodemailer from 'nodemailer';
import 'dotenv/config';

// Maintain a single transporter instance for resource efficiency.

// Explicit SMTP Configuration for Production Reliability
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  pool: true,
  auth: {
    user: process.env.GMAIL_USER || process.env.EMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
  },
});

// Diagnostic check and Connection Verification on Startup
const verifyConnection = async () => {
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  console.log(`[📧 EMAIL SETUP]: Attempting SMTP Verification...`);
  console.log(`[📧 EMAIL SETUP]: User: ${user ? 'Configured' : 'MISSING'}, Pass: ${pass ? 'Configured' : 'MISSING'}`);

  if (!user || !pass) {
    console.error('[🚨 EMAIL SETUP FAILED]: Missing SMTP credentials.');
    return;
  }

  try {
    await transporter.verify();
    console.log('[✅ SMTP CONNECTED]: Ready to send emails.');
  } catch (error: any) {
    console.error('[🚨 SMTP VERIFICATION FAILED]:', {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode
    });
  }
};

verifyConnection();

/**
 * Generic Email Sender
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  const authUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const mailOptions = {
    // Gmail often rejects if the 'from' doesn't match the authenticated user
    from: `"ProProven Support" <${authUser || process.env.EMAIL_FROM || 'support@proproven.dev'}>`,
    to,
    subject,
    html,
  };

  console.log(`[📩 ATTEMPTING EMAIL]: To: ${to}, Subject: ${subject}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[✅ EMAIL SENT]: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[🚨 EMAIL FAILED]: recipient: ${to}`, {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
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
          Powered by Proxima Ventures
        </p>
      </div>
    `;
  return await sendEmail(to, subject, html);
};
