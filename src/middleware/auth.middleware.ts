import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';
import { Role } from '@prisma/client';

interface JwtPayload {
    userId: string;
    role: Role;
    iat: number;
    exp: number;
}

/**
 * Protect Middleware
 * Verifies the JWT and attaches the current user to the request.
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    const secret = process.env.JWT_SECRET;

    if (!token) {
        return next(new AppError('Not authorized to access this route', 401));
    }

    try {
        // 1. Verify Token
        if (!secret) {
            console.error('[🚨 SECURITY CRITICAL]: JWT_SECRET is not defined in environment variables');
            if (process.env.NODE_ENV === 'production') {
                return next(new AppError('Internal Server Error', 500));
            }
        }

        const decoded = jwt.verify(token, secret || 'secret') as JwtPayload;

        // 2. Check if User Exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { profile: true },
        });

        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // 3. Attach User to Request
        req.user = {
            id: user.id,
            role: user.role,
            roles: user.roles, // New array field
            email: user.email,
            onboardingComplete: user.profile?.onboardingComplete || false,
            vettingStatus: user.profile?.vettingStatus as string | undefined
        };

        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return next(new AppError('Token is invalid or expired', 401));
        }

        console.error('[🚨 AUTH MIDDLEWARE ERROR]:', error);
        return next(new AppError('Internal authentication error', 500));
    }
};

/**
 * Authorize Middleware
 * Restricts access to specific roles.
 */
export const authorize = (...roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Not authorized', 401));
        }

        if (!roles.includes(req.user.role)) {
            console.warn(`[🚨 UNAUTHORIZED ACCESS ATTEMPT]: User ${req.user.id} (${req.user.role}) tried to access route restricted to roles: ${roles.join(', ')}`);
            return next(new AppError(`User role ${req.user.role} is not authorized to access this route`, 403));
        }
        next();
    };
};

/**
 * Ensure Onboarding Complete Middleware
 * Blocks access if the professional hasn't completed their profile.
 */
export const ensureOnboardingComplete = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === Role.PROFESSIONAL && !req.user.onboardingComplete) {
        return next(new AppError('Please complete your profile configuration to proceed.', 403));
    }
    next();
};
