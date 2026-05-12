import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware.
 * Express recognises 4-argument functions as error handlers.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ErrorHandler]', err.message, err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
}
