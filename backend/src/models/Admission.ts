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

  static async findByStudent(studentId: string): Promise<Admission[]> {
    return await db.select().from(admissions)
      .where(eq(admissions.studentId, studentId))
      .orderBy(desc(admissions.createdAt));
  }

  static async create(admissionData: InsertAdmission): Promise<Admission> {
    const result = await db
      .insert(admissions)
      .values(admissionData);

    const insertId = Number(result.insertId);
    const createdAdmission = await AdmissionModel.findById(insertId);

    if (!createdAdmission) {
      throw new Error("Failed to create admission - record not found after insert");
    }

    return createdAdmission;
  }

  static async update(id: number, updates: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const result = await db
      .update(admissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(admissions.id, id));

    if (result.rowsAffected === 0) {
      return undefined;
    }

    return await AdmissionModel.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(admissions).where(eq(admissions.id, id));
    return (result.rowCount || 0) > 0;
  }
}
