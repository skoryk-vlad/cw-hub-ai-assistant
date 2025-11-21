import axios from 'axios';
import { UserRoleCache } from '../models/user-role-cache.model.js';
import { AuthUser } from '../utils/auth.js';

/**
 * Cache TTL in milliseconds (10 minutes)
 */
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Default role ID if unable to fetch from backend (most restrictive)
 */
const DEFAULT_ROLE_ID = 4; // User role

/**
 * Response from the /auth/me endpoint
 */
interface AuthMeResponse {
  id: number;
  email: string;
  roleId?: number;
  role?: {
    id: number;
    name: string;
  };
  // Other fields may exist but we only care about role
}

/**
 * Fetches user role from the backend /auth/me endpoint
 */
async function fetchRoleFromBackend(
  accessToken: string,
): Promise<{ roleId: number; roleName?: string }> {
  try {
    const response = await axios.get<AuthMeResponse>(
      `${process.env.APP_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 5000, // 5 second timeout
      },
    );

    const data = response.data;

    // Try to extract roleId from various possible response structures
    const roleId = data.roleId ?? data.role?.id ?? DEFAULT_ROLE_ID;
    const roleName = data.role?.name;

    return { roleId, roleName };
  } catch (error) {
    console.error('Failed to fetch user role from backend:', error);
    // Return default role on error (most restrictive)
    return { roleId: DEFAULT_ROLE_ID };
  }
}

/**
 * Gets user role with MongoDB caching
 * - First checks cache in MongoDB
 * - If not found or expired, fetches from backend
 * - Stores result in cache with TTL
 */
export async function getUserRole(
  user: AuthUser,
  accessToken: string,
): Promise<number> {
  try {
    // Check if already attached to user object (from JWT)
    if (user.roleId !== undefined) {
      return user.roleId;
    }

    // Try to get from MongoDB cache
    const cached = await UserRoleCache.findOne({ userId: user.id });

    // If found and not expired, return cached value
    if (cached && cached.expiresAt > new Date()) {
      return cached.roleId;
    }

    // Cache miss or expired - fetch from backend
    const { roleId, roleName } = await fetchRoleFromBackend(accessToken);

    // Update or create cache entry
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await UserRoleCache.findOneAndUpdate(
      { userId: user.id },
      {
        userId: user.id,
        roleId,
        roleName,
        email: user.email,
        cachedAt: new Date(),
        expiresAt,
      },
      { upsert: true, new: true },
    );

    return roleId;
  } catch (error) {
    console.error('Error getting user role:', error);
    // Return default role on any error
    return DEFAULT_ROLE_ID;
  }
}

/**
 * Clears cached role for a user (useful after role changes)
 */
export async function clearUserRoleCache(userId: number): Promise<void> {
  try {
    await UserRoleCache.deleteOne({ userId });
  } catch (error) {
    console.error('Error clearing user role cache:', error);
  }
}
