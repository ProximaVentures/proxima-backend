import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import prisma from '../utils/prisma.js';
import { sendEmail } from '../utils/email.js';
import { Role } from '@prisma/client';
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
    // Notify User via Email & In-app Notification
    const emailSubject = status === 'VETTED' ? '🎉 Congratulations! Your ProVen Profile is Verified' : 'Action Required: Your ProVen Profile Vetting';
    const clientName = profile.firstName || profile.user?.username || 'Professional';
    
    let message = '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let ctaLink = frontendUrl;
    let ctaText = 'Login to Dashboard';
    const logoUrl = "https://proven-frontend.vercel.app/logo.png"; // Fallback URL or hosted asset

    if (status === 'VETTED') {
        message = `Great news! Your professional profile has been verified and approved by our team. You now have full access to high-value projects and ProVen's exclusive professional tools.`;
        ctaLink = `${frontendUrl}/dashboard/professional`;
        ctaText = 'Access Professional Dashboard';
    } else {
        message = `Thank you for your interest in ProVen. After reviewing your application, our team has determined that some updates are needed before we can proceed with your verification.`;
        ctaLink = `${frontendUrl}/dashboard/pending`;
        ctaText = 'Update Application';
    }

    const emailHtmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
                .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; margin-top: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .header { background: #0f172a; padding: 48px 32px; text-align: center; }
                .logo-text { color: #f97316; font-size: 32px; font-weight: 900; letter-spacing: -0.05em; margin: 0; text-transform: uppercase; }
                .logo-img { max-width: 140px; height: auto; margin-bottom: 12px; }
                .content { padding: 48px 40px; }
                .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.01em; }
                .message { font-size: 16px; line-height: 1.7; color: #475569; margin-bottom: 32px; }
                .status-card { background: ${status === 'VETTED' ? '#f0fdf4' : '#fff7ed'}; border-radius: 20px; padding: 24px; border: 1px solid ${status === 'VETTED' ? '#dcfce7' : '#ffedd5'}; margin-bottom: 32px; }
                .status-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${status === 'VETTED' ? '#166534' : '#9a3412'}; margin-bottom: 8px; display: block; }
                .status-value { font-size: 24px; font-weight: 900; color: ${status === 'VETTED' ? '#14532d' : '#7c2d12'}; display: block; }
                .remarks-section { margin-top: 16px; padding-top: 16px; border-top: 1px dashed ${status === 'VETTED' ? '#bbf7d0' : '#fed7aa'}; }
                .remarks-text { font-size: 14px; color: #64748b; font-style: italic; line-height: 1.5; }
                .cta-container { text-align: center; margin-top: 8px; }
                .cta-button { display: inline-block; background: #f97316; color: #ffffff !important; padding: 18px 36px; border-radius: 16px; font-weight: 800; text-decoration: none; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3); transition: all 0.2s; }
                .footer { background: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #f1f5f9; }
                .footer-text { font-size: 13px; color: #94a3b8; margin: 0 0 16px; line-height: 1.5; }
                .social-links { margin-bottom: 24px; }
                .copyright { font-size: 12px; color: #cbd5e1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="container">
                    <div class="header">
                        <!-- <img src="${logoUrl}" alt="ProVen Logo" class="logo-img"> -->
                        <h1 class="logo-text">ProVen</h1>
                    </div>
                    <div class="content">
                        <p class="greeting">Hi ${clientName},</p>
                        <p class="message">${message}</p>
                        
                        <div class="status-card">
                            <span class="status-label">Profile Status</span>
                            <span class="status-value">${status === 'VETTED' ? '✓ Verified' : '⚠ Action Required'}</span>
                            ${status !== 'VETTED' ? `
                            <div class="remarks-section">
                                <span class="status-label" style="font-size: 10px; opacity: 0.7;">Admin Feedback</span>
                                <p class="remarks-text">"${remarks || 'Please provide more details about your experience and skills.'}"</p>
                            </div>` : ''}
                        </div>
                        
                        <div class="cta-container">
                            <a href="${ctaLink}" class="cta-button">
                                ${ctaText}
                            </a>
                        </div>
                    </div>
                    <div class="footer">
                        <p class="footer-text">You received this because you requested verification on the ProVen platform. If you didn't, please ignore this email.</p>
                        <div class="copyright">© 2026 ProVen Global • Build the Future</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    // Create In-app Notification for Real-time Feedback
    try {
        await prisma.notification.create({
            data: {
                userId: profile.userId,
                title: status === 'VETTED' ? 'Verification Successful' : 'Profile Update Required',
                message: status === 'VETTED' 
                    ? 'Congratulations! Your professional profile has been approved.' 
                    : 'Your profile application needs more information. Please check the feedback.',
                type: status === 'VETTED' ? 'INFO' : 'BRIEFING',
                link: status === 'VETTED' ? '/dashboard/professional' : '/dashboard/pending',
            }
        });
        console.log(`[Admin] In-app notification created for user ${profile.userId}`);
    } catch (noteError) {
        console.error('[Admin] Failed to create in-app notification:', noteError);
    }


    // Check if user exists and has email before sending
    console.log(`[Admin] Attempting to send ${status === 'VETTED' ? 'approval' : 'rejection'} email to: ${profile.user?.email}`);
    if (profile.user && profile.user.email) {
        try {
            const emailResult = await sendEmail(profile.user.email, emailSubject, emailHtmlBody);
            console.log(`[Admin] Email send result: ${emailResult ? 'SUCCESS' : 'FAILURE'}`);
        } catch (emailError) {
            console.error('[Admin] Welcome/Reject email failed to send:', emailError);
        }
    } else {
        console.warn('[Admin] No email found for professional user, skipping email notification.', { userId: profile.user?.id });
    }

    res.status(200).json({
        success: true,
        message: `Professional ${status === 'VETTED' ? 'approved' : 'rejected'} successfully.`,
        data: updatedProfile,
    });
});

/**
 * Update Professional Rating
 * Updates the star rating for a professional profile.
 */
export const updateProfessionalRating = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { rating } = req.body;

    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
        throw new AppError('Invalid rating. Must be a number between 0 and 5.', 400);
    }

    const profile = await prisma.profile.findUnique({
        where: { id },
    });

    if (!profile) {
        throw new AppError('Profile not found', 404);
    }

    const updatedProfile = await prisma.profile.update({
        where: { id },
        data: { rating },
    });

    res.status(200).json({
        success: true,
        message: 'Professional rating updated successfully.',
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

    const isProfessional = 
        professional?.role === 'PROFESSIONAL' || 
        professional?.roles.includes('PROFESSIONAL') ||
        professional?.profile?.onboardingComplete === true;

    if (!professional || !isProfessional) {
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
    const roleQuery = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 10;

    const vettingStatus = typeof req.query.vettingStatus === 'string' ? req.query.vettingStatus : undefined;

    const skip = (page - 1) * limit;

    // Fetch all relevant users for in-memory filtering to bypass potential Prisma/Neon array filtering issues
    const allUsers = await prisma.user.findMany({
        include: {
            profile: true,
            _count: {
                select: {
                    projects: true,
                    pitches: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    let filteredUsers = allUsers;

    // 1. Role Filtering (Inclusive)
    if (roleQuery?.toUpperCase() === 'PROFESSIONAL') {
        filteredUsers = allUsers.filter(u => {
            const hasProRole = u.role === 'PROFESSIONAL' || u.role === Role.PROFESSIONAL;
            const rolesArray = Array.isArray(u.roles) ? u.roles : [];
            const hasProInArray = rolesArray.some(r => String(r).toUpperCase() === 'PROFESSIONAL');
            const isOnboarded = u.profile?.onboardingComplete === true;
            
            return hasProRole || hasProInArray || isOnboarded;
        });
    } else if (roleQuery?.toUpperCase() === 'CLIENT') {
        filteredUsers = allUsers.filter(u => {
            const hasClientRole = u.role === 'CLIENT' || u.role === Role.CLIENT;
            const rolesArray = Array.isArray(u.roles) ? u.roles : [];
            const hasClientInArray = rolesArray.some(r => String(r).toUpperCase() === 'CLIENT');
            
            return hasClientRole || hasClientInArray;
        });
    } else if (roleQuery) {
        filteredUsers = allUsers.filter(u => 
            u.role === roleQuery || 
            (u.roles && u.roles.some((r: any) => String(r).toUpperCase() === roleQuery.toUpperCase()))
        );
    }

    // 2. Search Filtering
    if (search) {
        const s = search.toLowerCase();
        filteredUsers = filteredUsers.filter(u => 
            u.id.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s) ||
            (u.username && u.username.toLowerCase().includes(s)) ||
            (u.profile?.firstName && u.profile.firstName.toLowerCase().includes(s)) ||
            (u.profile?.lastName && u.profile.lastName.toLowerCase().includes(s))
        );
    }

    // 3. Vetting Status Filtering
    if (vettingStatus) {
        filteredUsers = filteredUsers.filter(u => u.profile?.vettingStatus === vettingStatus);
    }

    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(skip, skip + Number(limit));

    res.status(200).json({
        success: true,
        count: paginatedUsers.length,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        data: paginatedUsers
    });
});

/**
 * Get User By ID (Admin)
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            profile: true,
            _count: {
                select: {
                    projects: true,
                    pitches: true
                }
            }
        }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * Get Professional By ID (Admin)
 * Fetches by either Profile ID or User ID for robustness.
 */
export const getProfessionalById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    let profile = await prisma.profile.findFirst({
        where: {
            OR: [
                { id: id },
                { userId: id }
            ]
        },
        include: {
            user: {
                include: {
                    _count: {
                        select: {
                            projects: true,
                            pitches: true
                        }
                    }
                }
            }
        }
    });

    if (!profile) {
        throw new AppError('Professional profile not found', 404);
    }

    res.status(200).json({
        success: true,
        data: profile
    });
});

/**
 * Get User Stats (Admin)
 */
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
    // Fetch users for in-memory statistics calculation to bypass Prisma array filtering issues
    const usersForStats = await prisma.user.findMany({
        include: { profile: { select: { onboardingComplete: true } } }
    });

    const clientCount = usersForStats.filter(u => 
        u.role === Role.CLIENT || (u.roles && u.roles.includes(Role.CLIENT))
    ).length;

    const professionalCount = usersForStats.filter(u => 
        u.role === Role.PROFESSIONAL || 
        (u.roles && u.roles.includes(Role.PROFESSIONAL)) || 
        u.profile?.onboardingComplete === true
    ).length;

    const [totalUsersCount, projectCount, pitchCount] = await Promise.all([
        prisma.user.count(),
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
            totalUsers: totalUsersCount
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
            status: { in: ['INTERESTED', 'ACTIVE', 'ACCEPTED', 'ASSIGNED'] }
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
        },
        include: { project: { include: { assignments: { include: { user: true } } } } }
    });

    // Notify ALL professionals (non-blocking — item creation succeeds even if notifications fail)
    try {
        const professionals = resource.project.assignments.map(a => a.user);
        console.log(`[Notify Resource] Project: ${resource.project.title}, Professionals found: ${professionals.length}`);
        for (const pro of professionals) {
            await prisma.notification.create({
                data: {
                    userId: pro.id,
                    title: 'New Resource Added',
                    message: `A new resource "${title}" has been added to project "${resource.project.title}"`,
                    type: 'RESOURCE',
                    link: `/dashboard/professional/projects/${projectId}`
                }
            });
            if (pro.email) {
                await sendEmail(
                    pro.email,
                    `📁 New Resource: ${title}`,
                    `A new resource has been added to your project <strong>${resource.project.title}</strong>.<br><br><strong>Title:</strong> ${title}<br><strong>Type:</strong> ${resource.type}<br><br><a href="${process.env.FRONTEND_URL}/dashboard/professional/projects/${projectId}">View Project</a>`
                ).catch(err => console.error('[Notify Resource] Email failed:', err));
            }
        }
    } catch (notifyErr) {
        console.error('[Notify Resource] Notification failed (non-blocking):', notifyErr);
    }

    res.status(201).json({
        success: true,
        data: resource
    });
});

/**
 * Edit Project Resource
 */
export const editProjectResource = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, url, type, platform, description } = req.body;

    const resource = await prisma.projectResource.update({
        where: { id },
        data: {
            title,
            url,
            type,
            platform,
            description
        }
    });

    res.status(200).json({
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
        },
        include: { project: { include: { assignments: { include: { user: true } } } } }
    });

    // Notify ALL professionals (non-blocking)
    try {
        const professionals = update.project.assignments.map(a => a.user);
        console.log(`[Notify Update] Project: ${update.project.title}, Professionals found: ${professionals.length}`);
        for (const pro of professionals) {
            await prisma.notification.create({
                data: {
                    userId: pro.id,
                    title: isUrgent ? '🚨 Urgent Project Update' : 'New Project Update',
                    message: `"${title}" - Project: ${update.project.title}`,
                    type: 'BRIEFING',
                    link: `/dashboard/professional/projects/${projectId}`
                }
            });
            if (pro.email) {
                await sendEmail(
                    pro.email,
                    `${isUrgent ? '🚨' : '📝'} Project Update: ${title}`,
                    `A new update has been posted for <strong>${update.project.title}</strong>.<br><br><strong>Title:</strong> ${title}<br><strong>Urgency:</strong> ${isUrgent ? 'High' : 'Normal'}<br><br><a href="${process.env.FRONTEND_URL}/dashboard/professional/projects/${projectId}">Read Update</a>`
                ).catch(err => console.error('[Notify Update] Email failed:', err));
            }
        }
    } catch (notifyErr) {
        console.error('[Notify Update] Notification failed (non-blocking):', notifyErr);
    }

    res.status(201).json({
        success: true,
        data: update
    });
});

