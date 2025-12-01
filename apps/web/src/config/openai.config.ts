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
