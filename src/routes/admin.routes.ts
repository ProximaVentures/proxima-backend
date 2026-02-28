import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Base Path: /api/admin
// All routes require ADMIN role

router.use(protect, authorize(Role.ADMIN));



router.get('/professionals/pending', adminController.getPendingProfessionals);
router.patch('/professionals/:id/vet', adminController.vetProfessional);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);

// Project Management
router.get('/projects', adminController.getAllProjects);
router.get('/projects/:id/interests', adminController.getProjectInterests);
router.patch('/projects/:id/status', adminController.updateProjectStatus);
router.post('/projects/:id/assign', adminController.assignProfessional);
// Interests Management
router.get('/interests', adminController.getAllInterests);
router.delete('/interests/:id', adminController.declineInterest);

// Handover & Communication
router.post('/projects/:id/resources', adminController.addProjectResource);
router.delete('/resources/:id', adminController.deleteProjectResource);
router.post('/projects/:id/updates', adminController.addProjectUpdate);
router.delete('/updates/:id', adminController.deleteProjectUpdate);

// Expanded Workspace Management
router.post('/projects/:id/meeting', adminController.addProjectMeeting);
router.delete('/meeting/:id', adminController.deleteProjectMeeting);

router.post('/projects/:id/document', adminController.addProjectDocument);
router.delete('/document/:id', adminController.deleteProjectDocument);

router.post('/projects/:id/task', adminController.addProjectTask);
router.delete('/task/:id', adminController.deleteProjectTask);

router.post('/projects/:id/info', adminController.addProjectInfo);
router.delete('/info/:id', adminController.deleteProjectInfo);


export default router;
