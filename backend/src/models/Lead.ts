import { eq, desc, and, not, exists } from "drizzle-orm";
import { db } from "../config/database.js";
import { leads, students, type Lead, type InsertLead } from "../shared/schema.js";

export class LeadModel {
  static async findById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  static async findAll(): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(not(exists(
        db.select().from(students).where(eq(students.leadId, leads.id))
      )))
      .orderBy(desc(leads.createdAt));
  }

  static async findByCounselor(counselorId: string): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(and(
        eq(leads.counselorId, counselorId),
        not(exists(
          db.select().from(students).where(eq(students.leadId, leads.id))
        ))
      ))
      .orderBy(desc(leads.createdAt));
  }

  static async create(leadData: InsertLead): Promise<Lead> {
    // Normalize array fields to strings if they are arrays (backward compatibility)
    const processedLead = { ...leadData } as any;
    if (Array.isArray((leadData as any).country)) {
      processedLead.country = (leadData as any).country[0] || null;
    }
    if (Array.isArray((leadData as any).program)) {
      processedLead.program = (leadData as any).program[0] || null;
    }

    const result = await db
      .insert(leads)
      .values(processedLead as InsertLead);

    // Handle different MySQL result formats
    let insertId: number;
    if (typeof result.insertId === 'bigint') {
      insertId = Number(result.insertId);
    } else if (typeof result.insertId === 'number') {
      insertId = result.insertId;
    } else if (typeof result.insertId === 'string') {
      insertId = parseInt(result.insertId, 10);
    } else {
      // Fallback: find the most recent lead by email
      console.warn("InsertId not available, falling back to query by email");
      const [fallbackLead] = await db.select().from(leads)
        .where(eq(leads.email, processedLead.email))
        .orderBy(desc(leads.createdAt))
        .limit(1);

      if (fallbackLead) {
        return fallbackLead;
      }
      throw new Error("Failed to create lead - unable to retrieve inserted record");
    }

    if (isNaN(insertId)) {
      throw new Error(`Failed to create lead - invalid insertId: ${result.insertId}`);
    }

    const createdLead = await LeadModel.findById(insertId);

    if (!createdLead) {
      throw new Error(`Failed to create lead - record not found after insert with ID: ${insertId}`);
    }

    return createdLead;
  }

  static async update(id: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    // Normalize array fields to strings if they are arrays (backward compatibility)
    const processedUpdates = { ...updates } as any;
    if (Array.isArray((updates as any).country)) {
      processedUpdates.country = (updates as any).country[0] || null;
    }
    if (Array.isArray((updates as any).program)) {
      processedUpdates.program = (updates as any).program[0] || null;
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

  static async assignToCounselor(leadId: number, counselorId: string): Promise<boolean> {
    const result = await db
      .update(leads)
      .set({ counselorId, updatedAt: new Date() })
      .where(eq(leads.id, leadId));
    return result.rowsAffected > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return (result.rowCount || 0) > 0;
  }
}
