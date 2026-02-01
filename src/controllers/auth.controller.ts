import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import prisma from '../utils/prisma.js';
import type { RegisterInput } from '../validators/auth.validator.js';

/**
 * 🔐 Register Controller (Stage 1)
 * Creates a basic user account and their initial empty profile.
 */
export const register = asyncHandler(async (req: Request<{}, {}, RegisterInput>, res: Response) => {
    const { email, password, username, role, phone } = req.body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    // 🏫 Professor's Tip: In a real app, you MUST hash the password here using bcrypt!
    // For this boilerplate, we'll focus on the data flow.

    // 2. Create User and empty Profile in a Transaction
    const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                password, // TODO: Use bcrupt.hash()
                username,
                role,
                phone: phone || null,
            },
        });

        // Create the associated profile immediately
        await tx.profile.create({
            data: {
                userId: user.id,
            },
        });

        return user;
    });

    res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        data: {
            userId: newUser.id,
            role: newUser.role,
        },
    });
});

/**
 * 🔒 Profile Completion Controller (Stage 2)
 * Handles the "Forced Onboarding" profile submission.
 */
export const completeProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId, category, metadata, firstName, lastName, bio } = req.body;

    // Update the profile and mark onboarding as complete
    const updatedProfile = await prisma.profile.update({
        where: { userId },
        data: {
            firstName,
            lastName,
            bio,
            category,
            metadata,
            onboardingComplete: true,
            vettingStatus: 'PENDING',
        },
    });

    res.status(200).json({
        success: true,
        message: 'Profile submitted for vetting successfully.',
        data: updatedProfile,
    });
});
