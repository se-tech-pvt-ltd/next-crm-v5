import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRY = process.env.JWT_EXPIRES_IN || '15m';
const SECRET = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';

export type JwtPayload = { sub: string; role?: string } & Record<string, any>;

export function signAccessToken(payload: JwtPayload, expiresIn: string = DEFAULT_EXPIRY): string {
  return jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn, subject: payload.sub });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function parseAuthHeader(header?: string | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const [k, v] = part.split('=');
    if (k && v) out[k.trim()] = decodeURIComponent(v.trim());
  }
  return out;
}
