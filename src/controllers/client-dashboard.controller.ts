import type { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';

// ═══════════════════════════════════════════════════════════
//  CLIENT DASHBOARD CONTROLLER
//  Powers the new client-facing project execution dashboard.
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/client/projects/:projectId/dashboard
 *
 * Returns the full project overview for the client dashboard:
 *  - Project header stats (title, progress, budget, timeline, PM, team)
 *  - Next milestone info
 *  - All sprints with summary data for the sidebar list
 */
export const getProjectDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const projectId = req.params.projectId as string;

    if (!userId) throw new AppError('Unauthorized', 401);

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            client: {
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
            },
            projectManager: {
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
            },
            assignments: {
                where: { status: { in: ['ACTIVE', 'ACCEPTED', 'ASSIGNED'] } },
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
                                    category: true,
                                }
                            }
                        }
                    }
                }
            },
            sprints: {
                orderBy: { order: 'asc' },
                include: {
                    objectives: { orderBy: { order: 'asc' } },
                    sprintDeliverables: true,
                    payment: true,
                    tasks: true,
                }
            }
        }
    });

    if (!project) throw new AppError('Project not found', 404);

    // Authorization: Only the client who owns the project or admin
    const isOwner = project.clientId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        throw new AppError('You are not authorized to view this dashboard', 403);
    }

    // ── Compute overall project progress from sprints ──
    const sprints = project.sprints || [];
    const totalWeight = sprints.reduce((sum: number, s: any) => sum + s.projectWeight, 0);
    const weightedProgress = totalWeight > 0
        ? sprints.reduce((sum: number, s: any) => sum + (s.progress * s.projectWeight / 100), 0) / totalWeight * 100
        : sprints.length > 0
            ? sprints.reduce((sum: number, s: any) => sum + s.progress, 0) / sprints.length
            : 0;

    // ── Find the next milestone (first non-completed sprint) ──
    const activeSprint = sprints.find((s: any) =>
        s.status === 'ACTIVE' || s.status === 'IN_REVIEW'
    ) || sprints.find((s: any) => s.status === 'PLANNED');

    // ── Compute budget used from sprint payments ──
    const computedBudgetUsed = sprints.reduce((sum: number, s: any) => {
        return sum + (s.payment?.amountPaid || 0);
    }, 0);

    // ── Build team avatars ──
    const assignments: any[] = project.assignments || [];
    const teamMembers = assignments.map((a: any) => ({
        id: a.user.id,
        name: `${a.user.profile?.firstName || ''} ${a.user.profile?.lastName || ''}`.trim() || a.user.username || 'Unknown',
        avatarUrl: a.user.profile?.avatarUrl || null,
        category: a.user.profile?.category || null,
        role: a.role,
    }));

    // ── Build project manager info ──
    const pmInfo = project.projectManager ? {
        id: project.projectManager.id,
        name: `${project.projectManager.profile?.firstName || ''} ${project.projectManager.profile?.lastName || ''}`.trim() || project.projectManager.username || 'Unassigned',
        avatarUrl: project.projectManager.profile?.avatarUrl || null,
    } : null;

    // ── Format sprints for sidebar list ──
    const sprintsSummary = sprints.map((s: any) => {
        const objectives: any[] = s.objectives || [];
        const tasks: any[] = s.tasks || [];
        const sprintDeliverables: any[] = s.sprintDeliverables || [];

        const objectivesCompleted = objectives.filter((o: any) => o.isCompleted).length;
        const objectivesTotal = objectives.length;
        const tasksCompleted = tasks.filter((t: any) => t.status === 'DONE').length;
        const tasksTotal = tasks.length;

        return {
            id: s.id,
            sprintNumber: s.sprintNumber,
            title: s.title,
            description: s.description,
            progress: Math.round(s.progress),
            status: s.status,
            startDate: s.startDate,
            dueDate: s.dueDate,
            budget: s.budget,
            teamAvatars: teamMembers.slice(0, 4).map((m: any) => m.avatarUrl),
            objectivesCompleted,
            objectivesTotal,
            tasksCompleted,
            tasksTotal,
            deliverablesCount: sprintDeliverables.length,
            deliverablesSubmitted: sprintDeliverables.filter((d: any) => d.status !== 'PENDING').length,
        };
    });

    // ── Format timeline ──
    const formatDate = (d: Date | null) => {
        if (!d) return null;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    res.status(200).json({
        success: true,
        data: {
            project: {
                id: project.id,
                title: project.title,
                versionLabel: project.versionLabel,
                status: project.status,
                overallProgress: Math.round(weightedProgress),
                totalBudget: project.totalBudget,
                budgetUsed: computedBudgetUsed > 0 ? computedBudgetUsed : project.budgetUsed,
                timeline: {
                    start: formatDate(project.timelineStart),
                    end: formatDate(project.timelineEnd),
                    startDate: project.timelineStart,
                    endDate: project.timelineEnd,
                },
                projectManager: pmInfo,
                teamSize: teamMembers.length,
                teamMembers,
            },
            nextMilestone: activeSprint ? {
                sprintId: activeSprint.id,
                sprintTitle: `Sprint ${activeSprint.sprintNumber}: ${activeSprint.title}`,
                progress: Math.round(activeSprint.progress),
                deadline: formatDate(activeSprint.dueDate),
                deadlineDate: activeSprint.dueDate,
            } : null,
            sprints: sprintsSummary,
            sprintCount: sprints.length,
        },
    });
});


