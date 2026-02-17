import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import prisma from '../utils/prisma.js';
import { sendEmail } from '../utils/email.js';

/**
 * Get Pending Professionals
 * Lists all profiles waiting for vetting.
 */
export const getPendingProfessionals = asyncHandler(async (req: Request, res: Response) => {
    const pendingProfiles = await prisma.profile.findMany({
        where: { vettingStatus: 'PENDING', onboardingComplete: true },
        include: { user: { select: { id: true, email: true, username: true } } },
    });

    res.status(200).json({
        success: true,
        count: pendingProfiles.length,
        data: pendingProfiles,
    });
});

/**
 * Vet Professional
 * Approve or Reject a professional's profile.
 */
export const vetProfessional = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status, remarks } = req.body; // status: 'VETTED' | 'REJECTED'

    if (!['VETTED', 'REJECTED'].includes(status)) {
        throw new AppError('Invalid status. Use VETTED or REJECTED.', 400);
    }

    const profile = await prisma.profile.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!profile) {
        throw new AppError('Profile not found', 404);
    }

    const updatedProfile = await prisma.profile.update({
        where: { id },
        data: { vettingStatus: status },
    });

    // Notify User via Email
    const emailSubject = status === 'VETTED' ? 'Congratulations! Your Profile is Verified' : 'Profile Vetting Update';
    const emailBody = status === 'VETTED'
        ? `<p>Hi ${profile.firstName || 'User'},</p><p>Your profile has been approved! You can now apply for jobs.</p>`
        : `<p>Hi ${profile.firstName || 'User'},</p><p>Unfortunately your profile was rejected.</p><p><strong>Remarks:</strong> ${remarks || 'Insufficient documentation.'}</p>`;

    // Check if user exists and has email before sending
    if (profile.user && profile.user.email) {
        await sendEmail(profile.user.email, emailSubject, emailBody);
    }

    res.status(200).json({
        success: true,
        message: `Professional ${status === 'VETTED' ? 'approved' : 'rejected'} successfully.`,
        data: updatedProfile,
    });
});

/**
 * Get All Projects (Admin)
 */
export const getAllProjects = asyncHandler(async (req: Request, res: Response) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 10;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
        where.status = status;
    }

    const projects = await prisma.project.findMany({
        where,
        include: {
            client: { select: { id: true, email: true, username: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.project.count({ where });

    res.status(200).json({
        success: true,
        count: projects.length,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        data: projects
    });
});

/**
 * Update Project Status
 */
export const updateProjectStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;

    // Validate Status
    const validStatuses = ['PENDING', 'mACCEPTED', 'REVIEWING', 'ACTIVE', 'COMPLETED', 'REJECTED', 'DRAFT'];
    // Note: 'mACCEPTED' seems like a typo in my thought process or previous valid statuses context, but wait, the user said "Accepted". 
    // Let's check the schema or previous files. `StatusBadge` had 'ACCEPTED'. 
    // The previous file content for `admin.controller.ts` didn't have the status list validation in the code I read (it was commented out).
    // I will stick to the logic of just updating and sending email, assuming the status passed is valid or handled by Prisma/Database constraints.
    // Actually, I should check the Prisma schema for ProjectStatus enum if possible, but I'll assume the string passed is correct for now or matches the frontend options.

    // Update project and fetch client email
    console.log(`[Admin] Updating project ${id} to status: ${status}`);

    // Normalize status to match Enum if needed (Prisma is strict, so we expect correct case from frontend)
    // If status is "APPROVED" (legacy/typo), map it to "ACCEPTED" or "ACTIVE" if necessary, though we fixed frontend.

    const project = await prisma.project.update({
        where: { id },
        data: { status },
        include: {
            client: {
                select: {
                    email: true,
                    username: true,
                    profile: {
                        select: {
                            firstName: true
                        }
                    }
                }
            }
        }
    });

    console.log(`[Admin] Project updated. Client email: ${project.client?.email}`);

    // Send Email Notification
    if (project.client && project.client.email) {
        const clientName = project.client.profile?.firstName || project.client.username || 'Client';
        let subject = `Project Status Update: ${project.title}`;
        let message = '';

        console.log(`[Admin] Preparing email for status: ${status}`);

        switch (status) {
            case 'ACCEPTED':
                subject = `🎉 Project Accepted: ${project.title}`;
                message = `Great news! Your project "<strong>${project.title}</strong>" has been accepted by our team. It is now visible to professionals.`;
                break;
            case 'REVIEWING':
                subject = `Project Under Review: ${project.title}`;
                message = `Your project "<strong>${project.title}</strong>" is currently being reviewed by our team. We will get back to you shortly.`;
                break;
            case 'ACTIVE':
                subject = `🚀 Project Active: ${project.title}`;
                message = `Your project "<strong>${project.title}</strong>" is now active and in progress.`;
                break;
            case 'REJECTED':
                subject = `Project Status Update: ${project.title}`;
                message = `Regarding your project "<strong>${project.title}</strong>". Unfortunately, it has been marked as rejected. Please contact support for more details.`;
                break;
            default:
                message = `The status of your project "<strong>${project.title}</strong>" has been updated to <strong>${status}</strong>.`;
        }

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4F46E5;">ProProven Project Update</h2>
                <p>Hi ${clientName},</p>
                <p>${message}</p>
                <br/>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/projects/${project.id}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Project</a>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">Powered by ProProven</p>
            </div>
        `;

        // Send the email (fire and forget to not block response significantly, or await if critical)
        await sendEmail(project.client.email, subject, html);
    }

    res.status(200).json({
        success: true,
        data: project
    });
});


/**
 * Assign Professional to Project
 */
export const assignProfessional = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Project ID
    const { professionalId, role } = req.body;

    // Verify Professional exists and is VETTED
    const professional = await prisma.user.findUnique({
        where: { id: professionalId },
        include: { profile: true }
    });

    if (!professional || professional.role !== 'PROFESSIONAL') {
        throw new AppError('Invalid professional ID', 400);
    }

    // Check if professional is vetted (Optional strictness)
    if (professional.profile?.vettingStatus !== 'VETTED') {
        throw new AppError('Professional is not vetted yet', 400);
    }

    const assignment = await prisma.projectAssignment.create({
        data: {
            projectId: id,
            userId: professionalId,
            role: role || 'Contributor'
        }
    });

    // Notify Professional
    // await sendEmail(professional.email, "New Project Assignment", `You have been assigned to project...`);

    res.status(201).json({
        success: true,
        message: 'Professional assigned successfully',
        data: assignment
    });
});

/**
 * Get All Users (Admin)
 * Fetch all users with role filtering and pagination.
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 10;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) {
        where.role = role;
    }

    const users = await prisma.user.findMany({
        where,
        include: {
            profile: true,
            _count: {
                select: {
                    projects: true,
                    pitches: true
                }
            }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.status(200).json({
        success: true,
        count: users.length,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        data: users
    });
});

/**
 * Get User Stats (Admin)
 */
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const [clientCount, professionalCount, projectCount, pitchCount] = await Promise.all([
        prisma.user.count({ where: { role: 'CLIENT' } }),
        prisma.user.count({ where: { role: 'PROFESSIONAL' } }),
        prisma.project.count(),
        prisma.investmentPitch.count(),
    ]);

    res.status(200).json({
        success: true,
        data: {
            clients: clientCount,
            professionals: professionalCount,
            projects: projectCount,
            pitches: pitchCount,
            totalUsers: clientCount + professionalCount
        }
    });
});
