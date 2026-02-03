import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import prisma from '../utils/prisma.js';
/**
 * Get Current User Profile
 */
export const getMe = asyncHandler(async (req, res) => {
    if (!req.user?.id) {
        throw new AppError('User not authenticated', 401);
    }
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true },
    });
    res.status(200).json({
        success: true,
        data: user,
    });
});
//# sourceMappingURL=profile.controller.js.map