import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { applications, type Application, type InsertApplication } from "../shared/schema.js";
import { randomUUID } from "crypto";
import { eq, desc, like } from "drizzle-orm";

function generateDailyPrefix(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `APP-${yy}${mm}${dd}-`;
}

export class ApplicationModel {
  static async findById(id: string): Promise<Application | undefined> {
    console.log('[ApplicationModel.findById] id:', id);
    const rows = await db.select().from(applications).where(eq(applications.id, id));
    console.log('[ApplicationModel.findById] rows:', rows?.length);
    const [application] = rows as any[];
    return application as any;
  }

  static async findAll(): Promise<Application[]> {
    return await db.select().from(applications).orderBy(desc(applications.createdAt));
  }

  static async findByStudent(studentId: string): Promise<Application[]> {
    return await db.select().from(applications)
      .where(eq(applications.studentId, studentId))
      .orderBy(desc(applications.createdAt));
  }

  static async create(applicationData: InsertApplication): Promise<Application> {
    const id = randomUUID();

    const prefix = generateDailyPrefix();

    // Find the latest code for today and increment the 3-digit sequence (resets daily)
    let nextSeq = 1;
    try {
      const latest = await db
        .select()
        .from(applications)
        .where(like(applications.applicationCode, `${prefix}%`))
        .orderBy(desc(applications.applicationCode))
        .limit(1);
      if (latest && latest.length > 0) {
        const lastCode = (latest[0] as any).applicationCode as string;
        const parts = lastCode?.split('-') || [];
        const seqStr = parts[2] || '000';
        const parsed = parseInt(seqStr, 10);
        if (!Number.isNaN(parsed)) nextSeq = parsed + 1;
      }
    } catch {}

    let applicationCode = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    // Safety: try a few times in case of race conditions
    for (let i = 0; i < 5; i++) {
      const existing = await db.select().from(applications).where(eq(applications.applicationCode, applicationCode));
      if (existing.length === 0) break;
      nextSeq += 1;
      applicationCode = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    }

    await db
      .insert(applications)
      .values({ ...applicationData, id, applicationCode });

    const createdApplication = await ApplicationModel.findById(id);

    if (!createdApplication) {
      throw new Error("Failed to create application - record not found after insert");
    }

    return createdApplication;
  }

  static async update(id: string, updates: Partial<InsertApplication>): Promise<Application | undefined> {
    const result = await db
      .update(applications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(applications.id, id));

    if ((result as any).rowsAffected === 0) {
      return undefined;
    }

    return await ApplicationModel.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.delete(applications).where(eq(applications.id, id));
    const affected = (result as any)?.affectedRows ?? (result as any)?.rowCount ?? 0;
    return affected > 0;
  }
}
