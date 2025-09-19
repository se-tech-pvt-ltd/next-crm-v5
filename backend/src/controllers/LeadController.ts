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

      console.log(`Getting leads: page=${page}, limit=${limit}, offset=${offset}, user=${currentUser.id}, role=${currentUser.role}`);

      const result = await LeadService.getLeads(currentUser.id, currentUser.role, { page, limit, offset }, (currentUser as any).regionId, (currentUser as any).branchId);

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
      const payload = { ...validatedData, createdBy: currentUser.id, updatedBy: currentUser.id } as any;
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
