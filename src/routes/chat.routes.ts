import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as chatController from '../controllers/chat.controller.js';
import * as meetingController from '../controllers/meeting.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// All chat routes are protected
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time messaging and conversation management
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all conversations for current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations with last message and participants
 */
router.get('/conversations', asyncHandler(chatController.getConversations));

/**
 * @swagger
 * /api/chat/unread-count:
 *   get:
 *     summary: Get total unread messages count across all conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total unread count
 */
router.get('/unread-count', asyncHandler(chatController.getTotalUnreadCount));

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Fetch message history for a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Message ID to start pagination from
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Array of messages in chronological order
 */
router.get('/conversations/:conversationId/messages', asyncHandler(chatController.getMessages));

/**
 * @swagger
 * /api/chat/conversations/private:
 *   post:
 *     summary: Start a 1-on-1 private chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Existing or newly created conversation
 */
router.post('/conversations/private', asyncHandler(chatController.startPrivateConversation));

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/read:
 *   post:
 *     summary: Mark all messages in a conversation as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success notification
 */
router.post('/conversations/:conversationId/read', asyncHandler(chatController.markAsRead));

/**
 * @swagger
 * /api/chat/admin/directory:
 *   get:
 *     summary: Get all clients and professionals for admin directory
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients and professionals
 */
router.get('/admin/directory', asyncHandler(chatController.getAdminDirectory));

// --- Meeting Routes ---
router.post('/conversations/:conversationId/meetings', asyncHandler(meetingController.scheduleMeeting));
router.get('/conversations/:conversationId/meetings/latest', asyncHandler(meetingController.getLatestMeeting));

export default router;
