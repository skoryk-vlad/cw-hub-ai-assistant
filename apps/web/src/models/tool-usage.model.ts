import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IToolUsage extends Document {
  toolName: string;
  usageCount: number;
  lastUsed: Date;
  avgResponseTime: number; // in milliseconds
  successCount: number;
  errorCount: number;
  category: string;
  operation: 'read' | 'write' | 'delete';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ToolUsageSchema = new Schema<IToolUsage>(
  {
    toolName: { type: String, required: true, unique: true, index: true },
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date, default: Date.now },
    avgResponseTime: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    category: { type: String, required: true, index: true },
    operation: {
      type: String,
      enum: ['read', 'write', 'delete'],
      required: true,
      index: true,
    },
    tags: { type: [String], default: [], index: true },
  },
  { timestamps: true },
);

// Compound indexes for efficient queries
ToolUsageSchema.index({ category: 1, operation: 1 });
ToolUsageSchema.index({ usageCount: -1 });
ToolUsageSchema.index({ lastUsed: -1 });

// Method to update usage statistics
ToolUsageSchema.methods.recordUsage = async function (
  responseTime: number,
  success: boolean = true,
) {
  this.usageCount += 1;
  this.lastUsed = new Date();

  if (success) {
    this.successCount += 1;
  } else {
    this.errorCount += 1;
  }

  // Calculate running average for response time
  this.avgResponseTime =
    (this.avgResponseTime * (this.usageCount - 1) + responseTime) /
    this.usageCount;

  return this.save();
};

export const ToolUsage: Model<IToolUsage> =
  (mongoose.models.ToolUsage as Model<IToolUsage>) ||
  mongoose.model<IToolUsage>('ToolUsage', ToolUsageSchema);
