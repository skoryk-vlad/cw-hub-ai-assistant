// To run it
// npx tsx scripts/generate-mcp-tools.ts --in ./postman.json --out ./src/mcp/tools-auto --forceBearer

import fs from 'fs';
import path from 'path';

type OA = {
  openapi: string;
  components?: {
    securitySchemes?: Record<string, any>;
    schemas?: Record<string, any>;
  };
  security?: Array<Record<string, any>>;
  paths: Record<
    string,
    Record<
      string,
      {
        operationId?: string;
        summary?: string;
        description?: string;
        tags?: string[];
        parameters?: any[];
        requestBody?: {
          required?: boolean;
          content?: Record<
            string,
            {
              schema?: any;
            }
          >;
        };
        responses?: any;
        security?: Array<Record<string, any>>;
      }
    >
  >;
};

type CliArgs = {
  in: string;
  out: string;
  forceBearer: boolean;
  filter?: string;
};

type FilterConfig = {
  include?: {
    operationIds: string[];
  };
  exclude: {
    tags: string[];
    paths: string[];
    operationIds: string[];
    methods: string[];
  };
};

type ToolMetadata = {
  name: string;
  category: string;
  operation: 'read' | 'write' | 'delete';
  httpMethod: string;
  tags: string[];
  description: string;
  relatedTools: string[];
  allowedRoleIds?: number[];
};

