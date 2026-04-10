import { Router } from 'express';
import { 
    reportTask, 
    updateTaskStatus, 
    sendTaskFeedback 
} from '../controllers/professional.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All professional routes require authentication and professional role
router.use(protect);
router.use(authorize('PROFESSIONAL'));

/**
 * @swagger
 * /api/professional/tasks/{id}/report:
 *   post:
 *     summary: Report completion of a task
 *     tags: [Professional]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *               links:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Task reported successfully
 */
router.post('/tasks/:id/report', reportTask);
router.patch('/tasks/:id/status', updateTaskStatus);
router.post('/tasks/:id/feedback', sendTaskFeedback);

export default router;
