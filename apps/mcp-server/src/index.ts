import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Console } from 'console';
import { config } from 'dotenv';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
config();

const logger = new Console({ stdout: process.stderr, stderr: process.stderr });
export const log = (message: string) => {
  logger.log(`[MCP] ${new Date().toISOString()} - ${message}`);
};
const error = (message: string) => {
  logger.error(`[MCP] ${new Date().toISOString()} - ${message}`);
};

// Create MCP server
const server = new McpServer({
  name: 'clockwise-assistant-mcp',
  version: '1.0.0',
});

// Helper: wrap tool callbacks to add logging
function withLogging<T extends any[]>(
  tool: [string, any, (...args: any[]) => Promise<any>],
): [string, any, (...args: any[]) => Promise<any>] {
  const [name, config, cb] = tool;
  const wrapped = async (params: any, ...rest: any[]) => {
    const startedAt = Date.now();
    try {
      log(`"${name}" called with: ${safeJson(params)}`);
      const res = await cb(params, ...rest);
      const duration = Date.now() - startedAt;
      log(`"${name}" success (${duration}ms): ${preview(res)}`);
      // log(JSON.stringify(res));

      return res;
    } catch (err) {
      const duration = Date.now() - startedAt;
      error(`"${name}" error (${duration}ms): ${safeJson(err)}`);
      throw err;
    }
  };
  return [name, config, wrapped];
}

function safeJson(v: any): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function preview(v: any, max = 300): string {
  const s = safeJson(v);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// Auto-discover and register generated tools under ./tools/**.tool.js or .ts compiled to .js
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const toolsDir = path.resolve(path.join(__dirname, 'tools-auto'));

function isToolModuleExport(key: string) {
  // Our generator exports functions named get<PascalName>Tool
  return /^get[A-Z].*Tool$/.test(key);
}

async function autoRegisterTools() {
  if (!fs.existsSync(toolsDir)) return;

  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        // Expect transpiled .js files at runtime
        if (
          (full.endsWith('.js') || full.endsWith('.ts')) &&
          !full.endsWith('.d.ts')
        ) {
          files.push(full);
        }
      }
    }
  }

  walk(toolsDir);

  let count = 0;
  for (const file of files) {
    try {
      const mod = await import(pathToFileUrl(file));
      const exportNames = Object.keys(mod).filter(isToolModuleExport);
      for (const name of exportNames) {
        const factory = mod[name];
        if (typeof factory === 'function') {
          const toolTuple = factory();
          server.registerTool(...withLogging(toolTuple));
          count++;
        }
      }
    } catch (e) {
      error(`failed to load tools from ${file}: ${e}`);
    }
  }

  return count;
}

function pathToFileUrl(p: string) {
  const u = new URL('file://');
  u.pathname = path.resolve(p).replace(/\\/g, '/');
  return u.href;
}

// Start server
(async () => {
  const autoCount = await autoRegisterTools().catch(() => 0);

  const transport = new StdioServerTransport();
  server.connect(transport);

  log(`server started name=clockwise-assistant-mcp tools=${autoCount}`);
})();

// (async () => {
//   const autoCount = await autoRegisterTools().catch(() => 0);

//   const app = express();
//   // app.use(express.json({ limit: '2mb' }));
//   app.use(cors());

//   // Create the Streamable HTTP transport and mount it at /mcp
//   const transport = new StreamableHTTPServerTransport({
//     // You can pass auth/cors handlers if supported by your SDK version
//     // cors: { origin: '*', methods: ['GET', 'POST', 'OPTIONS'] },
//     sessionIdGenerator: () => randomUUID(),
//   });

//   // Connect MCP server to the transport
//   server.connect(transport);

//   // Mount the transport’s handlers
//   // POST: client-to-server JSON-RPC messages
//   app.post('/mcp', (req, res) => transport.handleRequest(req, res));
//   // GET: optional SSE stream for server-to-client messages
//   app.get('/mcp', (req, res) => transport.handleRequest(req, res));
//   // OPTIONS: CORS preflight (optional)
//   app.options('/mcp', (req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
//     res.setHeader(
//       'Access-Control-Allow-Headers',
//       'Content-Type, Authorization, Accept',
//     );
//     res.status(204).end();
//   });

//   // const PORT = Number(process.env.PORT || 3000);
//   const PORT = 3002;
//   app.listen(PORT, () => {
//     console.log(
//       `MCP Streamable HTTP server listening at http://localhost:${PORT}/mcp tools=${autoCount}`,
//     );
//   });
// })();
