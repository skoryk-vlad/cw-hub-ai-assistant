import { Conversation } from '../models/conversation.model.js';
import type { IItemDocument } from '../types/conversation.types.js';
import { chat } from './openai-integration.js';
import { ResponseInput } from 'openai/resources/responses/responses.mjs';
import OpenAI from 'openai';
import { config } from '../config/index.js';
import { openaiConfig } from '../config/openai.config.js';

/**
 * Get or create a conversation for a user
 */
export async function ensureConversation(
  userId: number,
  conversationId?: string,
) {
  if (conversationId) {
    const existing = await Conversation.findOne({
      _id: conversationId,
      userId,
    });
    if (existing) return existing;
  }

  return Conversation.create({
    userId,
    title: 'New chat',
    items: [],
    usage: {
      input: 0,
      cached: 0,
      output: 0,
    },
    estimatedPrice: 0,
  });
}

/**
 * Convert conversation items to OpenAI history format
 */
export function toOpenAIHistory(messages: IItemDocument[]) {
  return messages as ResponseInput;
}

/**
 * Generate a conversation title based on the first user message
 */
async function generateConversationTitle(userMessage: string): Promise<string> {
  try {
    const openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });

    const response = await openai.chat.completions.create({
      model: openaiConfig.helperModel,
      max_tokens: openaiConfig.titleGeneration.maxTokens,
      temperature: openaiConfig.titleGeneration.temperature,
      messages: [
        {
          role: 'system',
          content:
            'Generate a concise 3-5 word title for this conversation. Match the language of the user\'s message (Ukrainian or English). Only return the title, nothing else.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const title = response.choices[0]?.message?.content?.trim();
    return title && title.length > 0 ? title : 'New chat';
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return 'New chat';
  }
}

/**
 * Update conversation with new messages and usage
 */
export async function update(
  conversationId: string,
  userId: number,
  response: {
    newMessages: ResponseInput;
    result: string;
    usage: {
      input: number;
      cached: number;
      output: number;
    };
    estimatedPrice: number;
  },
) {
  const conversation = await ensureConversation(userId, conversationId);

  conversation.items.push(...response.newMessages);
  conversation.usage.input += response.usage.input;
  conversation.usage.cached += response.usage.cached;
  conversation.usage.output += response.usage.output;
  conversation.estimatedPrice += response.estimatedPrice;

  await conversation.save();
}

/**
 * Handle a single chat turn: user message -> AI response
 */
export async function handleChatTurn(params: {
  userId: number;
  userRoleId: number;
  accessToken: string;
  conversationId?: string;
  userMessage: string;
}) {
  const { userId, userRoleId, accessToken, conversationId, userMessage } =
    params;

  const conversation = await ensureConversation(userId, conversationId);

  const history = toOpenAIHistory(conversation.items);

  const response = await chat(userMessage, history, accessToken, userRoleId);

  await update(conversation.id, userId, response);

  // Generate title after first response if still using default title
  if (conversation.items.length === 0 && conversation.title === 'New chat') {
    const generatedTitle = await generateConversationTitle(userMessage);
    conversation.title = generatedTitle;
    await conversation.save();
  }

  return {
    conversationId: conversationId || conversation.id,
    reply: response.result,
  };
}