// Role name to ID mapping (from system prompt)
const ROLE_NAME_TO_ID: Record<string, number> = {
  super_admin: 1,
  admin: 2,
  hr: 3,
  user: 4,
  pm: 5,
  qa: 6,
  developer: 7,
  designer: 8,
  financial_manager: 9,
  ba: 10,
  sales: 11,
  freelancer: 12,
};

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const get = (f: string, d?: string) => {
    const i = argv.indexOf(f);
    if (i < 0) return d!;
    const v = argv[i + 1];
    if (!v || v.startsWith('--')) return d!;
    return v;
  };
  const has = (f: string) => argv.includes(f);
  const input = get('--in');
  const out = get('--out', './src/tools');
  const filter = get('--filter');
  if (!input) {
    console.error(
      'Usage: ts-node generate-mcp-tools-from-openapi.ts --in openapi.json ' +
        '[--out ./src/tools] [--forceBearer] [--filter ./apps/mcp-server/tool-filter.config.json]',
    );
    process.exit(1);
  }
  return { in: input, out, forceBearer: has('--forceBearer'), filter };
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Cleaned output directory: ${dir}`);
  }
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadFilterConfig(filterPath?: string): FilterConfig | null {
  const defaultPath = './apps/mcp-server/tool-filter.config.json';
  const configPath = filterPath || defaultPath;

  try {
    if (fs.existsSync(configPath)) {
      const config = readJson<FilterConfig>(configPath);
      console.log(`Loaded filter config from ${configPath}`);
      return config;
    }
    if (filterPath) {
      console.error(`Filter config not found at ${filterPath}`);
      process.exit(1);
    }
    return null;
  } catch (error) {
    console.error(`Error reading filter config: ${error}`);
    process.exit(1);
  }
}

function matchesPattern(value: string, pattern: string): boolean {
  // Convert wildcard pattern to regex
  // Escape special regex characters except *
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(value);
}

function shouldGenerateTool(
  filterConfig: FilterConfig | null,
  path: string,
  method: string,
  op: any,
): boolean {
  if (!filterConfig) return true;

  // Check include list first (takes precedence over exclusions)
  if (filterConfig.include?.operationIds?.length && op.operationId) {
    if (filterConfig.include.operationIds.includes(op.operationId)) {
      return true; // Always include if in the include list
    }
  }

  const { exclude } = filterConfig;

  // Check excluded methods
  if (exclude.methods.length > 0) {
    if (exclude.methods.includes(method.toUpperCase())) {
      return false;
    }
  }

  // Check excluded paths (with wildcard support)
  if (exclude.paths.length > 0) {
    for (const pathPattern of exclude.paths) {
      if (matchesPattern(path, pathPattern)) {
        return false;
      }
    }
  }

  // Check excluded operationIds
  if (exclude.operationIds.length > 0 && op.operationId) {
    if (exclude.operationIds.includes(op.operationId)) {
      return false;
    }
  }

  // Check excluded tags
  if (exclude.tags.length > 0 && op.tags) {
    const opTags = op.tags as string[];
    for (const tag of opTags) {
      if (exclude.tags.includes(tag)) {
        return false;
      }
    }
  }

  return true;
}

function kebabCase(s: string): string {
  return s
    .replace(/Controller/gi, '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function toIdent(s: string): string {
  return s
    .replace(/Controller/gi, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .replace(/_+/g, '_');
}

// ------------- Zod generation with $ref resolution -------------

function zodForSchema(schemaIn: any, api: OA, stack: string[] = []): string {
  if (!schemaIn) return 'z.any()';

  // Resolve $ref first
  if (schemaIn.$ref) {
    const r = resolveRef(api, schemaIn.$ref, stack);
    if (r) return zodForSchema(r.schema, api, r.stack);
    return 'z.any()';
  }

  // Clone to avoid accidental mutation
  const schema = clone(schemaIn);

  // Handle nullable (OpenAPI 3)
  const nullable = schema.nullable === true;

  // allOf merge (try best-effort)
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const merged = mergeAllOfObjects(schema.allOf, api, stack);
    if (merged) {
      const s = zodForSchema({ ...merged, nullable }, api, stack);
      return s;
    }
    // Fallback: union of parts if cannot merge cleanly
    const parts = schema.allOf.map((p: any) => zodForSchema(p, api, stack));
    const z = `z.intersection(${parts[0]}, ${parts[1]})`;
    return nullable ? `${z}.nullable()` : z;
  }

  // oneOf/anyOf -> union
  if (schema.oneOf || schema.anyOf) {
    const list = (schema.oneOf || schema.anyOf) as any[];
    const parts = list.map((p) => zodForSchema(p, api, stack));
    const z = `z.union([${parts.join(', ')}])`;
    return nullable ? `${z}.nullable()` : z;
  }

  // If type is missing but properties exist, treat as object
  const type = schema.type || (schema.properties ? 'object' : undefined);

  if (type === 'array') {
    const item = zodForSchema(schema.items, api, stack);
    const z = `z.array(${item})`;
    return nullable ? `${z}.nullable()` : z;
  }

  if (type === 'integer' || type === 'number') {
    const z = 'z.number()';
    return nullable ? `${z}.nullable()` : z;
  }

  if (type === 'boolean') {
    const z = 'z.boolean()';
    return nullable ? `${z}.nullable()` : z;
  }

  if (type === 'string') {
    if (schema.enum) {
      const vals = schema.enum.map((v: any) => JSON.stringify(v)).join(', ');
      const z = `z.enum([${vals}])`;
      return nullable ? `${z}.nullable()` : z;
    }
    const z = 'z.string()';
    return nullable ? `${z}.nullable()` : z;
  }

  if (type === 'object') {
    const props = schema.properties || {};
    const req: string[] = schema.required || [];
    const lines: string[] = [];
    for (const [k, v] of Object.entries<any>(props)) {
      const inner = zodForSchema(v, api, stack);
      const isReq = req.includes(k);
      lines.push(`${toIdent(k)}: ${inner}${isReq ? '' : '.nullable()'}`);
    }
    const z = `z.object({ ${lines.join(', ')} })`;
    return nullable ? `${z}.nullable()` : z;
  }

  // Fallback
  return nullable ? 'z.any().nullable()' : 'z.any()';
}

// Unwrap .nullable() for mapping to ToolDefinition types
function splitByComma(str: string): string[] {
  // Split by commas while respecting nested brackets/braces
  const result: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '{' || char === '[' || char === '(') {
      depth++;
      current += char;
    } else if (char === '}' || char === ']' || char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      // Only split on commas at depth 0
      if (current.trim()) {
        result.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last part
  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

function unwrapOptional(zExpr: string): { inner: string; optional: boolean } {
  const m = zExpr.match(/^(.*)\.nullable\(\)\s*$/);
  if (m) return { inner: m[1], optional: true };
  return { inner: zExpr, optional: false };
}

function unwrapNullable(zExpr: string): { inner: string; nullable: boolean } {
  const m = zExpr.match(/^(.*)\.nullable\(\)\s*$/);
  if (m) return { inner: m[1], nullable: true };
  return { inner: zExpr, nullable: false };
}

function zodToGeneric(zExpr: string): string {
  // Respect optional and nullable wrappers
  const opt = unwrapOptional(zExpr);
  const nul = unwrapNullable(opt.inner);
  const innerExpr = nul.inner.trim();

  const wrap = (core: string) => {
    let out = core;
    // if (nul.nullable) out = `z.ZodNullable<${out}>`;
    // if (opt.optional) out = `z.ZodNullable<${out}>`;
    if (nul.nullable || opt.optional) out = `z.ZodNullable<${out}>`;
    return out;
  };

  // z.object({ ... }) -> z.ZodObject<{ ... }>
  if (innerExpr.startsWith('z.object')) {
    // Extract the object literal inside z.object({ ... })
    const m = innerExpr.match(/^z\.object\(\s*\{\s*([\s\S]*)\}\s*\)\s*$/);
    if (!m) return wrap('z.ZodObject<any>');
    const body = m[1].trim();

    // Parse fields of the form: key: <zodExpr>[.nullable()]
    // Use bracket-aware splitting to handle nested structures
    const lines = splitByComma(body);

    const shapeEntries: string[] = [];
    for (const line of lines) {
      // Find first colon to separate key from value
      const colonIndex = line.indexOf(':');
      if (colonIndex < 0) continue;
      const key = line.slice(0, colonIndex).trim();
      const valueExpr = line.slice(colonIndex + 1).trim();
      const generic = zodToGeneric(valueExpr); // recurse
      shapeEntries.push(`${key}: ${generic}`);
    }
    const shape = `{ ${shapeEntries.join('; ')} }`;
    return wrap(`z.ZodObject<${shape}>`);
  }

  // z.array(inner)
  if (innerExpr.startsWith('z.array')) {
    const innerM = innerExpr.match(/^z\.array\(\s*(.+?)\s*\)$/);
    const innerInner = innerM ? innerM[1] : 'z.any()';
    const innerGen = zodToGeneric(innerInner);
    return wrap(`z.ZodArray<${innerGen}>`);
  }

  // z.enum([...])
  if (innerExpr.startsWith('z.enum')) {
    const m = innerExpr.match(/^z\.enum\(\s*\[([^\]]*)\]\s*\)/);
    const gen = m ? `z.ZodEnum<[${m[1]}]>` : 'z.ZodEnum<any>';
    return wrap(gen);
  }

  if (innerExpr.startsWith('z.number')) return wrap('z.ZodNumber');
  if (innerExpr.startsWith('z.boolean')) return wrap('z.ZodBoolean');
  if (innerExpr.startsWith('z.string')) return wrap('z.ZodString');
  if (innerExpr.startsWith('z.any')) return wrap('z.ZodAny');

  // union/intersection and unknown complex cases → fallback
  return wrap('z.ZodAny');
}

// ------------- Security -------------

function hasGlobalBearer(api: OA): boolean {
  const sec = api.security ?? [];
  const schemes = api.components?.securitySchemes ?? {};
  const hasBearerScheme = Object.values(schemes).some(
    (s: any) => s?.type === 'http' && s?.scheme === 'bearer',
  );
  const globalRequiresBearer = sec.some((obj) =>
    Object.keys(obj).some((k) => {
      const s = schemes[k];
      return s?.type === 'http' && s?.scheme === 'bearer';
    }),
  );
  return hasBearerScheme && globalRequiresBearer;
}

function needsBearerForOp(api: OA, op: any, forceBearer: boolean): boolean {
  if (forceBearer) return true;
  const opRequires = (op.security || []).some((sec: any) =>
    Object.keys(sec).some((k) => {
      const s = api.components?.securitySchemes?.[k];
      return s?.type === 'http' && s?.scheme === 'bearer';
    }),
  );
  return opRequires || hasGlobalBearer(api);
}

// ------------- Axios assembly -------------

function buildAxiosLines(
  method: string,
  pathTpl: string,
  queryKeys: string[],
  headerKeys: string[],
  hasBody: boolean,
  contentType: string | null,
): string[] {
  const cfg: string[] = [];

  const headers: string[] = [];
  headers.push(`Authorization: \`Bearer \${accessToken}\``);
  for (const hk of headerKeys) {
    headers.push(
      `...(params.${toIdent(hk)} !== undefined ? { '${hk}': params.${toIdent(
        hk,
      )} } : {})`,
    );
  }
  if (headers.length) cfg.push(`headers: { ${headers.join(', ')} }`);

  const cfgExpr = cfg.length ? `, { ${cfg.join(', ')} }` : '';
  const baseUrl = '`' + '${process.env.APP_URL}' + pathTpl + '`';
  const url = queryKeys.length > 0 ? `buildUrl(${baseUrl}, params)` : baseUrl;

  if (['GET', 'DELETE'].includes(method) && !hasBody) {
    return [
      `const response = await axios.${method.toLowerCase()}(${url}${cfgExpr});`,
    ];
  }
  if (hasBody) {
    return [
      `const response = await axios.${method.toLowerCase()}(${url}, params.body${cfgExpr});`,
    ];
  }
  return [
    `const response = await axios.${method.toLowerCase()}(${url}${cfgExpr});`,
  ];
}

