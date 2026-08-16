import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || undefined;

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors ? err.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })) : err.issues;
  }

  // Handle Mongoose CastError / ValidationError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field ${err.path}`;
  }

  console.error(`[API ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${message}`, err.stack || err);

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    details: details || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
