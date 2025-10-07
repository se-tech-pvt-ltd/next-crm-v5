import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { PasswordResetController } from "../controllers/PasswordResetController.js";

export const authRoutes = Router();

authRoutes.post("/login", AuthController.login);
authRoutes.post("/register", AuthController.register);
authRoutes.get("/me", AuthController.me);
authRoutes.post("/logout", AuthController.logout);
authRoutes.get("/reset-password/verify", PasswordResetController.verify);
authRoutes.post("/reset-password", PasswordResetController.reset);
