import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";

export const authRoutes = Router();

authRoutes.post("/login", AuthController.login);
authRoutes.post("/register", AuthController.register);
authRoutes.get("/me", AuthController.me);
