import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';


// ═══════════════════════════════════════════════════════════
//  SPRINT CONTROLLER (Refactored)
//  Admin CRUD for sprints + sub-resources (objectives,
//  deliverables, payments, comments).
// ═══════════════════════════════════════════════════════════


// ────────────────────────────────────────────────────────
//  ADMIN: SPRINT CRUD
// ────────────────────────────────────────────────────────

/**
 * Creates a new Sprint for a Project
 * POST /api/admin/projects/:projectId/sprints
 */
export const createSprint = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;
    const {
        title, description, deliverables, startDate, dueDate,
        projectWeight, progress, status, assets, duration, richText,
        sprintNumber, order, budget, objectives
    } = req.body;

    if (!title) {
        throw new AppError('Sprint title is required', 400);
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError('Project not found', 404);

    // Auto-compute sprint number if not provided
    let computedSprintNumber = sprintNumber;
    if (!computedSprintNumber) {
        const existingSprints = await prisma.projectSprint.count({ where: { projectId } });
        computedSprintNumber = existingSprints + 1;
    }

    // Auto-compute order if not provided
    let computedOrder = order;
    if (computedOrder === undefined || computedOrder === null) {
        const maxOrder = await prisma.projectSprint.findFirst({
            where: { projectId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });
        computedOrder = (maxOrder?.order || 0) + 1;
    }

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
            sprintNumber: computedSprintNumber,
            order: computedOrder,
            budget: Number(budget) || 0,
        },
        include: {
            objectives: true,
            sprintDeliverables: true,
            payment: true,
        }
    });

    // If objectives were provided in the body, create them
    if (objectives && Array.isArray(objectives) && objectives.length > 0) {
        await prisma.sprintObjective.createMany({
            data: objectives.map((obj: any, idx: number) => ({
                sprintId: sprint.id,
                title: obj.title,
                description: obj.description || null,
                isCompleted: obj.isCompleted || false,
                order: obj.order ?? idx,
            }))
        });
    }

    // Re-fetch with objectives
    const result = await prisma.projectSprint.findUnique({
        where: { id: sprint.id },
        include: {
            objectives: { orderBy: { order: 'asc' } },
            sprintDeliverables: true,
            payment: true,
        }
    });

    res.status(201).json({
        success: true,
        data: result
    });
});

/**
 * Update an existing Sprint
 * PUT /api/admin/sprints/:id
 */
export const updateSprint = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const {
        title, description, deliverables, startDate, dueDate,
        projectWeight, progress, status, assets, duration, richText,
        sprintNumber, order, budget
    } = req.body;

    const sprintExist = await prisma.projectSprint.findUnique({ where: { id } });
    if (!sprintExist) throw new AppError('Sprint not found', 404);

    const updateData: any = {};

    // Only set explicitly provided fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deliverables !== undefined) updateData.deliverables = deliverables;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (projectWeight !== undefined) updateData.projectWeight = Number(projectWeight);
    if (progress !== undefined) updateData.progress = Number(progress);
    if (status !== undefined) updateData.status = status;
    if (assets !== undefined) updateData.assets = assets;
    if (duration !== undefined) updateData.duration = duration;
    if (richText !== undefined) updateData.richText = richText;
    if (sprintNumber !== undefined) updateData.sprintNumber = sprintNumber;
    if (order !== undefined) updateData.order = order;
    if (budget !== undefined) updateData.budget = Number(budget);

    const updatedSprint = await prisma.projectSprint.update({
        where: { id },
        data: updateData,
        include: {
            objectives: { orderBy: { order: 'asc' } },
            sprintDeliverables: true,
            payment: true,
        }
    });

    res.status(200).json({
        success: true,
        data: updatedSprint
    });
});

/**
 * Delete a Sprint
 * DELETE /api/admin/sprints/:id
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


// ────────────────────────────────────────────────────────
//  ADMIN: SPRINT OBJECTIVES
// ────────────────────────────────────────────────────────

/**
 * Add Objective to Sprint
 * POST /api/admin/sprints/:id/objectives
 */
