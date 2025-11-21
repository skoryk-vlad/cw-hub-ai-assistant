import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ToolUsage } from '../models/tool-usage.model.js';
import { IModelUsage } from '../utils/billing.js';
import { OpenAiModel } from '../config/openai.config.js';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

type ToolMetadata = {
  name: string;
  category: string;
  operation: 'read' | 'write' | 'delete';
  httpMethod: string;
  tags: string[];
  description: string;
  relatedTools: string[];
};

let toolMetadataCache: Map<string, ToolMetadata> | null = null;

// Load tool metadata from JSON file
export function loadToolMetadata(): Map<string, ToolMetadata> {
  if (toolMetadataCache) {
    return toolMetadataCache;
  }

  try {
    const metadataPath = path.join(
      __dirname,
      '../../../mcp-server/src/tool-metadata.json',
    );
    const rawData = fs.readFileSync(metadataPath, 'utf8');
    const data = JSON.parse(rawData);

    toolMetadataCache = new Map(
      data.tools.map((tool: ToolMetadata) => [tool.name, tool]),
    );

    console.log(
      `[TOOL METADATA] Loaded ${toolMetadataCache.size} tool metadata entries`,
    );
    return toolMetadataCache;
  } catch (error) {
    console.error('[TOOL METADATA ERROR] Failed to load metadata:', error);
    // Return empty map as fallback
    return new Map();
  }
}

// Map tool names to categories based on prefix
export function categorizeTool(toolName: string): string {
  const prefix = toolName.split('-')[0];
  return prefix;
}

// Group all tools by category
export function groupToolsByCategory(
  tools: OpenAI.Responses.FunctionTool[],
): Map<string, OpenAI.Responses.FunctionTool[]> {
  const groups = new Map<string, OpenAI.Responses.FunctionTool[]>();

  for (const tool of tools) {
    const category = categorizeTool(tool.name);
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(tool);
  }

  return groups;
}

// Analyze query to determine operation type intent (supports English and Ukrainian)
function detectOperationType(
  userMessage: string,
): 'read' | 'write' | 'delete' | 'all' {
  const messageLower = userMessage.toLowerCase();

  // Check for delete/remove operations (English + Ukrainian)
  if (
    messageLower.includes('delete') ||
    messageLower.includes('remove') ||
    messageLower.includes('deactivate') ||
    messageLower.includes('видали') ||
    messageLower.includes('видалити') ||
    messageLower.includes('прибери') ||
    messageLower.includes('прибрати') ||
    messageLower.includes('деактивувати')
  ) {
    return 'delete';
  }

  // Check for write/mutation operations (English + Ukrainian)
  if (
    messageLower.includes('create') ||
    messageLower.includes('add') ||
    messageLower.includes('update') ||
    messageLower.includes('edit') ||
    messageLower.includes('change') ||
    messageLower.includes('modify') ||
    messageLower.includes('set') ||
    messageLower.includes('approve') ||
    messageLower.includes('activate') ||
    messageLower.includes('створи') ||
    messageLower.includes('створити') ||
    messageLower.includes('додай') ||
    messageLower.includes('додати') ||
    messageLower.includes('оновити') ||
    messageLower.includes('оновлю') ||
    messageLower.includes('редагувати') ||
    messageLower.includes('зміни') ||
    messageLower.includes('змінити') ||
    messageLower.includes('встанови') ||
    messageLower.includes('встановити') ||
    messageLower.includes('затверди') ||
    messageLower.includes('затвердити') ||
    messageLower.includes('активувати')
  ) {
    return 'write';
  }

  // Check for read-only operations (queries) (English + Ukrainian)
  if (
    messageLower.includes('show') ||
    messageLower.includes('get') ||
    messageLower.includes('find') ||
    messageLower.includes('list') ||
    messageLower.includes('search') ||
    messageLower.includes('what') ||
    messageLower.includes('who') ||
    messageLower.includes('when') ||
    messageLower.includes('how many') ||
    messageLower.includes('how much') ||
    messageLower.includes('покажи') ||
    messageLower.includes('показати') ||
    messageLower.includes('дай') ||
    messageLower.includes('дати') ||
    messageLower.includes('знайди') ||
    messageLower.includes('знайти') ||
    messageLower.includes('перелік') ||
    messageLower.includes('список') ||
    messageLower.includes('пошук') ||
    messageLower.includes('скільки') ||
    messageLower.includes('який') ||
    messageLower.includes('яка') ||
    messageLower.includes('яке') ||
    messageLower.includes('які') ||
    messageLower.includes('хто') ||
    messageLower.includes('коли') ||
    messageLower.includes('де') ||
    messageLower.includes('чому')
  ) {
    return 'read';
  }

  // Default to all if unclear
  return 'all';
}

