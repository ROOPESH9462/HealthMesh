import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse } from '@healthcare/shared-utils';
import logger from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors: any = null;

  // Log error (Winston)
  logger.error(`${req.method} ${req.originalUrl} - Error: ${message}`, {
    stack: err.stack,
    statusCode,
    requestId: req.headers['x-request-id']
  });

  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Handle Zod Schema Validation Errors
  if (err.name === 'ZodError' || err.issues) {
    statusCode = 400;
    message = 'Validation Failed';
    errorCode = 'VALIDATION_FAILED';
    errors = err.issues ? err.issues.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message
    })) : err.errors;
  }

  // Handle Mongoose Cast Error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'VALIDATION_FAILED';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'CONFLICT';
    const key = Object.keys(err.keyValue)[0];
    message = `A resource with this ${key} already exists.`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Invalid authentication token. Please sign in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication token expired. Please refresh your session.';
  }

  res.status(statusCode).json(
    formatErrorResponse(message, errors, errorCode)
  );
}
