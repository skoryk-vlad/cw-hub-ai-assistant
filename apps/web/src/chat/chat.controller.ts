import type { Request, Response } from 'express';
import { handleChatTurn } from './chat.service.js';

/**
 * POST /chat - Send a message to the chatbot
 * Uses auth middleware to extract user and token
 */
export async function postChat(req: Request, res: Response) {
  const { message, conversationId } = req.body as {
    message?: string;
    conversationId?: string;
  };

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User ID missing from authentication' });
    }

    const result = await handleChatTurn({
      userId: req.user.id,
      userRoleId: req.user.roleId!,
      accessToken: req.accessToken!,
      conversationId,
      userMessage: message,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
}