/**
 * Edit Project Update
 */
export const editProjectUpdate = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, content } = req.body;

    const update = await prisma.projectUpdate.update({
        where: { id },
        data: {
            title,
            content
        }
    });

    res.status(200).json({
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
        },
        include: {
            project: {
                include: { assignments: true }
            }
        }
    });

    // Default to ALL professionals on the project if no specific attendees
    let notifyUserIds = attendeeIds || [];
    if (notifyUserIds.length === 0) {
        notifyUserIds = meeting.project.assignments.map(a => a.userId);
    }
    console.log(`[Notify Meeting] Project: ${meeting.project.title}, Notify IDs: ${notifyUserIds.join(', ')}`);

    // Notify attendees (non-blocking)
    try {
        if (notifyUserIds.length > 0) {
            const users = await prisma.user.findMany({ where: { id: { in: notifyUserIds } } });
            for (const user of users) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        title: 'New Meeting Scheduled',
                        message: `You have been invited to a meeting: "${title}" for project "${meeting.project.title}"`,
                        type: 'MEETING',
                        link: `/dashboard/professional/projects/${projectId}`
                    }
                });
                if (user.email) {
                    await sendEmail(
                        user.email,
                        `📅 Meeting Invitation: ${title}`,
                        `You have been invited to a meeting for <strong>${meeting.project.title}</strong>.<br><br><strong>Title:</strong> ${title}<br><strong>Time:</strong> ${new Date(startTime).toLocaleString()}<br><br><a href="${process.env.FRONTEND_URL}/dashboard/professional/projects/${projectId}">Join from Dashboard</a>`
                    ).catch(err => console.error('[Notify Meeting] Email failed:', err));
                }
            }
        }
    } catch (notifyErr) {
        console.error('[Notify Meeting] Notification failed (non-blocking):', notifyErr);
    }

    res.status(201).json({
        success: true,
        data: meeting
    });
});

