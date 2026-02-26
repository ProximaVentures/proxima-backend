import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { sendEmail } from '../utils/email.js';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

/**
 * Handle Contact Form Submission
 */
export const handleContactForm = asyncHandler(async (req: Request, res: Response) => {
  const result = contactSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message || 'Validation failed', 400);
  }

  const { name, email, subject, message } = result.data;
  const adminEmail = 'fonyuyjudegita@gmail.com';

  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
      <div style="margin-bottom: 32px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">New Contact Inquiry</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px; font-weight: 500;">ProVen Platform | Governance & Delivery</p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 8px;">From</p>
        <p style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 0;">${name}</p>
        <p style="color: #f97316; font-size: 14px; font-weight: 600; margin: 4px 0 0 0;">${email}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 8px;">Subject</p>
        <p style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 0;">${subject}</p>
      </div>

      <div style="margin-bottom: 32px; background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9;">
        <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 12px;">Message briefing</p>
        <p style="color: #334155; font-size: 15px; font-weight: 500; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
      </div>

      <div style="border-top: 2px solid #f1f5f9; padding-top: 24px; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0; font-weight: 500;">
          This inquiry was sent from the ProVen Contact Page at ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  `;



  const success = await sendEmail(adminEmail, `[ProVen Inquiry]: ${subject}`, html);

  if (!success) {
    throw new AppError('Failed to send inquiry. Please try again later or contact us directly.', 500);
  }

  res.status(200).json({
    success: true,
    message: "Thank you! We've received your message and will be in touch shortly.",
  });
});
