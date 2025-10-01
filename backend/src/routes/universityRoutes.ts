import { Router } from "express";
import { universityController } from "../controllers/UniversityController";
import { requireAuth } from "../middlewares/auth.js";

export const universityRoutes = Router();

universityRoutes.get("/", requireAuth, universityController.list);
universityRoutes.get("/:id", requireAuth, universityController.getById);
export default universityRoutes;
