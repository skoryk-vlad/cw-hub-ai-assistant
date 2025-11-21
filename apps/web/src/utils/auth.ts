import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  email: string;
  roleId?: number;
  roleName?: string;
  backendToken?: string;
  backendRefreshToken?: string;
}

export function getUserFromAccessToken(token: string): AuthUser {
  // First decode to check token structure
  const decoded = jwt.decode(token) as {
    userId?: number;
    id?: number;
    email: string;
    backendToken?: string;
    backendRefreshToken?: string;
  } | null;

  if (!decoded) {
    throw new Error('Invalid token');
  }

  // Check if this is our wrapper JWT (has backendToken field)
  const isWrapperToken = 'backendToken' in decoded;

  if (isWrapperToken) {
    // Standalone mode: verify our wrapper JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
      backendToken?: string;
      backendRefreshToken?: string;
    };
    return {
      id: payload.userId,
      email: payload.email,
      backendToken: payload.backendToken,
      backendRefreshToken: payload.backendRefreshToken,
    };
  } else {
    // Embedded mode: backend JWT (already verified by backend)
    // Just extract user info without verification
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      throw new Error('No user ID in token');
    }

    return {
      id: userId,
      email: decoded.email,
      backendToken: undefined,
      backendRefreshToken: undefined,
    };
  }
}
