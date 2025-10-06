import type { Response } from "express";
import { z } from "zod";
import { StudentService } from "../services/StudentService.js";
import { insertStudentSchema } from "../shared/schema.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

export class StudentController {
  static async getStudents(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const students = await StudentService.getStudents(currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId);
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  }

  static async getStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id;
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const student = await StudentService.getStudent(id, currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Get student error:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  }

  static async getStudentByLeadId(req: AuthenticatedRequest, res: Response) {
    try {
      const leadId = req.params.leadId;
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const student = await StudentService.getStudentByLeadId(leadId, currentUser.id, currentUser.role);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Get student by leadId error:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  }

  static async createStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
    const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
    const student = await StudentService.createStudent(validatedData, currentUser.id);
    res.status(201).json(student);
    } catch (error) {
      console.error("Create student error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  }

  static async convertFromLead(req: AuthenticatedRequest, res: Response) {
    try {
      const { leadId, ...studentData } = req.body as any;

      if (!leadId) {
        return res.status(400).json({ message: 'leadId is required' });
      }

      const { mapStudentFromLeadPayload } = await import("../utils/helpers.js");
      const transformed = mapStudentFromLeadPayload(studentData);
      const toValidate = { ...transformed, leadId };

      const validatedData = insertStudentSchema.parse(toValidate);
      const student = await StudentService.convertFromLead(leadId, validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Convert lead to student error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && (error as any).code === 'LEAD_CONVERTED') {
        return res.status(400).json({ message: 'Lead has already been converted to a student' });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  }

  static async updateStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id;
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const student = await StudentService.updateStudent(id, validatedData, currentUser.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Update student error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  }

  static async deleteStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id;
      const success = await StudentService.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete student error:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  }

  static async searchStudents(req: AuthenticatedRequest, res: Response) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const students = await StudentService.searchStudents(query, currentUser.id, currentUser.role);
      res.json(students);
    } catch (error) {
      console.error("Search students error:", error);
      res.status(500).json({ message: "Failed to search students" });
    }
  }
}
