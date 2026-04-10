import type { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';

/**
 * Report completion of a task (Professional)
 */
export const reportTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const taskId = req.params.id;
    const { content, media, links } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);

    const task = await prisma.projectTask.findUnique({
        where: { id: taskId as string },
        include: { project: true }
    }) as any;

    if (!task) throw new AppError('Task not found', 404);

    // Verify user is assigned to this project or specific task
    // (In this project, professionalIds in task or project assignments)
    const isAssigned = task.professionalIds.includes(userId) ||
        (await prisma.projectAssignment.findUnique({
            where: { projectId_userId: { projectId: task.projectId, userId } }
        }));

    if (!isAssigned) {
        throw new AppError('You are not authorized to report on this task', 403);
    }

    const updatedTask = await prisma.projectTask.update({
        where: { id: taskId as string },
        data: {
            reportContent: content,
            reportMedia: media || [],
            reportLinks: links || [],
            reportedAt: new Date(),
            status: 'IN_REVIEW' // Automatically move to review
        }
    });

    // Notify Admins
    try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins) {
            await prisma.notification.create({
                data: {
                    userId: admin.id,
                    title: 'Task Reported',
                    message: `Professional has reported task: "${task.title}" in project "${task.project.title}"`,
                    type: 'TASK',
                    link: `/admin/projects/${task.projectId}`
                }
            });
        }
    } catch (err) {
        console.error('[Report Task] Notification failed:', err);
    }

    res.status(200).json({
        success: true,
        message: 'Task reported successfully and moved to review.',
        data: updatedTask
    });
});

/**
 * Update task status (Professional)
 * Valid statuses: TODO, IN_PROGRESS, IN_REVIEW, DONE, DO_AGAIN, CANCELLED
 */
export const updateTaskStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const taskId = req.params.id;
    const { status } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!status) throw new AppError('Status is required', 400);

    const task = await prisma.projectTask.findUnique({
        where: { id: taskId as string },
        include: { project: true }
    }) as any;

    if (!task) throw new AppError('Task not found', 404);

    // Verify user is authorized
    const isAssigned = task.professionalIds.includes(userId) ||
        (await prisma.projectAssignment.findUnique({
            where: { projectId_userId: { projectId: task.projectId, userId } }
        }));

    if (!isAssigned) {
        throw new AppError('You are not authorized to update this task', 403);
    }

    const updatedTask = await prisma.projectTask.update({
        where: { id: taskId as string },
        data: { status }
    });

    // Notify Admins if mission started
    if (status === 'IN_PROGRESS') {
        try {
            const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
            for (const admin of admins) {
                await prisma.notification.create({
                    data: {
                        userId: admin.id,
                        title: 'Mission Initialized',
                        message: `Professional has started working on task: "${task.title}" in project "${task.project.title}"`,
                        type: 'TASK',
                        link: `/admin/projects/${task.projectId}`
                    }
                });
            }
        } catch (err) {
            console.error('[Start Mission] Notification failed:', err);
        }
    }

    res.status(200).json({
        success: true,
        message: `Task status updated to ${status}`,
        data: updatedTask
    });
});

/**
 * Send feedback/issue regarding a task (Professional)
 */
export const sendTaskFeedback = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const taskId = req.params.id;
    const { feedback } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!feedback) throw new AppError('Feedback content is required', 400);

    const task = await prisma.projectTask.findUnique({
        where: { id: taskId as string },
        include: { project: true }
    }) as any;

    if (!task) throw new AppError('Task not found', 404);

    // Verify user is authorized
    const isAssigned = task.professionalIds.includes(userId) ||
        (await prisma.projectAssignment.findUnique({
            where: { projectId_userId: { projectId: task.projectId, userId } }
        }));

    if (!isAssigned) {
        throw new AppError('You are not authorized to send feedback for this task', 403);
    }

    // Since ProjectTask doesn't have a feedback field yet, we rely on Notifications
    // But we can also log it to a global 'SystemNotes' if we had one.
    // For now, notification is the primary communication channel.

    try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins) {
            await prisma.notification.create({
                data: {
                    userId: admin.id,
                    title: 'Task Clarification Requested',
                    message: `Strategic question from Professional on task: "${task.title}". Feedback: "${feedback}"`,
                    type: 'TASK',
                    link: `/admin/projects/${task.projectId}`
                }
            });
        }
    } catch (err) {
        console.error('[Task Feedback] Notification failed:', err);
    }

    res.status(200).json({
        success: true,
        message: 'Feedback relayed to Admins successfully.'
    });
});