/**
 * Edit Project Meeting
 */
export const editProjectMeeting = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, description, meetingLink, startTime, endTime, duration } = req.body;

    const updateData: any = {
        title,
        description,
        meetingLink,
        duration
    };
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);

    const meeting = await prisma.projectMeeting.update({
        where: { id },
        data: updateData
    });

    res.status(200).json({
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
        },
        include: {
            project: {
                include: { assignments: true }
            }
        }
    });

    // Default to ALL professionals on the project if no specific ones provided
    let notifyUserIds = professionalIds || [];
    if (notifyUserIds.length === 0) {
        notifyUserIds = document.project.assignments.map(a => a.userId);
    }
    console.log(`[Notify Document] Project: ${document.project.title}, Notify IDs: ${notifyUserIds.join(', ')}`);

    // Notify targeted professionals (non-blocking)
    try {
        if (notifyUserIds.length > 0) {
            const users = await prisma.user.findMany({ where: { id: { in: notifyUserIds } } });
            for (const user of users) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        title: 'New Document Shared',
                        message: `A new document "${title}" has been shared with you for project "${document.project.title}"`,
                        type: 'DOC',
                        link: `/dashboard/professional/projects/${projectId}`
                    }
                });
                if (user.email) {
                    await sendEmail(
                        user.email,
                        `📄 New Document: ${title}`,
                        `A new document has been shared with you for <strong>${document.project.title}</strong>.<br><br><strong>Title:</strong> ${title}<br><br><a href="${process.env.FRONTEND_URL}/dashboard/professional/projects/${projectId}">View Project</a>`
                    ).catch(err => console.error('[Notify Document] Email failed:', err));
                }
            }
        }
    } catch (notifyErr) {
        console.error('[Notify Document] Notification failed (non-blocking):', notifyErr);
    }

    res.status(201).json({
        success: true,
        data: document
    });
});

