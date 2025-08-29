import { Router } from "express";
import { StudentController } from "../controllers/StudentController.js";

export const studentRoutes = Router();

studentRoutes.get("/", StudentController.getStudents);
studentRoutes.get("/by-lead/:leadId", StudentController.getStudentByLeadId);
studentRoutes.get("/:id", StudentController.getStudent);
studentRoutes.post("/", StudentController.createStudent);
studentRoutes.post("/convert-from-lead", StudentController.convertFromLead);
studentRoutes.put("/:id", StudentController.updateStudent);
studentRoutes.delete("/:id", StudentController.deleteStudent);

// Search route
studentRoutes.get("/search/students", StudentController.searchStudents);