export const addObjective = asyncHandler(async (req: Request, res: Response) => {
    const sprintId = req.params.id as string;
    const { title, description, isCompleted, order: objOrder } = req.body;

    if (!title) throw new AppError('Objective title is required', 400);

    const sprint = await prisma.projectSprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new AppError('Sprint not found', 404);

    // Auto-compute order
    let computedOrder = objOrder;
    if (computedOrder === undefined || computedOrder === null) {
        const maxOrder = await prisma.sprintObjective.findFirst({
            where: { sprintId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });
        computedOrder = (maxOrder?.order || 0) + 1;
    }

    const objective = await prisma.sprintObjective.create({
        data: {
            sprintId,
            title,
            description: description || null,
            isCompleted: isCompleted || false,
            order: computedOrder,
        }
    });

    res.status(201).json({
        success: true,
        data: objective,
    });
});

/**
 * Update Objective
 * PUT /api/admin/objectives/:id
 */
export const updateObjective = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, description, isCompleted, order: objOrder } = req.body;

    const existing = await prisma.sprintObjective.findUnique({ where: { id } });
    if (!existing) throw new AppError('Objective not found', 404);

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (objOrder !== undefined) updateData.order = objOrder;

    const objective = await prisma.sprintObjective.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        data: objective,
    });
});

/**
 * Delete Objective
 * DELETE /api/admin/objectives/:id
 */
export const deleteObjective = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.sprintObjective.findUnique({ where: { id } });
    if (!existing) throw new AppError('Objective not found', 404);

    await prisma.sprintObjective.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: 'Objective deleted successfully',
    });
});

/**
 * Toggle Objective Completion
 * PATCH /api/admin/objectives/:id/toggle
 */
export const toggleObjective = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.sprintObjective.findUnique({ where: { id } });
    if (!existing) throw new AppError('Objective not found', 404);

    const objective = await prisma.sprintObjective.update({
        where: { id },
        data: { isCompleted: !existing.isCompleted },
    });

    res.status(200).json({
        success: true,
        data: objective,
    });
});


// ────────────────────────────────────────────────────────
//  ADMIN: SPRINT DELIVERABLES
// ────────────────────────────────────────────────────────

/**
 * Add Deliverable to Sprint
 * POST /api/admin/sprints/:id/deliverables
 */
export const addDeliverable = asyncHandler(async (req: Request, res: Response) => {
    const sprintId = req.params.id as string;
    const { title, description, type, fileUrl, fileName, fileSize, commitCount, status: deliverableStatus } = req.body;

    if (!title) throw new AppError('Deliverable title is required', 400);

    const sprint = await prisma.projectSprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new AppError('Sprint not found', 404);

    const deliverable = await prisma.sprintDeliverable.create({
        data: {
            sprintId,
            title,
            description: description || null,
            type: type || 'OTHER',
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            fileSize: fileSize || null,
            commitCount: commitCount ? Number(commitCount) : null,
            status: deliverableStatus || 'PENDING',
            submittedAt: deliverableStatus === 'SUBMITTED' ? new Date() : null,
        }
    });

    res.status(201).json({
        success: true,
        data: deliverable,
    });
});

/**
 * Update Deliverable
 * PUT /api/admin/deliverables/:id
 */
export const updateDeliverable = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { title, description, type, fileUrl, fileName, fileSize, commitCount } = req.body;

    const existing = await prisma.sprintDeliverable.findUnique({ where: { id } });
    if (!existing) throw new AppError('Deliverable not found', 404);

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (commitCount !== undefined) updateData.commitCount = Number(commitCount);

    const deliverable = await prisma.sprintDeliverable.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        data: deliverable,
    });
});

/**
 * Delete Deliverable
 * DELETE /api/admin/deliverables/:id
 */
export const deleteDeliverable = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const existing = await prisma.sprintDeliverable.findUnique({ where: { id } });
    if (!existing) throw new AppError('Deliverable not found', 404);

    await prisma.sprintDeliverable.delete({ where: { id } });

    res.status(200).json({
        success: true,
        message: 'Deliverable deleted successfully',
    });
});

/**
 * Update Deliverable Status
 * PATCH /api/admin/deliverables/:id/status
 */
