import mongoose, { Schema, Model } from 'mongoose';

/**
 * Interface for user role cache document
 */
export interface IUserRoleCache {
  userId: number;
  roleId: number;
  roleName?: string;
  email: string;
  cachedAt: Date;
  expiresAt: Date;
}

/**
 * MongoDB schema for caching user role information
 * This cache reduces calls to the auth-me endpoint
 */
const UserRoleCacheSchema = new Schema<IUserRoleCache>(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    roleId: {
      type: Number,
      required: true,
    },
    roleName: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
    },
    cachedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false },
);

// TTL index - MongoDB will automatically delete expired documents
UserRoleCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserRoleCache: Model<IUserRoleCache> =
  (mongoose.models.UserRoleCache as Model<IUserRoleCache>) ||
  mongoose.model<IUserRoleCache>('UserRoleCache', UserRoleCacheSchema);
