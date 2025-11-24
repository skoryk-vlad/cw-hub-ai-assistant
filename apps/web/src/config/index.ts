import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build MongoDB connection URI from individual environment variables
 */
function buildMongoDbUri(): string {
  const username = process.env.MONGO_USERNAME || 'root';
  const password = process.env.MONGO_PASSWORD || 'example';
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const database = process.env.MONGO_DATABASE || 'clockwise_ai';

  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
}

/**
 * Load environment variables and validate required configuration
 */
export const config = {
  /** MongoDB connection URI */
  mongodbUri: buildMongoDbUri(),

  /** OpenAI API key */
  openaiApiKey: validateRequired(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY'),

  /** OpenAI Vector Store ID for file search (RAG) */
  openaiVectorStoreId: process.env.OPENAI_VECTOR_STORE_ID,

  /** Server port */
  port: parseInt(process.env.PORT || '3001', 10),

  /** Node environment */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** Whether running in production */
  isProduction: process.env.NODE_ENV === 'production',

  /** Whether running in development */
  isDevelopment: process.env.NODE_ENV !== 'production',
} as const;

/**
 * Validate that a required environment variable is set
 */
function validateRequired(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Load the system prompt from markdown file
 */
export function loadSystemPrompt(): string {
  const promptPath = path.join(__dirname, 'prompts', 'assistant.prompt.md');
  return fs.readFileSync(promptPath, 'utf-8');
}
