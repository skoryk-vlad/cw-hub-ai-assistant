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
  model: OpenAiModel.GPT_5_1,

  /** Vector store ID for file search (RAG) */
  vectorStoreId: 'vs_690349b01adc81918315954ba5fcc1b1',

  /** Configuration for title generation */
  titleGeneration: {
    model: OpenAiModel.GPT_4O_MINI,
    maxTokens: 15,
    temperature: 0.7,
  },
} as const;
