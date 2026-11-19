import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

const fail = (
  res: Parameters<ErrorRequestHandler>[2],
  status: number,
  message: string,
  code: string,
  errors?: unknown,
) => res.status(status).json({ success: false, message, code, ...(errors ? { errors } : {}) });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return fail(res, 400, errors[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR', errors);
  }
  if (err instanceof ApiError) {
    return fail(res, err.statusCode, err.message, err.code, err.details);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return fail(res, 400, 'Validation failed', 'VALIDATION_ERROR', errors);
  }
  if (err instanceof mongoose.Error.CastError) {
    return fail(res, 400, `Invalid value for ${err.path}`, 'BAD_REQUEST');
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return fail(res, 409, `A record with this ${field} already exists`, 'DUPLICATE', [
      { field, message: `This ${field} is already in use` },
    ]);
  }
  if (err?.type === 'entity.parse.failed') {
    return fail(res, 400, 'Malformed JSON body', 'BAD_REQUEST');
  }
  if (err?.type === 'entity.too.large') {
    return fail(res, 413, 'Request body too large', 'PAYLOAD_TOO_LARGE');
  }

  logger.error('Unhandled error', err);
  return fail(res, 500, env.isProd ? 'Internal server error' : String(err?.message ?? err), 'INTERNAL_ERROR');
};
