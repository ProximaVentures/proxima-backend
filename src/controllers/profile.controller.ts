import type { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';

/**
 * 👤 Get Current User Profile
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
        throw new AppError('User not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true },
    });

    res.status(200).json({
        success: true,
        data: user,
    });
});
