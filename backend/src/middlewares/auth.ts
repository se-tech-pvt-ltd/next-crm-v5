import type { Request, Response, NextFunction } from 'express';
import { parseAuthHeader, parseCookies, verifyAccessToken } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role?: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const bearer = parseAuthHeader(req.headers['authorization'] as string | undefined);
  let token = bearer;
  if (!token) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies['access_token'];
  }
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ message: 'Unauthorized' });
  req.user = { id: payload.sub, role: payload.role };
  next();
}
