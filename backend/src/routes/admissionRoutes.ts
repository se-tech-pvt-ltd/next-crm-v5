import { Router } from "express";
import { AdmissionController } from "../controllers/AdmissionController.js";

export const admissionRoutes = Router();

admissionRoutes.get("/", AdmissionController.getAdmissions);
admissionRoutes.get("/student/:studentId", AdmissionController.getAdmissionsByStudent);
admissionRoutes.post("/", AdmissionController.createAdmission);
admissionRoutes.put("/:id", AdmissionController.updateAdmission);
