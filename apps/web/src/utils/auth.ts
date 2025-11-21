import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  email: string;
  roleId?: number;
  roleName?: string;
}

export function getUserFromAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, process.env.JWT_SECRET) as {
    userId: number;
    email: string;
  };
  return { id: payload.userId, email: payload.email };
}
