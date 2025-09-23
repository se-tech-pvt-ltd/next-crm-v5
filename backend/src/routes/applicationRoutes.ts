import { Router } from "express";
import { ApplicationController } from "../controllers/ApplicationController.js";
import { requireAuth } from "../middlewares/auth.js";

export const applicationRoutes = Router();

applicationRoutes.get("/", requireAuth, ApplicationController.getApplications);
applicationRoutes.get("/student/:studentId", requireAuth, ApplicationController.getApplicationsByStudent);
applicationRoutes.get("/:id", requireAuth, ApplicationController.getApplication);
applicationRoutes.post("/", requireAuth, ApplicationController.createApplication);
applicationRoutes.put("/:id", requireAuth, ApplicationController.updateApplication);
