import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface SessionPayload {
  sub: string;
}

export function signToken(adminId: string): { token: string; expiresAt: Date } {
  const token = jwt.sign({ sub: adminId } satisfies SessionPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
  const { exp } = jwt.decode(token) as { exp: number };
  return { token, expiresAt: new Date(exp * 1000) };
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    return typeof payload === 'object' && typeof payload.sub === 'string' ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}
