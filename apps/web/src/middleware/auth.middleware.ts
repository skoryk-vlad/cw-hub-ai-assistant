import type { Request, Response, NextFunction } from 'express';
import { getUserFromAccessToken, type AuthUser } from '../utils/auth.js';
import { getUserRole } from '../services/user-role.service.js';

/**
 * Extend Express Request to include user and token
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      accessToken?: string;
    }
  }
}

/**
 * Middleware to authenticate requests using Bearer token
 * Extracts user info and token, attaches to req object
 * Also fetches and caches user role from backend
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = getUserFromAccessToken(token);

    // Fetch and attach role ID (with caching)
    const roleId = await getUserRole(user, token);
    user.roleId = roleId;

    req.user = user;
    req.accessToken = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
