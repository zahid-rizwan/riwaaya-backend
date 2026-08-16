import { Response } from 'express';

export interface ApiResponseOptions<T = any> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: any;
}

export const sendResponse = <T = any>(
  res: Response,
  statusCode = 200,
  message = 'Success',
  data?: T,
  meta?: any
) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message,
    data: data !== undefined ? data : null,
    meta: meta || undefined
  });
};
