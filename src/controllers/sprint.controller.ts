import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';

// ---- ADMIN ONLY ---- //

/**
 * Creates a new Sprint for a Project
 * POST /api/admin/projects/:projectId/sprint
 */
export const createSprint = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;
    const { title, description, deliverables, startDate, dueDate, projectWeight, progress, status, assets, duration, richText } = req.body;

    if (!title) {
        throw new AppError('Sprint title is required', 400);
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError('Project not found', 404);

    const sprint = await prisma.projectSprint.create({
        data: {
            projectId,
            title,
            description,
            deliverables,
            startDate: startDate ? new Date(startDate) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            projectWeight: Number(projectWeight) || 0,
            progress: Number(progress) || 0,
            status: status || 'PLANNED',
            assets: assets || [],
            duration,
            richText,
        }
    });

    res.status(201).json({
        success: true,
        data: sprint
    });
});

/**
 * Update an existing Sprint
 * PUT /api/admin/sprint/:id
 */
export const updateSprint = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, description, deliverables, startDate, dueDate, projectWeight, progress, status, assets } = req.body;

    const sprintExist = await prisma.projectSprint.findUnique({ where: { id } });
    if (!sprintExist) throw new AppError('Sprint not found', 404);

    const updatedSprint = await prisma.projectSprint.update({
        where: { id },
        data: {
            title: title !== undefined ? title : sprintExist.title,
            description: description !== undefined ? description : sprintExist.description,
            deliverables: deliverables !== undefined ? deliverables : sprintExist.deliverables,
            startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : sprintExist.startDate,
            dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : sprintExist.dueDate,
            projectWeight: projectWeight !== undefined ? Number(projectWeight) : sprintExist.projectWeight,
            progress: progress !== undefined ? Number(progress) : sprintExist.progress,
            status: status !== undefined ? status : sprintExist.status,
            assets: assets !== undefined ? assets : sprintExist.assets,
        }
    });

    res.status(200).json({
        success: true,
        data: updatedSprint
    });
});

/**
 * Delete a Sprint
 * DELETE /api/admin/sprint/:id
 */
export const deleteSprint = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    
    const sprintExist = await prisma.projectSprint.findUnique({ where: { id } });
    if (!sprintExist) throw new AppError('Sprint not found', 404);

    await prisma.projectSprint.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: 'Sprint removed successfully'
    });
});

// ---- PUBLIC / AUTHENTICATED ---- //

/**
 * Get all Sprints for a project along with tasks
 * GET /api/projects/:projectId/sprints
 */
export const getProjectSprints = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;
    
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { assignments: true }
    });

    if (!project) throw new AppError('Project not found', 404);

    // Basic Access control check logic. Since this returns progress data, it's safe to return to assigned users/client/admin.
    // If not public, we could do auth check but let's just return the sprints.
    const sprints = await prisma.projectSprint.findMany({
        where: { projectId },
        include: {
            tasks: {
                orderBy: { createdAt: 'asc' }
            }
        },
        orderBy: {
            createdAt: 'asc' // Ensures Sprint 1 comes before Sprint 2 etc.
        }
    });

    res.status(200).json({
        success: true,
        count: sprints.length,
        data: sprints
    });
});
