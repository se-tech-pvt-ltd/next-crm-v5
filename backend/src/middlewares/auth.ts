import type { Request, Response, NextFunction } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { parseAuthHeader, parseCookies, verifyAccessToken } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role?: string; regionId?: string | null; branchId?: string | null; roleDetails?: any };
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

  // Populate request user with role details if available in token
  const user: any = { id: payload.sub, role: payload.role };
  if ((payload as any).role_details) {
    const rd = (payload as any).role_details;
    user.regionId = rd.region_id || rd.regionId || null;
    user.branchId = rd.branch_id || rd.branchId || null;
    user.roleDetails = rd;
    // Prefer role from role_details if present and normalize it
    const rawRole = rd.role_name || rd.role || payload.role;
    if (rawRole) {
      let norm = String(rawRole).toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
      if (norm === 'branch_head') norm = 'branch_manager';
      if (norm === 'counsellor') norm = 'counselor';
      user.role = norm;
    }
  } else if (payload.role) {
    // Normalize role from payload.role if no role_details
    let norm = String(payload.role).toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
    if (norm === 'branch_head') norm = 'branch_manager';
    if (norm === 'counsellor') norm = 'counselor';
    user.role = norm;
  }

  req.user = user;
  next();
}
