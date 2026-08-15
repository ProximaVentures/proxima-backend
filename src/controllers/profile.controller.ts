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

    const { username, phone, firstName, lastName, jobTitle, city, country, bio, avatarUrl, metadata, preferences, category, pushNotificationsEnabled } = req.body;

    if (username !== undefined || phone !== undefined) {
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                username: username !== undefined ? username : undefined,
                phone: phone !== undefined ? phone : undefined
            }
        });
    }

    if (firstName !== undefined || lastName !== undefined || jobTitle !== undefined || city !== undefined || country !== undefined || bio !== undefined || avatarUrl !== undefined || metadata !== undefined || preferences !== undefined || category !== undefined || pushNotificationsEnabled !== undefined) {
        const existingProfile = await prisma.profile.findUnique({
            where: { userId: req.user.id }
        });

        const mergedMetadata = (metadata !== undefined && existingProfile?.metadata && typeof existingProfile.metadata === 'object') 
            ? { ... (existingProfile.metadata as object), ...metadata } 
            : metadata;

        const mergedPreferences = (preferences !== undefined && existingProfile?.preferences && typeof existingProfile.preferences === 'object')
            ? { ... (existingProfile.preferences as object), ...preferences }
            : preferences;

        await prisma.profile.upsert({
            where: { userId: req.user.id },
            update: {
                firstName: firstName !== undefined ? firstName : undefined,
                lastName: lastName !== undefined ? lastName : undefined,
                jobTitle: jobTitle !== undefined ? jobTitle : undefined,
                city: city !== undefined ? city : undefined,
                country: country !== undefined ? country : undefined,
                bio: bio !== undefined ? bio : undefined,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
                category: category !== undefined ? category : undefined,
                metadata: metadata !== undefined ? mergedMetadata : undefined,
                preferences: preferences !== undefined ? mergedPreferences : undefined,
                pushNotificationsEnabled: pushNotificationsEnabled !== undefined ? pushNotificationsEnabled : undefined,
                onboardingComplete: true // Auto-complete if they are through this flow
            },
            create: {
                userId: req.user.id,
                firstName: firstName || '',
                lastName: lastName || '',
                jobTitle: jobTitle || '',
                city: city || '',
                country: country || '',
                bio: bio || '',
                avatarUrl: avatarUrl || '',
                category: category || null,
                metadata: metadata || {},
                preferences: preferences || {},
                pushNotificationsEnabled: pushNotificationsEnabled !== undefined ? pushNotificationsEnabled : true,
                onboardingComplete: true
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
