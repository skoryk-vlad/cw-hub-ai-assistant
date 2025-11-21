# Clockwise Assistant

An internal AI chatbot system for Clockwise Software company employees, powered by OpenAI and Model Context Protocol (MCP).

## Project Structure

```
clockwise-assistant/
├── apps/
│   ├── web/                      # Express web application
│   │   ├── src/
│   │   │   ├── index.ts         # Main server entry point
│   │   │   ├── app.ts           # Express app configuration
│   │   │   ├── chat/            # Chat and OpenAI integration
│   │   │   │   ├── chat.controller.ts  # Request handlers
│   │   │   │   ├── chat.service.ts     # Business logic
│   │   │   │   ├── chat.routes.ts      # Route definitions
│   │   │   │   ├── mcp-client.ts       # MCP client setup
│   │   │   │   ├── openai-integration.ts  # OpenAI API handling
│   │   │   │   ├── tool-selector.ts    # Tool filtering by role
│   │   │   │   └── tool-executor.ts    # Tool execution logic
│   │   │   ├── config/          # Configuration and prompts
│   │   │   ├── middleware/      # Express middleware
│   │   │   ├── services/        # Additional business logic
│   │   │   ├── models/          # MongoDB models
│   │   │   ├── utils/           # Helper functions
│   │   │   └── types/           # TypeScript type definitions
│   │   ├── public/              # Static files (chat UI and widget)
│   │   └── tsconfig.json
│   │
│   └── mcp-server/              # MCP server (runs as separate process)
│       ├── src/
│       │   ├── index.ts         # MCP server entry point
│       │   ├── tools/           # Manually written tools
│       │   ├── tools-auto/      # Auto-generated tools from OpenAPI
│       │   └── helpers/         # Helper functions
│       └── tsconfig.json
│
├── scripts/                      # Build and maintenance scripts
│   ├── generate-mcp-tools.ts    # Generate MCP tools from OpenAPI spec
│   ├── create-vector-db.ts      # Create OpenAI vector store from PDFs
│   └── README.md                # Scripts documentation
│
├── data/
│   └── documents/               # PDF files for vector database
│
├── dist/                        # Build output
│   ├── web/                     # Compiled web app
│   └── mcp-server/              # Compiled MCP server
│
├── tsconfig.json                # Root TypeScript config (references)
├── tsconfig.base.json           # Shared TypeScript config
├── package.json
├── docker-compose.yml
└── Dockerfile
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB
- OpenAI API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### Development

```bash
# Run web application in development mode
npm run dev:web

# Run MCP server in development mode (if needed separately)
npm run dev:mcp

# Or run both (default dev command runs web app)
npm run dev
```

### Building

```bash
# Build all apps
npm run build

# Build specific app
npm run build:web
npm run build:mcp
```

### Production

```bash
# Start web application
npm start
# or
npm run start:web

# Start MCP server (usually started by web app automatically)
npm run start:mcp
```

### Docker (Recommended for Development)

Docker Compose provides MongoDB and runs the application with automatic hot reload on file changes.

```bash
# Start all services (MongoDB + API)
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Rebuild after dependency changes
docker-compose up --build
```

**Features:**

- MongoDB automatically configured and ready to use
- Hot reload: code changes to both web app AND MCP server automatically restart
- Isolated environment: no need to install MongoDB locally
- Health checks ensure MongoDB is ready before starting API
- Development mode: MCP server runs via tsx (no compilation needed)

**Available endpoints:**

- API: http://localhost:3001
- Chat UI: http://localhost:3001/chat-ui
- Widget: http://localhost:3001/widget/widget.js
- MongoDB: localhost:27017

**Note:** The `.env` file should have `MONGODB_URI=mongodb://root:example@mongodb:27017/clockwise_ai?authSource=admin` for Docker.

## Scripts

### Generate MCP Tools

Generate MCP tool definitions from OpenAPI/Postman specification:

```bash
npm run tools:generate
```

This reads `postman.json` and generates tool files in `apps/mcp-server/src/tools-auto/`.

### Create Vector Database

Upload PDF documents to OpenAI and create a vector store:

```bash
npm run vector:create
```

Place your PDF files in `data/documents/` before running. After creation, update the vector store ID in `apps/web/src/chat.ts`.

See `scripts/README.md` for more details.

