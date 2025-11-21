import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tool metadata structure from tool-metadata.json
 */
interface ToolMetadata {
  name: string;
  category: string;
  operation: string;
  httpMethod: string;
  tags: string[];
  description: string;
  relatedTools: string[];
  allowedRoleIds?: number[];
}

interface ToolMetadataFile {
  tools: ToolMetadata[];
}

/**
 * Load tool metadata from JSON file
 * Cached to avoid repeated file reads
 */
let toolMetadataCache: Map<string, number[]> | null = null;

function loadToolMetadata(): Map<string, number[]> {
  if (toolMetadataCache) {
    return toolMetadataCache;
  }

  try {
    const metadataPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'mcp-server',
      'src',
      'tool-metadata.json',
    );

    const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
    const metadata: ToolMetadataFile = JSON.parse(metadataContent);

    // Create a map of tool name -> allowedRoleIds for fast lookups
    toolMetadataCache = new Map();
    for (const tool of metadata.tools) {
      if (tool.allowedRoleIds && tool.allowedRoleIds.length > 0) {
        toolMetadataCache.set(tool.name, tool.allowedRoleIds);
      }
    }

    return toolMetadataCache;
  } catch (error) {
    console.error('Failed to load tool metadata:', error);
    // Return empty map on error (fail-safe: no filtering)
    return new Map();
  }
}

/**
 * Check if a user with given roleId can access a specific tool
 */
export function canAccessTool(toolName: string, userRoleId: number): boolean {
  const metadata = loadToolMetadata();

  // If tool not in metadata, allow access (fail-open for unregistered tools)
  const allowedRoleIds = metadata.get(toolName);
  if (!allowedRoleIds) {
    return true;
  }

  // Check if user's roleId is in the allowed list
  return allowedRoleIds.includes(userRoleId);
}

/**
 * Filter a list of OpenAI function tools based on user's roleId
 * Returns only tools the user is allowed to access
 */
export function filterToolsByRole(
  tools: OpenAI.Responses.FunctionTool[],
  userRoleId: number,
): OpenAI.Responses.FunctionTool[] {
  return tools.filter((tool) => canAccessTool(tool.name, userRoleId));
}

/**
 * Clear the metadata cache (useful for hot reload in development)
 */
export function clearToolMetadataCache(): void {
  toolMetadataCache = null;
}
