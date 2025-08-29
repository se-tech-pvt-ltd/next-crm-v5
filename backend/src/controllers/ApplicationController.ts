import type { Request, Response } from "express";
import { z } from "zod";
import { ApplicationService } from "../services/ApplicationService.js";
import { insertApplicationSchema } from "../shared/schema.js";

export class ApplicationController {
  private static getCurrentUser() {
    return {
      id: 'admin1',
      role: 'admin_staff'
    };
  }

  static async getApplications(req: Request, res: Response) {
    try {
      const currentUser = ApplicationController.getCurrentUser();
      const applications = await ApplicationService.getApplications(currentUser.id, currentUser.role);
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  }

  static async getApplicationsByStudent(req: Request, res: Response) {
    try {
      const studentId = req.params.studentId;
      const currentUser = ApplicationController.getCurrentUser();
      const applications = await ApplicationService.getApplicationsByStudent(studentId, currentUser.id, currentUser.role);
      res.json(applications);
    } catch (error) {
      console.error("Get applications by student error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  }

  static async createApplication(req: Request, res: Response) {
    try {
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await ApplicationService.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Create application error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  }

  static async updateApplication(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
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
