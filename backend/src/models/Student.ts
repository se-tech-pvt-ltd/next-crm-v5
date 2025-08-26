import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
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
    const result = await db
      .insert(students)
      .values(studentData);

    const insertId = Number(result.insertId);
    const createdStudent = await StudentModel.findById(insertId);

    if (!createdStudent) {
      throw new Error("Failed to create student - record not found after insert");
    }

    return createdStudent;
  }

  static async update(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return (result.rowCount || 0) > 0;
  }
}
