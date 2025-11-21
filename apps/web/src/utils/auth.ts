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
}
