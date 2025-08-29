import { eq, desc, and, not, exists, count, sql } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { db } from "../config/database.js";
import { leads, students, type Lead, type InsertLead } from "../shared/schema.js";

interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

interface PaginatedLeadsResult {
  leads: Lead[];
  total: number;
}

export class LeadModel {
  // Helper function to parse JSON fields back to arrays for frontend consumption
  private static parseLeadFields(lead: Lead): Lead {
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
  }

  static async findById(id: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        notes: leads.notes,
        counselorId: leads.counselorId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)
      .where(eq(leads.id, id));
    return lead ? (LeadModel.parseLeadFields(lead as unknown as Lead)) : undefined;
  }

  static async findAll(pagination?: PaginationOptions): Promise<PaginatedLeadsResult> {
    const baseQuery = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        notes: leads.notes,
        counselorId: leads.counselorId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)
      .where(not(exists(
        db.select().from(students).where(eq(students.leadId, leads.id))
      )));

    if (pagination) {
      // Get total count
      const [totalResult] = await db.select({ count: count() })
        .from(leads)
        .where(not(exists(
          db.select().from(students).where(eq(students.leadId, leads.id))
        )));

      // Get paginated results
      const paginatedLeads = await baseQuery
        .orderBy(desc(leads.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        leads: paginatedLeads.map(LeadModel.parseLeadFields),
        total: totalResult.count
      };
    }

    // Return all leads if no pagination
    const allLeads = await baseQuery.orderBy(desc(leads.createdAt));
    return {
      leads: allLeads.map(LeadModel.parseLeadFields),
      total: allLeads.length
    };
  }

  static async findByCounselor(counselorId: string, pagination?: PaginationOptions): Promise<PaginatedLeadsResult> {
    const baseQuery = db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        country: leads.country,
        program: leads.program,
        source: leads.source,
        status: leads.status,
        expectation: leads.expectation,
        type: leads.type,
        studyLevel: leads.studyLevel,
        studyPlan: leads.studyPlan,
        elt: leads.elt,
        lostReason: leads.lostReason,
        notes: leads.notes,
        counselorId: leads.counselorId,
        createdBy: leads.createdBy,
        updatedBy: leads.updatedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)
      .where(and(
        eq(leads.counselorId, counselorId),
        not(exists(
          db.select().from(students).where(eq(students.leadId, leads.id))
        ))
      ));

    if (pagination) {
      // Get total count
      const [totalResult] = await db.select({ count: count() })
        .from(leads)
        .where(and(
          eq(leads.counselorId, counselorId),
          not(exists(
            db.select().from(students).where(eq(students.leadId, leads.id))
          ))
        ));

      // Get paginated results
      const paginatedLeads = await baseQuery
        .orderBy(desc(leads.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        leads: paginatedLeads.map(LeadModel.parseLeadFields),
        total: totalResult.count
      };
    }

    // Return all leads if no pagination
    const allLeads = await baseQuery.orderBy(desc(leads.createdAt));
    return {
      leads: allLeads.map(LeadModel.parseLeadFields),
      total: allLeads.length
    };
  }

  static async create(leadData: InsertLead): Promise<Lead> {
    // Generate UUID for the lead
    const leadId = uuidv4();

    // Serialize array fields to JSON strings for database storage
    const processedLead = { ...leadData, id: leadId } as any;
    if (Array.isArray((leadData as any).country)) {
      processedLead.country = JSON.stringify((leadData as any).country);
    }
    if (Array.isArray((leadData as any).program)) {
      processedLead.program = JSON.stringify((leadData as any).program);
    }

    await db
      .insert(leads)
      .values(processedLead as InsertLead & { id: string });

    const createdLead = await LeadModel.findById(leadId);

    if (!createdLead) {
      throw new Error(`Failed to create lead - record not found after insert with ID: ${leadId}`);
    }

    return createdLead;
  }

  static async update(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    // Serialize array fields to JSON strings for database storage
    const processedUpdates = { ...updates } as any;
    if (Array.isArray((updates as any).country)) {
      processedUpdates.country = JSON.stringify((updates as any).country);
    }
    if (Array.isArray((updates as any).program)) {
      processedUpdates.program = JSON.stringify((updates as any).program);
    }

    const result = await db
      .update(leads)
      .set({ ...processedUpdates, updatedAt: new Date() } as any)
      .where(eq(leads.id, id));

    // Check if the update was successful
    if (result.rowsAffected === 0) {
      return undefined;
    }

    // Fetch the updated record
    return await LeadModel.findById(id);
  }

  static async assignToCounselor(leadId: string, counselorId: string): Promise<boolean> {
    const result = await db
      .update(leads)
      .set({ counselorId, updatedAt: new Date() })
      .where(eq(leads.id, leadId));
    return result.rowsAffected > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return (result.rowCount || 0) > 0;
  }
}