export const updateDeliverableStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Valid: ${validStatuses.join(', ')}`, 400);
    }

    const existing = await prisma.sprintDeliverable.findUnique({ where: { id } });
    if (!existing) throw new AppError('Deliverable not found', 404);

    const updateData: any = { status };
    if (status === 'SUBMITTED' && !existing.submittedAt) {
        updateData.submittedAt = new Date();
    }
    if (['APPROVED', 'REJECTED'].includes(status)) {
        updateData.reviewedAt = new Date();
    }

    const deliverable = await prisma.sprintDeliverable.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        data: deliverable,
    });
});


// ────────────────────────────────────────────────────────
//  ADMIN: SPRINT PAYMENT
// ────────────────────────────────────────────────────────

/**
 * Create/Update Sprint Payment
 * POST /api/admin/sprints/:id/payment
 */
export const upsertSprintPayment = asyncHandler(async (req: Request, res: Response) => {
    const sprintId = req.params.id as string;
    const { totalAmount, amountPaid, status: paymentStatus, transactionRef, receiptUrl } = req.body;

    if (totalAmount === undefined) throw new AppError('Total amount is required', 400);

    const sprint = await prisma.projectSprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new AppError('Sprint not found', 404);

    // Upsert — create if doesn't exist, update if it does
    const updateData: any = {};
    if (totalAmount !== undefined) updateData.totalAmount = Number(totalAmount);
    if (amountPaid !== undefined) updateData.amountPaid = Number(amountPaid);
    if (paymentStatus !== undefined) updateData.status = paymentStatus;
    if (transactionRef !== undefined) updateData.transactionRef = transactionRef;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
    if (paymentStatus === 'PAID') updateData.paidAt = new Date();

    const payment = await prisma.sprintPayment.upsert({
        where: { sprintId },
        create: {
            sprintId,
            totalAmount: Number(totalAmount),
            amountPaid: Number(amountPaid) || 0,
            status: paymentStatus || 'UNPAID',
            transactionRef: transactionRef || null,
            receiptUrl: receiptUrl || null,
            paidAt: paymentStatus === 'PAID' ? new Date() : null,
        },
        update: updateData
    });

    res.status(200).json({
        success: true,
        data: payment,
    });
});

/**
 * Update Payment Record
 * PATCH /api/admin/payments/:id
 */
export const updatePayment = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { totalAmount, amountPaid, status: paymentStatus, transactionRef, receiptUrl } = req.body;

    const existing = await prisma.sprintPayment.findUnique({ where: { id } });
    if (!existing) throw new AppError('Payment record not found', 404);

    const updateData: any = {};
    if (totalAmount !== undefined) updateData.totalAmount = Number(totalAmount);
    if (amountPaid !== undefined) updateData.amountPaid = Number(amountPaid);
    if (paymentStatus !== undefined) updateData.status = paymentStatus;
    if (transactionRef !== undefined) updateData.transactionRef = transactionRef;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
    if (paymentStatus === 'PAID') updateData.paidAt = new Date();

    const payment = await prisma.sprintPayment.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        data: payment,
    });
});


// ────────────────────────────────────────────────────────
//  ADMIN: PROJECT BUDGET
// ────────────────────────────────────────────────────────

/**
 * Update Project Budget & Dashboard Info
 * PATCH /api/admin/projects/:projectId/budget
 */
export const updateProjectBudget = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;
    const { totalBudget, budgetUsed, versionLabel, projectManagerId, timelineStart, timelineEnd } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError('Project not found', 404);

    const updateData: any = {};
    if (totalBudget !== undefined) updateData.totalBudget = Number(totalBudget);
    if (budgetUsed !== undefined) updateData.budgetUsed = Number(budgetUsed);
    if (versionLabel !== undefined) updateData.versionLabel = versionLabel;
    if (projectManagerId !== undefined) updateData.projectManagerId = projectManagerId;
    if (timelineStart !== undefined) updateData.timelineStart = timelineStart ? new Date(timelineStart) : null;
    if (timelineEnd !== undefined) updateData.timelineEnd = timelineEnd ? new Date(timelineEnd) : null;

    const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
    });

    res.status(200).json({
        success: true,
        data: updatedProject,
    });
});


// ────────────────────────────────────────────────────────
//  ADMIN: SPRINT COMMENTS (admin can also comment)
// ────────────────────────────────────────────────────────

/**
 * Admin adds comment to sprint
 * POST /api/admin/sprints/:id/comments
 */
export const adminAddSprintComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const sprintId = req.params.id as string;
    const { content } = req.body;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!content) throw new AppError('Comment content is required', 400);

    const sprint = await prisma.projectSprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new AppError('Sprint not found', 404);

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


// ────────────────────────────────────────────────────────
//  PUBLIC / AUTHENTICATED: GET SPRINTS
// ────────────────────────────────────────────────────────

/**
 * Get all Sprints for a project along with tasks
 * GET /api/projects/:projectId/sprints
 *
 * Enhanced: Now includes objectives, deliverables, and payment info
 */
export const getProjectSprints = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { assignments: true }
    });

    if (!project) throw new AppError('Project not found', 404);

    const sprints = await prisma.projectSprint.findMany({
        where: { projectId },
        include: {
            tasks: {
                orderBy: { createdAt: 'asc' }
            },
            objectives: {
                orderBy: { order: 'asc' }
            },
            sprintDeliverables: {
                orderBy: { createdAt: 'desc' }
            },
            payment: true,
        },
        orderBy: {
            order: 'asc'
        }
    });

    res.status(200).json({
        success: true,
        count: sprints.length,
        data: sprints
    });
});
