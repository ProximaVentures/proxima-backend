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

    // Validate against Prisma ProjectStatus enum
    const validStatuses = ['PENDING', 'REVIEWING', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'];

    if (!status || !validStatuses.includes(status)) {
        throw new AppError(`Invalid status "${status}". Valid statuses: ${validStatuses.join(', ')}`, 400);
    }

    console.log(`[Admin] Updating project ${id} to status: ${status}`);

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

    console.log(`[Admin] Project updated successfully. Client email: ${project.client?.email}`);

    // Send Email Notification (wrapped in try/catch so email failures don't break the API response)
    if (project.client && project.client.email) {
        try {
            const clientName = project.client.profile?.firstName || project.client.username || 'Client';
            let subject = `Project Status Update: ${project.title}`;
            let message = '';

            switch (status) {
                case 'ACCEPTED':
                    subject = `🎉 Project Accepted: ${project.title}`;
                    message = `Great news! Your project "<strong>${project.title}</strong>" has been accepted by our team. It is now visible to professionals.`;
                    break;
                case 'REVIEWING':
                    subject = `📋 Project Under Review: ${project.title}`;
                    message = `Your project "<strong>${project.title}</strong>" is currently being reviewed by our team. We will get back to you shortly.`;
                    break;
                case 'ACTIVE':
                    subject = `🚀 Project Active: ${project.title}`;
                    message = `Your project "<strong>${project.title}</strong>" is now active and in progress.`;
                    break;
                case 'COMPLETED':
                    subject = `✅ Project Completed: ${project.title}`;
                    message = `Your project "<strong>${project.title}</strong>" has been marked as completed. Thank you for choosing Proven!`;
                    break;
                case 'CANCELLED':
                    subject = `Project Cancelled: ${project.title}`;
                    message = `Your project "<strong>${project.title}</strong>" has been cancelled. If you have any questions, please contact support.`;
                    break;
                case 'REJECTED':
                    subject = `Project Update: ${project.title}`;
                    message = `Regarding your project "<strong>${project.title}</strong>" — unfortunately, it has been rejected. Please contact support for more details.`;
                    break;
                default:
                    message = `The status of your project "<strong>${project.title}</strong>" has been updated to <strong>${status}</strong>.`;
            }

            const html = `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                    <h2 style="color: #4F46E5; margin-bottom: 16px;">Proven Project Update</h2>
                    <p style="color: #374151;">Hi ${clientName},</p>
                    <p style="color: #374151; line-height: 1.6;">${message}</p>
                    <br/>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/projects/${project.id}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Project</a>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #9ca3af;">Powered by Proven</p>
                </div>
            `;

            console.log(`[Admin] Sending email to ${project.client.email} for status: ${status}`);
            const emailSent = await sendEmail(project.client.email, subject, html);
            console.log(`[Admin] Email result: ${emailSent ? '✅ Sent' : '❌ Failed'}`);
        } catch (emailError) {
            console.error(`[Admin] Email sending failed (non-blocking):`, emailError);
            // Don't throw — status was updated successfully, email is secondary
        }
    } else {
        console.log(`[Admin] No client email found for project ${id}, skipping notification.`);
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
