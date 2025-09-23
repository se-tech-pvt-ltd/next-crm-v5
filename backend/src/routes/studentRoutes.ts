import { Router } from "express";
import { StudentController } from "../controllers/StudentController.js";
import { requireAuth } from "../middlewares/auth.js";

export const studentRoutes = Router();

studentRoutes.get("/", requireAuth, StudentController.getStudents);
studentRoutes.get("/by-lead/:leadId", requireAuth, StudentController.getStudentByLeadId);
studentRoutes.get("/:id", requireAuth, StudentController.getStudent);
studentRoutes.post("/", requireAuth, StudentController.createStudent);
studentRoutes.post("/convert-from-lead", requireAuth, StudentController.convertFromLead);
studentRoutes.put("/:id", requireAuth, StudentController.updateStudent);
studentRoutes.delete("/:id", requireAuth, StudentController.deleteStudent);

// Search route
studentRoutes.get("/search/students", requireAuth, StudentController.searchStudents);
