import type { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';

/**
 * Get Current User Profile
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

/**
 * Update Current User Profile
 */
export const updateMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
        throw new AppError('User not authenticated', 401);
    }

    const { username, phone, firstName, lastName, bio, avatarUrl, metadata, category } = req.body;

    if (username !== undefined || phone !== undefined) {
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                username: username !== undefined ? username : undefined,
                phone: phone !== undefined ? phone : undefined
            }
        });
    }

    if (firstName !== undefined || lastName !== undefined || bio !== undefined || avatarUrl !== undefined || metadata !== undefined || category !== undefined) {
        const existingProfile = await prisma.profile.findUnique({
            where: { userId: req.user.id }
        });

        const mergedMetadata = (metadata !== undefined && existingProfile?.metadata && typeof existingProfile.metadata === 'object') 
            ? { ... (existingProfile.metadata as object), ...metadata } 
            : metadata;

        await prisma.profile.upsert({
            where: { userId: req.user.id },
            update: {
                firstName: firstName !== undefined ? firstName : undefined,
                lastName: lastName !== undefined ? lastName : undefined,
                bio: bio !== undefined ? bio : undefined,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
                category: category !== undefined ? category : undefined,
                metadata: metadata !== undefined ? mergedMetadata : undefined
            },
            create: {
                userId: req.user.id,
                firstName: firstName || '',
                lastName: lastName || '',
                bio: bio || '',
                avatarUrl: avatarUrl || '',
                category: category || null,
                metadata: metadata || {}
            }
        });
    }

    const updatedUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true },
    });

    res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
    });
});
