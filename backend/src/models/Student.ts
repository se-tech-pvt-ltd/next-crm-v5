import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { eq, desc } from "drizzle-orm";
import { students, type Student, type InsertStudent } from "../shared/schema.js";

export class StudentModel {
  static async findById(id: number): Promise<Student | undefined> {
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
    const result: any = await db.insert(students).values(studentData);
    const insertIdRaw = (result && (result.insertId ?? result[0]?.insertId));
    const insertId = typeof insertIdRaw === 'number' ? insertIdRaw : Number(insertIdRaw);

    if (!Number.isFinite(insertId)) {
      // Fallback: fetch the most recent matching record
      const rows = await db.select().from(students)
        .where(eq(students.email, studentData.email))
        .orderBy(desc(students.createdAt));
      if (rows.length > 0) return rows[0];
      throw new Error("Failed to create student - insertId not available");
    }

    const createdStudent = await StudentModel.findById(insertId);

    if (!createdStudent) {
      throw new Error("Failed to create student - record not found after insert");
    }

    return createdStudent;
  }

  static async update(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const result = await db
      .update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id));

    if (result.rowsAffected === 0) {
      return undefined;
    }

    return await StudentModel.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await db.delete(students).where(eq(students.id, id));
    const affected = result?.affectedRows ?? result?.rowCount ?? 0;
    return affected > 0;
  }
}
