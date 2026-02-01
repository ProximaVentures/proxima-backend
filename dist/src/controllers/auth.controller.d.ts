import type { Request, Response } from 'express';
/**
 * 🔐 Register Controller (Stage 1)
 * Creates a basic user account and their initial empty profile.
 */
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * 🔒 Profile Completion Controller (Stage 2)
 * Handles the "Forced Onboarding" profile submission.
 */
export declare const completeProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=auth.controller.d.ts.map