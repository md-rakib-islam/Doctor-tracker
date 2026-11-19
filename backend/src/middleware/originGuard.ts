import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence-in-depth for cookie auth: state-changing requests that carry an Origin header
 * must come from an allowed frontend origin. (Non-browser clients send no Origin and are unaffected.)
 */
export const originGuard: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin;
  if (SAFE_METHODS.has(req.method) || !origin) return next();
  if (!env.corsOrigins.includes(origin.replace(/\/$/, ''))) throw ApiError.forbidden('Origin not allowed');
  next();
};
