import { Router } from "express";
import { ApplicationController } from "../controllers/ApplicationController.js";

export const applicationRoutes = Router();

applicationRoutes.get("/", ApplicationController.getApplications);
applicationRoutes.get("/student/:studentId", ApplicationController.getApplicationsByStudent);
applicationRoutes.get("/:id", ApplicationController.getApplication);
applicationRoutes.post("/", ApplicationController.createApplication);
applicationRoutes.put("/:id", ApplicationController.updateApplication);
