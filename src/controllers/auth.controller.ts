import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import prisma from '../utils/prisma.js';
import { sendOTPEmail } from '../utils/email.js';
import { generateOTP, hashOTP, compareOTP } from '../utils/otp.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

/**
 * Register Controller (Stage 1)
 * Creates a basic user account, generates an OTP, and sends a verification email.
 */
export const register = asyncHandler(async (req: Request<{}, {}, RegisterInput>, res: Response) => {
    const { email, password, username, role, phone } = req.body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User, Profile, and OTP in a Transaction
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                role,
                phone: phone || null,
            },
        });

        await tx.profile.create({
            data: { userId: user.id },
        });

        const otpCode = generateOTP();
        const hashedOTP = await hashOTP(otpCode);

        await tx.oTP.create({
            data: {
                code: hashedOTP,
                userId: user.id,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
        });

        return { user, otpCode };
    });

    // 4. Send the OTP Email (Plain Text)
    await sendOTPEmail(email, result.otpCode);

    res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email for the verification code.',
        data: { userId: result.user.id },
    });
});

/**
 * Verify OTP Controller
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({
        where: { email },
        include: { otps: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('User is already verified', 400);

    const latestOTP = user.otps[0];
    if (!latestOTP || latestOTP.expiresAt < new Date()) {
        throw new AppError('Invalid or expired OTP', 400);
    }

    const isValid = await compareOTP(code, latestOTP.code);
    if (!isValid) {
        throw new AppError('Invalid or expired OTP', 400);
    }

    // Mark user as verified
    await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
    });

    // Clean up OTPs
    await prisma.oTP.deleteMany({ where: { userId: user.id } });

    res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now log in.',
    });
});

/**
 * Login Controller
 */
export const login = asyncHandler(async (req: Request<{}, {}, LoginInput>, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
    });

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    if (!user.isVerified) {
        throw new AppError('Please verify your email before logging in', 403);
    }

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
    );

    res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        data: {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                onboardingComplete: user.profile?.onboardingComplete,
            },
        },
    });
});

/**
 * Resend OTP Controller
 */
export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('User is already verified', 400);

    const otpCode = generateOTP();
    const hashedOTP = await hashOTP(otpCode);

    await prisma.oTP.create({
        data: {
            code: hashedOTP,
            userId: user.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
    });

    await sendOTPEmail(email, otpCode);

    res.status(200).json({
        success: true,
        message: 'New OTP sent to your email.',
    });
});

/**
 * Profile Completion Controller (Stage 2)
 */
export const completeProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId, category, metadata, firstName, lastName, bio } = req.body;

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
