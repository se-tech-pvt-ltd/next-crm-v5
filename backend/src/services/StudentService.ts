import { ilike, or, and, eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { students, type Student, type InsertStudent } from "../shared/schema.js";
import { StudentModel } from "../models/Student.js";
import { ActivityService } from "./ActivityService.js";

export class StudentService {
  // Helper to expose student_id (snake_case) in API responses
  static mapStudentForApi(s: any) {
    if (!s) return s;
    const out = { ...s } as any;
    out.student_id = s.studentId || s.student_id || null;
    // keep id for routing but remove camelCase duplicate
    if (out.studentId !== undefined) delete out.studentId;
    return out;
  }

  static async getStudents(userId?: string, userRole?: string): Promise<Student[]> {
    let rows: any[];
    if (userRole === 'counselor' && userId) {
      rows = await StudentModel.findByCounselor(userId);
    } else {
      rows = await StudentModel.findAll();
    }
    return rows.map(this.mapStudentForApi);
  }

  static async getStudent(id: string, userId?: string, userRole?: string): Promise<Student | undefined> {
    const student = await StudentModel.findById(id);

    if (!student) return undefined;

    // Check role-based access
    if (userRole === 'counselor' && userId && student.counselorId !== userId) {
      return undefined;
    }

    return this.mapStudentForApi(student) as any;
  }

  static async getStudentByLeadId(leadId: string, userId?: string, userRole?: string): Promise<Student | undefined> {
    const student = await StudentModel.findByLeadId(leadId);
    if (!student) return undefined;
    if (userRole === 'counselor' && userId && student.counselorId !== userId) {
      return undefined;
    }
    return this.mapStudentForApi(student) as any;
  }

  static async createStudent(studentData: InsertStudent): Promise<Student> {
    const student = await StudentModel.create(studentData);

    // Log activity
    await ActivityService.logActivity(
      'student',
      student.id,
      'created',
      'Student record created',
      `Student ${student.name} was added to the system`
    );

    return this.mapStudentForApi(student) as any;
  }

  static async updateStudent(id: string, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    // Get the current student to track changes
    const currentStudent = await StudentModel.findById(id);
    if (!currentStudent) return undefined;

    const student = await StudentModel.update(id, updates);

    if (student) {
      // Log changes for each updated field
      for (const [fieldName, newValue] of Object.entries(updates)) {
        if (fieldName === 'updatedAt') continue;

        const oldValue = (currentStudent as any)[fieldName];
        if (oldValue !== newValue) {
          const fieldDisplayName = fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());

          await ActivityService.logActivity(
            'student',
            id,
            'updated',
            `${fieldDisplayName} updated`,
            `${fieldDisplayName} changed from "${oldValue || 'empty'}" to "${newValue || 'empty'}"`,
            fieldName,
            String(oldValue || ''),
            String(newValue || ''),
            undefined,
            "Next Bot"
          );
        }
      }
    }

    return student ? (this.mapStudentForApi(student) as any) : undefined;
  }

  static async deleteStudent(id: string): Promise<boolean> {
    const student = await StudentModel.findById(id);
    const success = await StudentModel.delete(id);

    if (success && student) {
      await ActivityService.logActivity(
        'student',
        id,
        'deleted',
        'Student deleted',
        `Student ${student.name} was deleted from the system`
      );
    }

    return success;
  }

  static async searchStudents(query: string, userId?: string, userRole?: string): Promise<Student[]> {
    const searchConditions = or(
      ilike(students.name, `%${query}%`),
      ilike(students.email, `%${query}%`),
      ilike(students.targetProgram, `%${query}%`),
      ilike(students.targetCountry, `%${query}%`)
    );

    let rows: any[];
    if (userRole === 'counselor' && userId) {
      rows = await db.select().from(students).where(
        and(
          eq(students.counselorId, userId),
          searchConditions
        )
      );
    } else {
      rows = await db.select().from(students).where(searchConditions);
    }
    return rows.map(this.mapStudentForApi);
  }

  static async convertFromLead(leadId: string, studentData: InsertStudent): Promise<Student> {
    console.log('[StudentService.convertFromLead] leadId:', leadId);
    const payload = { ...(studentData as any), leadId } as any;
    console.log('[StudentService.convertFromLead] payload:', JSON.stringify(payload));

    const student = await StudentModel.create(payload);

    // Transfer activities from lead to student
    await ActivityService.transferActivities('lead', leadId, 'student', student.id);

    // Log conversion on the lead timeline
    await ActivityService.logActivity(
      'lead',
      leadId,
      'converted',
      'Lead converted',
      `Lead ${student.name} was converted to student ${student.name}`
    );

    return this.mapStudentForApi(student) as any;
  }
}
