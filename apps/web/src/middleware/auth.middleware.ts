import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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
 * Check if a JWT token is expired or about to expire
 */
function isTokenExpiringSoon(token: string, bufferSeconds: number = 30): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return false;

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const bufferTime = bufferSeconds * 1000;

    return expirationTime - now < bufferTime;
  } catch {
    return false;
  }
}

/**
 * Refresh backend tokens using refresh token
 */
async function refreshBackendToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch(`${process.env.APP_URL}/auth/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.accessToken || data.access_token,
      refreshToken: data.refreshToken || data.refresh_token || refreshToken,
    };
  } catch (error) {
    console.error('Backend token refresh failed:', error);
    return null;
  }
}

/**
 * Middleware to authenticate requests using Bearer token
 * Supports two modes:
 * 1. Embedded mode: JWT from frontend app (original flow)
 * 2. Standalone mode: JWT issued by our /auth/login endpoint
 *
 * Extracts user info and token, attaches to req object
 * Also fetches and caches user role from backend
 * Automatically refreshes expired backend tokens in standalone mode
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
    const decoded = getUserFromAccessToken(token);

    let backendToken = decoded.backendToken || token;
    const hasRefreshToken = !!decoded.backendRefreshToken;

    // If token is expiring soon and we have a refresh token, refresh it
    if (hasRefreshToken && isTokenExpiringSoon(backendToken, 30)) {
      const refreshed = await refreshBackendToken(decoded.backendRefreshToken!);

      if (refreshed) {
        backendToken = refreshed.accessToken;

        // Generate new wrapper JWT with refreshed tokens
        const newWrapperToken = jwt.sign(
          {
            userId: decoded.id,
            email: decoded.email,
            backendToken: refreshed.accessToken,
            backendRefreshToken: refreshed.refreshToken,
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Add the new token to response header so client can update it
        res.setHeader('X-New-Token', newWrapperToken);
      } else {
        return res.status(401).json({ error: 'Token expired and refresh failed' });
      }
    }

    // Fetch and attach role ID (with caching)
    const roleId = await getUserRole(decoded, backendToken);
    decoded.roleId = roleId;

    req.user = decoded;
    // Use the backend token for API calls, not wrapper JWT
    req.accessToken = backendToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
