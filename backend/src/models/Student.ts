import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { v4 as uuidv4 } from 'uuid';
import { students, type Student, type InsertStudent } from "../shared/schema.js";
import { eq, desc, like } from "drizzle-orm";

function generateStudentPrefix(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `STD-${yy}${mm}${dd}-`;
}

export class StudentModel {
  static async findById(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student as any;
  }

  static async findAll(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  static async findByCounselor(counselorId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.counsellorId, counselorId))
      .orderBy(desc(students.createdAt));
  }

  static async findByAdmissionOfficer(admissionOfficerId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.admissionOfficerId, admissionOfficerId))
      .orderBy(desc(students.createdAt));
  }

  static async findByEmail(email: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students)
      .where(eq(students.email, email))
      .limit(1);
    return student as any;
  }

  static async findByPhone(phone: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students)
      .where(eq(students.phone, phone))
      .limit(1);
    return student as any;
  }

  static async create(studentData: InsertStudent): Promise<Student> {
    const newId = uuidv4();

    // Determine studentId (STD-YYMMDD-XXX with daily reset sequence) unless provided
    let studentCode = (studentData as any).studentId as string | undefined;
    if (!studentCode) {
      const prefix = generateStudentPrefix();
      let nextSeq = 1;
      try {
        const latest = await db
          .select({ studentId: students.studentId })
          .from(students)
          .where(like(students.studentId, `${prefix}%`))
          .orderBy(desc(students.studentId))
          .limit(1);
        if (latest && latest.length > 0) {
          const lastCode = (latest[0] as any).studentId as string;
          const parts = lastCode.split('-');
          const seqStr = parts[2] || '000';
          const parsed = parseInt(seqStr, 10);
          if (!Number.isNaN(parsed)) nextSeq = parsed + 1;
        }
      } catch {}
      studentCode = `${prefix}${String(nextSeq).padStart(3, '0')}`;
      // Safety loop in case of race condition
      for (let i = 0; i < 5; i++) {
        const existing = await db.select().from(students).where(eq(students.studentId, studentCode));
        if (existing.length === 0) break;
        nextSeq += 1;
        studentCode = `${prefix}${String(nextSeq).padStart(3, '0')}`;
      }
    }

    const insertPayload = {
      ...(studentData as any),
      id: newId,
      studentId: studentCode,
      consultancyFree: (studentData as any).consultancyFree ?? false,
      scholarship: (studentData as any).scholarship ?? false,
      expectation: (studentData as any).expectation ?? '',
      eltTest: (studentData as any).eltTest ?? '',
      address: (studentData as any).address ?? (studentData as any).city ?? null,
    } as any;
    console.log('[StudentModel.create] inserting:', JSON.stringify(insertPayload));
    await db.insert(students).values(insertPayload);
    const createdStudent = await StudentModel.findById(newId);
    if (!createdStudent) {
      throw new Error(`Failed to create student - record not found after insert with ID: ${newId}`);
    }
    return createdStudent as any;
  }

  static async update(id: string, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const result = await db
      .update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id));

    if ((result as any).rowsAffected === 0) {
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
    return student as any;
  }
}