/**
 * GET /api/client/projects/:projectId/sprints/:sprintId
 *
 * Returns the full sprint board detail:
 *  - Sprint info, status, dates
 *  - Payment status
 *  - Objectives (key objectives checklist)
 *  - Deliverables (work delivered list)
 *  - Reviews & Comments
 *  - Progress summary
 */
export const getSprintBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const projectId = req.params.projectId as string;
    const sprintId = req.params.sprintId as string;

    if (!userId) throw new AppError('Unauthorized', 401);

    // Verify project access
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { clientId: true, id: true, title: true }
    });

    if (!project) throw new AppError('Project not found', 404);

    const isOwner = project.clientId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        throw new AppError('Unauthorized', 403);
    }

    const sprint = await prisma.projectSprint.findUnique({
        where: { id: sprintId },
        include: {
            objectives: { orderBy: { order: 'asc' } },
            sprintDeliverables: { orderBy: { createdAt: 'desc' } },
            payment: true,
            reviews: { orderBy: { createdAt: 'desc' } },
            comments: { orderBy: { createdAt: 'asc' } },
            tasks: { orderBy: { createdAt: 'asc' } },
            activities: { orderBy: { createdAt: 'asc' } },
        }
    });

    if (!sprint) throw new AppError('Sprint not found', 404);
    if (sprint.projectId !== projectId) throw new AppError('Sprint does not belong to this project', 400);

    // ── Collect ALL user IDs we need to resolve (deliverable authors, comment authors, review authors, activity actors) ──
    const sprintDeliverables: any[] = sprint.sprintDeliverables || [];
    const comments: any[] = sprint.comments || [];
    const reviews: any[] = sprint.reviews || [];
    const activities: any[] = sprint.activities || [];

    const allUserIds = [
        ...comments.map((c: any) => c.authorId),
        ...reviews.map((r: any) => r.reviewerId),
        ...sprintDeliverables.map((d: any) => d.authorId).filter(Boolean),
        ...activities.map((a: any) => a.actorId).filter(Boolean),
    ];
    const uniqueUserIds = [...new Set(allUserIds)] as string[];

    const users = uniqueUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: uniqueUserIds } },
            select: {
                id: true,
                username: true,
                role: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
            }
        })
        : [];

    const userMap = new Map((users as any[]).map((u: any) => [u.id, {
        id: u.id,
        firstName: u.profile?.firstName || '',
        lastName: u.profile?.lastName || '',
        name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.username || 'Unknown',
        avatarUrl: u.profile?.avatarUrl || null,
        role: u.role,
    }]));

    // ── Compute progress summary ──
    const deliverablesSubmitted = sprintDeliverables.filter((d: any) => d.status !== 'PENDING').length;
    const deliverablesTotal = sprintDeliverables.length;

    // Duration calculation
    let sprintDuration = sprint.duration || null;
    if (!sprintDuration && sprint.startDate && sprint.dueDate) {
        const totalDays = Math.ceil((sprint.dueDate.getTime() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.ceil((Date.now() - sprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
        sprintDuration = `${Math.min(elapsedDays, totalDays)} of ${totalDays} days`;
    }

    // Team velocity indicator
    const tasks: any[] = sprint.tasks || [];
    const tasksCompleted = tasks.filter((t: any) => t.status === 'DONE').length;
    const tasksTotal = tasks.length;
    let teamVelocity = 'Not started';
    if (tasksTotal > 0) {
        const completionRatio = tasksCompleted / tasksTotal;
        if (completionRatio >= 0.8) teamVelocity = 'On track';
        else if (completionRatio >= 0.5) teamVelocity = 'Moderate';
        else if (completionRatio > 0) teamVelocity = 'Behind schedule';
    }

    // ── Payment info (with paidAt + createdAt) ──
    const paymentInfo = sprint.payment ? {
        id: sprint.payment.id,
        totalAmount: sprint.payment.totalAmount,
        amountPaid: sprint.payment.amountPaid,
        percentPaid: sprint.payment.totalAmount > 0
            ? Math.round((sprint.payment.amountPaid / sprint.payment.totalAmount) * 100)
            : 0,
        remaining: sprint.payment.totalAmount - sprint.payment.amountPaid,
        status: sprint.payment.status,
        receiptUrl: sprint.payment.receiptUrl,
        transactionRef: sprint.payment.transactionRef,
        paidAt: sprint.payment.paidAt,
        createdAt: sprint.payment.createdAt,
    } : null;

    // ── Determine clientApproved and approvedAt from reviews ──
    const approvalReview = reviews.find((r: any) => r.action === 'APPROVED');
    const latestChangeRequest = reviews.find((r: any) => r.action === 'CHANGES_REQUESTED');

    const objectives: any[] = sprint.objectives || [];

    // ── Build the flattened response matching frontend expectation ──
    res.status(200).json({
        success: true,
        data: {
            id: sprint.id,
            projectId: sprint.projectId,
            sprintNumber: sprint.sprintNumber,
            title: sprint.title,
            description: sprint.description,
            richText: sprint.richText,
            status: sprint.status,
            progress: Math.round(sprint.progress),
            startDate: sprint.startDate,
            endDate: sprint.dueDate,
            duration: sprintDuration,
            budget: sprint.budget,
            clientApproved: sprint.status === 'APPROVED',
            approvedAt: approvalReview?.createdAt || null,
            changeRequestNote: latestChangeRequest?.comment || null,

            // 1. Objectives array
            objectives: objectives.map((o: any) => ({
                id: o.id,
                title: o.title,
                description: o.description,
                isCompleted: o.isCompleted,
            })),

            // 2. Sprint Deliverables with author info
            sprintDeliverables: sprintDeliverables.map((d: any) => {
                const author = d.authorId ? userMap.get(d.authorId) : null;
                return {
                    id: d.id,
                    title: d.title,
                    description: d.description,
                    type: d.type,
                    status: d.status,
                    fileUrl: d.fileUrl,
                    fileName: d.fileName,
                    fileSize: d.fileSize,
                    commitCount: d.commitCount,
                    author: author ? {
                        id: author.id,
                        firstName: author.firstName,
                        lastName: author.lastName,
                        avatarUrl: author.avatarUrl,
                    } : null,
                    createdAt: d.createdAt,
                };
            }),

            // 3. Payment + budget
            payment: paymentInfo,

            // 4. Activity Log with actor info
            activityLog: activities.map((a: any) => {
                const actor = a.actorId ? userMap.get(a.actorId) : null;
                return {
                    id: a.id,
                    type: a.type,
                    description: a.description,
                    createdAt: a.createdAt,
                    actor: actor ? {
                        firstName: actor.firstName,
                        lastName: actor.lastName,
                        avatarUrl: actor.avatarUrl,
                    } : null,
                };
            }),

            // Tasks (for Kanban / progress)
            tasks: tasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                progress: t.progress,
            })),

            // Reviews & Comments (kept for backward compat)
            reviews: reviews.map((r: any) => ({
                id: r.id,
                action: r.action,
                comment: r.comment,
                reviewer: userMap.get(r.reviewerId) ? {
                    id: userMap.get(r.reviewerId)!.id,
                    name: userMap.get(r.reviewerId)!.name,
                    avatarUrl: userMap.get(r.reviewerId)!.avatarUrl,
                    role: userMap.get(r.reviewerId)!.role,
                } : { id: r.reviewerId, name: 'Unknown' },
                createdAt: r.createdAt,
            })),
            comments: comments.map((c: any) => ({
                id: c.id,
                content: c.content,
                author: userMap.get(c.authorId) ? {
                    id: userMap.get(c.authorId)!.id,
                    name: userMap.get(c.authorId)!.name,
                    avatarUrl: userMap.get(c.authorId)!.avatarUrl,
                    role: userMap.get(c.authorId)!.role,
                } : { id: c.authorId, name: 'Unknown' },
                createdAt: c.createdAt,
            })),

            // Progress summary
            progressSummary: {
                deliverablesSubmitted: `${deliverablesSubmitted} of ${deliverablesTotal} completed`,
                deliverablesSubmittedCount: deliverablesSubmitted,
                deliverablesTotalCount: deliverablesTotal,
                tasksCompleted: `${tasksCompleted} of ${tasksTotal}`,
                tasksCompletedCount: tasksCompleted,
                tasksTotalCount: tasksTotal,
                sprintDuration,
                teamVelocity,
            },
        },
    });
});


