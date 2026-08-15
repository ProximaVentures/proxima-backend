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

/**
 * 🔔 PUSH NOTIFICATIONS
 */
import webpush from 'web-push';

// Initialize web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

/**
 * Subscribe a device to push notifications
 */
export const subscribeToPush = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const subscription = req.body;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    if (!subscription || !subscription.endpoint) {
        throw new AppError('Invalid subscription object', 400);
    }

    // Save to database
    await prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
            userId,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        },
        create: {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        }
    });

    res.status(201).json({ success: true, message: 'Subscribed successfully' });
});

/**
 * Unsubscribe a device from push notifications
 */
export const unsubscribeFromPush = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { endpoint } = req.body;
    
    if (!endpoint) {
        throw new AppError('Endpoint required', 400);
    }

    await prisma.pushSubscription.deleteMany({
        where: { endpoint }
    });

    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
});

/**
 * Test pushing a notification to the current user
 */
export const testPushNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    // Check if user has globally enabled push notifications
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile?.pushNotificationsEnabled) {
        throw new AppError('Push notifications are disabled in user settings', 400);
    }

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
    });

    if (subscriptions.length === 0) {
        throw new AppError('No active subscriptions found for this user', 404);
    }

    const payload = JSON.stringify({
        title: 'Test Notification',
        body: 'Push notifications are working perfectly on ProVen!',
        url: '/dashboard'
    });

    let successCount = 0;

    const promises = subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload);
            successCount++;
        } catch (error: any) {
            console.error('Error sending push notification:', error);
            // If subscription expired or is invalid, remove it
            if (error.statusCode === 410 || error.statusCode === 404) {
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
        }
    });

    await Promise.all(promises);

    res.status(200).json({ 
        success: true, 
        message: `Notification sent to ${successCount}/${subscriptions.length} devices.` 
    });
});

/**
 * Toggle push notification settings for the user
 */
export const togglePushSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { enabled } = req.body;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    const updated = await prisma.profile.update({
        where: { userId },
        data: { pushNotificationsEnabled: Boolean(enabled) }
    });

    res.status(200).json({
        success: true,
        pushNotificationsEnabled: updated.pushNotificationsEnabled
    });
});
