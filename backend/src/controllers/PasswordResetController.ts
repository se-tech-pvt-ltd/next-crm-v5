import type { Request, Response } from "express";
import { z } from "zod";

import { UserModel } from "../models/User.js";
import { AuthService } from "../services/AuthService.js";
import { UserResetTokenService } from "../services/UserResetTokenService.js";

const verifyQuerySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

const resetBodySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8),
});

const INVALID_TOKEN_MESSAGE = "Invalid or expired token";

export class PasswordResetController {
  static async verify(req: Request, res: Response) {
    try {
      const { email, token } = verifyQuerySchema.parse({
        email: req.query.email,
        token: req.query.token,
      });

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: INVALID_TOKEN_MESSAGE });
      }

      const record = await UserResetTokenService.validateTokenForUser(user.id, token);
      if (!record) {
        return res.status(400).json({ message: INVALID_TOKEN_MESSAGE });
      }

      return res.json({
        message: "Token valid",
        expiresAt: record.expiry.toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request" });
      }
      console.error("[PasswordResetController] verify error", error);
      return res.status(500).json({ message: "Failed to verify token" });
    }
  }

  static async reset(req: Request, res: Response) {
    try {
      const { email, token, password } = resetBodySchema.parse(req.body);

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: INVALID_TOKEN_MESSAGE });
      }

      const record = await UserResetTokenService.validateTokenForUser(user.id, token);
      if (!record) {
        return res.status(400).json({ message: INVALID_TOKEN_MESSAGE });
      }

      await AuthService.updateUserPassword(user.id, password);
      await UserResetTokenService.markTokenAsUsed(record.id);

      return res.json({ message: "Password updated" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request" });
      }
      console.error("[PasswordResetController] reset error", error);
      return res.status(500).json({ message: "Failed to reset password" });
    }
  }
}
