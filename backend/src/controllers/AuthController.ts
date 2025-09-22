import type { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/AuthService.js";
import { insertUserSchema } from "../shared/schema.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const createUserSchema = z.object({
  user: insertUserSchema,
  password: z.string().min(6),
});

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await AuthService.authenticateUser(email, password);
      if (!user) return res.status(401).json({ error: "Invalid email or password" });

      const { signAccessToken } = await import("../utils/jwt.js");
      // Fetch role/branch/region details for the user to include in token
      try {
        const { connection } = await import('../config/database.js');
        const sql = `SELECT ur.role_name,
       COALESCE(r.id, r2.id, r3.id) AS region_id,
       COALESCE(r.region_name, r2.region_name, r3.region_name) AS region_name,
       COALESCE(b.id, b2.id) AS branch_id,
       COALESCE(b.branch_name, b2.branch_name) AS branch_name
FROM users u
JOIN user_roles ur ON u.role_id = ur.id
LEFT JOIN regions r ON (ur.role_name = 'regional manager' AND r.region_head_id = u.id)
LEFT JOIN branches b ON (ur.role_name = 'branch manager' AND b.branch_head_id = u.id)
LEFT JOIN regions r2 ON (ur.role_name = 'branch manager' AND r2.id = b.branch_region)
LEFT JOIN branch_emps be ON (ur.role_name IN ('counsellor','admission officer') AND be.user_id = u.id)
LEFT JOIN branches b2 ON (ur.role_name IN ('counsellor','admission officer') AND b2.id = be.branch_id)
LEFT JOIN regions r3 ON (ur.role_name IN ('counsellor','admission officer') AND r3.id = b2.branch_region)
WHERE u.id = ? LIMIT 1`;
        const [rows] = await connection.query<any[]>(sql, [user.id]);
        const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        const roleDetails = row ? {
          role_name: row.role_name ?? null,
          region_id: row.region_id ?? null,
          region_name: row.region_name ?? null,
          branch_id: row.branch_id ?? null,
          branch_name: row.branch_name ?? null,
        } : null;

        // Attach to the user object returned in response
        (user as any).role_details = roleDetails;

        // Include role details in JWT payload (be mindful of token size)
        const tokenPayload: any = { sub: user.id, role: (user as any).role };
        if (roleDetails) tokenPayload.role_details = roleDetails;

        const token = signAccessToken(tokenPayload);
        const expRaw = process.env.JWT_EXPIRES_IN || '60m';
        const expMs = (() => {
          const m = String(expRaw);
          const num = parseInt(m, 10);
          if (Number.isFinite(num)) return m.endsWith('m') || m.endsWith('h') || m.endsWith('s') ? 0 : num * 1000; // plain seconds
          const match = m.match(/^(\d+)([smhd])$/i);
          if (match) {
            const v = parseInt(match[1], 10);
            const u = match[2].toLowerCase();
            if (u === 's') return v * 1000;
            if (u === 'm') return v * 60 * 1000;
            if (u === 'h') return v * 60 * 60 * 1000;
            if (u === 'd') return v * 24 * 60 * 60 * 1000;
          }
          return 60 * 60 * 1000; // default 1h
        })();
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('access_token', token, {
          httpOnly: true,
          sameSite: isProd ? 'none' : 'lax',
          secure: isProd,
          maxAge: expMs,
          path: '/',
        });

        res.json({ user, token, expiresIn: Math.floor(expMs / 1000) });
        return;
      } catch (fetchErr) {
        console.error('Failed to fetch role details for token:', fetchErr);
        // Fallback: sign basic token without role_details
        const token = signAccessToken({ sub: user.id, role: (user as any).role });
        const expRaw = process.env.JWT_EXPIRES_IN || '60m';
        const expMs = (() => {
          const m = String(expRaw);
          const num = parseInt(m, 10);
          if (Number.isFinite(num)) return m.endsWith('m') || m.endsWith('h') || m.endsWith('s') ? 0 : num * 1000;
          const match = m.match(/^(\d+)([smhd])$/i);
          if (match) {
            const v = parseInt(match[1], 10);
            const u = match[2].toLowerCase();
            if (u === 's') return v * 1000;
            if (u === 'm') return v * 60 * 1000;
            if (u === 'h') return v * 60 * 60 * 1000;
            if (u === 'd') return v * 24 * 60 * 60 * 1000;
          }
          return 60 * 60 * 1000;
        })();
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('access_token', token, {
          httpOnly: true,
          sameSite: isProd ? 'none' : 'lax',
          secure: isProd,
          maxAge: expMs,
          path: '/',
        });

        res.json({ user, token, expiresIn: Math.floor(expMs / 1000) });
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { user: userData, password } = createUserSchema.parse(req.body);
      const user = await AuthService.createUserWithPassword(userData, password);
      res.json(user);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Failed to create user" });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const { parseAuthHeader, parseCookies, verifyAccessToken } = await import('../utils/jwt.js');
      const bearer = parseAuthHeader(req.headers['authorization'] as string | undefined);
      let token = bearer;
      if (!token) token = parseCookies(req.headers.cookie)['access_token'];
      if (!token) return res.status(401).json({ message: 'Unauthorized' });
      const payload = verifyAccessToken(token);
      if (!payload) return res.status(401).json({ message: 'Unauthorized' });
      const out: any = { id: payload.sub, role: payload.role };
      if (payload.role_details) out.role_details = payload.role_details;
      res.json(out);
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      // Clear the access_token cookie by setting it to empty and expiring it
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', '', {
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        expires: new Date(0),
        path: '/',
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Failed to logout' });
    }
  }
}
