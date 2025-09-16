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
      const token = signAccessToken({ sub: user.id, role: (user as any).role });
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', token, {
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        maxAge: 15 * 60 * 1000,
        path: '/',
      });

      res.json({ user, token, expiresIn: 15 * 60 });
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
      res.json({ id: payload.sub, role: payload.role });
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized' });
    }
  }
}
