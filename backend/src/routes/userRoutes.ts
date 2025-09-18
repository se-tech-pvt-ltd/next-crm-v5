import { Router } from "express";
import { UserController } from "../controllers/UserController.js";

export const userRoutes = Router();

userRoutes.get("/", UserController.getUsers);
userRoutes.post("/", UserController.createUser);
userRoutes.post("/invite", UserController.inviteUser);
userRoutes.put("/:id", UserController.updateUser);
userRoutes.get("/:id", UserController.getUser);
userRoutes.put("/:id/password", UserController.changePassword);
userRoutes.put("/profile-image", UserController.updateProfileImage);
