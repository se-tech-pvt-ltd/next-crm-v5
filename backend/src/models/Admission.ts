import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { admissions, type Admission, type InsertAdmission } from "../shared/schema.js";

export class AdmissionModel {
  static async findById(id: number): Promise<Admission | undefined> {
    const [admission] = await db.select().from(admissions).where(eq(admissions.id, id));
    return admission;
  }

  static async findAll(): Promise<Admission[]> {
    return await db.select().from(admissions).orderBy(desc(admissions.createdAt));
  }

  static async findByStudent(studentId: number): Promise<Admission[]> {
    return await db.select().from(admissions)
      .where(eq(admissions.studentId, studentId))
      .orderBy(desc(admissions.createdAt));
  }

  static async create(admissionData: InsertAdmission): Promise<Admission> {
    const [admission] = await db
      .insert(admissions)
      .values(admissionData)
      .returning();
    return admission;
  }

  static async update(id: number, updates: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const [admission] = await db
      .update(admissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(admissions.id, id))
      .returning();
    return admission;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(admissions).where(eq(admissions.id, id));
    return (result.rowCount || 0) > 0;
  }
}