// ------------- Generation -------------

function sanitizeOpName(
  opId: string | undefined,
  method: string,
  fullPath: string,
  maxLength: number = 64,
) {
  const base =
    opId && opId.trim().length
      ? opId
      : `${method}-${fullPath.replace(/[{}]/g, '')}`;
  const noController = base.replace(/Controller/gi, '');
  let name = kebabCase(noController);

  // OpenAI tool names must be 64 characters or less
  if (name.length > maxLength) {
    const original = name;
    name = name.slice(0, maxLength);
    console.warn(
      `Warning: Tool name too long (${original.length} chars). Truncated to ${maxLength} chars: "${original}" -> "${name}"`,
    );
  }

  return name;
}

function determineOperationType(
  method: string,
  toolName: string,
): 'read' | 'write' | 'delete' {
  const methodUpper = method.toUpperCase();
  const nameLower = toolName.toLowerCase();

  // DELETE methods or delete/remove in name
  if (methodUpper === 'DELETE' || nameLower.includes('delete') || nameLower.includes('remove')) {
    return 'delete';
  }

  // GET methods are reads (unless they have mutation keywords)
  if (methodUpper === 'GET') {
    return 'read';
  }

  // POST, PUT, PATCH are writes (unless they're clearly reads)
  if (['POST', 'PUT', 'PATCH'].includes(methodUpper)) {
    // Check if it's actually a read operation (some APIs use POST for complex queries)
    if (
      nameLower.includes('find') ||
      nameLower.includes('get') ||
      nameLower.includes('search') ||
      nameLower.includes('list') ||
      nameLower.includes('query')
    ) {
      return 'read';
    }
    return 'write';
  }

  // Default to write for safety
  return 'write';
}

