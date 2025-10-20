import type { Request, Response } from "express";
import { z } from "zod";
import { LeadService } from "../services/LeadService.js";
import { insertLeadSchema } from "../shared/schema.js";

export class LeadController {
  static getFallbackUser() {
    return { id: 'admin1', role: 'admin_staff' };
  }

  static async getLeads(req: Request, res: Response) {
    try {
      const currentUser = (req && req.user) ? req.user : LeadController.getFallbackUser();

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Parse filter parameters
      const status = req.query.status as string | undefined;
      const source = req.query.source as string | undefined;
      const lastUpdated = req.query.lastUpdated as string | undefined;
      const filterType = req.query.filterType as 'active' | 'lost' | 'converted' | undefined;

      console.log(`Getting leads: page=${page}, limit=${limit}, offset=${offset}, user=${currentUser.id}, role=${currentUser.role}`);

      const result = await LeadService.getLeads(currentUser.id, currentUser.role, { page, limit, offset }, (currentUser as any).regionId, (currentUser as any).branchId, { status, source, lastUpdated, filterType });

      console.log(`Lead results: total=${result.total}, leads count=${result.leads.length}`);

      const response = {
        data: result.leads,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNextPage: page < Math.ceil(result.total / limit),
          hasPrevPage: page > 1
        }
      };

      console.log(`Pagination response:`, JSON.stringify(response.pagination, null, 2));

      res.json(response);
    } catch (error) {
      console.error("Get leads error:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const currentUser = (req && req.user) ? req.user : LeadController.getFallbackUser();

      // Parse filter parameters
      const status = req.query.status as string | undefined;
      const source = req.query.source as string | undefined;
      const lastUpdated = req.query.lastUpdated as string | undefined;
      const filterType = req.query.filterType as 'active' | 'lost' | 'converted' | undefined;

      const stats = await LeadService.getStats(currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId, { status, source, lastUpdated, filterType });
      res.json(stats);
    } catch (error) {
      console.error("Get leads stats error:", error);
      res.status(500).json({ message: "Failed to fetch leads stats" });
    }
  }

  static async getLead(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const currentUser = (req && req.user) ? req.user : LeadController.getFallbackUser();
      const lead = await LeadService.getLead(id, currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Get lead error:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  }

  static async createLead(req: Request, res: Response) {
    try {
      console.log("Received lead data:", JSON.stringify(req.body, null, 2));
      const currentUser = (req && req.user) ? req.user : LeadController.getFallbackUser();
      const validatedData = insertLeadSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));

      // Enforce region/branch from authenticated user where applicable
      const role = String((currentUser as any)?.role || '').toLowerCase();
      const userRegionId = (currentUser as any)?.regionId;
      const userBranchId = (currentUser as any)?.branchId;

      const payload = { ...validatedData, createdBy: currentUser.id, updatedBy: currentUser.id } as any;
      if (role === 'regional_manager' && userRegionId) {
        payload.regionId = userRegionId;
      }
      if (role === 'branch_manager') {
        if (userRegionId) payload.regionId = userRegionId;
        if (userBranchId) payload.branchId = userBranchId;
      }

      console.log("Create payload (with audit fields):", JSON.stringify(payload, null, 2));
      const lead = await LeadService.createLead(payload, currentUser.id);
      console.log("Created lead:", JSON.stringify(lead, null, 2));
      res.status(201).json(lead);
    } catch (error) {
      console.error("Create lead error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  }

  static async updateLead(req: Request, res: Response) {
    try {
      const id = req.params.id;
      console.log('Updating lead:', id, 'with data:', req.body);
      const { processLeadUpdatePayload } = await import("../utils/helpers.js");
      const processedData = processLeadUpdatePayload(req.body);
      const currentUser = (req && req.user) ? req.user : LeadController.getFallbackUser();
      const validatedData = insertLeadSchema.partial().parse(processedData);
      const lead = await LeadService.updateLead(id, { ...validatedData, updatedBy: currentUser.id } as any, currentUser.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error('Lead update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid data",
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      if (error instanceof Error && (error as any).code === 'LEAD_CONVERTED') {
        return res.status(400).json({ message: "Lead has been converted to a student and cannot be edited" });
      }
      if (error instanceof Error && (error as any).message === 'EMAIL_PHONE_SAME') {
        return res.status((error as any).status || 400).json({ message: 'Email and phone cannot be the same' });
      }
      if (error instanceof Error && (error as any).message === 'DUPLICATE') {
        const f = (error as any).fields || {};
        const emailDup = Boolean(f.email);
        const phoneDup = Boolean(f.phone);
        const msg = emailDup && phoneDup
          ? 'Duplicate email and phone'
          : emailDup
            ? 'Duplicate email'
            : phoneDup
              ? 'Duplicate phone'
              : 'Duplicate';
        return res.status((error as any).status || 409).json({ message: msg, fields: { email: emailDup, phone: phoneDup } });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  }

  static async deleteLead(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const success = await LeadService.deleteLead(id);
      if (!success) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete lead error:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  }

  static async searchLeads(req: Request, res: Response) {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const currentUser = (req && req.user) ? req.user : LeadController.getFallbackUser();
      const leads = await LeadService.searchLeads(query, currentUser.id, currentUser.role, (currentUser as any).regionId, (currentUser as any).branchId);
      res.json(leads);
    } catch (error) {
      console.error("Search leads error:", error);
      res.status(500).json({ message: "Failed to search leads" });
    }
  }
}
