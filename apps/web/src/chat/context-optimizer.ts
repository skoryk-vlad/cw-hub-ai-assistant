import type {
  IItemDocument,
  FunctionCallOutputItem,
  ReasoningItem,
} from '../types/conversation.types.js';
import { contextOptimizationConfig } from '../config/openai.config.js';

/**
 * Context Optimization Module
 *
 * Provides two key optimizations:
 * 1. Conversation windowing - limits items sent to OpenAI while preserving pairs
 * 2. Tool response field extraction - compresses large arrays by keeping only key fields
 */

// ============================================================================
// CONVERSATION WINDOWING
// ============================================================================

/**
 * Determines if an item is "meaningful" for windowing purposes.
 * Meaningful items count toward the max items limit.
 *
 * NOT meaningful (don't count toward limit):
 * - reasoning items (kept separately if non-empty)
 * - function_call items (kept with their pairs)
 * - function_call_output items (kept with their pairs)
 */
function isMeaningfulItem(item: IItemDocument): boolean {
  return ![
    'reasoning',
    'function_call',
    'function_call_output',
  ].includes(item.type);
}

/**
 * Checks if a reasoning item has substantial content
 */
function isNonEmptyReasoning(item: IItemDocument): boolean {
  if (item.type !== 'reasoning') return false;
  const reasoningItem = item as ReasoningItem;
  return !!(reasoningItem.content || reasoningItem.summary);
}

/**
 * Selects conversation items for sending to OpenAI with smart windowing.
 *
 * Algorithm:
 * 1. Select last N "meaningful" items (messages, searches, etc.)
 * 2. Add function_call + function_call_output pairs for selected items
 * 3. Add non-empty reasoning items that precede meaningful items
 * 4. Return items in original order
 *
 * @param items - Full conversation history
 * @param maxMeaningfulItems - Max number of meaningful items to keep (default: 15)
 * @returns Filtered items array
 */
export function selectConversationItems(
  items: IItemDocument[],
  maxMeaningfulItems: number = 15,
): IItemDocument[] {
  if (items.length === 0) return [];

  const meaningfulIndices: number[] = [];
  for (let i = 0; i < items.length; i++) {
    if (isMeaningfulItem(items[i])) {
      meaningfulIndices.push(i);
    }
  }

  if (meaningfulIndices.length <= maxMeaningfulItems) {
    return items;
  }

  const indicesToKeep = new Set<number>();
  const lastMeaningful = meaningfulIndices.slice(-maxMeaningfulItems);

  for (const idx of lastMeaningful) {
    indicesToKeep.add(idx);
  }

  for (let i = 0; i < items.length; i++) {
    if (indicesToKeep.has(i)) {
      const item = items[i];

      if (item.type === 'function_call' || item.type === 'function_call_output') {
        const callId = (item as any).call_id;

        for (let j = 0; j < items.length; j++) {
          const otherItem = items[j] as any;
          if (
            (otherItem.type === 'function_call' ||
              otherItem.type === 'function_call_output') &&
            otherItem.call_id === callId
          ) {
            indicesToKeep.add(j);
          }
        }
      }

      if (i > 0 && items[i - 1].type === 'reasoning') {
        if (isNonEmptyReasoning(items[i - 1])) {
          indicesToKeep.add(i - 1);
        }
      }
    }
  }

  return items.filter((_, idx) => indicesToKeep.has(idx));
}

// ============================================================================
// TOOL RESPONSE FIELD EXTRACTION
// ============================================================================

interface TruncationOptions {
  arrayItemThreshold: number; // Start field extraction at this size (default: 5)
  maxDepth: number; // Default: 3
  maxStringLength: number; // Default: 1000
  keyFields: string[]; // Fields to always keep
}

// Common identifying field names
const DEFAULT_KEY_FIELDS = [
  'id',
  'name',
  'title',
  'status',
  'type',
  'key',
  'code',
  'email',
  'label',
];

/**
 * Detects which fields to keep from an object based on heuristics.
 *
 * Strategy:
 * 1. Check for common key field names (id, name, title, etc.)
 * 2. If found >= 2, use those
 * 3. Otherwise, use first N simple fields (string/number/boolean)
 *
 * @param obj - Object to analyze
 * @param commonKeyNames - List of common key field names
 * @returns Array of field names to extract
 */