function generateTags(
  toolName: string,
  operation: 'read' | 'write' | 'delete',
): string[] {
  const tags: string[] = [operation];
  const nameLower = toolName.toLowerCase();

  // Add query-related tags
  if (
    nameLower.includes('find') ||
    nameLower.includes('get') ||
    nameLower.includes('search') ||
    nameLower.includes('list')
  ) {
    tags.push('query');
  }

  // Add mutation-related tags
  if (
    nameLower.includes('create') ||
    nameLower.includes('add') ||
    nameLower.includes('new')
  ) {
    tags.push('create', 'mutation');
  }

  if (
    nameLower.includes('update') ||
    nameLower.includes('edit') ||
    nameLower.includes('modify')
  ) {
    tags.push('update', 'mutation');
  }

  if (nameLower.includes('delete') || nameLower.includes('remove')) {
    tags.push('mutation');
  }

  // Add admin-related tags
  if (
    nameLower.includes('activate') ||
    nameLower.includes('deactivate') ||
    nameLower.includes('approve') ||
    nameLower.includes('reject')
  ) {
    tags.push('admin');
  }

  // Add list-related tags
  if (nameLower.includes('all') || nameLower.includes('list')) {
    tags.push('list');
  }

  // Add single-item tags
  if (nameLower.includes('one') || nameLower.includes('by-id')) {
    tags.push('single');
  }

  return [...new Set(tags)]; // Remove duplicates
}

