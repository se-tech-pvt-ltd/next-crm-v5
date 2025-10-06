import type { Response } from "express";
import { z } from "zod";
import { ApplicationService } from "../services/ApplicationService.js";
import { insertApplicationSchema } from "../shared/schema.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

export class ApplicationController {
  static async getApplications(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const applications = await ApplicationService.getApplications(currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId);
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  }

  static async getApplicationsByStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const studentId = req.params.studentId;
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const applications = await ApplicationService.getApplicationsByStudent(studentId, currentUser.id, currentUser.role);
      res.json(applications);
    } catch (error) {
      console.error("Get applications by student error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  }

  static async getApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id;
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      console.log('[GetApplication] id:', id);
      const application = await ApplicationService.getApplication(id, currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId);
      console.log('[GetApplication] found:', !!application);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Get application error:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  }

  static async createApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = insertApplicationSchema.parse(req.body);
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
    const application = await ApplicationService.createApplication(validatedData, currentUser.id);
    res.status(201).json(application);
    } catch (error) {
      console.error("Create application error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  }

  static async updateApplication(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id;
      const validatedData = insertApplicationSchema.partial().parse(req.body);
      const application = await ApplicationService.updateApplication(id, validatedData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Update application error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update application" });
    }
  }
}
