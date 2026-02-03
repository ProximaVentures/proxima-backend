import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, professionalProfileSchema, loginSchema } from '../validators/auth.validator.js';
const router = Router();
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', validate(loginSchema), authController.login);
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';
router.post('/complete-profile', protect, authorize(Role.PROFESSIONAL), validate(professionalProfileSchema), authController.completeProfile);
export default router;
//# sourceMappingURL=auth.routes.js.map