type ParamField = {
  key: string;
  z: string;
  required: boolean;
  where: 'path' | 'query' | 'header';
};

function collectParams(
  api: OA,
  params: any[] | undefined,
): {
  fields: ParamField[];
  pathParams: string[];
  queryKeys: string[];
  headerKeys: string[];
} {
  const fields: ParamField[] = [];
  const pathParams: string[] = [];
  const queryKeys: string[] = [];
  const headerKeys: string[] = [];
  for (const p of params ?? []) {
    const key = p.name;
    const z = zodForSchema(p.schema || {}, api);
    const required = !!p.required;
    if (p.in === 'path') {
      pathParams.push(key);
      fields.push({ key, z: z || 'z.string()', required: true, where: 'path' });
    } else if (p.in === 'query') {
      queryKeys.push(key);
      fields.push({ key, z, required, where: 'query' });
    } else if (p.in === 'header') {
      headerKeys.push(key);
      fields.push({ key, z, required, where: 'header' });
    }
  }
  return { fields, pathParams, queryKeys, headerKeys };
}

function requestBodyInfo(
  api: OA,
  reqBody: any,
): {
  hasBody: boolean;
  zBody: string | null;
  contentType: string | null;
  required: boolean;
} {
  if (!reqBody)
    return { hasBody: false, zBody: null, contentType: null, required: false };

  const content = reqBody.content || {};
  const types = Object.keys(content);
  const preferred = types.includes('application/json')
    ? 'application/json'
    : types[0] || null;

  if (!preferred)
    return { hasBody: false, zBody: null, contentType: null, required: false };

  const s = content[preferred]?.schema;
  const z = zodForSchema(s, api, []);
  return {
    hasBody: true,
    zBody: z,
    contentType: preferred,
    required: !!reqBody.required,
  };
}

