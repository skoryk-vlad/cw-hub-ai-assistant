import express from 'express';
import cors from 'cors';
import path from 'path';
import { readFileSync } from 'fs';
import chatRoutes from './chat/chat.routes.js';
import authRoutes from './auth/auth.routes.js';
import { errorHandler } from './middleware/error-handler.middleware.js';

/**
 * Create and configure Express application
 */
export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Static widget + UI
  const publicPath = path.join(process.cwd(), 'apps/web/public');
  app.use('/widget', express.static(publicPath));

  app.get('/chat-ui', (_req, res) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:4000';

    // Read and inject env var into HTML
    const chatHtml = readFileSync(path.join(publicPath, 'chat.html'), 'utf8');
    const injectedHtml = chatHtml.replace(
      '__ENV_ALLOWED_ORIGIN__',
      allowedOrigin,
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(injectedHtml);
  });

  // Login page for standalone mode
  app.get('/login', (_req, res) => {
    res.sendFile(path.join(publicPath, 'login.html'));
  });

  // API routes
  app.use('/auth', authRoutes);
  app.use('/chat', chatRoutes);

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
