import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { projectSchema, investmentPitchSchema, projectUpdateSchema, investmentPitchUpdateSchema } from '../validators/project.validator.js';

const router = Router();

// All project routes require authentication
router.use(protect);

router.get('/check-title', projectController.checkTitleAvailability);

router.post(
    '/',
    validate(projectSchema),
    projectController.createProject
);

router.post(
    '/pitches',
    validate(investmentPitchSchema),
    projectController.createInvestmentPitch
);

router.patch(
    '/:id',
    validate(projectUpdateSchema),
    projectController.updateProject
);

router.patch(
    '/pitches/:id',
    validate(investmentPitchUpdateSchema),
    projectController.updateInvestmentPitch
);

router.get(
    '/my-submissions',
    projectController.getMySubmissions
);

// Get professional's own missions
router.get(
    '/my-missions',
    projectController.getMyMissions
);

// Public/Protected feed for professionals
router.get(
    '/feed',
    projectController.getAcceptedProjects
);

// Get specific project details
router.get(
    '/:id',
    projectController.getProjectById
);

// Express interest in a project
router.post(
    '/:id/interest',
    projectController.expressInterest
);

export default router;
