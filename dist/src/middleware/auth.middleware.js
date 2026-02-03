import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware.js';
import prisma from '../utils/prisma.js';
import { Role } from '@prisma/client';
/**
 * Protect Middleware
 * Verifies the JWT and attaches the current user to the request.
 */
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new AppError('Not authorized to access this route', 401));
    }
    try {
        // 1. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
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
            email: user.email,
            onboardingComplete: user.profile?.onboardingComplete || false,
            vettingStatus: user.profile?.vettingStatus
        };
        next();
    }
    catch (error) {
        return next(new AppError('Not authorized to access this route', 401));
    }
};
/**
 * Authorize Middleware
 * Restricts access to specific roles.
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError(`User role ${req.user?.role} is not authorized to access this route`, 403));
        }
        next();
    };
};
/**
 * Ensure Onboarding Complete Middleware
 * Blocks access if the professional hasn't completed their profile.
 */
export const ensureOnboardingComplete = (req, res, next) => {
    if (req.user?.role === Role.PROFESSIONAL && !req.user.onboardingComplete) {
        return next(new AppError('Please complete your profile configuration to proceed.', 403));
    }
    next();
};
//# sourceMappingURL=auth.middleware.js.map