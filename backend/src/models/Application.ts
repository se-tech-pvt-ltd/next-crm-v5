import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { applications, type Application, type InsertApplication } from "../shared/schema.js";

export class ApplicationModel {
  static async findById(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
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
    const result = await db
      .insert(applications)
      .values(applicationData);

    const insertId = Number(result.insertId);
    const createdApplication = await ApplicationModel.findById(insertId);

    if (!createdApplication) {
      throw new Error("Failed to create application - record not found after insert");
    }

    return createdApplication;
  }

  static async update(id: number, updates: Partial<InsertApplication>): Promise<Application | undefined> {
    const result = await db
      .update(applications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(applications.id, id));

    if (result.rowsAffected === 0) {
      return undefined;
    }

    return await ApplicationModel.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(applications).where(eq(applications.id, id));
    return (result.rowCount || 0) > 0;
  }
}
