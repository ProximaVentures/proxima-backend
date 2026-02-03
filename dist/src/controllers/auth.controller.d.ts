import type { Request, Response } from 'express';
/**
 * Register Controller (Stage 1)
 * Creates a basic user account, generates an OTP, and sends a verification email.
 */
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Verify OTP Controller
 */
export declare const verifyOTP: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Login Controller
 */
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Resend OTP Controller
 */
export declare const resendOTP: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Profile Completion Controller (Stage 2)
 */
export declare const completeProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=auth.controller.d.ts.map