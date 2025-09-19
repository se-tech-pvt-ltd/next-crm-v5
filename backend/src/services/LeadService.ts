import { ilike, or, and, eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { leads, students, type Lead, type InsertLead } from "../shared/schema.js";
import { LeadModel } from "../models/Lead.js";
import { ActivityService } from "./ActivityService.js";

interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

interface PaginatedLeadsResult {
  leads: Lead[];
  total: number;
}

export class LeadService {
  static async getLeads(userId?: string, userRole?: string, pagination?: PaginationOptions, regionId?: string): Promise<PaginatedLeadsResult> {
    if (userRole === 'counselor' && userId) {
      return await LeadModel.findByCounselor(userId, pagination);
    }

    if (userRole === 'regional_manager') {
      if (regionId) {
        return await LeadModel.findByRegion(regionId, pagination);
      }
      // If regional manager role but no region assigned, return empty result to avoid exposing all records
      return { leads: [], total: 0 };
    }

    // Default: if user has a region, scope by region unless super_admin
    if (regionId && userRole !== 'super_admin') {
      return await LeadModel.findByRegion(regionId, pagination);
    }

    return await LeadModel.findAll(pagination);
  }

  static async getLead(id: string, userId?: string, userRole?: string, regionId?: string): Promise<Lead | undefined> {
    const lead = await LeadModel.findById(id);

    if (!lead) return undefined;

    // Check role-based access
    if (userRole === 'counselor' && userId && lead.counselorId !== userId) {
      return undefined;
    }

    // Region scoping for any role that has a region (except super_admin)
    if (regionId && userRole !== 'super_admin') {
      if ((lead as any).regionId !== regionId) return undefined;
    }

    return lead;
  }

  static async createLead(leadData: InsertLead, currentUserId?: string): Promise<Lead> {
    const enriched: InsertLead = {
      ...leadData,
      createdBy: (leadData as any).createdBy ?? currentUserId ?? (leadData as any).counselorId ?? null,
      updatedBy: (leadData as any).updatedBy ?? (leadData as any).createdBy ?? currentUserId ?? (leadData as any).counselorId ?? null,
    } as any;

    const lead = await LeadModel.create(enriched);

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

  static async updateLead(id: string, updates: Partial<InsertLead>, currentUserId?: string): Promise<Lead | undefined> {
    // Block edits if lead already converted to student
    const converted = await db.select().from(students).where(eq(students.leadId, id));
    if (converted.length > 0) {
      const err = new Error('LEAD_CONVERTED');
      // @ts-expect-error attach code
      (err as any).code = 'LEAD_CONVERTED';
      throw err;
    }

    // Get the current lead to track changes
    const currentLead = await LeadModel.findById(id);
    if (!currentLead) return undefined;

    const lead = await LeadModel.update(id, { ...updates, updatedBy: (updates as any).updatedBy ?? currentUserId ?? (updates as any).createdBy ?? (updates as any).counselorId ?? null });
    
    if (lead) {
      // Log only selected changes
      for (const [fieldName, newValue] of Object.entries(updates)) {
        if (fieldName === 'updatedAt') continue;
        if (fieldName !== 'status' && fieldName !== 'counselorId') continue;

        const oldValue = (currentLead as any)[fieldName];
        if (oldValue !== newValue) {
          if (fieldName === 'status') {
            await ActivityService.logActivity(
              'lead',
              id,
              'status_changed',
              'Status updated',
              `Status changed from "${oldValue || 'empty'}" to "${newValue || 'empty'}"`,
              fieldName,
              String(oldValue || ''),
              String(newValue || ''),
              undefined,
              'Next Bot'
            );
          } else if (fieldName === 'counselorId') {
            await ActivityService.logActivity(
              'lead',
              id,
              'assigned',
              'Admission officer changed',
              `Admission officer changed from "${oldValue || 'empty'}" to "${newValue || 'empty'}"`,
              fieldName,
              String(oldValue || ''),
              String(newValue || ''),
              undefined,
              'Next Bot'
            );
          }
        }
      }
    }

    return lead;
  }

  static async assignLeadToCounselor(leadId: string, counselorId: string): Promise<boolean> {
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

  static async deleteLead(id: string): Promise<boolean> {
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

  static async searchLeads(query: string, userId?: string, userRole?: string, regionId?: string): Promise<Lead[]> {
    const searchConditions = or(
      ilike(leads.name, `%${query}%`),
      ilike(leads.email, `%${query}%`),
      ilike(leads.program, `%${query}%`),
      ilike(leads.country, `%${query}%`)
    );

    let results: Lead[];

    if (userRole === 'counselor' && userId) {
      results = await db.select().from(leads).where(
        and(
          eq(leads.counselorId, userId),
          searchConditions
        )
      );
    } else if (userRole === 'regional_manager') {
      if (!regionId) return [];
      results = await db.select().from(leads).where(
        and(
          eq(leads.regionId, regionId),
          searchConditions
        )
      );
    } else if (regionId && userRole !== 'super_admin') {
      results = await db.select().from(leads).where(
        and(
          eq(leads.regionId, regionId),
          searchConditions
        )
      );
    } else {
      results = await db.select().from(leads).where(searchConditions);
    }

    // Parse JSON fields for frontend consumption
    return results.map(lead => {
      const parsedLead = { ...lead };

      // Parse country field if it's a JSON string
      if (parsedLead.country && typeof parsedLead.country === 'string') {
        try {
          const parsed = JSON.parse(parsedLead.country);
          if (Array.isArray(parsed)) {
            (parsedLead as any).country = parsed;
          }
        } catch {
          // If parsing fails, keep as string (backward compatibility)
        }
      }

      // Parse program field if it's a JSON string
      if (parsedLead.program && typeof parsedLead.program === 'string') {
        try {
          const parsed = JSON.parse(parsedLead.program);
          if (Array.isArray(parsed)) {
            (parsedLead as any).program = parsed;
          }
        } catch {
          // If parsing fails, keep as string (backward compatibility)
        }
      }

      return parsedLead;
    });
  }
}
