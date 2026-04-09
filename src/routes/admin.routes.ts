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
router.patch('/professionals/:id/rating', adminController.updateProfessionalRating);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);
router.get('/users/:id', adminController.getUserById);
router.get('/professionals/:id', adminController.getProfessionalById);

// Project Management
router.get('/projects', adminController.getAllProjects);
router.get('/projects/:id', adminController.getProjectById);
router.get('/projects/:id/interests', adminController.getProjectInterests);
router.patch('/projects/:id/status', adminController.updateProjectStatus);
router.post('/projects/:id/assign', adminController.assignProfessional);
// Interests Management
router.get('/interests', adminController.getAllInterests);
router.delete('/interests/:id', adminController.declineInterest);

// Handover & Communication
router.get('/projects/:id/resources', adminController.getProjectResources);
router.post('/projects/:id/resources', adminController.addProjectResource);
router.put('/resources/:id', adminController.editProjectResource);
router.delete('/resources/:id', adminController.deleteProjectResource);

router.get('/projects/:id/updates', adminController.getProjectUpdates);
router.post('/projects/:id/updates', adminController.addProjectUpdate);
router.put('/updates/:id', adminController.editProjectUpdate);
router.delete('/updates/:id', adminController.deleteProjectUpdate);

// Expanded Workspace Management
router.get('/projects/:id/meetings', adminController.getProjectMeetings);
router.post('/projects/:id/meeting', adminController.addProjectMeeting);
router.put('/meeting/:id', adminController.editProjectMeeting);
router.delete('/meeting/:id', adminController.deleteProjectMeeting);

router.get('/projects/:id/documents', adminController.getProjectDocuments);
router.post('/projects/:id/document', adminController.addProjectDocument);
router.put('/document/:id', adminController.editProjectDocument);
router.delete('/document/:id', adminController.deleteProjectDocument);

router.get('/projects/:id/tasks', adminController.getProjectTasks);
router.post('/projects/:id/task', adminController.addProjectTask);
router.put('/task/:id', adminController.editProjectTask);
router.delete('/task/:id', adminController.deleteProjectTask);
router.patch('/tasks/:id/review', adminController.reviewTask);

router.get('/projects/:id/info', adminController.getProjectInfo);
router.post('/projects/:id/info', adminController.addProjectInfo);
router.put('/info/:id', adminController.editProjectInfo);
router.delete('/info/:id', adminController.deleteProjectInfo);


export default router;
