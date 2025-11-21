import { Document, Types } from 'mongoose';
import { IModelUsage } from '../utils/billing.js';

/**
 * Roles for Responses API messages
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * ItemType set (extend as needed)
 */
export type ItemType =
  | 'message'
  | 'function_call'
  | 'function_call_output'
  | 'reasoning'
  | 'file_search_call'
  | 'web_search_call'
  | 'code_interpreter_call'
  | 'image_generation_call'
  | 'mcp_list_tools'
  | 'mcp_tool_call';

/**
 * Content parts for messages
 */
export type ContentPart =
  | {
      type: 'input_text' | 'output_text';
      text: string;
      annotations?: any;
      logprobs?: any;
    }
  | {
      type: 'input_image';
      image_url: string;
      detail?: 'low' | 'high' | 'auto';
    };

/**
 * Base item interface
 */
interface BaseItem {
  id?: string;
  type: ItemType;
  status?: 'in_progress' | 'completed';
}

/**
 * Message item in conversation
 */
export interface MessageItem extends BaseItem {
  type: 'message';
  role: MessageRole;
  content: ContentPart[];
  text?: string;
  refusal?: string | null;
}

/**
 * Function call item
 */
export interface FunctionCallItem extends BaseItem {
  type: 'function_call';
  call_id: string;
  name: string;
  arguments: string; // raw JSON/text from API
}

/**
 * Function call output item
 */
export interface FunctionCallOutputItem extends BaseItem {
  type: 'function_call_output';
  call_id: string;
  output: string; // raw JSON/text from tool
}

/**
 * Reasoning item
 */
export interface ReasoningItem extends BaseItem {
  type: 'reasoning';
  content?: any[];
  summary?: any[];
}

/**
 * Tool call item (file search, web search, etc.)
 */
export interface ToolCallItem extends BaseItem {
  type:
    | 'file_search_call'
    | 'web_search_call'
    | 'code_interpreter_call'
    | 'image_generation_call'
    | 'mcp_list_tools'
    | 'mcp_tool_call';
  data?: Record<string, any> | null;
}

/**
 * Union type for all conversation items
 */
export type ConversationItem =
  | MessageItem
  | FunctionCallItem
  | FunctionCallOutputItem
  | ReasoningItem
  | ToolCallItem;

/**
 * Item document base interface
 */
export interface IItemDocBase extends Document {
  createdAt: Date;
}

/**
 * Item document type
 */
export type IItemDocument = IItemDocBase & ConversationItem;

/**
 * Response metadata
 */
export interface IResponseMeta {
  response_id?: string;
  previous_response_id?: string | null;
  model?: string;
  usage?: IModelUsage;
  status?: 'in_progress' | 'completed' | 'failed';
  error?: any | null;
  createdAt?: Date;
}

/**
 * Conversation document interface
 */
export interface IConversation extends Document {
  userId: number;
  title?: string;
  items: Types.DocumentArray<IItemDocument>;
  usage?: IModelUsage;
  estimatedPrice?: number;
  lastResponse?: IResponseMeta | null;
  archived?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
