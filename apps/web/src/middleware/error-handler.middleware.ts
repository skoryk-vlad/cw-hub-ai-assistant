import type { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handler middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error('[ERROR]', err);

  // Default to 500 Internal Server Error
  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
