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
        where: { id: taskId },
        include: { project: true }
    });

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
        where: { id: taskId },
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