function detectKeyFields(
  obj: Record<string, any>,
  commonKeyNames: string[] = DEFAULT_KEY_FIELDS,
): string[] {
  if (!obj || typeof obj !== 'object') return [];

  const objectKeys = Object.keys(obj);

  // Heuristic 1: Use common names if present
  const foundCommon = objectKeys.filter((k) => commonKeyNames.includes(k));
  if (foundCommon.length >= 2) {
    return foundCommon;
  }

  // Heuristic 2: Use shortest simple keys
  const simpleKeys = objectKeys
    .filter((k) => {
      const v = obj[k];
      return (
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean'
      );
    })
    .sort((a, b) => a.length - b.length)
    .slice(0, 5);

  if (simpleKeys.length >= 2) {
    return simpleKeys;
  }

  // Heuristic 3: All simple keys
  return objectKeys.filter((k) => {
    const v = obj[k];
    return (
      typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    );
  });
}

/**
 * Recursively truncates a tool response by extracting key fields from large arrays.
 *
 * @param data - Tool response data
 * @param options - Truncation options
 * @param depth - Current recursion depth
 * @returns Truncated data with metadata
 */
function truncateToolResponse(
  data: any,
  options: TruncationOptions,
  depth: number = 0,
): any {
  const { arrayItemThreshold, maxDepth, maxStringLength, keyFields } = options;

  if (depth > maxDepth) {
    return '[truncated: max depth reached]';
  }

  if (data === null || typeof data !== 'object') {
    if (typeof data === 'string' && data.length > maxStringLength) {
      return data.slice(0, maxStringLength) + '... [truncated]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    if (data.length <= arrayItemThreshold) {
      return data.map((item) => truncateToolResponse(item, options, depth + 1));
    }

    const firstItem = data[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      return data;
    }

    const fieldsToKeep = detectKeyFields(firstItem, keyFields);

    if (fieldsToKeep.length === 0) {
      return data
        .slice(0, Math.min(arrayItemThreshold, data.length))
        .map((item) => truncateToolResponse(item, options, depth + 1));
    }

    const truncated = data.map((item) => {
      const extracted: Record<string, any> = {};
      for (const field of fieldsToKeep) {
        if (field in item) {
          const value = item[field];
          if (
            value === null ||
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            extracted[field] = value;
          }
        }
      }
      return extracted;
    });

    return {
      _items: truncated,
      _truncation: {
        totalCount: data.length,
        fieldsKept: fieldsToKeep,
        note: 'Verbose fields removed. Use specific query for full details.',
      },
    };
  }

  const result: Record<string, any> = {};

  if ('count' in data && 'rows' in data && Array.isArray(data.rows)) {
    result.count = data.count;
    result.rows = truncateToolResponse(data.rows, options, depth + 1);
    return result;
  }

  if (
    'data' in data &&
    Array.isArray(data.data) &&
    Object.keys(data).length === 1
  ) {
    return {
      data: truncateToolResponse(data.data, options, depth + 1),
    };
  }

  for (const [key, value] of Object.entries(data)) {
    result[key] = truncateToolResponse(value, options, depth + 1);
  }

  return result;
}

/**
 * Optimizes function call output items by truncating large tool responses.
 *
 * @param items - Conversation items (potentially windowed)
 * @returns Items with optimized function_call_output.output fields
 */
export function optimizeFunctionOutputs(
  items: IItemDocument[],
): IItemDocument[] {
  const config = contextOptimizationConfig.toolResponseTruncation;

  return items.map((item) => {
    if (item.type !== 'function_call_output') {
      return item;
    }

    const outputItem = item as FunctionCallOutputItem & IItemDocument;

    try {
      const parsed = JSON.parse(outputItem.output);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed[0].type === 'text' &&
        typeof parsed[0].text === 'string'
      ) {
        const actualData = JSON.parse(parsed[0].text);

        const optimized = truncateToolResponse(
          actualData,
          {
            arrayItemThreshold: config.arrayItemThreshold,
            maxDepth: config.maxDepth,
            maxStringLength: config.maxStringLength,
            keyFields: config.keyFields,
          },
          0,
        );

        const wrappedOptimized = [
          {
            type: 'text',
            text: JSON.stringify(optimized),
          },
        ];

        return {
          ...item.toObject(),
          output: JSON.stringify(wrappedOptimized),
        } as IItemDocument;
      } else {
        const optimized = truncateToolResponse(
          parsed,
          {
            arrayItemThreshold: config.arrayItemThreshold,
            maxDepth: config.maxDepth,
            maxStringLength: config.maxStringLength,
            keyFields: config.keyFields,
          },
          0,
        );

        return {
          ...item.toObject(),
          output: JSON.stringify(optimized),
        } as IItemDocument;
      }
    } catch (error) {
      console.error('[CONTEXT OPTIMIZER] Error processing output:', error);
      return item;
    }
  });
}
