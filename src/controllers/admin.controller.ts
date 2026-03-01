import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import prisma from '../utils/prisma.js';
import { sendEmail } from '../utils/email.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';

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
            client: { select: { id: true, email: true, username: true } },
            _count: {
                select: {
                    assignments: {
                        where: { status: 'INTERESTED' }
                    }
                }
            }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.project.count({ where });

    // Map projects to include interestsCount for frontend consistency
    const projectsWithCount = projects.map((p: any) => ({
        ...p,
        interestsCount: p._count?.assignments || 0
    }));

    res.status(200).json({
        success: true,
        count: projects.length,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        data: projectsWithCount
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
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; margin: 0; padding: 0; background-color: #f9fafb; }
                        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                        .header { background: #000000; padding: 40px 32px; text-align: center; }
                        .logo { color: #f97316; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin: 0; }
                        .content { padding: 48px 32px; }
                        .greeting { font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 12px; }
                        .message { font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px; }
                        .project-card { background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #f1f5f9; margin-bottom: 32px; }
                        .project-title { font-weight: 700; color: #0f172a; margin-bottom: 4px; display: block; }
                        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; }
                        .cta-button { display: inline-block; background: #f97316; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; transition: transform 0.2s; }
                        .footer { background: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; }
                        .footer-text { font-size: 12px; color: #9ca3af; margin: 0 0 16px; }
                        .brand { color: #1a1a1a; font-weight: 700; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 class="logo">PROVEN</h1>
                        </div>
                        <div class="content">
                            <p class="greeting">Hello ${clientName},</p>
                            <p class="message">${message}</p>
                            
                            <div class="project-card">
                                <span class="project-title">${project.title}</span>
                                <div class="status-badge">${status}</div>
                            </div>
                            
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/client/projects/${project.id}" class="cta-button">
                                Track Project Progress
                            </a>
                        </div>
                        <div class="footer">
                            <p class="footer-text">This is an automated notification from ProVen Platform.</p>
                            <div class="brand">© 2026 ProVen</div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const emailSent = await sendEmail(project.client.email, subject, html);
        } catch (emailError) {
            console.error(`[Admin] Email sending failed (non-blocking):`, emailError);
            // Don't throw — status was updated successfully, email is secondary
        }
    } else {

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

    const assignment = await prisma.projectAssignment.upsert({
        where: {
            projectId_userId: {
                projectId: id,
                userId: professionalId,
            }
        },
        update: {
            status: 'ACTIVE',
            role: role || 'Contributor',
        },
        create: {
            projectId: id,
            userId: professionalId,
            role: role || 'Contributor',
            status: 'ACTIVE',
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

/**
 * Get Project Interests
 * Returns a list of professionals who expressed interest in a specific project.
 */
export const getProjectInterests = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const interests = await prisma.projectAssignment.findMany({
        where: {
            projectId: id,
            status: 'INTERESTED'
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    username: true,
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                            category: true,
                            bio: true
                        }
                    }
                }
            }
        },
        orderBy: {
            assignedAt: 'desc'
        }
    });

    res.status(200).json({
        success: true,
        count: interests.length,
        data: interests
    });
});

/**
 * Get All Interests
 * Fetches all ProjectAssignments with status 'INTERESTED' across all projects
 */
export const getAllInterests = asyncHandler(async (req: Request, res: Response) => {
    const interests = await prisma.projectAssignment.findMany({
        where: {
            status: 'INTERESTED'
        },
        include: {
            project: {
                select: {
                    id: true,
                    title: true,
                    status: true
                }
            },
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
                            bio: true
                        }
                    }
                }
            }
        },
        orderBy: {
            assignedAt: 'desc'
        }
    });

    res.status(200).json({
        success: true,
        count: interests.length,
        data: interests
    });
});

/**
 * Decline Interest
 * Deletes the ProjectAssignment record for an interest
 */
export const declineInterest = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string; // Assignment ID

    // Check if it exists and is 'INTERESTED'
    const assignment = await prisma.projectAssignment.findUnique({
        where: { id }
    });

    if (!assignment) {
        throw new AppError('Interest record not found', 404);
    }

    if (assignment.status !== 'INTERESTED') {
        throw new AppError('Cannot decline an active assignment', 400);
    }

    await prisma.projectAssignment.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Interest declined successfully'
    });
});

/**
 * Add Project Resource
 */
