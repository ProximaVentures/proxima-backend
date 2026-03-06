import type { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import prisma from '../utils/prisma.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
    });

    res.status(200).json({
        success: true,
        unreadCount,
        data: notifications
    });
});

/**
 * Mark a specific notification as read
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    const notification = await prisma.notification.findUnique({
        where: { id }
    });

    if (!notification || notification.userId !== userId) {
        throw new AppError('Notification not found', 404);
    }

    const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });

    res.status(200).json({
        success: true,
        data: updated
    });
});

/**
 * Mark all notifications as read for the user
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
    });

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
    });
});
