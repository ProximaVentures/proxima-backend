import { Router } from 'express';
import * as sprintController from '../controllers/sprint.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// ═══════════════════════════════════════════════════════════
//  SPRINT ROUTES (Refactored)
//  Base: /api  (mounted in index.ts)
//
//  Public:     GET /api/projects/:projectId/sprints
//  Admin:      /api/admin/... (all sprint management)
// ═══════════════════════════════════════════════════════════

// ── Public/Authenticated: Get Sprints ──
router.get(
    '/projects/:projectId/sprints',
    protect,
    sprintController.getProjectSprints
);

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES — Sprint CRUD
// ═══════════════════════════════════════════════════════════

router.post(
    '/admin/projects/:projectId/sprints',
    protect, authorize(Role.ADMIN),
    sprintController.createSprint
);

router.put(
    '/admin/sprints/:id',
    protect, authorize(Role.ADMIN),
    sprintController.updateSprint
);

router.delete(
    '/admin/sprints/:id',
    protect, authorize(Role.ADMIN),
    sprintController.deleteSprint
);

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES — Sprint Objectives
// ═══════════════════════════════════════════════════════════

router.post(
    '/admin/sprints/:id/objectives',
    protect, authorize(Role.ADMIN),
    sprintController.addObjective
);

router.put(
    '/admin/objectives/:id',
    protect, authorize(Role.ADMIN),
    sprintController.updateObjective
);

router.delete(
    '/admin/objectives/:id',
    protect, authorize(Role.ADMIN),
    sprintController.deleteObjective
);

router.patch(
    '/admin/objectives/:id/toggle',
    protect, authorize(Role.ADMIN),
    sprintController.toggleObjective
);

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES — Sprint Deliverables
// ═══════════════════════════════════════════════════════════

router.post(
    '/admin/sprints/:id/deliverables',
    protect, authorize(Role.ADMIN),
    sprintController.addDeliverable
);

router.put(
    '/admin/deliverables/:id',
    protect, authorize(Role.ADMIN),
    sprintController.updateDeliverable
);

router.delete(
    '/admin/deliverables/:id',
    protect, authorize(Role.ADMIN),
    sprintController.deleteDeliverable
);

router.patch(
    '/admin/deliverables/:id/status',
    protect, authorize(Role.ADMIN),
    sprintController.updateDeliverableStatus
);

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES — Sprint Payment
// ═══════════════════════════════════════════════════════════

router.post(
    '/admin/sprints/:id/payment',
    protect, authorize(Role.ADMIN),
    sprintController.upsertSprintPayment
);

router.patch(
    '/admin/payments/:id',
    protect, authorize(Role.ADMIN),
    sprintController.updatePayment
);

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES — Project Budget & Dashboard Config
// ═══════════════════════════════════════════════════════════

router.patch(
    '/admin/projects/:projectId/budget',
    protect, authorize(Role.ADMIN),
    sprintController.updateProjectBudget
);

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES — Sprint Comments
// ═══════════════════════════════════════════════════════════

router.post(
    '/admin/sprints/:id/comments',
    protect, authorize(Role.ADMIN),
    sprintController.adminAddSprintComment
);

export default router;
