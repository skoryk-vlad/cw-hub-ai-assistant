import mongoose, { Schema, Model } from 'mongoose';
import { IModelUsage } from '../utils/billing.js';
import type {
  ContentPart,
  MessageItem,
  FunctionCallItem,
  FunctionCallOutputItem,
  ToolCallItem,
  IItemDocument,
  IConversation,
} from '../types/conversation.types.js';

/**
 * Mongoose schemas for conversation storage
 */

const ContentPartSchema = new Schema<ContentPart>(
  {
    type: {
      type: String,
      required: true,
      enum: ['input_text', 'output_text', 'input_image'],
    },
    text: { type: String },
    annotations: { type: Schema.Types.Mixed },
    logprobs: { type: Schema.Types.Mixed },
    image_url: { type: String },
    detail: { type: String, enum: ['low', 'high', 'auto'] },
  },
  { _id: false },
);

const ItemBaseSchema = new Schema<IItemDocument>(
  {
    id: { type: String },
    type: {
      type: String,
      required: false,
      enum: [
        'message',
        'function_call',
        'function_call_output',
        'reasoning',
        'file_search_call',
        'web_search_call',
        'code_interpreter_call',
        'image_generation_call',
        'mcp_list_tools',
        'mcp_tool_call',
      ],
    },
    status: { type: String, enum: ['in_progress', 'completed'] },
  },
  {
    _id: false,
    timestamps: { createdAt: false, updatedAt: false },
    discriminatorKey: 'type',
  },
);

const MessageItemSchema = new Schema<MessageItem>(
  {
    role: {
      type: String,
      enum: ['system', 'user', 'assistant'],
      required: true,
    },
    content: { type: [ContentPartSchema], required: true },
    text: { type: String },
    refusal: { type: String, default: null },
  },
  { _id: false },
);

const FunctionCallItemSchema = new Schema<FunctionCallItem>(
  {
    call_id: { type: String, required: true },
    name: { type: String, required: true },
    arguments: { type: String, required: true },
  },
  { _id: false },
);

const FunctionCallOutputItemSchema = new Schema<FunctionCallOutputItem>(
  {
    call_id: { type: String, required: true },
    output: { type: String, required: true },
  },
  { _id: false },
);

const ToolCallItemSchema = new Schema<ToolCallItem>(
  {
    data: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const ModelUsageSchema = new Schema<IModelUsage>(
  {
    input: { type: Number, default: 0 },
    cached: { type: Number, default: 0 },
    output: { type: Number, default: 0 },
  },
  { _id: false },
);

const ItemSchema = ItemBaseSchema.clone();
ItemSchema.set('strict', false);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Number, index: true, required: true },
    title: { type: String },
    items: { type: [ItemSchema], default: [] },
    usage: {
      type: ModelUsageSchema,
      default: { input: 0, cached: 0, output: 0 },
    },
    estimatedPrice: { type: Number, default: 0 },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Indexes
ConversationSchema.index({ userId: 1, updatedAt: -1 });
ConversationSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 30,
    partialFilterExpression: { archived: { $ne: true } },
  },
);

export const Conversation: Model<IConversation> =
  (mongoose.models.Conversation as Model<IConversation>) ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
