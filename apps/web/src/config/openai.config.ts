import { config } from './index.js';

export enum OpenAiModel {
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_5_MINI = 'gpt-5-mini',
  GPT_5 = 'gpt-5',
  GPT_5_1 = 'gpt-5.1',
}

/**
 * OpenAI configuration settings
 */
export const openaiConfig = {
  /** Model to use for chat completions */
  model: config.openaiModel,

  /** Vector store ID for file search (RAG) */
  vectorStoreId: config.openaiVectorStoreId,

  /** Model for helper tasks (tool selection, title generation) */
  helperModel: config.openaiHelperModel,

  /** Configuration for title generation */
  titleGeneration: {
    maxTokens: 15,
    temperature: 0.7,
  },
} as const;

/**
 * Context optimization configuration
 * Controls conversation windowing and tool response truncation
 */
export const contextOptimizationConfig = {
  /** Maximum number of "meaningful" conversation items to send to OpenAI */
  maxConversationItems: parseInt(
    process.env.MAX_CONVERSATION_ITEMS || '10',
    10,
  ),

  /** Tool response truncation settings */
  toolResponseTruncation: {
    /** Start extracting key fields from arrays larger than this */
    arrayItemThreshold: parseInt(
      process.env.TOOL_RESPONSE_ARRAY_THRESHOLD || '5',
      10,
    ),
    /** Maximum recursion depth for nested object processing */
    maxDepth: parseInt(process.env.TOOL_RESPONSE_MAX_DEPTH || '3', 10),
    /** Maximum string length before truncation */
    maxStringLength: parseInt(
      process.env.TOOL_RESPONSE_MAX_STRING_LENGTH || '1000',
      10,
    ),
    /** Key fields to extract from objects (id, name, etc.) */
    keyFields: (
      process.env.TOOL_RESPONSE_KEY_FIELDS || 'id,name,title,status,type'
    ).split(','),
  },
};
