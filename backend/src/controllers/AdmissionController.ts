import type { Response } from "express";
import { z } from "zod";
import { AdmissionService } from "../services/AdmissionService.js";
import { insertAdmissionSchema } from "../shared/schema.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

export class AdmissionController {
  static async getAdmissions(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const admissions = await AdmissionService.getAdmissions(currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId);
      res.json(admissions);
    } catch (error) {
      console.error("Get admissions error:", error);
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  }

  static async getAdmissionsByStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const studentId = req.params.studentId;
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const admissions = await AdmissionService.getAdmissionsByStudent(studentId, currentUser.id, currentUser.role);
      res.json(admissions);
    } catch (error) {
      console.error("Get admissions by student error:", error);
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  }

  static async createAdmission(req: AuthenticatedRequest, res: Response) {
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

  static async updateAdmission(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id;
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