## Architecture

### Web Application (`apps/web/`)

- Express.js REST API
- MongoDB for conversation history
- JWT authentication
- Serves chat UI at `/chat-ui`
- Spawns MCP server as child process
- Uses OpenAI Responses API with function calling

### MCP Server (`apps/mcp-server/`)

- Standalone Model Context Protocol server
- Exposes 100+ tools from auto-generated definitions
- Communicates via stdio transport
- Auto-discovers and registers tools from `tools-auto/`

### Communication Flow

```
User → Express API → OpenAI API → Function Calls → MCP Server → Backend API
                                                          ↓
                                  ← Response ← Format ← Result
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb://...

# Optional
PORT=3001                          # Default port (3000 also works)
APP_URL=http://localhost:3000      # Your backend API URL (used for authentication in standalone mode)
ALLOWED_ORIGIN=http://localhost:4000  # CORS allowed origin (for embedded mode)
JWT_SECRET=your-jwt-secret         # Secret for JWT token verification
```

## API Endpoints

- `POST /chat` - Send chat message (requires Bearer token)
- `POST /auth/login` - Login with email/password (for standalone mode)
- `POST /auth/refresh` - Refresh access token using refresh token
- `POST /auth/logout` - Logout (clears session)
- `GET /chat-ui` - Chat interface
- `GET /login` - Login page (for standalone mode)
- `GET /health` - Health check

## Usage Modes

The chat assistant supports two different modes of operation:

### 1. Embedded Mode (Original)

The assistant runs embedded in your frontend application via an iframe. Authentication is handled by passing the user's access token from the parent application to the iframe via postMessage.

**Use this mode when:**
- You want to integrate the assistant into an existing authenticated application
- Your application already handles user authentication
- You want the assistant to use the logged-in user's credentials

See [Frontend Integration](#frontend-integration) section below for implementation details.

### 2. Standalone Mode (New)

The assistant runs as a standalone web application with its own login page. Users authenticate directly with email/password.

**Use this mode when:**
- You want to access the assistant directly in a browser without a parent application
- You need a standalone deployment
- You want users to log in directly to the assistant

**How to use:**

1. Ensure `APP_URL` environment variable points to your backend authentication API
2. Navigate to `http://localhost:3001/login` in your browser
3. Enter your email and password
4. Upon successful login, you'll be redirected to the chat interface

**How it works:**

- User enters credentials on login page
- Login endpoint (`/auth/login`) forwards credentials to backend API
- Backend API validates credentials and returns access and refresh tokens
- Our server wraps these tokens in a JWT for secure storage
- Tokens are stored in localStorage
- Chat UI automatically detects standalone mode and uses localStorage tokens
- When access token expires (401 error), automatically refreshes using refresh token
- Logout clears localStorage and redirects to login page

## Frontend Integration

### Connecting from a React Application

To integrate the Clockwise Assistant API into your React frontend, use the following custom hook:

```typescript
import { useEffect, useRef } from 'react';
import { useAccessToken } from './useAccessToken';

const CHAT_WIDGET_URL: string =
  import.meta.env.VITE_CHAT_WIDGET_URL || 'http://localhost:3001';

export const useChatWidget = () => {
  const token = useAccessToken();
  const iframeReadyRef = useRef(false);

  // Helper function to get iframe and send token
  const sendTokenToIframe = (tokenValue: string | null) => {
    const iframe = document.querySelector(
      '#chat-widget-window iframe',
    ) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'auth-token', token: tokenValue },
        CHAT_WIDGET_URL,
      );
    }
  };

  // Load widget script once on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `${CHAT_WIDGET_URL}/widget/widget.js`;
    script.async = true;
    document.body.appendChild(script);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== CHAT_WIDGET_URL) return;

      if (event.data === 'chat-ready') {
        iframeReadyRef.current = true;
        sendTokenToIframe(token);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      script.remove();
    };
  }, []);

  // Send updated token whenever it changes (after iframe is ready)
  useEffect(() => {
    if (!iframeReadyRef.current) return;

    sendTokenToIframe(token);
  }, [token]);
};
```

**Usage Example:**

```typescript
import { useChatWidget } from 'src/hooks/useChatWidget';

export const App = () => {
  useChatWidget();

  return (
    <AppRouterProvider />
  );
};
```
