import { Router } from 'express';
import * as clientDashboardController from '../controllers/client-dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// ═══════════════════════════════════════════════════════════
//  CLIENT DASHBOARD ROUTES
//  Base Path: /api/client
//  All routes require authentication (CLIENT or ADMIN role)
// ═══════════════════════════════════════════════════════════

router.use(protect);

// ── Project Dashboard Overview ──
router.get(
    '/projects/:projectId/dashboard',
    clientDashboardController.getProjectDashboard
);

// ── Sprint Board Detail ──
router.get(
    '/projects/:projectId/sprints/:sprintId',
    clientDashboardController.getSprintBoard
);

// ── Sprint Actions ──
router.post(
    '/sprints/:sprintId/approve',
    clientDashboardController.approveSprint
);

router.post(
    '/sprints/:sprintId/request-changes',
    clientDashboardController.requestSprintChanges
);

// ── Sprint Comments/Feedback ──
router.post(
    '/sprints/:sprintId/comments',
    clientDashboardController.addSprintComment
);

router.get(
    '/sprints/:sprintId/comments',
    clientDashboardController.getSprintComments
);

// ── Project Progress Stats ──
router.get(
    '/projects/:projectId/progress',
    clientDashboardController.getProjectProgress
);

export default router;
