import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { ZodRawShape } from 'zod';

export type ToolDefinition<T extends ZodRawShape> = [
  string,
  {
    title?: string;
    description?: string;
    inputSchema?: T;
    outputSchema?: ZodRawShape;
    annotations?: ToolAnnotations;
  },
  ToolCallback<T>,
];
