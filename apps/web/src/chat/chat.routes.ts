import { Router } from 'express';
import { postChat } from './chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /chat - Send a message to the chatbot
 * Requires authentication
 */
router.post('/', authenticate, postChat);

export default router;
