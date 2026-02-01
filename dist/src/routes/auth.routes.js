import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, professionalProfileSchema, loginSchema } from '../validators/auth.validator.js';
const router = Router();
// 🏫 Professor's Tip: Use descriptive route names.
// /auth/register vs /auth/signup (be consistent!)
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', validate(loginSchema), authController.login);
router.post('/complete-profile', validate(professionalProfileSchema), authController.completeProfile);
export default router;
//# sourceMappingURL=auth.routes.js.map