import 'dotenv/config';
/**
 * Generic Email Sender
 */
export declare const sendEmail: (to: string, subject: string, html: string) => Promise<boolean>;
/**
 * Sends a stylized OTP email to the user.
 */
export declare const sendOTPEmail: (to: string, otp: string) => Promise<boolean>;
//# sourceMappingURL=email.d.ts.map