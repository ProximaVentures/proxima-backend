import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import { Role } from '@prisma/client';
/**
 * Protect Middleware
 * Verifies the JWT and attaches the current user to the request.
 */
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authorize Middleware
 * Restricts access to specific roles.
 */
export declare const authorize: (...roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Ensure Onboarding Complete Middleware
 * Blocks access if the professional hasn't completed their profile.
 */
export declare const ensureOnboardingComplete: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map