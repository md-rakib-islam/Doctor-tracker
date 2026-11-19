import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { Admin } from '../models/Admin';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

/** Protects a route: requires a valid session cookie (or Bearer token) belonging to an existing admin. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined;
  const token: string | undefined = req.cookies?.[env.COOKIE_NAME] ?? bearer;
  if (!token) throw ApiError.unauthorized();

  const payload = verifyToken(token);
  if (!payload) throw ApiError.unauthorized('Session expired or invalid. Please sign in again.');

  // One indexed lookup lets us revoke access immediately by removing an admin.
  const admin = await Admin.findById(payload.sub).select('name email').lean();
  if (!admin) throw ApiError.unauthorized('Account no longer exists');

  req.admin = { id: String(admin._id), email: admin.email, name: admin.name };
  next();
};
