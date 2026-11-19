import type { CookieOptions, RequestHandler } from 'express';
import { env } from '../config/env';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/response';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  // SameSite=None is only accepted by browsers together with Secure.
  secure: env.isProd || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE,
  path: '/',
});

export const login: RequestHandler = async (req, res) => {
  const { token, expiresAt, admin } = await authService.login(req.body.email, req.body.password);
  res.cookie(env.COOKIE_NAME, token, { ...cookieOptions(), expires: expiresAt });
  sendSuccess(res, 'Logged in successfully', { admin, expiresAt });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(env.COOKIE_NAME, cookieOptions());
  sendSuccess(res, 'Logged out successfully', null);
};

export const me: RequestHandler = (req, res) => {
  sendSuccess(res, 'Authenticated', { admin: req.admin });
};
