# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clockwise Assistant is an internal AI chatbot for Clockwise Software employees. It uses OpenAI's API with Model Context Protocol (MCP) to provide 100+ auto-generated tools that interface with the company's backend API.

**Key Architecture Pattern:** This is a dual-process system where the Express web app spawns an MCP server as a child process via stdio transport. The web app acts as an MCP client, calling tools that are dynamically registered from auto-generated files.

## Development Commands

### Quick Start (Docker - Recommended)
```bash
docker-compose up              # Starts MongoDB + API with hot reload
docker-compose down            # Stop all services
docker-compose up --build      # Rebuild after package.json changes
```

### Local Development
```bash
npm install                    # Install dependencies
npm run dev:web               # Run web app (spawns MCP server automatically)
npm run dev:mcp               # Run MCP server standalone (for testing)
npm run build                 # Build both apps
npm run build:web             # Build web app only
npm run build:mcp             # Build MCP server only
```

### Maintenance Scripts
```bash
npm run tools:generate        # Generate MCP tools from OpenAPI spec (postman.json)
npm run vector:create         # Create OpenAI vector store from PDFs in data/documents/
```

## Project Structure

```
apps/
├── web/                      # Express API (port 3001 by default)
│   ├── src/
│   │   ├── index.ts         # Entry point - MongoDB connection and server startup
│   │   ├── app.ts           # Express app configuration
│   │   ├── chat/            # Chat and OpenAI integration
│   │   │   ├── chat.controller.ts  # HTTP request handlers
│   │   │   ├── chat.service.ts     # Conversation business logic
│   │   │   ├── chat.routes.ts      # Route definitions
│   │   │   ├── mcp-client.ts       # Spawns MCP server, handles client
│   │   │   ├── openai-integration.ts  # OpenAI API integration
│   │   │   ├── tool-selector.ts    # Filters tools by user role
│   │   │   └── tool-executor.ts    # Executes MCP tools
│   │   ├── config/          # Configuration and system prompts
│   │   ├── middleware/      # Express middleware (auth, error handling)
│   │   ├── services/        # Additional business logic (roles, permissions)
│   │   ├── models/          # Mongoose schemas
│   │   ├── utils/           # Auth (JWT) and billing helpers
│   │   └── types/           # TypeScript type definitions
│   └── public/              # Static files (chat.html, widget.js)
│
└── mcp-server/              # MCP server (spawned by web app)
    ├── src/
    │   ├── index.ts         # MCP server entry - auto-discovers and registers tools
    │   ├── tools/           # Manually written MCP tools
    │   ├── tools-auto/      # Auto-generated tools (100+ endpoints)
    │   └── helpers/         # URL building utilities

scripts/
├── generate-mcp-tools.ts    # Parses OpenAPI → generates TypeScript MCP tools
└── create-vector-db.ts      # Uploads PDFs → creates OpenAI vector store

data/
└── documents/               # PDF files for RAG (file search)
```

## Critical Architecture Details

### MCP Client-Server Communication

**In Development:**
- Web app runs via `tsx watch` - restarts on file changes
- Web app spawns MCP server via `npx tsx apps/mcp-server/src/index.ts` (no compilation)
- MCP server runs as child process, communicates via stdio
- Hot reload enabled: changes to web app trigger full restart (including spawned MCP server)

**In Production:**
- Web app spawns MCP server via `node dist/mcp-server/index.js` (compiled)
- Mode detection: `process.env.NODE_ENV !== 'production'` (see `apps/web/src/chat/mcp-client.ts`)

### Tool Generation Flow

1. OpenAPI spec in `data/api-collections/postman.json`
2. Run `npm run tools:generate`
3. Script generates TypeScript files in `apps/mcp-server/src/tools-auto/`
4. Each tool exports a `get<Name>Tool()` function that returns `[name, config, handler]` tuple
5. MCP server auto-discovers tools via filename pattern matching (`/^get[A-Z].*Tool$/`)
6. Tools are registered with logging wrapper (`withLogging()` in mcp-server/src/index.ts)

### OpenAI Integration Pattern

The app uses OpenAI's **Responses API** (not Chat Completions):
- Tools are passed as `FunctionTool[]` format (not `ChatCompletionTool[]`)
- File search is integrated via vector store ID (hardcoded in chat.ts)
- Access tokens are injected into every tool call (`{ ...args, accessToken }`)
- Conversation history stored in MongoDB with token usage tracking

### Authentication Flow

- JWT tokens passed as Bearer header
- Web app validates token and extracts user ID
- MCP tools receive `accessToken` parameter and forward it to backend API
- Each backend API call uses the user's token for authorization

## Environment Configuration

**For Docker:**
```bash
MONGODB_URI=mongodb://root:example@mongodb:27017/clockwise_ai?authSource=admin
OPENAI_API_KEY=sk-...
```

**For Local Development:**
```bash
PORT=3001
OPENAI_API_KEY=sk-...
APP_URL=http://localhost:3000
ALLOWED_ORIGIN=http://localhost:4000
JWT_SECRET=local-jwt-secret
MONGODB_URI=mongodb://root:example@localhost:27017/clockwise_ai?authSource=admin
```

## Important Implementation Notes

### When Modifying MCP Tools

1. **Auto-generated tools** (`tools-auto/`): Regenerate with `npm run tools:generate`
2. **Manual tools** (`tools/`): Must export `get<Name>Tool()` function matching pattern
3. Tool handlers receive params with `accessToken` automatically injected
4. MCP server logs all tool calls with timing and preview of results

### When Changing OpenAI Integration

- Vector store ID is hardcoded in `apps/web/src/chat/openai-integration.ts`
- After running `npm run vector:create`, update this line with new vector store ID
- System prompt is in `apps/web/src/config/prompts/assistant.prompt.md`
- Model configuration is in `apps/web/src/config/openai.config.ts`
- OpenAI integration logic is split between:
  - `openai-integration.ts` - Main API calls and response streaming
  - `chat.service.ts` - Conversation management and history
  - `tool-executor.ts` - MCP tool execution

### When Working with Conversation History

- Conversations stored in MongoDB with full message history
- Schema: `Conversation` model in `apps/web/src/models/conversation.model.ts`
- Tracks token usage (input, cached, output) and estimated pricing
- History converted to OpenAI format via `toOpenAIHistory()` in chat service

### Build System

- **Root tsconfig.json**: Project references only (no compilation)
- **tsconfig.base.json**: Shared compiler options
- **apps/*/tsconfig.json**: Individual app configs, output to `dist/web/` and `dist/mcp-server/`
- TypeScript in nodenext module resolution mode (ESM with `.js` imports)

## Common Gotchas

1. **Import extensions**: Always use `.js` in imports despite writing `.ts` (ESM requirement)
2. **MCP server path**: Use relative path from project root in development, dist path in production
3. **Default port**: The application defaults to port 3001 (configurable via PORT env var)
4. **Tool discovery**: Tools must match naming pattern `get<PascalCase>Tool` to be auto-registered
5. **MongoDB connection**: Top-level await in `apps/web/src/index.ts` - must succeed before server starts
6. **File organization**: Core chat logic is in `apps/web/src/chat/` directory, not at the root of `src/`
7. **Widget endpoint**: Widget files are served at `/widget/*` (maps to `apps/web/public/`)

## Deployment Notes

Docker setup includes:
- MongoDB health checks before API starts
- Named volume for node_modules (faster rebuilds)
- Hot reload via volume mounts for source files
- Automatic restart on file changes (development mode)