/**
 * Edit Project Document
 */
export const editProjectDocument = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, url, type, description } = req.body;

    const document = await prisma.projectDocument.update({
        where: { id },
        data: {
            title,
            url,
            type,
            description
        }
    });

    res.status(200).json({
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
    const { title, description, priority, dueDate, professionalIds, assignedToId, sprintId, progress, sprintWeight, duration, richText } = req.body;

    if (!title) {
        throw new AppError('Title is required', 400);
    }

    const existingTaskCount = await prisma.projectTask.count({
        where: { projectId, title }
    });
    if (existingTaskCount >= 2) {
        throw new AppError('This task has already been added twice to this project', 400);
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
            status: 'TODO',
            priority: priority || 'MEDIUM',
            dueDate: dueDate ? new Date(dueDate) : null,
            professionalIds: professionalIds || (assignedToId ? [assignedToId] : []),
            sprintId: sprintId || null,
            progress: Number(progress) || 0,
            sprintWeight: Number(sprintWeight) || 0,
            duration,
            richText
        },
        include: {
            project: {
                include: { assignments: true }
            }
        }
    });

    // Default to ALL professionals on the project if no specific ones assigned
    let notifyUserIds = task.professionalIds;
    if (notifyUserIds.length === 0) {
        notifyUserIds = task.project.assignments.map(a => a.userId);
    }
    console.log(`[Notify Task] Project: ${task.project.title}, Notify IDs: ${notifyUserIds.join(', ')}`);

    // Notify assigned professionals (non-blocking)
    try {
        if (notifyUserIds.length > 0) {
            const users = await prisma.user.findMany({ where: { id: { in: notifyUserIds } } });
            for (const user of users) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        title: 'New Task Assigned',
                        message: `You have been assigned: "${title}" in "${task.project.title}"`,
                        type: 'TASK',
                        link: `/dashboard/professional/projects/${projectId}`
                    }
                });
                if (user.email) {
                    await sendEmail(
                        user.email,
                        `✅ New Task: ${title}`,
                        `You have a new task for <strong>${task.project.title}</strong>.<br><br><strong>Task:</strong> ${title}<br><strong>Priority:</strong> ${priority || 'MEDIUM'}<br><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}<br><br><a href="${process.env.FRONTEND_URL}/dashboard/professional/projects/${projectId}">View Task</a>`
                    ).catch(err => console.error('[Notify Task] Email failed:', err));
                }
            }
        }
    } catch (notifyErr) {
        console.error('[Notify Task] Notification failed (non-blocking):', notifyErr);
    }

    res.status(201).json({
        success: true,
        data: task
    });
});

