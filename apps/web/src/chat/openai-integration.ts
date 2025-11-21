import OpenAI from 'openai';
import { config, loadSystemPrompt } from '../config/index.js';
import { openaiConfig, OpenAiModel } from '../config/openai.config.js';
import { estimatePrice, IModelUsage } from '../utils/billing.js';
import { selectRelevantTools } from './tool-selector.js';
import { handleToolCalls } from './tool-executor.js';
import { getMcpTools } from './mcp-client.js';
import { filterToolsByRole } from '../services/tool-permission.service.js';

/**
 * OpenAI client instance
 */
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Recursively add additionalProperties: false to all object schemas
 * Required by OpenAI's strict mode in SDK version 6.9.1+
 */
function addAdditionalPropertiesFalse(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const result = { ...schema };

  // If this is an object type, add additionalProperties: false
  if (result.type === 'object' || result.properties) {
    result.additionalProperties = false;
  }

  // Recursively process properties
  if (result.properties) {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([key, value]) => [
        key,
        addAdditionalPropertiesFalse(value),
      ]),
    );
  }

  // Recursively process nested schemas in arrays, allOf, anyOf, oneOf
  if (result.items) {
    result.items = addAdditionalPropertiesFalse(result.items);
  }
  if (result.allOf) {
    result.allOf = result.allOf.map(addAdditionalPropertiesFalse);
  }
  if (result.anyOf) {
    result.anyOf = result.anyOf.map(addAdditionalPropertiesFalse);
  }
  if (result.oneOf) {
    result.oneOf = result.oneOf.map(addAdditionalPropertiesFalse);
  }

  return result;
}

/**
 * Convert MCP tools to OpenAI function tools format
 * Filters tools based on user's role permissions
 */
async function getOpenAiTools(
  userRoleId: number,
): Promise<OpenAI.Responses.FunctionTool[]> {
  const toolList = await getMcpTools();

  const allTools = toolList.tools.map((t) => ({
    type: 'function' as const,
    name: t.name,
    description: t.description ?? t.title ?? '',
    strict: true,
    parameters: addAdditionalPropertiesFalse(t.inputSchema),
  }));

  // Filter tools based on user's role
  return filterToolsByRole(allTools, userRoleId);
}

/**
 * Main chat function that handles OpenAI Responses API integration
 */
export async function chat(
  message: string,
  history: OpenAI.Responses.ResponseInput,
  accessToken: string,
  userRoleId: number,
  model: OpenAiModel = openaiConfig.model,
) {
  const newMessages: OpenAI.Responses.ResponseInput = [
    {
      role: 'user',
      type: 'message',
      content: [{ type: 'input_text', text: message }],
    },
  ];

  const usage = {
    input: 0,
    cached: 0,
    output: 0,
  };

  // Get all available tools (filtered by user role)
  const openaiTools = await getOpenAiTools(userRoleId);

  // Select only relevant tools for this query
  const conversationContext: string[] = history
    .filter(
      (msg: OpenAI.Responses.ResponseInputItem) =>
        msg.type === 'message' && msg.role === 'user',
    )
    .map((msg: any) =>
      msg.content
        .filter((c: any) => c.type === 'input_text')
        .map((c: any) => c.text)
        .join(' '),
    );

  const toolSelectionModel = OpenAiModel.GPT_4O_MINI;
  const { tools: relevantTools, usage: toolSelectionUsage } =
    await selectRelevantTools(
      message,
      openaiTools,
      conversationContext,
      toolSelectionModel,
    );

  // Add tool selection usage to total
  usage.input += toolSelectionUsage.input;
  usage.cached += toolSelectionUsage.cached;
  usage.output += toolSelectionUsage.output;

  // Load system prompt from markdown file
  const systemPrompt = loadSystemPrompt();

  let done = false;
  let response: OpenAI.Responses.Response;

  while (!done) {
    response = await openai.responses.create({
      model,
      input: [...history, ...newMessages],
      reasoning: {
        effort: 'none',
      },
      tools: [
        {
          type: 'file_search',
          vector_store_ids: [openaiConfig.vectorStoreId],
          max_num_results: 5,
        },
        ...relevantTools,
      ],
      instructions: systemPrompt,
    });

    usage.input += response.usage.input_tokens;
    usage.cached += response.usage.input_tokens_details.cached_tokens;
    usage.output += response.usage.output_tokens;
    usage.output += response.usage.output_tokens_details.reasoning_tokens;

    // Log file search calls
    const fileSearchCalls = response.output.filter(
      (item) => item.type === 'file_search_call',
    );
    if (fileSearchCalls.length) {
      console.log(
        `[FILE SEARCH CALL]: ${fileSearchCalls[0].queries}. Response: ${fileSearchCalls[0].results}`,
      );
    }

    // Handle function calls
    const functionCalls = response.output.filter(
      (item) => item.type === 'function_call',
    );

    newMessages.push(...response.output);

    if (functionCalls.length) {
      const results = await handleToolCalls(functionCalls, accessToken);
      newMessages.push(...results);
    } else {
      done = true;
    }
  }

  // Calculate total price: main model + tool selection model
  const mainModelUsage: IModelUsage = {
    input: usage.input - toolSelectionUsage.input,
    cached: usage.cached - toolSelectionUsage.cached,
    output: usage.output - toolSelectionUsage.output,
  };
  const totalPrice =
    estimatePrice(mainModelUsage, model) +
    estimatePrice(toolSelectionUsage, toolSelectionModel);

  return {
    newMessages,
    result: response.output_text,
    usage,
    estimatedPrice: totalPrice,
  };
}
