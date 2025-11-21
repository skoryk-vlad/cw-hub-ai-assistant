import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * POST /auth/login - Login with email and password
 * Returns JWT token for standalone chat access
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Call the backend API to authenticate
    const response = await fetch(`${process.env.APP_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.message || 'Invalid credentials',
      });
    }

    const data = await response.json();

    // The backend should return an access token
    if (!data.accessToken && !data.access_token) {
      return res.status(500).json({ error: 'Authentication failed' });
    }

    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;

    // Decode the backend token to extract user ID
    const backendPayload = jwt.decode(accessToken) as {
      userId?: number;
      user_id?: number;
      id?: number;
      email?: string;
    } | null;

    const userId =
      data.id ||
      data.userId ||
      data.user_id ||
      backendPayload?.userId ||
      backendPayload?.user_id ||
      backendPayload?.id;

    if (!userId) {
      return res.status(500).json({ error: 'Failed to extract user ID from authentication response' });
    }

    // Generate our own JWT that wraps the backend tokens
    // This allows us to store user info in the JWT for quick access
    const token = jwt.sign(
      {
        userId: userId,
        email: email,
        backendToken: accessToken,
        backendRefreshToken: refreshToken,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken: token,
      refreshToken: token, // Return the same wrapper token
      user: {
        id: userId,
        email: email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * POST /auth/refresh - Refresh access token using refresh token
 */
export async function refresh(req: Request, res: Response) {
  const { refreshToken: clientRefreshToken } = req.body as {
    refreshToken?: string;
  };

  if (!clientRefreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    // Decode our wrapper JWT to get the backend refresh token
    const payload = jwt.verify(clientRefreshToken, process.env.JWT_SECRET) as {
      userId: number;
      email: string;
      backendRefreshToken?: string;
    };

    if (!payload.backendRefreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Call backend API to refresh tokens
    const response = await fetch(`${process.env.APP_URL}/auth/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: payload.backendRefreshToken }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Token refresh failed' });
    }

    const data = await response.json();

    const newAccessToken = data.accessToken || data.access_token;
    const newRefreshToken = data.refreshToken || data.refresh_token;

    if (!newAccessToken) {
      return res.status(500).json({ error: 'Token refresh failed' });
    }

    // Generate new wrapper JWT with refreshed tokens
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        backendToken: newAccessToken,
        backendRefreshToken: newRefreshToken || payload.backendRefreshToken,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken: token,
      refreshToken: token,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

/**
 * POST /auth/logout - Logout (optional, mainly clears client-side token)
 */
export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Logged out successfully' });
}
