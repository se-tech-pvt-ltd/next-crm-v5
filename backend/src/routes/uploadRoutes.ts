import { Router } from "express";
import { UploadController } from "../controllers/UploadController.js";
import { upload } from "../middlewares/upload.js";

export const uploadRoutes = Router();

uploadRoutes.post("/profile-picture", upload.single('profilePicture'), UploadController.uploadProfilePicture);
