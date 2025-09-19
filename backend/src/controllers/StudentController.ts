import type { Request, Response } from "express";
import { z } from "zod";
import { StudentService } from "../services/StudentService.js";
import { insertStudentSchema } from "../shared/schema.js";

export class StudentController {
  private static getCurrentUser() {
    return {
      id: 'admin1',
      role: 'admin_staff'
    };
  }

  static async getStudents(req: Request, res: Response) {
    try {
      const currentUser = StudentController.getCurrentUser();
      const students = await StudentService.getStudents(currentUser.id, currentUser.role);
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  }

  static async getStudent(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const currentUser = StudentController.getCurrentUser();
      const student = await StudentService.getStudent(id, currentUser.id, currentUser.role);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Get student error:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  }

  static async getStudentByLeadId(req: Request, res: Response) {
    try {
      const leadId = req.params.leadId;
      const currentUser = StudentController.getCurrentUser();
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

  static async createStudent(req: Request, res: Response) {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await StudentService.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Create student error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  }

  static async convertFromLead(req: Request, res: Response) {
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
      res.status(500).json({ message: "Failed to create student" });
    }
  }

  static async updateStudent(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await StudentService.updateStudent(id, validatedData);
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

  static async deleteStudent(req: Request, res: Response) {
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

  static async searchStudents(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const currentUser = StudentController.getCurrentUser();
      const students = await StudentService.searchStudents(query, currentUser.id, currentUser.role);
      res.json(students);
    } catch (error) {
      console.error("Search students error:", error);
      res.status(500).json({ message: "Failed to search students" });
    }
  }
}