/**
 * Edit Project Task
 */
export const editProjectTask = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, description, priority, dueDate, assignedToId, status, sprintId, progress, sprintWeight, duration, richText } = req.body;

    // Optional duplicate title check for edited task
    if (title) {
        const currentTask = await prisma.projectTask.findUnique({ where: { id } });
        if (currentTask && title !== currentTask.title) {
            const existingTask = await prisma.projectTask.findFirst({
                where: { projectId: currentTask.projectId, title }
            });
            if (existingTask) {
                throw new AppError('A task with this title already exists in the project', 400);
            }
        }
    }

    const updateData: any = {
        title,
        description,
        priority,
        status,
        professionalIds: assignedToId ? [assignedToId] : undefined,
    };
    if (sprintId !== undefined) updateData.sprintId = sprintId;
    if (progress !== undefined) updateData.progress = Number(progress);
    if (sprintWeight !== undefined) updateData.sprintWeight = Number(sprintWeight);
    if (duration !== undefined) updateData.duration = duration;
    if (richText !== undefined) updateData.richText = richText;

    if (dueDate) updateData.dueDate = new Date(dueDate);

    const task = await prisma.projectTask.update({
        where: { id },
        data: updateData
    });

    res.status(200).json({
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
 * Review Project Task (Admin)
 */
export const reviewTask = asyncHandler(async (req: Request, res: Response) => {
    const taskId = req.params.id as string;
    const { feedback, status } = req.body;

    if (!['DONE', 'DO_AGAIN', 'CANCELLED'].includes(status)) {
        throw new AppError('Invalid status for review. Use DONE, DO_AGAIN, or CANCELLED', 400);
    }

    const task = await prisma.projectTask.findUnique({
        where: { id: taskId },
        include: { project: true }
    });

    if (!task) throw new AppError('Task not found', 404);

    const updatedTask = await prisma.projectTask.update({
        where: { id: taskId },
        data: {
            adminFeedback: feedback,
            status,
            reviewedAt: new Date()
        }
    });

    // Notify Professionals
    try {
        const notifyUserIds = task.professionalIds;
        if (notifyUserIds.length > 0) {
            for (const userId of notifyUserIds) {
                await prisma.notification.create({
                    data: {
                        userId,
                        title: `Task Review: ${status}`,
                        message: `Admin has reviewed your task: "${task.title}". Status: ${status}`,
                        type: 'TASK',
                        link: `/dashboard/professional/projects/${task.projectId}`
                    }
                });
            }
        }
    } catch (err) {
        console.error('[Review Task] Notification failed:', err);
    }

    res.status(200).json({
        success: true,
        message: `Task reviewed successfully as ${status}`,
        data: updatedTask
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
 * Edit Project Info
 */
export const editProjectInfo = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, content } = req.body;

    const info = await prisma.projectInfo.update({
        where: { id },
        data: {
            title,
            content
        }
    });

    res.status(200).json({
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

/**
 * Get Project By ID (Admin)
 */
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            client: {
                select: {
                    id: true,
                    email: true,
                    username: true,
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatarUrl: true
                        }
                    }
                }
            },
            assignments: {
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
                                    category: true
                                }
                            }
                        }
                    }
                }
            },
            documents: {
                orderBy: { createdAt: 'desc' }
            },
            _count: {
                select: {
                    assignments: {
                        where: { status: 'INTERESTED' }
                    }
                }
            }
        }
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    // Map project to include interestsCount for frontend consistency
    const projectWithCount = {
        ...project,
        interestsCount: project._count?.assignments || 0
    };

    res.status(200).json({
        success: true,
        data: projectWithCount
    });
});