/**
 * POST /api/client/sprints/:sprintId/approve
 *
 * Client approves a sprint. This:
 *  1. Creates a review record with APPROVED action
 *  2. Updates the sprint status to APPROVED
 *  3. Notifies admin
 */
export const approveSprint = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sprintId = req.params.sprintId as string;
    const { comment } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);

    const sprint = await prisma.projectSprint.findUnique({
        where: { id: sprintId },
        include: { project: true }
    });

    if (!sprint) throw new AppError('Sprint not found', 404);

    // Only the project client or admin can approve
    const isOwner = sprint.project.clientId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        throw new AppError('Only the project client can approve sprints', 403);
    }

    if (sprint.status !== 'IN_REVIEW') {
        throw new AppError('Sprint must be in review status to approve', 400);
    }

    // Create review record and update sprint status in transaction
    const [review, updatedSprint] = await prisma.$transaction([
        prisma.sprintReview.create({
            data: {
                sprintId,
                reviewerId: userId,
                action: 'APPROVED',
                comment: comment || null,
            }
        }),
        prisma.projectSprint.update({
            where: { id: sprintId },
            data: {
                status: 'APPROVED',
                progress: 100,
            }
        })
    ]);

    // Notify admin (non-blocking)
    try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins as any[]) {
            await prisma.notification.create({
                data: {
                    userId: admin.id,
                    title: '✅ Sprint Approved by Client',
                    message: `Sprint "${sprint.title}" in project "${sprint.project.title}" has been approved by the client.`,
                    type: 'TASK',
                    link: `/admin/projects/${sprint.projectId}`,
                }
            });
        }
    } catch (err) {
        console.error('[Client Dashboard] Notification failed:', err);
    }

    res.status(200).json({
        success: true,
        message: 'Sprint approved successfully',
        data: { review, sprint: updatedSprint },
    });
});


