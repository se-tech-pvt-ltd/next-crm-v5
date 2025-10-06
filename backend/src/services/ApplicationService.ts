import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { applications, students, type Application, type InsertApplication } from "../shared/schema.js";
import { ApplicationModel } from "../models/Application.js";
import { StudentModel } from "../models/Student.js";
import { ActivityService } from "./ActivityService.js";
import { DropdownService } from "./DropdownService.js";
import { eq, desc } from "drizzle-orm";

export class ApplicationService {
  // Map dropdown-backed fields (e.g., status, intake, courseType, etc.) to their display labels
  static async enrichDropdownFields(rows: any[]) {
    if (!Array.isArray(rows) || rows.length === 0) return rows;
    // Pull both Applications module dropdowns and global list as fallback (some fields like Country may live elsewhere)
    const moduleDropdowns = await DropdownService.getDropdownsByModule('applications');
    const allDropdowns = await DropdownService.getAllDropdowns();
    const dropdowns = [...moduleDropdowns, ...allDropdowns];

    // Group dropdowns by normalized field name
    const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const stripComposite = (val: string) => {
      if (typeof val !== 'string') return val as any;
      // Split on newlines and prefer the non-UUID part
      const parts = val.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        const nonUuid = parts.find((p) => !uuidRe.test(p));
        if (nonUuid) return nonUuid;
      }
      // Remove UUIDs wrapped in parentheses or trailing/leading UUID tokens
      let s = val.replace(/\(([0-9a-fA-F-]{36})\)/g, '').trim();
      s = s.replace(uuidRe, '').trim();
      // Remove any remaining naked UUID tokens
      s = s
        .split(/\s+/)
        .filter((tok) => !uuidRe.test(tok))
        .join(' ')
        .trim();
      return s || val;
    };

    const groups: Record<string, Record<string, string>> = {};
    for (const d of dropdowns) {
      const fn = normalize((d as any).fieldName);
      if (!groups[fn]) groups[fn] = {};
      const map = groups[fn];
      const id = (d as any).id;
      const key = (d as any).key;
      const val = (d as any).value;
      if (id) map[id] = val;
      if (key) map[key] = val;
      if (val) map[val] = val;
    }