// Get frequently used tools from database
async function getFrequentTools(limit: number = 5): Promise<string[]> {
  try {
    const topTools = await ToolUsage.find()
      .sort({ usageCount: -1 })
      .limit(limit)
      .select('toolName');

    return topTools.map((tool) => tool.toolName);
  } catch (error) {
    console.error('[TOOL USAGE ERROR]', error);
    return [];
  }
}

export interface ToolSelectionResult {
  tools: OpenAI.Responses.FunctionTool[];
  usage: IModelUsage;
}

// Use a cheap model to determine relevant tool categories with operation filtering
export async function selectRelevantTools(
  userMessage: string,
  allTools: OpenAI.Responses.FunctionTool[],
  conversationHistory: string[] = [],
  model: OpenAiModel = OpenAiModel.GPT_4O_MINI,
): Promise<ToolSelectionResult> {
  const toolGroups = groupToolsByCategory(allTools);
  const categories = Array.from(toolGroups.keys());
  const metadata = loadToolMetadata();

  // Detect operation type from query
  const operationType = detectOperationType(userMessage);

  // Build category descriptions with tool counts by operation type
  const categoryDescriptions = categories.map((cat) => {
    const tools = toolGroups.get(cat) || [];
    const toolsWithMeta = tools.map((t) => ({
      tool: t,
      meta: metadata.get(t.name),
    }));

    const readCount = toolsWithMeta.filter(
      (t) => t.meta?.operation === 'read',
    ).length;
    const writeCount = toolsWithMeta.filter(
      (t) => t.meta?.operation === 'write',
    ).length;
    const deleteCount = toolsWithMeta.filter(
      (t) => t.meta?.operation === 'delete',
    ).length;

    return `- ${cat} (${tools.length} tools: ${readCount} read, ${writeCount} write, ${deleteCount} delete)`;
  });

  // Build a prompt to select relevant categories
  const prompt = `You are a tool selection assistant. Given a user message, select which tool categories are most relevant.

Available categories:
${categoryDescriptions.join('\n')}

User message: "${userMessage}"

${
  conversationHistory.length > 0
    ? `Recent conversation context:\n${conversationHistory
        .slice(-3)
        .join('\n')}\n`
    : ''
}

Query type: ${operationType === 'all' ? 'general' : operationType + ' operation'}

Return a JSON object with:
- categories: array of 2-4 most relevant category names
- operationTypes: array of operation types needed ("read", "write", "delete")

Example: {"categories": ["projects", "users"], "operationTypes": ["read"]}`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a precise tool selector. Always respond with valid JSON. Prefer fewer categories and specific operation types to reduce tokens.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content?.trim() || '{}';
    console.log('[TOOL SELECTION] LLM response:', content);

    const selection = JSON.parse(content);
    const selectedCategories: string[] = selection.categories || [];
    const selectedOperations: string[] = selection.operationTypes || ['read'];

    // Gather tools from selected categories and filter by operation type
    let selectedTools: OpenAI.Responses.FunctionTool[] = [];
    for (const category of selectedCategories) {
      const tools = toolGroups.get(category) || [];

      // Filter by operation type if metadata is available
      const filteredTools = tools.filter((tool) => {
        const meta = metadata.get(tool.name);
        if (!meta) return true; // Include if no metadata

        // If operation type is 'all', include everything
        if (operationType === 'all') return true;

        // Check if tool's operation matches selected operations
        return selectedOperations.includes(meta.operation);
      });

      selectedTools.push(...filteredTools);
    }

    // Get frequently used tools and add them if they're relevant
    const frequentTools = await getFrequentTools(5);
    const frequentToolObjects = allTools.filter((t) =>
      frequentTools.includes(t.name),
    );

    console.log(
      `[TOOL SELECTION] Selected ${selectedTools.length}/${allTools.length} tools from categories: ${selectedCategories.join(', ')} (operations: ${selectedOperations.join(', ')})`,
    );
    console.log(
      `[TOOL SELECTION] Adding ${frequentToolObjects.length} frequently used tools`,
    );

    // Always include auth tools
    const authTools = toolGroups.get('auth') || [];
    const combined = [...authTools, ...selectedTools, ...frequentToolObjects];

    // Deduplicate
    const unique = Array.from(
      new Map(combined.map((t) => [t.name, t])).values(),
    );

    console.log(
      `[TOOL SELECTION] Final: ${unique.length} tools after deduplication`,
    );

    // Calculate usage from the selection API call
    const usage: IModelUsage = {
      input: response.usage?.prompt_tokens || 0,
      cached: response.usage?.prompt_tokens_details?.cached_tokens || 0,
      output: response.usage?.completion_tokens || 0,
    };

    console.log(
      `[TOOL SELECTION] Usage: ${usage.input} input (${usage.cached} cached), ${usage.output} output`,
    );

    return { tools: unique, usage };
  } catch (error) {
    console.error('[TOOL SELECTION ERROR]', error);
    // Fallback: return all tools if selection fails
    return {
      tools: allTools,
      usage: { input: 0, cached: 0, output: 0 },
    };
  }
}
