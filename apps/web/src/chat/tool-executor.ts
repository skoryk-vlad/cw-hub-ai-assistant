import OpenAI from 'openai';
import { mcp } from './mcp-client.js';
import { loadToolMetadata } from './tool-selector.js';
import { ToolUsage } from '../models/tool-usage.model.js';

/**
 * Track tool usage in database for analytics
 */
async function trackToolUsage(
  toolName: string,
  responseTime: number,
  success: boolean,
) {
  try {
    const metadata = loadToolMetadata();
    const toolMeta = metadata.get(toolName);

    // Find or create tool usage record
    let toolUsage = await ToolUsage.findOne({ toolName });

    if (!toolUsage) {
      // Create new record if it doesn't exist
      toolUsage = new ToolUsage({
        toolName,
        category: toolMeta?.category || 'unknown',
        operation: toolMeta?.operation || 'read',
        tags: toolMeta?.tags || [],
        usageCount: 0,
        successCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
      });
    }

    // Update usage statistics
    await (toolUsage as any).recordUsage(responseTime, success);

    console.log(
      `[TOOL USAGE] Tracked ${toolName}: ${
        toolUsage.usageCount
      } total uses, avg ${toolUsage.avgResponseTime.toFixed(0)}ms`,
    );
  } catch (error) {
    console.error('[TOOL USAGE ERROR] Failed to track usage:', error);
    // Don't throw - usage tracking shouldn't break the main flow
  }
}

/**
 * Execute tool calls from OpenAI and return results
 */
export async function handleToolCalls(
  functionCalls: OpenAI.Responses.ResponseFunctionToolCall[],
  accessToken: string,
): Promise<OpenAI.Responses.ResponseFunctionToolCallOutputItem[]> {
  const results: OpenAI.Responses.ResponseFunctionToolCallOutputItem[] = [];

  for (const functionCall of functionCalls) {
    const toolName = functionCall.name;
    const args = JSON.parse(functionCall.arguments || '{}');

    console.log(
      `[TOOL CALL]: ${toolName}, ${JSON.stringify(
        args,
      )}. Used token: ${accessToken.slice(0, 10)}`,
    );

    const startTime = Date.now();

    try {
      const mcpResult = await mcp.callTool({
        name: toolName,
        arguments: { ...args, accessToken },
      });

      const responseTime = Date.now() - startTime;

      // Track successful tool usage
      await trackToolUsage(toolName, responseTime, true);

      results.push({
        id: functionCall.id.replace('fc_', 'fco_'),
        type: 'function_call_output',
        call_id: functionCall.call_id,
        output: JSON.stringify(mcpResult.content),
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Track failed tool usage
      await trackToolUsage(toolName, responseTime, false);

      console.error(`[TOOL CALL ERROR]: ${toolName}`, error);

      // Return error as tool output
      results.push({
        id: functionCall.id.replace('fc_', 'fco_'),
        type: 'function_call_output',
        call_id: functionCall.call_id,
        output: JSON.stringify({
          error: 'Tool call failed',
          message: error instanceof Error ? error.message : String(error),
        }),
      });
    }
  }

  return results;
}
