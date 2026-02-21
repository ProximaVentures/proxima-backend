import { Router } from 'express';
import { handleContactForm } from '../controllers/contact.controller.js';

const router = Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Handle contact form submissions and send email notifications
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: Marcus Aurelius
 *               email:
 *                 type: string
 *                 format: email
 *                 example: marcus@institution.com
 *               subject:
 *                 type: string
 *                 example: Governance & Delivery Inquiry
 *               message:
 *                 type: string
 *                 example: Describe your project vision or specific needs...
 *     responses:
 *       200:
 *         description: Inquiry received and email sent
 *       400:
 *         description: Validation error
 *       500:
 *         description: Email sending failed
 */
router.post('/', handleContactForm);

export default router;
