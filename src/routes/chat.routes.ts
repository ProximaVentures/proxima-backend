import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

// All chat routes are protected
router.use(protect);

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all conversations for current user
 */
router.get('/conversations', chatController.getConversations);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Fetch message history for a conversation
 */
router.get('/conversations/:conversationId/messages', chatController.getMessages);

/**
 * @swagger
 * /api/chat/conversations/private:
 *   post:
 *     summary: Start a 1-on-1 private chat
 */
router.post('/conversations/private', chatController.startPrivateConversation);

export default router;
