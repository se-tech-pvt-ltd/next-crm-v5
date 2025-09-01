import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { applications, type Application, type InsertApplication } from "../shared/schema.js";
import { randomUUID } from "crypto";

function generateCode() {
  const num = Math.floor(Math.random() * 1_000_000);
  return `APP-${num.toString().padStart(6, '0')}`;
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
    // Try generating a unique applicationCode a few times
    let applicationCode = generateCode();
    for (let i = 0; i < 5; i++) {
      const existing = await db.select().from(applications).where(eq(applications.applicationCode, applicationCode));
      if (existing.length === 0) break;
      applicationCode = generateCode();
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
    return ((result as any).rowCount || 0) > 0;
  }
}
