import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Helper to generate a simple unique request ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  // Set request ID in headers and attach to request object
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  // Log on request start
  logger.debug(`Incoming request: ${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Log on request end
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      userId: (req as any).user?.id // Log user ID if authenticated
    });
  });

  next();
}