// Resolve local $ref like "#/components/schemas/Name"
function resolveRef(api: OA, ref: string, stack: string[] = []): any | null {
  const m = ref.match(/^#\/components\/schemas\/(.+)$/);
  if (!m) return null;
  const key = m[1];
  if (!api.components?.schemas || !api.components.schemas[key]) return null;
  if (stack.includes(key)) return null; // prevent cycles

  return { schema: api.components.schemas[key], stack: [...stack, key] };
}

// Deep clone small utility
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Merge allOf when all parts are objects with properties/required
function mergeAllOfObjects(parts: any[], api: OA, stack: string[]): any | null {
  const resolvedParts = parts.map((p) => {
    if (p.$ref) {
      const r = resolveRef(api, p.$ref, stack);
      return r ? r.schema : null;
    }
    return p;
  });

  if (resolvedParts.some((p) => !p)) return null;

  const canMerge = resolvedParts.every(
    (p) => p.type === 'object' || p.properties || p.allOf,
  );

  if (!canMerge) return null;

  const out: any = { type: 'object', properties: {}, required: [] as string[] };
  for (const part of resolvedParts) {
    if (part.allOf) {
      const merged = mergeAllOfObjects(part.allOf, api, stack);
      if (merged) {
        Object.assign(out.properties, merged.properties || {});
        out.required = Array.from(
          new Set([...(out.required || []), ...(merged.required || [])]),
        );
        continue;
      }
    }
    const props = part.properties || {};
    Object.assign(out.properties, props);
    const req = part.required || [];
    out.required = Array.from(new Set([...(out.required || []), ...req]));
  }

  return out;
}

/**
 * Extracts x-required-roles from operation and converts to role IDs
 * Returns undefined if no x-required-roles specified (means all roles allowed)
 */
function extractAllowedRoleIds(op: any): number[] | undefined {
  const requiredRoles = op['x-required-roles'];

  if (!requiredRoles || !Array.isArray(requiredRoles)) {
    return undefined; // No restriction = all roles
  }

  const roleIds: number[] = [];

  for (const roleName of requiredRoles) {
    const roleId = ROLE_NAME_TO_ID[roleName];
    if (roleId !== undefined) {
      roleIds.push(roleId);
    } else {
      console.warn(
        `Unknown role name in x-required-roles: "${roleName}" for operation ${op.operationId || 'unknown'}`,
      );
    }
  }

  // Return sorted unique IDs
  return [...new Set(roleIds)].sort((a, b) => a - b);
}

function genOneTool(
  api: OA,
  fullPath: string,
  method: string,
  op: any,
  outDir: string,
  tag: string | null,
  forceBearer: boolean,
): ToolMetadata {
  const tagFolder = kebabCase(tag || 'untagged');
  const folder = path.join(outDir, tagFolder);
  ensureDir(folder);

  const toolName = sanitizeOpName(op.operationId, method, fullPath);
  const exportName =
    'get' +
    toolName
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') +
    'Tool';
  const typeName =
    toolName
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + 'Tool';

  const { fields, queryKeys, headerKeys } = collectParams(
    api,
    op.parameters || [],
  );
  const rb = requestBodyInfo(api, op.requestBody);
  const hasBody = rb.hasBody;
  const contentType = rb.contentType;

  const bearer = needsBearerForOp(api, op, forceBearer);

  const pathTpl = fullPath.replace(
    /\{([^}]+)\}/g,
    (_m, p1) => '${params.' + toIdent(p1) + '}',
  );

  const inputSchemaLines: string[] = [];
  const typeLines: string[] = [];

  for (const f of fields) {
    const zExpr = f.z + (f.required ? '' : '.nullable()');
    inputSchemaLines.push(`      ${toIdent(f.key)}: ${zExpr},`);
    typeLines.push(`  ${toIdent(f.key)}: ${zodToGeneric(zExpr)};`);
  }

  if (hasBody && rb.zBody) {
    const bodyZ = rb.zBody + (rb.required ? '' : '.nullable()');
    inputSchemaLines.push(`      body: ${bodyZ},`);
    typeLines.push(`  body: ${zodToGeneric(bodyZ)};`);
  }

  if (bearer) {
    inputSchemaLines.push(`      accessToken: z.string(),`);
    typeLines.push(`  accessToken: z.ZodString;`);
  }

  const axiosLines = buildAxiosLines(
    method,
    pathTpl,
    queryKeys,
    headerKeys,
    hasBody,
    contentType,
  );

  const title = op.summary || op.operationId || `${method} ${fullPath}`;
  const desc = op.description || title;

  const ts = `import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';${queryKeys?.length ? `\nimport { buildUrl } from '../../helpers/build-url.helper.js';` : ''}

type ${typeName} = ToolDefinition<{
${typeLines.join('\n')}
}>;

export function ${exportName}(): ${typeName} {
  const name: string = '${toolName}';

  const config: ${typeName}[1] = {
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(desc)},
    inputSchema: {
${inputSchemaLines.join('\n')}
    },
  };

  const cb: ${typeName}[2] = async ({ accessToken, ...params }) => {
    try {
      ${axiosLines.join('\n      ')}
      const responseString = JSON.stringify(response.data);
      return { content: [{ type: 'text', text: responseString }] };
    } catch (err) {
      let error =
        err instanceof AxiosError
          ? JSON.stringify(err.response.data)
          : JSON.stringify(err);

      return {
        content: [
          {
            type: 'text',
            text: \`Request failed. Error: \${error}\`,
          },
        ],
      };
    }
  };

  return [name, config, cb];
}
`;

  const filePath = path.join(folder, `${toolName}.ts`);
  fs.writeFileSync(filePath, ts, 'utf8');

  // Generate and return metadata
  const operation = determineOperationType(method, toolName);
  const tags = generateTags(toolName, operation);

  // Extract role requirements from x-required-roles
  const allowedRoleIds = extractAllowedRoleIds(op);

  return {
    name: toolName,
    category: tagFolder,
    operation,
    httpMethod: method,
    tags,
    description: desc,
    relatedTools: [], // Will be populated in post-processing
    allowedRoleIds,
  };
}

