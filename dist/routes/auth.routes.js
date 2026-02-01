import { Router } from 'express';
import { register, completeProfile } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, professionalProfileSchema } from '../validators/auth.validator.js';
const router = Router();
// 🛣️ Stage 1: Basic Registration
router.post('/register', validate(registerSchema), register);
// 🛣️ Stage 2: Forced Profile Completion
// Note: In Stage 1, we select a role. If it's Professional, the frontend will call this next.
router.patch('/profile/complete', validate(professionalProfileSchema), completeProfile);
export default router;
//# sourceMappingURL=auth.routes.js.map