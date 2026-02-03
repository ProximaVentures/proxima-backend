import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import prisma from '../utils/prisma.js';
import * as emailUtils from '../utils/email.js';

// Mock side-effects to decouple tests from infrastructure.
jest.mock('../utils/email.js', () => ({
    sendOTPEmail: jest.fn<any>().mockResolvedValue(true),
}));

describe('🔒 Authentication Integration Tests', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testworker',
        role: 'PROFESSIONAL',
    };

    beforeAll(async () => {
        // Clean up any existing test user
        await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    afterAll(async () => {
        // Final cleanup
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        await prisma.$disconnect();
    });

    it('✅ Should register a new user and create an OTP', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('Registration successful');

        // Check if OTP exists in DB
        const user = await prisma.user.findUnique({
            where: { email: testUser.email },
            include: { otps: true }
        });
        expect(user).toBeDefined();
        expect(user?.otps.length).toBe(1);
    });

    it('✅ Should verify the OTP and mark user as verified', async () => {
        // 1. Get the OTP from the DB
        const userWithOTP = await prisma.user.findUnique({
            where: { email: testUser.email },
            include: { otps: true }
        });
        const otpCode = userWithOTP?.otps?.[0]?.code;
        if (!otpCode) throw new Error('OTP not generated in test');

        // 2. Verify it
        const res = await request(app)
            .post('/api/auth/verify-otp')
            .send({ email: testUser.email, code: otpCode });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // 3. Check DB status
        const verifiedUser = await prisma.user.findUnique({ where: { email: testUser.email } });
        expect(verifiedUser?.isVerified).toBe(true);
    });

    it('✅ Should login successfully and return a JWT', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('❌ Should reject login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
