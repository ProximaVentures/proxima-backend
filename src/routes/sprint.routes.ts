import { Router } from 'express';
import * as sprintController from '../controllers/sprint.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Base Path: /api/projects/:projectId/sprints or /api/admin/sprints
// But we will mount this at /api/sprints, or within project routes, or direct.
// Let's mount it at /api/projects as an extension? 
// No, standard is mounting at /api/sprints and /api/projects/:projectId/sprints

// --- Public/Authenticated routes (Getting Sprints) --- //
router.get(
    '/projects/:projectId/sprints',
    protect,
    sprintController.getProjectSprints
);

// --- Admin routes (Managing Sprints) --- //
router.post(
    '/admin/projects/:projectId/sprint',
    protect,
    authorize(Role.ADMIN),
    sprintController.createSprint
);

router.put(
    '/admin/sprint/:id',
    protect,
    authorize(Role.ADMIN),
    sprintController.updateSprint
);

router.delete(
    '/admin/sprint/:id',
    protect,
    authorize(Role.ADMIN),
    sprintController.deleteSprint
);

export default router;