function findRelatedTools(allMetadata: ToolMetadata[]): ToolMetadata[] {
  // Group tools by category
  const byCategory = new Map<string, ToolMetadata[]>();
  for (const meta of allMetadata) {
    const existing = byCategory.get(meta.category) || [];
    existing.push(meta);
    byCategory.set(meta.category, existing);
  }

  // Find related tools within same category
  for (const meta of allMetadata) {
    const categoryTools = byCategory.get(meta.category) || [];
    const baseName = meta.name.replace(/-find-all|-find-one|-create|-update|-delete|-edit|-add|-remove/g, '');

    meta.relatedTools = categoryTools
      .filter((other) => {
        if (other.name === meta.name) return false;
        const otherBaseName = other.name.replace(/-find-all|-find-one|-create|-update|-delete|-edit|-add|-remove/g, '');
        return baseName === otherBaseName;
      })
      .map((other) => other.name)
      .slice(0, 5); // Limit to 5 related tools
  }

  return allMetadata;
}

function main() {
  const args = parseArgs();
  const api = readJson<OA>(args.in);

  // Clean and recreate output directory
  cleanDir(args.out);
  ensureDir(args.out);

  // Load filter configuration
  const filterConfig = loadFilterConfig(args.filter);

  const allMetadata: ToolMetadata[] = [];
  let skippedCount = 0;

  for (const [p, methods] of Object.entries(api.paths)) {
    for (const [m, op] of Object.entries(methods)) {
      const method = m.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) continue;

      // Apply filtering
      if (!shouldGenerateTool(filterConfig, p, method, op)) {
        skippedCount++;
        continue;
      }

      const tags = (
        op.tags && op.tags.length ? op.tags : ['untagged']
      ) as string[];
      for (const tag of tags) {
        const metadata = genOneTool(api, p, method, op, args.out, tag, args.forceBearer);
        allMetadata.push(metadata);
      }
    }
  }

  // Find related tools
  const metadataWithRelations = findRelatedTools(allMetadata);

  // Save metadata to JSON file
  const metadataPath = path.join(path.dirname(args.out), 'tool-metadata.json');
  fs.writeFileSync(
    metadataPath,
    JSON.stringify({ tools: metadataWithRelations }, null, 2),
    'utf8'
  );

  console.log(`Generated ${allMetadata.length} tools in ${path.resolve(args.out)}`);
  if (skippedCount > 0) {
    console.log(`Skipped ${skippedCount} tools based on filter config`);
  }
  console.log(`Tool metadata saved to ${path.resolve(metadataPath)}`);
}

main();
