import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All notification routes are protected
router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

// Push Notification Routes
router.post('/push/subscribe', notificationController.subscribeToPush);
router.post('/push/unsubscribe', notificationController.unsubscribeFromPush);
router.post('/push/test', notificationController.testPushNotification);
router.patch('/push/settings', notificationController.togglePushSettings);

export default router;
