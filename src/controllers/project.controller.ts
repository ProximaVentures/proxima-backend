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
 * Remove undefined properties from an object to satisfy exactOptionalPropertyTypes
 */
const cleanData = <T extends Record<string, any>>(data: T): T => {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
        if (data[key] !== undefined) {
            cleaned[key] = data[key];
        }
    }
    return cleaned;
};

/**
 * Create Standard Project
 */
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const data = req.body as ProjectInput;

    const project = await prisma.project.create({
        data: cleanData({
            ...data,
            budgetRange: mapBudget(data.budgetRange),
            timeline: mapTimeline(data.timeline),
            clientId: userId,
        }) as any,
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
        data: cleanData({
            ...data,
            clientId: userId,
        }) as any,
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

/**
 * Update Standard Project
 */
export const updateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const projectId = req.params.id as string;

    if (!userId) throw new AppError('Unauthorized', 401);

    // Check ownership
    const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!existingProject) {
        throw new AppError('Project not found', 404);
    }

    if (existingProject.clientId !== userId) {
        throw new AppError('You are not authorized to update this project', 403);
    }

    const data = req.body as Partial<ProjectInput>;

    // Handle map budget and timeline if they are present
    // Remove undefined values to please Prisma types
    const updateData: any = {};

    Object.keys(data).forEach(key => {
        const value = data[key as keyof ProjectInput];
        if (value !== undefined) {
            updateData[key] = value;
        }
    });

    if (data.budgetRange) {
        updateData.budgetRange = mapBudget(data.budgetRange);
    }

    if (data.timeline) {
        updateData.timeline = mapTimeline(data.timeline);
    }

    const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: 'Project updated successfully!',
        data: project,
    });
});

/**
 * Update Investment Pitch
 */
export const updateInvestmentPitch = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const pitchId = req.params.id as string;

    if (!userId) throw new AppError('Unauthorized', 401);

    // Check ownership
    const existingPitch = await prisma.investmentPitch.findUnique({
        where: { id: pitchId },
    });

    if (!existingPitch) {
        throw new AppError('Pitch not found', 404);
    }

    if (existingPitch.clientId !== userId) {
        throw new AppError('You are not authorized to update this pitch', 403);
    }

    const data = req.body as Partial<InvestmentPitchInput>;

    // Remove undefined values
    const updateData: any = {};
    Object.keys(data).forEach(key => {
        const value = data[key as keyof InvestmentPitchInput];
        if (value !== undefined) {
            updateData[key] = value;
        }
    });

    const pitch = await prisma.investmentPitch.update({
        where: { id: pitchId },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        message: 'Investment pitch updated successfully!',
        data: pitch,
    });
});

/**
 * Get Accepted Projects (For Professionals Feed)
 */
export const getAcceptedProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Optional: Add pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const projects = await prisma.project.findMany({
        where: {
            status: 'ACCEPTED',
        },
        include: {
            client: {
                select: {
                    id: true,
                    username: true,
                    // Add other client fields if necessary
                }
            },
            assignments: {
                where: {
                    userId: req.user?.id || '',
                    status: 'INTERESTED',
                },
                select: {
                    userId: true,
                    status: true,
                    role: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        },
        skip,
        take: limit,
    });

    const total = await prisma.project.count({
        where: {
            status: 'ACCEPTED',
        },
    });

    res.status(200).json({
        success: true,
        count: projects.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        data: projects,
    });
});
/**
 * Get Specific Project by ID
 */
export const getProjectById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const projectId = req.params.id as string;

    if (!userId) throw new AppError('Unauthorized', 401);

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            client: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        }
                    }
                }
            },
            assignments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    avatarUrl: true,
                                    category: true,
                                }
                            }
                        }
                    }
                },
                orderBy: { assignedAt: 'desc' }
            },
            resources: {
                orderBy: { createdAt: 'desc' }
            },
            updates: {
                orderBy: { createdAt: 'desc' }
            },
            meetings: {
                orderBy: { startTime: 'asc' }
            },
            documents: {
                orderBy: { createdAt: 'desc' }
            },
            projectInfo: {
                orderBy: { createdAt: 'desc' }
            },
            tasks: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    // Authorization: Client owner, Admin, or Professional (if project is ACCEPTED or they are assigned)
    const isOwner = project.clientId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    const isProfessional = req.user?.role === 'PROFESSIONAL';
    const isAssigned = project.assignments.some(a => a.userId === userId);
    const isPublicAccepted = project.status === 'ACCEPTED';

    if (!isOwner && !isAdmin && (!isProfessional || (!isPublicAccepted && !isAssigned))) {
        throw new AppError('You are not authorized to view this project', 403);
    }

    res.status(200).json({
        success: true,
        data: {
            ...project,
            isAssigned, // Tell the frontend if the current user is assigned
        },
    });
});

/**
 * Express Interest in a Project (Professionals)
 */
export const expressInterest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const projectId = req.params.id as string;
    const { role, note } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (req.user?.role !== 'PROFESSIONAL') {
        throw new AppError('Only professionals can express interest in projects', 403);
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    if (project.status !== 'ACCEPTED') {
        throw new AppError('This project is not open for interest expressing', 400);
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.projectAssignment.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId,
            }
        }
    });

    if (existingAssignment) {
        // If already ACTIVE (assigned by admin), don't allow re-interest
        if (existingAssignment.status === 'ACTIVE') {
            return res.status(200).json({
                success: true,
                message: 'You are already assigned to this project.',
                data: existingAssignment,
            });
        }
        // If already INTERESTED, return idempotently
        return res.status(200).json({
            success: true,
            message: 'Interest already recorded.',
            data: existingAssignment,
        });
    }

    const assignment = await prisma.projectAssignment.create({
        data: {
            projectId,
            userId,
            role,
            note: note || null,
            status: 'INTERESTED',
        }
    });

    res.status(201).json({
        success: true,
        message: 'Interest recorded successfully!',
        data: assignment,
    });
});

/**
 * Get My Missions (For Professionals)
 * Fetches all projects where the professional has an assignment
 */
export const getMyMissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const assignments = await prisma.projectAssignment.findMany({
        where: { userId },
        include: {
            project: {
                include: {
                    client: {
                        select: {
                            id: true,
                            username: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    avatarUrl: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { assignedAt: 'desc' }
    });

    res.status(200).json({
        success: true,
        count: assignments.length,
        data: assignments.map(a => ({
            ...a.project,
            assignmentStatus: a.status,
            assignmentRole: a.role,
            assignedAt: a.assignedAt
        }))
    });
});
/**
 * Check if a project title is already taken
 */
export const checkTitleAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
    const title = req.query.title as string;

    if (!title) {
        throw new AppError('Title query parameter is required', 400);
    }

    const project = await prisma.project.findFirst({
        where: {
            title: {
                equals: title,
                mode: 'insensitive', // Case-insensitive check
            },
        },
    });

    res.status(200).json({
        success: true,
        available: !project,
    });
});
