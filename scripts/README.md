# Scripts

This directory contains build and maintenance scripts for the Clockwise Assistant project.

## Available Scripts

### `generate-mcp-tools.ts`

Generates MCP tool definitions from an OpenAPI/Postman specification file.

**Usage:**
```bash
npm run tools:generate
# or directly:
npx tsx scripts/generate-mcp-tools.ts --in ./data/api-collections/postman.json --out ./apps/mcp-server/src/tools-auto --forceBearer
```

**Options:**
- `--in` - Path to the OpenAPI/Postman JSON file
- `--out` - Output directory for generated tool files
- `--forceBearer` - Force Bearer token authentication for all endpoints

**What it does:**
- Parses OpenAPI specification
- Generates TypeScript tool definitions for each endpoint
- Creates properly typed MCP tools with Zod schemas
- Organizes tools by tags/categories

### `create-vector-db.ts`

Creates an OpenAI vector store from PDF documents for use with file search.

**Usage:**
```bash
npm run vector:create
# or directly:
npx tsx scripts/create-vector-db.ts
```

**What it does:**
- Scans the `data/documents/` directory for PDF files
- Uploads files to OpenAI
- Creates a vector store with uploaded files
- Outputs the vector store ID for use in the application

**Configuration:**
- Place PDF documents in `data/documents/`
- Requires `OPENAI_API_KEY` in `.env`
- Update the vector store ID in `apps/web/src/chat.ts` after running

## Adding New Scripts

When adding new scripts:
1. Place the script in this directory
2. Add a corresponding npm script in `package.json`
3. Update this README with usage instructions
