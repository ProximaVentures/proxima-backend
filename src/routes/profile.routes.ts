import { Router } from 'express';
import { protect, ensureOnboardingComplete } from '../middleware/auth.middleware.js';
import * as profileController from '../controllers/profile.controller.js';

const router = Router();

// All routes here are protected
router.use(protect);

// Get Current User Profile
router.get('/me', profileController.getMe);

// This route requires onboarding to be complete
router.get('/dashboard', ensureOnboardingComplete, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the Professional Dashboard!',
        user: req.user
    });
});

export default router;
