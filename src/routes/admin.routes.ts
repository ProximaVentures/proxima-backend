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

export default router;
