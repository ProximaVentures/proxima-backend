import type { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';
import type { ProjectInput, InvestmentPitchInput } from '../validators/project.validator.js';
import { BudgetTier, TimelineTier } from '@prisma/client';

/**
 * Maps frontend budget strings to Prisma enums
 */
const mapBudget = (budget: string): BudgetTier => {
    switch (budget) {
        case '<5k': return BudgetTier.UNDER_5K;
        case '5k-10k': return BudgetTier.FROM_5K_TO_10K;
        case '10k-25k': return BudgetTier.FROM_10K_TO_25K;
        case '25k-50k': return BudgetTier.FROM_25K_TO_50K;
        case '50k+': return BudgetTier.ABOVE_50K;
        default: return BudgetTier.UNDER_5K;
    }
};

/**
 * Maps frontend timeline strings to Prisma enums
 */
const mapTimeline = (timeline: string): TimelineTier => {
    switch (timeline) {
        case '<1_month': return TimelineTier.UNDER_1_MONTH;
        case '1-3_months': return TimelineTier.FROM_1_TO_3_MONTHS;
        case '3-6_months': return TimelineTier.FROM_3_TO_6_MONTHS;
        case '6_months+': return TimelineTier.ABOVE_6_MONTHS;
        default: return TimelineTier.UNDER_1_MONTH;
    }
};

/**
 * Create Standard Project
 */
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const data = req.body as ProjectInput;

    const project = await prisma.project.create({
        data: {
            ...data,
            budgetRange: mapBudget(data.budgetRange),
            timeline: mapTimeline(data.timeline),
            clientId: userId,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Project submitted successfully!',
        data: project,
    });
});

/**
 * Create Investment Pitch
 */
export const createInvestmentPitch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const data = req.body as InvestmentPitchInput;

    const pitch = await prisma.investmentPitch.create({
        data: {
            ...data,
            clientId: userId,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Investment pitch submitted successfully!',
        data: pitch,
    });
});

/**
 * Get My Submissions (Projects & Pitches)
 */
export const getMySubmissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const [projects, pitches] = await Promise.all([
        prisma.project.findMany({ where: { clientId: userId }, orderBy: { createdAt: 'desc' } }),
        prisma.investmentPitch.findMany({ where: { clientId: userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            projects,
            pitches,
        },
    });
});
