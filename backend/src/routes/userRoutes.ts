import { Router } from "express";
import { UserController } from "../controllers/UserController.js";

export const userRoutes = Router();

userRoutes.get("/", UserController.getUsers);
userRoutes.put("/:id", UserController.updateUser);
userRoutes.put("/profile-image", UserController.updateProfileImage);