/**
 * POST /api/client/sprints/:sprintId/request-changes
 *
 * Client requests changes on a sprint.
 */
export const requestSprintChanges = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sprintId = req.params.sprintId as string;
    const { comment } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!comment) throw new AppError('A comment explaining the requested changes is required', 400);

    const sprint = await prisma.projectSprint.findUnique({
        where: { id: sprintId },
        include: { project: true }
    });

    if (!sprint) throw new AppError('Sprint not found', 404);

    const isOwner = sprint.project.clientId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        throw new AppError('Only the project client can request changes', 403);
    }

    if (sprint.status !== 'IN_REVIEW') {
        throw new AppError('Sprint must be in review status to request changes', 400);
    }

    // Create review record and set sprint back to ACTIVE status
    const [review, updatedSprint] = await prisma.$transaction([
        prisma.sprintReview.create({
            data: {
                sprintId,
                reviewerId: userId,
                action: 'CHANGES_REQUESTED',
                comment,
            }
        }),
        prisma.projectSprint.update({
            where: { id: sprintId },
            data: { status: 'ACTIVE' }
        })
    ]);

    // Notify admin (non-blocking)
    try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins as any[]) {
            await prisma.notification.create({
                data: {
                    userId: admin.id,
                    title: '⚠️ Changes Requested on Sprint',
                    message: `Client requested changes on sprint "${sprint.title}" in project "${sprint.project.title}": ${comment}`,
                    type: 'TASK',
                    link: `/admin/projects/${sprint.projectId}`,
                }
            });
        }
    } catch (err) {
        console.error('[Client Dashboard] Notification failed:', err);
    }

    res.status(200).json({
        success: true,
        message: 'Changes requested successfully',
        data: { review, sprint: updatedSprint },
    });
});


