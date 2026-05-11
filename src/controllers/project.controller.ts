import type { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';
import { sendEmail, EmailSender } from '../utils/email.js';

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
const cleanData = <T extends Record<string, any>>(data: T): any => {
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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    // Check project limit (max 3)
    const [projectCount, pitchCount] = await Promise.all([
        prisma.project.count({ where: { clientId: userId } }),
        prisma.investmentPitch.count({ where: { clientId: userId } }),
    ]);

    if (projectCount + pitchCount >= 3) {
        throw new AppError('You have reached the maximum limit of 3 projects. Please contact support or delete an existing pending project to submit a new one.', 400);
    }

    const data = req.body as any;

    const project = await prisma.project.create({
        data: {
            title: data.title,
            description: data.description,
            targetAudience: data.targetAudience,
            timeline: mapTimeline(data.timeline),
            specificNotes: data.specificNotes || null,
            // DB-required fields not in the form — set sensible defaults
            industry: [],
            requirements: data.specificNotes || 'See project documentation',
            budgetRange: BudgetTier.UNDER_5K,
            category: 'General',
            categoryData: {},
            clientId: userId,
            // Create document record if a brief was uploaded
            ...(data.briefUrl ? {
                documents: {
                    create: [{
                        title: data.briefName || 'Project Brief',
                        url: data.briefUrl,
                        type: 'DOC',
                    }]
                }
            } : {})
        }
    });

    // Notify Admin of new project submission
    const adminEmail = process.env.ADMIN_RECEIVE_EMAIL || 'info@provenworld.com';
    await sendEmail(
        adminEmail,
        `🚀 New Project Submission: ${data.title}`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-bottom: 24px;">New Project Submission</h2>
            <p style="font-size: 16px; color: #334155;">A new project has been submitted on the ProVen Platform.</p>
            
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #f1f5f9;">
                <p style="margin: 0 0 12px 0;"><strong>Title:</strong> ${data.title}</p>
                <p style="margin: 0 0 12px 0;"><strong>Client Name:</strong> ${user.username}</p>
                <p style="margin: 0 0 12px 0;"><strong>Client Email:</strong> ${user.email}</p>
                <p style="margin: 0 0 12px 0;"><strong>Timeline:</strong> ${data.timeline}</p>
                <p style="margin: 0;"><strong>Brief:</strong> ${data.briefUrl ? 'Uploaded' : 'No brief provided'}</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">Please review this submission in the Admin Dashboard.</p>
        </div>
        `,
        EmailSender.INFO
    ).catch(err => console.error('[Admin Project Notification] Failed:', err));

    // Send confirmation to Client
    await sendEmail(
        user.email,
        `ProVen | Project Submission Received: ${data.title}`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
            <h2 style="color: #0f172a; margin-bottom: 24px;">Project Received</h2>
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello <strong>${user.username}</strong>,<br><br>Thank you for submitting your project "<strong>${data.title}</strong>" to ProVen. We have received your submission and our team is currently performing the initial review.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; margin-bottom: 8px;">Next Steps</p>
                <p style="font-size: 14px; color: #64748b; margin: 0;">1. Our analysts will review your brief within 24-48 hours.<br>2. You will receive an email once the project status is updated.<br>3. If approved, we will begin the professional vetting and assignment phase.</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">Thank you for choosing ProVen for your execution infrastructure.</p>
        </div>
        `,
        EmailSender.INFO
    ).catch(err => console.error('[Client Project Confirmation] Failed:', err));

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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    // Check project limit (max 3)
    const [projectCount, pitchCount] = await Promise.all([
        prisma.project.count({ where: { clientId: userId } }),
        prisma.investmentPitch.count({ where: { clientId: userId } }),
    ]);

    if (projectCount + pitchCount >= 3) {
        throw new AppError('You have reached the maximum limit of 3 projects. Please contact support or delete an existing pending project to submit a new one.', 400);
    }

    const data = req.body as InvestmentPitchInput;

    const pitch = await prisma.investmentPitch.create({
        data: cleanData({
            ...data,
            clientId: userId,
        })
    });

    // Notify Admin of new investment pitch
    const adminEmail = process.env.ADMIN_RECEIVE_EMAIL || 'info@provenworld.com';
    await sendEmail(
        adminEmail,
        `💎 New Investment Pitch: ${data.companyName}`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-bottom: 24px;">New Investment Pitch</h2>
            <p style="font-size: 16px; color: #334155;">A new investment pitch has been submitted for review.</p>
            
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #f1f5f9;">
                <p style="margin: 0 0 12px 0;"><strong>Company:</strong> ${data.companyName}</p>
                <p style="margin: 0 0 12px 0;"><strong>Client Name:</strong> ${user.username}</p>
                <p style="margin: 0 0 12px 0;"><strong>Client Email:</strong> ${user.email}</p>
                <p style="margin: 0 0 12px 0;"><strong>Industry:</strong> ${data.industry}</p>
                <p style="margin: 0 0 12px 0;"><strong>Stage:</strong> ${data.stage}</p>
                <p style="margin: 0;"><strong>ID:</strong> ${pitch.id}</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">Please review the full pitch details in the Admin Dashboard.</p>
        </div>
        `,
        EmailSender.INFO
    ).catch(err => console.error('[Admin Pitch Notification] Failed:', err));

    // Send confirmation to Client
    await sendEmail(
        user.email,
        `ProVen | Investment Pitch Received: ${data.companyName}`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
            <h2 style="color: #0f172a; margin-bottom: 24px;">Pitch Received</h2>
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello <strong>${user.username}</strong>,<br><br>Your investment pitch for "<strong>${data.companyName}</strong>" has been successfully uploaded to the ProVen platform.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; margin-bottom: 8px;">Review Timeline</p>
                <p style="font-size: 14px; color: #64748b; margin: 0;">Our investment committee reviews pitches on a rolling basis. You will be notified via email of any status changes or if additional documentation is required.</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">Best regards,<br>The ProVen Investment Relations Team</p>
        </div>
        `,
        EmailSender.INFO
    ).catch(err => console.error('[Client Pitch Confirmation] Failed:', err));

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
        prisma.project.findMany({ 
            where: { clientId: userId }, 
            include: {
                assignments: {
                    where: { status: 'ACTIVE' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profile: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        avatarUrl: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' } 
        }),

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

    const data = req.body as any;

    // Handle map budget and timeline if they are present
    // Remove undefined values to please Prisma types
    const updateData: any = {};

    Object.keys(data).forEach(key => {
        const value = data[key];
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
    const limit = parseInt(req.query.limit as string) || 4;
    const skip = (page - 1) * limit;

    const { type, search } = req.query;
    const where: any = {
        status: 'ACCEPTED',
    };

    if (search) {
        where.OR = [
            { title: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
        ];
    }

    if (type && type !== 'All') {
        const typeMap: any = {
            'Test Project': 'TEST',
            'Client Project': 'CLIENT',
            'Ready Project': 'READY'
        };
        const typeStr = type as string;
        where.type = typeMap[typeStr] || typeStr.toUpperCase();
    }
    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                avatarUrl: true, jobTitle: true, city: true, country: true, metadata: true, preferences: true,
                            }
                        }
                    }
                },
                assignments: {
                    select: {
                        userId: true,
                        status: true,
                        role: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profile: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        avatarUrl: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        }),
        prisma.project.count({ where })
    ]);

    // Map projects to include isAssigned and isInterested convenience flags SPECIFIC to the user
    const currentUserId = req.user?.id;
    const mappedProjects = projects.map(project => ({
        ...project,
        isAssigned: project.assignments.some(a => (a.userId === currentUserId) && a.status === 'ACTIVE'),
        isInterested: project.assignments.some(a => (a.userId === currentUserId) && a.status === 'INTERESTED'),
    }));

    res.status(200).json({
        success: true,
        count: projects.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        projects: mappedProjects,
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
                            avatarUrl: true, jobTitle: true, city: true, country: true, metadata: true, preferences: true,
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
                                    avatarUrl: true, jobTitle: true, city: true, country: true, metadata: true, preferences: true,
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
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.roles?.includes('ADMIN');
    const isProfessional = req.user?.role === 'PROFESSIONAL' || req.user?.roles?.includes('PROFESSIONAL');
    
    // Check specific relations for the current user
    const userAssignment = project.assignments.find(a => a.userId === userId);
    const isAssigned = userAssignment && ['ACTIVE', 'ACCEPTED', 'ASSIGNED'].includes(userAssignment.status);
    const isInterested = userAssignment?.status === 'INTERESTED';
    
    const isPublicAccepted = project.status === 'ACCEPTED';

    if (!isOwner && !isAdmin && (!isProfessional || (!isPublicAccepted && !isAssigned))) {
        throw new AppError('You are not authorized to view this project', 403);
    }

    res.status(200).json({
        success: true,
        data: {
            ...project,
            isAssigned, // Explicitly tell the frontend if the current user is assigned (ACTIVE)
            isInterested, // Explicitly tell the frontend if the current user has expressed interest
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
    const isProfessionalUser = req.user?.role === 'PROFESSIONAL' || req.user?.roles?.includes('PROFESSIONAL');
    if (!isProfessionalUser) {
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
                                            avatarUrl: true, jobTitle: true, city: true, country: true, metadata: true, preferences: true
                                        }
                                    }
                                }
                            },
                            assignments: {
                                where: { status: { in: ['ACTIVE', 'ACCEPTED', 'INTERESTED'] } },
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            username: true,
                                            profile: {
                                                select: {
                                                    firstName: true,
                                                    lastName: true,
                                                    avatarUrl: true,
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            tasks: {
                                orderBy: { createdAt: 'desc' }
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
/**
 * Delete Standard Project
 */
export const deleteProject = asyncHandler(async (req: AuthRequest, res: Response) => {
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
        throw new AppError('You are not authorized to delete this project', 403);
    }

    // Only allow deletion if status is PENDING
    if (existingProject.status !== 'PENDING') {
        throw new AppError('Only pending projects can be deleted', 400);
    }

    await prisma.project.delete({
        where: { id: projectId },
    });

    res.status(200).json({
        success: true,
        message: 'Project deleted successfully!',
    });
});

/**
 * Delete Investment Pitch
 */
export const deleteInvestmentPitch = asyncHandler(async (req: AuthRequest, res: Response) => {
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
        throw new AppError('You are not authorized to delete this pitch', 403);
    }

    // Only allow deletion if status is PENDING
    if (existingPitch.status !== 'PENDING') {
        throw new AppError('Only pending pitches can be deleted', 400);
    }

    await prisma.investmentPitch.delete({
        where: { id: pitchId },
    });

    res.status(200).json({
        success: true,
        message: 'Investment pitch deleted successfully!',
    });
});
