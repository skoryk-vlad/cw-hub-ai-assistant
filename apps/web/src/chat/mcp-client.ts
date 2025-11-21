import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from '../config/index.js';

/**
 * Initialize and connect to the MCP server
 * Uses tsx in development for hot reload, compiled version in production
 */
export async function createMcpClient(): Promise<Client> {
  const mcpTransport = new StdioClientTransport({
    command: config.isDevelopment ? 'npx' : 'node',
    args: config.isDevelopment
      ? ['tsx', 'apps/mcp-server/src/index.ts']
      : ['dist/mcp-server/index.js'],
    cwd: process.cwd(),
  });

  const mcp = new Client({
    name: 'example-client',
    version: '1.0.0',
  });

  await mcp.connect(mcpTransport);

  return mcp;
}

/**
 * Global MCP client instance
 */
export const mcp = await createMcpClient();

/**
 * Get list of available tools from MCP server
 */
export async function getMcpTools() {
  return await mcp.listTools();
}
