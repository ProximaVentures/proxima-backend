import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import prisma from '../utils/prisma.js';
import { sendOTPEmail } from '../utils/email.js';
import { generateOTP, hashOTP, compareOTP } from '../utils/otp.js';
import type { RegisterInput, LoginInput, socialLoginSchema } from '../validators/auth.validator.js';
import { z } from 'zod';
type SocialLoginInput = z.infer<typeof socialLoginSchema>;
import redis from '../utils/redis.js';

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
        // Store in Redis: Key = "otp:email", Value = the code, EX = 600 seconds (10 mins)
        await redis.set(`otp:${email}`, otpCode, 'EX', 600);

        return { user, otpCode };
    });

    // 4. Send the OTP Email (Asynchronous / Non-blocking)
    sendOTPEmail(email, result.otpCode).catch(err => {
        console.error(`[🚨 BACKGROUND EMAIL FAILED]: ${email}`, err);
    });

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

    // 1. Fetch code from Redis
    const storedOTP = await redis.get(`otp:${email}`);

    if (!storedOTP || storedOTP !== code) {
        throw new AppError('Invalid or expired OTP', 400);
    }

    // 2. Mark user as verified in Database
    await prisma.user.update({
        where: { email },
        data: { isVerified: true }
    });

    // 3. Cleanup: delete from Redis immediately
    await redis.del(`otp:${email}`);

    // 4. Send success response (Fixes the "loading forever" issue)
    res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now log in.'
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

    // 1. Check if user exists and isn't verified
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('User is already verified', 400);

    // 2. Generate new OTP and store in Redis
    const otpCode = generateOTP();
    await redis.set(`otp:${email}`, otpCode, 'EX', 600);

    // 3. Send the OTP Email (Asynchronous / Non-blocking)
    sendOTPEmail(email, otpCode).catch(err => {
        console.error(`[🚨 BACKGROUND EMAIL FAILED]: ${email}`, err);
    });

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

/**
 * Diagnostic Test Email Controller
 */
export const testEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    console.log(`[🧪 TEST EMAIL]: Request for ${email}`);
    const success = await sendOTPEmail(email, '123456');

    if (success) {
        res.status(200).json({ success: true, message: 'Test email sent successfully!' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to send test email. Check server logs.' });
    }
});

/**
 * Social Login Controller
 */
export const socialLogin = asyncHandler(async (req: Request<{}, {}, SocialLoginInput>, res: Response) => {
    const { email, name, provider, providerId, image } = req.body;

    let user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
    });

    if (!user) {
        // Create new user for social signup
        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    username: name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000),
                    isVerified: true, // Social users are pre-verified
                    provider,
                    providerId,
                    role: 'CLIENT', // Default role for searchers
                },
            });

            await tx.profile.create({
                data: {
                    userId: newUser.id,
                    firstName: name.split(' ')[0] || null,
                    lastName: name.split(' ').slice(1).join(' ') || null,
                    avatarUrl: image || null,
                },
            });

            return tx.user.findUnique({
                where: { id: newUser.id },
                include: { profile: true }
            });
        });

        if (!result) throw new AppError('Fatal: Failed to create user account', 500);
        user = result;
    } else {
        // Link social if not already linked (e.g., if they previously registered via email)
        if (user.provider === 'credentials') {
            user = await prisma.user.update({
                where: { email },
                data: {
                    provider,
                    providerId,
                    isVerified: true
                },
                include: { profile: true }
            });
        }
    }

    // Final safety check
    if (!user) throw new AppError('User not found', 404);

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
    );

    res.status(200).json({
        success: true,
        message: 'Social login successful',
        token,
        data: {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                onboardingComplete: user.profile?.onboardingComplete || false,
            },
        },
    });
});
