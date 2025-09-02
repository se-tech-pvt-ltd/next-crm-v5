import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { admissions, type Admission, type InsertAdmission } from "../shared/schema.js";
import { v4 as uuidv4 } from "uuid";
import { eq, desc } from "drizzle-orm";

export class AdmissionModel {
  static async findById(id: string): Promise<Admission | undefined> {
    const [admission] = await db
      .select({
        id: admissions.id,
        applicationId: admissions.applicationId,
        studentId: admissions.studentId,
        university: admissions.university,
        program: admissions.program,
        decision: admissions.decision,
        decisionDate: admissions.decisionDate,
        scholarshipAmount: admissions.scholarshipAmount,
        conditions: admissions.conditions,
        depositRequired: admissions.depositRequired,
        depositAmount: admissions.depositAmount,
        depositDeadline: admissions.depositDeadline,
        visaStatus: admissions.visaStatus,
        admissionId: admissions.admissionId,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt,
      })
      .from(admissions)
      .where(eq(admissions.id, id));
    return admission;
  }

  static async findAll(): Promise<Admission[]> {
    return await db
      .select({
        id: admissions.id,
        applicationId: admissions.applicationId,
        studentId: admissions.studentId,
        university: admissions.university,
        program: admissions.program,
        decision: admissions.decision,
        decisionDate: admissions.decisionDate,
        scholarshipAmount: admissions.scholarshipAmount,
        conditions: admissions.conditions,
        depositRequired: admissions.depositRequired,
        depositAmount: admissions.depositAmount,
        depositDeadline: admissions.depositDeadline,
        visaStatus: admissions.visaStatus,
        admissionId: admissions.admissionId,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt,
      })
      .from(admissions)
      .orderBy(desc(admissions.createdAt));
  }

  static async findByStudent(studentId: string): Promise<Admission[]> {
    return await db
      .select({
        id: admissions.id,
        applicationId: admissions.applicationId,
        studentId: admissions.studentId,
        university: admissions.university,
        program: admissions.program,
        decision: admissions.decision,
        decisionDate: admissions.decisionDate,
        scholarshipAmount: admissions.scholarshipAmount,
        conditions: admissions.conditions,
        depositRequired: admissions.depositRequired,
        depositAmount: admissions.depositAmount,
        depositDeadline: admissions.depositDeadline,
        visaStatus: admissions.visaStatus,
        admissionId: admissions.admissionId,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt,
      })
      .from(admissions)
      .where(eq(admissions.studentId, studentId))
      .orderBy(desc(admissions.createdAt));
  }

  static async create(admissionData: InsertAdmission): Promise<Admission> {
    const id = uuidv4();
    await db
      .insert(admissions)
      .values({ id, ...admissionData });

    const createdAdmission = await AdmissionModel.findById(id);

    if (!createdAdmission) {
      throw new Error("Failed to create admission - record not found after insert");
    }

    return createdAdmission;
  }

  static async update(id: string, updates: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const result: any = await db
      .update(admissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(admissions.id, id));

    const affected = result?.affectedRows ?? result?.rowCount ?? result?.rowsAffected ?? 0;
    if (affected === 0) {
      return undefined;
    }

    return await AdmissionModel.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result: any = await db.delete(admissions).where(eq(admissions.id, id));
    const affected = result?.affectedRows ?? result?.rowCount ?? 0;
    return affected > 0;
  }
}
