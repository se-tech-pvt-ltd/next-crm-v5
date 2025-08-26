import { ilike, or, and } from "drizzle-orm";
import { db } from "../config/database.js";
import { leads, type Lead, type InsertLead } from "../shared/schema.js";
import { LeadModel } from "../models/Lead.js";
import { ActivityService } from "./ActivityService.js";

export class LeadService {
  static async getLeads(userId?: string, userRole?: string): Promise<Lead[]> {
    if (userRole === 'counselor' && userId) {
      return await LeadModel.findByCounselor(userId);
    }
    return await LeadModel.findAll();
  }

  static async getLead(id: number, userId?: string, userRole?: string): Promise<Lead | undefined> {
    const lead = await LeadModel.findById(id);
    
    if (!lead) return undefined;
    
    // Check role-based access
    if (userRole === 'counselor' && userId && lead.counselorId !== userId) {
      return undefined;
    }
    
    return lead;
  }

  static async createLead(leadData: InsertLead): Promise<Lead> {
    const lead = await LeadModel.create(leadData);
    
    // Log activity
    await ActivityService.logActivity(
      'lead', 
      lead.id, 
      'created', 
      'Lead created',
      `Lead ${lead.name} was added to the system`
    );
    
    return lead;
  }

  static async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    // Get the current lead to track changes
    const currentLead = await LeadModel.findById(id);
    if (!currentLead) return undefined;

    const lead = await LeadModel.update(id, updates);
    
    if (lead) {
      // Log changes for each updated field
      for (const [fieldName, newValue] of Object.entries(updates)) {
        if (fieldName === 'updatedAt') continue;
        
        const oldValue = (currentLead as any)[fieldName];
        if (oldValue !== newValue) {
          const fieldDisplayName = fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
          
          await ActivityService.logActivity(
            'lead', 
            id, 
            'updated', 
            `${fieldDisplayName} updated`,
            `${fieldDisplayName} changed from "${oldValue || 'empty'}" to "${newValue || 'empty'}"`,
            fieldName,
            String(oldValue || ''),
            String(newValue || ''),
            undefined,
            "Next Bot"
          );
        }
      }
    }

    return lead;
  }

  static async assignLeadToCounselor(leadId: number, counselorId: string): Promise<boolean> {
    const success = await LeadModel.assignToCounselor(leadId, counselorId);
    
    if (success) {
      await ActivityService.logActivity(
        'lead', 
        leadId, 
        'assigned', 
        'Lead assigned to counselor',
        `Lead assigned to counselor ${counselorId}`
      );
    }
    
    return success;
  }

  static async deleteLead(id: number): Promise<boolean> {
    const lead = await LeadModel.findById(id);
    const success = await LeadModel.delete(id);
    
    if (success && lead) {
      await ActivityService.logActivity(
        'lead', 
        id, 
        'deleted', 
        'Lead deleted',
        `Lead ${lead.name} was deleted from the system`
      );
    }
    
    return success;
  }

  static async searchLeads(query: string, userId?: string, userRole?: string): Promise<Lead[]> {
    const searchConditions = or(
      ilike(leads.name, `%${query}%`),
      ilike(leads.email, `%${query}%`),
      ilike(leads.program, `%${query}%`),
      ilike(leads.country, `%${query}%`)
    );
    
    if (userRole === 'counselor' && userId) {
      return await db.select().from(leads).where(
        and(
          eq(leads.counselorId, userId),
          searchConditions
        )
      );
    }
    
    return await db.select().from(leads).where(searchConditions);
  }
}
