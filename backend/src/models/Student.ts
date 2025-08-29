import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { v4 as uuidv4 } from 'uuid';
import { students, type Student, type InsertStudent } from "../shared/schema.js";

export class StudentModel {
  static async findById(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  static async findAll(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  static async findByCounselor(counselorId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.counselorId, counselorId))
      .orderBy(desc(students.createdAt));
  }

  static async create(studentData: InsertStudent): Promise<Student> {
    const studentId = uuidv4();
    const insertPayload = {
      ...(studentData as any),
      id: studentId,
      consultancyFree: (studentData as any).consultancyFree ?? false,
      scholarship: (studentData as any).scholarship ?? false,
      expectation: (studentData as any).expectation ?? '',
      eltTest: (studentData as any).eltTest ?? '',
      address: (studentData as any).address ?? (studentData as any).city ?? null,
    } as any;
    console.log('[StudentModel.create] inserting:', JSON.stringify(insertPayload));
    await db.insert(students).values(insertPayload);
    const createdStudent = await StudentModel.findById(studentId);
    if (!createdStudent) {
      throw new Error(`Failed to create student - record not found after insert with ID: ${studentId}`);
    }
    return createdStudent;
  }

  static async update(id: string, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const result = await db
      .update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id));

    if (result.rowsAffected === 0) {
      return undefined;
    }

    return await StudentModel.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result: any = await db.delete(students).where(eq(students.id, id));
    const affected = result?.affectedRows ?? result?.rowCount ?? 0;
    return affected > 0;
  }

  static async findByLeadId(leadId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.leadId, leadId)).limit(1);
    return student;
  }
}
