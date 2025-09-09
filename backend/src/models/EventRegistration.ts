import { db } from "../config/database.js";
import { eventRegistrations, type EventRegistration, type InsertEventRegistration } from "../shared/schema.js";
import { randomUUID } from "crypto";
import { and, desc, eq, like } from "drizzle-orm";

function generateDailyPrefix(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `EVT-${yy}${mm}${dd}-`;
}

export class EventRegistrationModel {
  static async findById(id: string): Promise<EventRegistration | undefined> {
    const rows = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, id));
    const [row] = rows as any[];
    return row as any;
  }

  static async findAll(): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).orderBy(desc(eventRegistrations.createdAt));
  }

  static async findByEvent(eventId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId)).orderBy(desc(eventRegistrations.createdAt));
  }

  static async existsByEventEmail(eventId: string, email?: string): Promise<boolean> {
    if (!email) return false;
    const rows = await db.select().from(eventRegistrations).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.email, email))).limit(1);
    return (rows as any[]).length > 0;
  }

  static async existsByEventNumber(eventId: string, number?: string): Promise<boolean> {
    if (!number) return false;
    const rows = await db.select().from(eventRegistrations).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.number, number))).limit(1);
    return (rows as any[]).length > 0;
  }

  static async create(data: InsertEventRegistration): Promise<EventRegistration> {
    const id = randomUUID();

    const prefix = generateDailyPrefix();
    let nextSeq = 1;
    try {
      const latest = await db
        .select()
        .from(eventRegistrations)
        .where(like(eventRegistrations.registrationCode, `${prefix}%`))
        .orderBy(desc(eventRegistrations.registrationCode))
        .limit(1);
      if (latest && latest.length > 0) {
        const lastCode = (latest[0] as any).registrationCode as string;
        const parts = lastCode?.split('-') || [];
        const seqStr = parts[2] || '0000';
        const parsed = parseInt(seqStr, 10);
        if (!Number.isNaN(parsed)) nextSeq = parsed + 1;
      }
    } catch {}

    let registrationCode = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    for (let i = 0; i < 5; i++) {
      const existing = await db.select().from(eventRegistrations).where(eq(eventRegistrations.registrationCode, registrationCode));
      if (existing.length === 0) break;
      nextSeq += 1;
      registrationCode = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    }

    await db.insert(eventRegistrations).values({ ...data, id, registrationCode });

    const created = await EventRegistrationModel.findById(id);
    if (!created) throw new Error("Failed to create registration");
    return created;
  }

  static async update(id: string, data: Partial<InsertEventRegistration>): Promise<EventRegistration | undefined> {
    const result = await db.update(eventRegistrations).set({ ...data, updatedAt: new Date() }).where(eq(eventRegistrations.id, id));
    if ((result as any).rowsAffected === 0) return undefined;
    return await EventRegistrationModel.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(eventRegistrations).where(eq(eventRegistrations.id, id));
    return ((result as any).rowCount || 0) > 0;
  }
}
