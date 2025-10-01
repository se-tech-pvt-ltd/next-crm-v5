import { Router } from "express";
import { AdmissionController } from "../controllers/AdmissionController.js";
import { requireAuth } from "../middlewares/auth.js";

export const admissionRoutes = Router();

admissionRoutes.get("/", requireAuth, AdmissionController.getAdmissions);
admissionRoutes.get("/student/:studentId", requireAuth, AdmissionController.getAdmissionsByStudent);
admissionRoutes.get("/:id", requireAuth, AdmissionController.getAdmission);
admissionRoutes.post("/", requireAuth, AdmissionController.createAdmission);
admissionRoutes.put("/:id", requireAuth, AdmissionController.updateAdmission);
