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
      try { console.log('[AdmissionController] getAdmissions', { user: currentUser, count: Array.isArray(admissions) ? admissions.length : 'unknown', sample: Array.isArray(admissions) ? (admissions as any[]).slice(0,5).map(a=>({id:a.id, studentId:a.studentId, regionId:(a as any).regionId})) : null }); } catch(e){}
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

  static async getAdmission(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id;
      const currentUser = (req && req.user) ? req.user : { id: 'admin1', role: 'admin_staff' };
      const admission = await AdmissionService.getAdmission(id, currentUser.id, currentUser.role);
      if (!admission) return res.status(404).json({ message: 'Admission not found' });
      res.json(admission);
    } catch (error) {
      console.error('Get admission error:', error);
      res.status(500).json({ message: 'Failed to fetch admission' });
    }
  }

  static async createAdmission(req: AuthenticatedRequest, res: Response) {
    try {
      // Coerce string date fields to Date objects before zod validation
      const body = { ...req.body } as any;
      const dateFields = ['decisionDate','depositDate','depositDeadline','visaDate'];
      for (const f of dateFields) {
        if (typeof body[f] === 'string' && body[f].trim() !== '') {
          const d = new Date(body[f]);
          if (!Number.isNaN(d.getTime())) body[f] = d;
        }
      }

      // Remove undefined or null date fields and avoid logging raw values
      dateFields.forEach((f) => { if (body[f] === undefined || body[f] === null) delete body[f]; });
      console.log('[AdmissionController] request body date fields types:', dateFields.reduce((acc:any, f) => { acc[f] = typeof body[f]; return acc; }, {}));
      const validatedData = insertAdmissionSchema.parse(body);
      const admission = await AdmissionService.createAdmission(validatedData);
      res.status(201).json(admission);
    } catch (error) {
      console.error("Create admission error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && (error as any).code === 'APPLICATION_CONVERTED') {
        return res.status(400).json({ message: 'Application has already been converted to an admission' });
      }
      res.status(500).json({ message: "Failed to create admission" });
    }
  }

  static async updateAdmission(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id;
      const body = { ...req.body } as any;
      console.log('[AdmissionController] updateAdmission called with id:', id, 'body keys:', Object.keys(body));
      const dateFields = ['decisionDate','depositDate','depositDeadline','visaDate'];
      for (const f of dateFields) {
        if (typeof body[f] === 'string' && body[f].trim() !== '') {
          const d = new Date(body[f]);
          if (!Number.isNaN(d.getTime())) body[f] = d;
        }
      }
      const validatedData = insertAdmissionSchema.partial().parse(body);
      const admission = await AdmissionService.updateAdmission(id, validatedData);
      if (!admission) {
        console.warn('[AdmissionController] updateAdmission - Admission not found for id:', id);
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
