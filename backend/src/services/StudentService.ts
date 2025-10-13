import { ilike, or, and, eq } from "drizzle-orm";
import { db } from "../config/database.js";
import { students, type Student, type InsertStudent } from "../shared/schema.js";
import { StudentModel } from "../models/Student.js";
import { ActivityService } from "./ActivityService.js";
import { DropdownModel } from "../models/Dropdown.js";
import { eq, desc } from "drizzle-orm";

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

  static async getStudents(userId?: string, userRole?: string, regionId?: string, branchId?: string): Promise<Student[]> {
    let rows: any[];
    if (userRole === 'counselor' && userId) {
      rows = await StudentModel.findByCounselor(userId);
    } else if (userRole === 'admission_officer' && userId) {
      rows = await StudentModel.findByAdmissionOfficer(userId);
    } else if (userRole === 'partner' && userId) {
      // Support partner sub-users scoped by subPartner. Normalize role to detect "partner sub-user" variants.
      const normalizedRole = String(userRole || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const isPartnerSubUser = normalizedRole.includes('partner') && normalizedRole.includes('sub');
      rows = await db.select().from(students).where(isPartnerSubUser ? eq(students.subPartner, userId) : eq(students.partner, userId)).orderBy(desc(students.createdAt));
    } else if (userRole === 'branch_manager') {
      if (branchId) {
        rows = await db.select().from(students).where(eq(students.branchId, branchId)).orderBy(desc(students.createdAt));
      } else {
        rows = [];
      }
    } else if (userRole === 'regional_manager') {
      if (regionId) {
        rows = await db.select().from(students).where(eq(students.regionId, regionId)).orderBy(desc(students.createdAt));
      } else {
        rows = [];
      }
    } else if (regionId && userRole !== 'super_admin') {
      rows = await db.select().from(students).where(eq(students.regionId, regionId)).orderBy(desc(students.createdAt));
    } else {
      rows = await StudentModel.findAll();
    }
    const enriched = await this.enrichDropdownFields(rows);
    // also attach counselor display name from dropdowns
    const dropdowns = await DropdownModel.findByModule('students');
    const counselorList = (dropdowns || []).filter((d: any) => (d.fieldName || '').toLowerCase().includes('counsel'));
    const counselorMap: Record<string,string> = {};
    counselorList.forEach((c: any) => { if (c.id) counselorMap[c.id]=c.value; if (c.key) counselorMap[c.key]=c.value; });
    const withCounselorName = enriched.map((r: any) => ({ ...r, counselor: counselorMap[r.counsellorId] || r.counselor || null }));
    return withCounselorName.map(this.mapStudentForApi);
  }

  static async getStudent(id: string, userId?: string, userRole?: string, regionId?: string, branchId?: string): Promise<Student | undefined> {
    const student = await StudentModel.findById(id);

    if (!student) return undefined;

    // Check role-based access
    if (userRole === 'counselor' && userId && student.counsellorId !== userId) {
      return undefined;
    }
    if (userRole === 'admission_officer' && userId && (student as any).admissionOfficerId !== userId) {
      return undefined;
    }

    // Partner scoping (support partner sub-user mapped to subPartner)
    const normalizedRoleForSingle = String(userRole || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isPartnerSubUserForSingle = normalizedRoleForSingle.includes('partner') && normalizedRoleForSingle.includes('sub');
    if ((userRole === 'partner' || isPartnerSubUserForSingle) && userId) {
      const allowed = isPartnerSubUserForSingle ? (student as any).subPartner === userId : (student as any).partner === userId;
      if (!allowed) return undefined;
    }

    // Branch manager scoping
    if (userRole === 'branch_manager') {
      if (!branchId) return undefined;
      if ((student as any).branchId !== branchId) return undefined;
    }

    // Region scoping for any role that has a region (except super_admin and branch_manager)
    if (regionId && userRole !== 'super_admin' && userRole !== 'branch_manager') {
      if ((student as any).regionId !== regionId) return undefined;
    }

    const [enriched] = await this.enrichDropdownFields([student]);
    // counselor name
    const dropdowns = await DropdownModel.findByModule('students');
    const counselorList = (dropdowns || []).filter((d: any) => (d.fieldName || '').toLowerCase().includes('counsel'));
    const counselorMap: Record<string,string> = {};
    counselorList.forEach((c: any) => { if (c.id) counselorMap[c.id]=c.value; if (c.key) counselorMap[c.key]=c.value; });
    enriched.counselor = counselorMap[enriched.counsellorId] || enriched.counselor || null;
    return this.mapStudentForApi(enriched) as any;
  }

  static async getStudentByLeadId(leadId: string, userId?: string, userRole?: string): Promise<Student | undefined> {
    const student = await StudentModel.findByLeadId(leadId);
    if (!student) return undefined;
    if (userRole === 'counselor' && userId && student.counsellorId !== userId) {
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
    enriched.counselor = counselorMap[enriched.counsellorId] || enriched.counselor || null;
    return this.mapStudentForApi(enriched) as any;
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
          eq(students.counsellorId, userId),
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
    } else if (userRole === 'partner' && userId) {
      const normalizedRole = String(userRole || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const isPartnerSubUser = normalizedRole.includes('partner') && normalizedRole.includes('sub');
      rows = await db.select().from(students).where(
        and(
          isPartnerSubUser ? eq(students.subPartner, userId) : eq(students.partner, userId),
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

    // Server-side guard: disallow converting an already converted lead
    if (lead && ((lead as any).isConverted === 1 || (lead as any).isConverted === '1')) {
      const err = new Error('LEAD_CONVERTED');
      // @ts-expect-error attach code
      (err as any).code = 'LEAD_CONVERTED';
      throw err;
    }

    // build payload (targetCountry normalized below)
    const payload = {
      ...(studentData as any),
      leadId,
      // Prefer values coming from request; fallback to lead record
      branchId: (studentData as any).branchId ?? (lead as any)?.branchId ?? undefined,
      regionId: (studentData as any).regionId ?? (lead as any)?.regionId ?? undefined,
      counsellorId: (studentData as any).counsellorId ?? (studentData as any).counsellorId ?? (lead as any)?.counsellorId ?? undefined,
      admissionOfficerId: (studentData as any).admissionOfficerId ?? (lead as any)?.admissionOfficerId ?? undefined,
    } as any;
    console.log('[StudentService.convertFromLead] payload:', JSON.stringify(payload));

    // Ensure targetCountry stored as JSON array of UUIDs: prefer payload.targetCountry if already an array/JSON, otherwise fall back to lead.country
    let finalTargetCountry: string | undefined = undefined;
    try {
      const p = (payload as any).targetCountry ?? (payload as any).interestedCountry ?? (payload as any).country;
      if (Array.isArray(p)) finalTargetCountry = JSON.stringify(p);
      else if (typeof p === 'string') {
        const t = p.trim();
        if (t.startsWith('[')) {
          try { const parsed = JSON.parse(t); if (Array.isArray(parsed)) finalTargetCountry = JSON.stringify(parsed); } catch {}
        }
      }
    } catch {}
    if (!finalTargetCountry && lead) {
      const lc = (lead as any).country;
      if (Array.isArray(lc)) finalTargetCountry = JSON.stringify(lc);
      else if (typeof lc === 'string') {
        try { const parsed = JSON.parse(lc); if (Array.isArray(parsed)) finalTargetCountry = JSON.stringify(parsed); } catch {}
      }
    }

    const payload2 = { ...payload, targetCountry: finalTargetCountry ?? (payload as any).targetCountry };
    const student = await StudentModel.create(payload2);

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

    // Mark lead record as converted (is_converted = 1)
    try {
      if (leadId) {
        await LeadModel.update(String(leadId), { isConverted: 1 } as any);
      }
    } catch (e) {
      console.warn('[StudentService.convertFromLead] Failed to mark lead as converted', e);
    }

    const [enriched] = await this.enrichDropdownFields([student]);
    return this.mapStudentForApi(enriched) as any;
  }

  static async createStudent(studentData: InsertStudent, userId?: string): Promise<Student> {
    const student = await StudentModel.create(studentData);

    // Log activity
    await ActivityService.logActivity(
      'student',
      student.id,
      'created',
      'Student record created',
      `Student ${student.name} was added to the system`,
      undefined,
      undefined,
      undefined,
      userId
    );

    const [enriched] = await this.enrichDropdownFields([student]);
    return this.mapStudentForApi(enriched) as any;
  }

  static async updateStudent(id: string, updates: Partial<InsertStudent>, userId?: string): Promise<Student | undefined> {
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
            userId
          );
        }
      }
    }

    return student ? (this.mapStudentForApi(student) as any) : undefined;
  }
}
