import { ilike, or, and, eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { students, type Student, type InsertStudent } from "../shared/schema.js";
import { StudentModel } from "../models/Student.js";
import { ActivityService } from "./ActivityService.js";
import { DropdownModel } from "../models/Dropdown.js";

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

  // Enrich dropdown-backed fields (expectation, eltTest, englishProficiency, etc.)
  static async enrichDropdownFields(rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) return rows;
    const dropdowns = await DropdownModel.findByModule('students');
    // group dropdowns by normalized field name
    const groups: Record<string, any[]> = {};
    (dropdowns || []).forEach((d: any) => {
      const fn = (d.fieldName || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!groups[fn]) groups[fn] = [];
      groups[fn].push(d);
    });

    // helper to map raw value to label for a given normalized field
    const mapForField = (fn: string) => {
      const list = groups[fn] || [];
      const map: Record<string, string> = {};
      list.forEach((opt: any) => {
        if (opt.id) map[opt.id] = opt.value;
        if (opt.key) map[opt.key] = opt.value;
        if (opt.value) map[opt.value] = opt.value;
      });
      return map;
    };

    const expectationMap = mapForField('expectation');
    const eltMap = mapForField('elttest');
    const eltMapAlt = mapForField('elttest');
    const englishMap = mapForField('englishproficiency');

    return rows.map((r: any) => {
      const copy = { ...r } as any;
      // expectation
      if (copy.expectation && expectationMap[copy.expectation]) copy.expectation = expectationMap[copy.expectation];
      // eltTest / english proficiency
      if (copy.eltTest && (eltMap[copy.eltTest] || eltMapAlt[copy.eltTest])) copy.eltTest = eltMap[copy.eltTest] || eltMapAlt[copy.eltTest];
      if (copy.englishProficiency && englishMap[copy.englishProficiency]) copy.englishProficiency = englishMap[copy.englishProficiency];
      return copy;
    });
  }

  static async getStudents(userId?: string, userRole?: string): Promise<Student[]> {
    let rows: any[];
    if (userRole === 'counselor' && userId) {
      rows = await StudentModel.findByCounselor(userId);
    } else {
      rows = await StudentModel.findAll();
    }
    const enriched = await this.enrichDropdownFields(rows);
    // also attach counselor display name from dropdowns
    const dropdowns = await DropdownModel.findByModule('students');
    const counselorList = (dropdowns || []).filter((d: any) => (d.fieldName || '').toLowerCase().includes('counsel'));
    const counselorMap: Record<string,string> = {};
    counselorList.forEach((c: any) => { if (c.id) counselorMap[c.id]=c.value; if (c.key) counselorMap[c.key]=c.value; });
    const withCounselorName = enriched.map((r: any) => ({ ...r, counselor: counselorMap[r.counselorId] || r.counselor || null }));
    return withCounselorName.map(this.mapStudentForApi);
  }

  static async getStudent(id: string, userId?: string, userRole?: string): Promise<Student | undefined> {
    const student = await StudentModel.findById(id);

    if (!student) return undefined;

    // Check role-based access
    if (userRole === 'counselor' && userId && student.counselorId !== userId) {
      return undefined;
    }
    const [enriched] = await this.enrichDropdownFields([student]);
    // counselor name
    const dropdowns = await DropdownModel.findByModule('students');
    const counselorList = (dropdowns || []).filter((d: any) => (d.fieldName || '').toLowerCase().includes('counsel'));
    const counselorMap: Record<string,string> = {};
    counselorList.forEach((c: any) => { if (c.id) counselorMap[c.id]=c.value; if (c.key) counselorMap[c.key]=c.value; });
    enriched.counselor = counselorMap[enriched.counselorId] || enriched.counselor || null;
    return this.mapStudentForApi(enriched) as any;
  }

  static async getStudentByLeadId(leadId: string, userId?: string, userRole?: string): Promise<Student | undefined> {
    const student = await StudentModel.findByLeadId(leadId);
    if (!student) return undefined;
    if (userRole === 'counselor' && userId && student.counselorId !== userId) {
      return undefined;
    }
    if (userRole === 'admission_officer' && userId && (student as any).admissionOfficerId !== userId) {
      return undefined;
    }
    const [enriched] = await this.enrichDropdownFields([student]);
    const dropdowns = await DropdownModel.findByModule('students');
    const counselorList = (dropdowns || []).filter((d: any) => (d.fieldName || '').toLowerCase().includes('counsel'));
    const counselorMap: Record<string,string> = {};
    counselorList.forEach((c: any) => { if (c.id) counselorMap[c.id]=c.value; if (c.key) counselorMap[c.key]=c.value; });
    enriched.counselor = counselorMap[enriched.counselorId] || enriched.counselor || null;
    return this.mapStudentForApi(enriched) as any;
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
    } else if (userRole === 'admission_officer' && userId) {
      rows = await db.select().from(students).where(
        and(
          eq(students.admissionOfficerId, userId),
          searchConditions
        )
      );
    } else {
      rows = await db.select().from(students).where(searchConditions);
    }
    const enriched = await this.enrichDropdownFields(rows);
    return enriched.map(this.mapStudentForApi);
  }

  static async convertFromLead(leadId: string, studentData: InsertStudent): Promise<Student> {
    console.log('[StudentService.convertFromLead] leadId:', leadId);
    // Fetch lead to inherit branch/region and default counselor/admission officer if missing
    const { LeadModel } = await import('../models/Lead.js');
    const lead = await LeadModel.findById(leadId);

    const payload = {
      ...(studentData as any),
      leadId,
      // Prefer values coming from request; fallback to lead record
      branchId: (studentData as any).branchId ?? (lead as any)?.branchId ?? undefined,
      regionId: (studentData as any).regionId ?? (lead as any)?.regionId ?? undefined,
      counsellorId: (studentData as any).counsellorId ?? (studentData as any).counselorId ?? (lead as any)?.counselorId ?? undefined,
      admissionOfficerId: (studentData as any).admissionOfficerId ?? (lead as any)?.admissionOfficerId ?? undefined,
    } as any;
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

    const [enriched] = await this.enrichDropdownFields([student]);
    return this.mapStudentForApi(enriched) as any;
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

    const [enriched] = await this.enrichDropdownFields([student]);
    return this.mapStudentForApi(enriched) as any;
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
}
