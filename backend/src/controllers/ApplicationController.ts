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
      console.log('[CreateApplication] req.body:', req.body);
      // Allow partial input first, then apply role-based required checks
      const validatedData = insertApplicationSchema.partial().parse(req.body);
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };

      const roleRaw = (currentUser as any)?.role || (currentUser as any)?.role_name || '';
      const roleName = String(roleRaw || '').trim().toLowerCase().replace(/\s+/g, '_');
      const isPartner = String(roleName || '').includes('partner');

      if (isPartner) {
        if (!validatedData.subPartner && !validatedData.subPartnerId && !validatedData.subPartnerId) {
          return res.status(400).json({ message: 'Sub partner is required for partner users' });
        }
        // ensure partner is set to current user if missing
        if (!validatedData.partner) validatedData.partner = String(currentUser.id);
      } else {
        const missing: string[] = [];
        if (!validatedData.regionId) missing.push('region');
        if (!validatedData.branchId) missing.push('branch');
        if (!validatedData.counsellorId) missing.push('counsellor');
        if (!validatedData.admissionOfficerId) missing.push('admissionOfficer');
        if (missing.length) {
          return res.status(400).json({ message: `${missing.join('; ')} are required` });
        }
      }

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
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const application = await ApplicationService.updateApplication(id, validatedData, currentUser.id);
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