    // For each row, for each property that matches a known dropdown field, strip composite values and map value -> label if present
    return rows.map((r) => {
      const out: Record<string, any> = { ...r };
      for (const [k, v] of Object.entries(out)) {
        const fn = normalize(k);
        const map = groups[fn];
        if (typeof v === 'string') {
          const stripped = stripComposite(v);
          if (map && (stripped in map)) {
            out[k] = map[stripped];
          } else if (map && (v in map)) {
            out[k] = map[v as string];
          } else {
            out[k] = stripped;
          }
        }
      }
      return out as any;
    });
  }

  static async getApplications(userId?: string, userRole?: string, regionId?: string, branchId?: string): Promise<Application[]> {
    if (userRole === 'counselor' && userId) {
      // Counselors can only see applications for their assigned students
      const rows = await db
        .select({
          id: applications.id,
          applicationCode: applications.applicationCode,
          studentId: applications.studentId,
          university: applications.university,
          program: applications.program,
          courseType: applications.courseType,
          appStatus: applications.appStatus,
          caseStatus: applications.caseStatus,
          country: applications.country,
          channelPartner: applications.channelPartner,
          intake: applications.intake,
          googleDriveLink: applications.googleDriveLink,
          notes: applications.notes,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
        })
        .from(applications)
        .innerJoin(students, eq(applications.studentId, students.id))
        .where(eq(students.counsellorId, userId))
        .orderBy(desc(applications.createdAt));
      return (await this.enrichDropdownFields(rows)) as any;
    }
    if (userRole === 'admission_officer' && userId) {
      const rows = await db
        .select({
          id: applications.id,
          applicationCode: applications.applicationCode,
          studentId: applications.studentId,
          university: applications.university,
          program: applications.program,
          courseType: applications.courseType,
          appStatus: applications.appStatus,
          caseStatus: applications.caseStatus,
          country: applications.country,
          channelPartner: applications.channelPartner,
          intake: applications.intake,
          googleDriveLink: applications.googleDriveLink,
          notes: applications.notes,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
        })
        .from(applications)
        .innerJoin(students, eq(applications.studentId, students.id))
        .where(eq(students.admissionOfficerId, userId))
        .orderBy(desc(applications.createdAt));
      return (await this.enrichDropdownFields(rows)) as any;
    }

    if (userRole === 'branch_manager') {
      if (branchId) {
        const rows = await db
          .select({
            id: applications.id,
            applicationCode: applications.applicationCode,
            studentId: applications.studentId,
            university: applications.university,
            program: applications.program,
            courseType: applications.courseType,
            appStatus: applications.appStatus,
            caseStatus: applications.caseStatus,
            country: applications.country,
            channelPartner: applications.channelPartner,
            intake: applications.intake,
            googleDriveLink: applications.googleDriveLink,
            notes: applications.notes,
            createdAt: applications.createdAt,
            updatedAt: applications.updatedAt,
          })
          .from(applications)
          .innerJoin(students, eq(applications.studentId, students.id))
          .where(eq(students.branchId, branchId))
          .orderBy(desc(applications.createdAt));
        return (await this.enrichDropdownFields(rows)) as any;
      }
      return [];
    }

    if (userRole === 'regional_manager') {
      if (regionId) {
        const rows = await db
          .select({
            id: applications.id,
            applicationCode: applications.applicationCode,
            studentId: applications.studentId,
            university: applications.university,
            program: applications.program,
            courseType: applications.courseType,
            appStatus: applications.appStatus,
            caseStatus: applications.caseStatus,
            country: applications.country,
            channelPartner: applications.channelPartner,
            intake: applications.intake,
            googleDriveLink: applications.googleDriveLink,
            notes: applications.notes,
            createdAt: applications.createdAt,
            updatedAt: applications.updatedAt,
          })
          .from(applications)
          .innerJoin(students, eq(applications.studentId, students.id))
          .where(eq(students.regionId, regionId))
          .orderBy(desc(applications.createdAt));
        return (await this.enrichDropdownFields(rows)) as any;
      }
      return [];
    }

    // Default: scope by region if provided and not super_admin
    if (regionId && userRole !== 'super_admin') {
      const rows = await db
        .select({
          id: applications.id,
          applicationCode: applications.applicationCode,
          studentId: applications.studentId,
          university: applications.university,
          program: applications.program,
          courseType: applications.courseType,
          appStatus: applications.appStatus,
          caseStatus: applications.caseStatus,
          country: applications.country,
          channelPartner: applications.channelPartner,
          intake: applications.intake,
          googleDriveLink: applications.googleDriveLink,
          notes: applications.notes,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
        })
        .from(applications)
        .innerJoin(students, eq(applications.studentId, students.id))
        .where(eq(students.regionId, regionId))
        .orderBy(desc(applications.createdAt));
      return (await this.enrichDropdownFields(rows)) as any;
    }

    const rows = await ApplicationModel.findAll();
    return (await this.enrichDropdownFields(rows)) as any;
  }

  static async getApplication(id: string, userId?: string, userRole?: string, regionId?: string, branchId?: string): Promise<Application | undefined> {
    const application = await ApplicationModel.findById(id);

    if (!application) return undefined;

    // Check role-based access
    if (userRole === 'counselor' && userId) {
      const student = await StudentModel.findById(application.studentId);
      if (!student || (student as any).counsellorId !== userId) {
        return undefined;
      }
    }
    if (userRole === 'admission_officer' && userId) {
      const student = await StudentModel.findById(application.studentId);
      if (!student || (student as any).admissionOfficerId !== userId) {
        return undefined;
      }
    }

    // Branch manager scoping
    if (userRole === 'branch_manager') {
      if (!branchId) return undefined;
      const student = await StudentModel.findById(application.studentId);
      if (!student || (student as any).branchId !== branchId) return undefined;
    }

    // Region scoping for any role that has a region (except super_admin and branch_manager)
    if (regionId && userRole !== 'super_admin' && userRole !== 'branch_manager') {
      const student = await StudentModel.findById(application.studentId);
      if (!student || (student as any).regionId !== regionId) return undefined;
    }

    const [enriched] = await this.enrichDropdownFields([application]);
    return enriched as any;
  }

  static async getApplicationsByStudent(studentId: string, userId?: string, userRole?: string): Promise<Application[]> {
    // Check role-based access
    if (userRole === 'counselor' && userId) {
      const student = await StudentModel.findById(studentId);
      if (!student || (student as any).counsellorId !== userId) {
        return [];
      }
    }
    if (userRole === 'admission_officer' && userId) {
      const student = await StudentModel.findById(studentId);
      if (!student || (student as any).admissionOfficerId !== userId) {
        return [];
      }
    }

    const rows = await ApplicationModel.findByStudent(studentId);
    return (await this.enrichDropdownFields(rows)) as any;
  }

  static async createApplication(applicationData: InsertApplication, userId?: string): Promise<Application> {
    const application = await ApplicationModel.create(applicationData);

    // Log activity for the student
    await ActivityService.logActivity(
      'student',
      application.studentId,
      'application_created',
      'Application created',
      `Application submitted to ${application.university} for ${application.program}`,
      undefined,
      undefined,
      undefined,
      undefined,
      userId
    );

    // Also log activity for the application itself
    await ActivityService.logActivity(
      'application',
      application.id,
      'created',
      'Application submitted',
      `Application submitted to ${application.university} for ${application.program}`,
      undefined,
      undefined,
      undefined,
      undefined,
      userId
    );

    const [enriched] = await this.enrichDropdownFields([application]);
    return enriched as any;
  }

  static async updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application | undefined> {
    const currentApplication = await ApplicationModel.findById(id);
    if (!currentApplication) return undefined;

    const application = await ApplicationModel.update(id, updates);

    if (application) {
      // Log changes for each updated field
      for (const [fieldName, newValue] of Object.entries(updates)) {
        if (fieldName === 'updatedAt') continue;

        const oldValue = (currentApplication as any)[fieldName];
        if (oldValue !== newValue) {
          const fieldDisplayName = fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());

          await ActivityService.logActivity(
            'application',
            id,
            'updated',
            `${fieldDisplayName} updated`,
            `${fieldDisplayName} changed from "${oldValue || 'empty'}" to "${newValue || 'empty'}"`,
            fieldName,
            String(oldValue || ''),
            String(newValue || ''),
            undefined,
            'Next Bot'
          );
        }
      }
    }

    if (!application) return undefined;
    const [enriched] = await this.enrichDropdownFields([application]);
    return enriched as any;
  }

  static async deleteApplication(id: string): Promise<boolean> {
    const application = await ApplicationModel.findById(id);
    const success = await ApplicationModel.delete(id);

    if (success && application) {
      await ActivityService.logActivity(
        'application',
        id,
        'deleted',
        'Application deleted',
        `Application to ${application.university} was deleted`
      );
    }

    return success;
  }
}