export const addProjectResource = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const { title, url, type, platform, description } = req.body;

    if (!title || !url) {
        throw new AppError('Title and URL are required', 400);
    }

    const resource = await prisma.projectResource.create({
        data: {
            projectId,
            title,
            url,
            type: type || 'LINK',
            platform: platform || 'OTHER',
            description
        }
    });

    res.status(201).json({
        success: true,
        data: resource
    });
});

/**
 * Delete Project Resource
 */
export const deleteProjectResource = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await prisma.projectResource.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Resource deleted successfully'
    });
});

/**
 * Add Project Update/Briefing
 */
export const addProjectUpdate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = req.params.id as string;
    const { title, content, isUrgent } = req.body;

    if (!title || !content) {
        throw new AppError('Title and content are required', 400);
    }

    const update = await prisma.projectUpdate.create({
        data: {
            projectId,
            title,
            content,
            isUrgent: !!isUrgent,
            authorId: req.user?.id || 'admin'
        }
    });

    res.status(201).json({
        success: true,
        data: update
    });
});

/**
 * Delete Project Update
 */
export const deleteProjectUpdate = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await prisma.projectUpdate.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Project update deleted successfully'
    });
});

/**
 * Get Project Meetings
 */
export const getProjectMeetings = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const meetings = await prisma.projectMeeting.findMany({
        where: { projectId },
        orderBy: { startTime: 'desc' }
    });

    res.status(200).json({ success: true, count: meetings.length, data: meetings });
});

/**
 * Get Project Documents
 */
export const getProjectDocuments = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const documents = await prisma.projectDocument.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: documents.length, data: documents });
});

/**
 * Get Project Tasks
 */
export const getProjectTasks = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const tasks = await prisma.projectTask.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

/**
 * Get Project Info
 */
export const getProjectInfo = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const info = await prisma.projectInfo.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: info.length, data: info });
});

/**
 * Get Project Resources
 */
export const getProjectResources = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const resources = await prisma.projectResource.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: resources.length, data: resources });
});

/**
 * Get Project Updates
 */
export const getProjectUpdates = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const updates = await prisma.projectUpdate.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: updates.length, data: updates });
});

/**
 * Add Project Meeting
 */
export const addProjectMeeting = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const { title, description, meetingLink, startTime, endTime, duration, attendeeIds } = req.body;

    if (!title || !meetingLink || !startTime) {
        throw new AppError('Title, meeting link, and start time are required', 400);
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const meeting = await prisma.projectMeeting.create({
        data: {
            projectId,
            title,
            description,
            meetingLink,
            startTime: new Date(startTime),
            endTime: endTime ? new Date(endTime) : null,
            duration,
            attendeeIds: attendeeIds || []
        }
    });

    res.status(201).json({
        success: true,
        data: meeting
    });
});

/**
 * Delete Project Meeting
 */
export const deleteProjectMeeting = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await prisma.projectMeeting.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Meeting deleted successfully'
    });
});

/**
 * Add Project Document
 */
export const addProjectDocument = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const { title, url, type, description, professionalIds } = req.body;

    if (!title || !url) {
        throw new AppError('Title and URL are required', 400);
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const document = await prisma.projectDocument.create({
        data: {
            projectId,
            title,
            url,
            type: type || 'DOC',
            description,
            professionalIds: professionalIds || []
        }
    });

    res.status(201).json({
        success: true,
        data: document
    });
});

/**
 * Delete Project Document
 */
export const deleteProjectDocument = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await prisma.projectDocument.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
    });
});

/**
 * Add Project Task
 */
export const addProjectTask = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const { title, description, priority, dueDate, professionalIds } = req.body;

    if (!title) {
        throw new AppError('Title is required', 400);
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const task = await prisma.projectTask.create({
        data: {
            projectId,
            title,
            description,
            priority: priority || 'MEDIUM',
            dueDate: dueDate ? new Date(dueDate) : null,
            professionalIds: professionalIds || []
        }
    });

    res.status(201).json({
        success: true,
        data: task
    });
});

/**
 * Delete Project Task
 */
export const deleteProjectTask = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await prisma.projectTask.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
    });
});

/**
 * Add Localized Project Info
 */
export const addProjectInfo = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.id as string;
    const { title, content, professionalIds } = req.body;

    if (!title || !content) {
        throw new AppError('Title and content are required', 400);
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const info = await prisma.projectInfo.create({
        data: {
            projectId,
            title,
            content,
            professionalIds: professionalIds || []
        }
    });

    res.status(201).json({
        success: true,
        data: info
    });
});

/**
 * Delete Project Info
 */
export const deleteProjectInfo = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await prisma.projectInfo.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Project info deleted successfully'
    });
});