/**
 * POST /api/client/sprints/:sprintId/comments
 *
 * Client adds a comment/feedback on a sprint.
 */
export const addSprintComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sprintId = req.params.sprintId as string;
    const { content } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!content) throw new AppError('Comment content is required', 400);

    const sprint = await prisma.projectSprint.findUnique({
        where: { id: sprintId },
        include: { project: true }
    });

    if (!sprint) throw new AppError('Sprint not found', 404);

    // Authorization: Client owner or admin
    const isOwner = sprint.project.clientId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        throw new AppError('Unauthorized', 403);
    }

    const comment = await prisma.sprintComment.create({
        data: {
            sprintId,
            authorId: userId,
            content,
        }
    });

    res.status(201).json({
        success: true,
        data: comment,
    });
});


/**
 * GET /api/client/sprints/:sprintId/comments
 *
 * Get all comments for a sprint.
 */
export const getSprintComments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sprintId = req.params.sprintId as string;

    if (!userId) throw new AppError('Unauthorized', 401);

    const sprint = await prisma.projectSprint.findUnique({
        where: { id: sprintId },
        include: { project: { select: { clientId: true } } }
    });

    if (!sprint) throw new AppError('Sprint not found', 404);

    const isOwner = sprint.project.clientId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
        throw new AppError('Unauthorized', 403);
    }

    const comments = await prisma.sprintComment.findMany({
        where: { sprintId },
        orderBy: { createdAt: 'asc' },
    });

    // Resolve authors
    const authorIds = [...new Set((comments as any[]).map((c: any) => c.authorId))] as string[];
    const authors = authorIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: {
                id: true,
                username: true,
                role: true,
                profile: { select: { firstName: true, lastName: true, avatarUrl: true } }
            }
        })
        : [];
    const authorMap = new Map((authors as any[]).map((a: any) => [a.id, {
        id: a.id,
        name: `${a.profile?.firstName || ''} ${a.profile?.lastName || ''}`.trim() || a.username || 'Unknown',
        avatarUrl: a.profile?.avatarUrl || null,
        role: a.role,
    }]));

    res.status(200).json({
        success: true,
        count: (comments as any[]).length,
        data: (comments as any[]).map((c: any) => ({
            ...c,
            author: authorMap.get(c.authorId) || { id: c.authorId, name: 'Unknown' },
        })),
    });
});


