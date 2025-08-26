import type { Request, Response } from "express";
import { z } from "zod";
import { AdmissionService } from "../services/AdmissionService.js";
import { insertAdmissionSchema } from "../shared/schema.js";

export class AdmissionController {
  private static getCurrentUser() {
    return {
      id: 'admin1',
      role: 'admin_staff'
    };
  }

  static async getAdmissions(req: Request, res: Response) {
    try {
      const currentUser = AdmissionController.getCurrentUser();
      const admissions = await AdmissionService.getAdmissions(currentUser.id, currentUser.role);
      res.json(admissions);
    } catch (error) {
      console.error("Get admissions error:", error);
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  }

  static async getAdmissionsByStudent(req: Request, res: Response) {
    try {
      const studentId = parseInt(req.params.studentId);
      const currentUser = AdmissionController.getCurrentUser();
      const admissions = await AdmissionService.getAdmissionsByStudent(studentId, currentUser.id, currentUser.role);
      res.json(admissions);
    } catch (error) {
      console.error("Get admissions by student error:", error);
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  }

  static async createAdmission(req: Request, res: Response) {
    try {
      const validatedData = insertAdmissionSchema.parse(req.body);
      const admission = await AdmissionService.createAdmission(validatedData);
      res.status(201).json(admission);
    } catch (error) {
      console.error("Create admission error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create admission" });
    }
  }

  static async updateAdmission(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAdmissionSchema.partial().parse(req.body);
      const admission = await AdmissionService.updateAdmission(id, validatedData);
      if (!admission) {
        return res.status(404).json({ message: "Admission not found" });
      }
      res.json(admission);
    } catch (error) {
      console.error("Update admission error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update admission" });
    }
  }
}
