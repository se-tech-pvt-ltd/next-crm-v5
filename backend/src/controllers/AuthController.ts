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
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      res.json(user);
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
}