/**
 * GET /api/projects/:projectId/progress
 *
 * Computed project progress & stats.
 * Available to project client, admin, and assigned professionals.
 */
export const getProjectProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const projectId = req.params.projectId as string;

    if (!userId) throw new AppError('Unauthorized', 401);

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            sprints: {
                include: {
                    objectives: true,
                    sprintDeliverables: true,
                    payment: true,
                    tasks: true,
                },
                orderBy: { order: 'asc' },
            },
            assignments: { select: { userId: true, status: true } },
        }
    });

    if (!project) throw new AppError('Project not found', 404);

    // Authorization check
    const isOwner = project.clientId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    const isAssigned = (project.assignments as any[]).some((a: any) => a.userId === userId && ['ACTIVE', 'ACCEPTED', 'ASSIGNED'].includes(a.status));
    if (!isOwner && !isAdmin && !isAssigned) {
        throw new AppError('Unauthorized', 403);
    }

    // Compute overview stats
    const sprints: any[] = project.sprints || [];
    const totalSprints = sprints.length;
    const completedSprints = sprints.filter((s: any) => s.status === 'COMPLETED' || s.status === 'APPROVED').length;
    const activeSprints = sprints.filter((s: any) => s.status === 'ACTIVE' || s.status === 'IN_REVIEW').length;

    const totalObjectives = sprints.reduce((sum: number, s: any) => sum + (s.objectives?.length || 0), 0);
    const completedObjectives = sprints.reduce((sum: number, s: any) => sum + (s.objectives?.filter((o: any) => o.isCompleted)?.length || 0), 0);

    const totalDeliverables = sprints.reduce((sum: number, s: any) => sum + (s.sprintDeliverables?.length || 0), 0);
    const submittedDeliverables = sprints.reduce((sum: number, s: any) => sum + (s.sprintDeliverables?.filter((d: any) => d.status !== 'PENDING')?.length || 0), 0);

    const totalTasks = sprints.reduce((sum: number, s: any) => sum + (s.tasks?.length || 0), 0);
    const completedTasks = sprints.reduce((sum: number, s: any) => sum + (s.tasks?.filter((t: any) => t.status === 'DONE')?.length || 0), 0);

    const totalBudget = project.totalBudget || sprints.reduce((sum: number, s: any) => sum + s.budget, 0);
    const totalPaid = sprints.reduce((sum: number, s: any) => sum + (s.payment?.amountPaid || 0), 0);

    // Weighted progress
    const totalWeight = sprints.reduce((sum: number, s: any) => sum + s.projectWeight, 0);
    const overallProgress = totalWeight > 0
        ? sprints.reduce((sum: number, s: any) => sum + (s.progress * s.projectWeight / 100), 0) / totalWeight * 100
        : totalSprints > 0
            ? sprints.reduce((sum: number, s: any) => sum + s.progress, 0) / totalSprints
            : 0;

    res.status(200).json({
        success: true,
        data: {
            overallProgress: Math.round(overallProgress),
            sprints: { total: totalSprints, completed: completedSprints, active: activeSprints },
            objectives: { total: totalObjectives, completed: completedObjectives },
            deliverables: { total: totalDeliverables, submitted: submittedDeliverables },
            tasks: { total: totalTasks, completed: completedTasks },
            budget: { total: totalBudget, paid: totalPaid, remaining: totalBudget - totalPaid },
        },
    });
});
