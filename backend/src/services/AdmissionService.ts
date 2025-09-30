import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { admissions, students, type Admission, type InsertAdmission } from "../shared/schema.js";
import { AdmissionModel } from "../models/Admission.js";
import { StudentModel } from "../models/Student.js";
import { ActivityService } from "./ActivityService.js";
import { and, gte, lt, sql, eq, desc } from "drizzle-orm";

export class AdmissionService {
  static async getAdmissions(userId?: string, userRole?: string, regionId?: string, branchId?: string): Promise<Admission[]> {
    if (userRole === 'counselor' && userId) {
      // Counselors can only see admissions for their assigned students
      return await db.select({
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
        fullTuitionFee: admissions.fullTuitionFee,
        netTuitionFee: admissions.netTuitionFee,
        depositDate: admissions.depositDate,
        visaDate: admissions.visaDate,
        visaStatus: admissions.visaStatus,
        admissionId: admissions.admissionId,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt
      })
      .from(admissions)
      .innerJoin(students, eq(admissions.studentId, students.id))
      .where(eq(students.counselorId, userId))
      .orderBy(desc(admissions.createdAt));
    }
    if (userRole === 'admission_officer' && userId) {
      return await db.select({
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
        fullTuitionFee: admissions.fullTuitionFee,
        netTuitionFee: admissions.netTuitionFee,
        depositDate: admissions.depositDate,
        visaDate: admissions.visaDate,
        visaStatus: admissions.visaStatus,
        admissionId: admissions.admissionId,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt
      })
      .from(admissions)
      .innerJoin(students, eq(admissions.studentId, students.id))
      .where(eq(students.admissionOfficerId, userId))
      .orderBy(desc(admissions.createdAt));
    }

    if (userRole === 'branch_manager') {
      if (branchId) {
        return await db.select({
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
        fullTuitionFee: admissions.fullTuitionFee,
        netTuitionFee: admissions.netTuitionFee,
        depositDate: admissions.depositDate,
        visaDate: admissions.visaDate,
        visaStatus: admissions.visaStatus,
          admissionId: admissions.admissionId,
          createdAt: admissions.createdAt,
          updatedAt: admissions.updatedAt
        })
        .from(admissions)
        .innerJoin(students, eq(admissions.studentId, students.id))
        .where(eq(students.branchId, branchId))
        .orderBy(desc(admissions.createdAt));
      }
      return [];
    }

    if (userRole === 'regional_manager') {
      if (regionId) {
        return await db.select({
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
        fullTuitionFee: admissions.fullTuitionFee,
        netTuitionFee: admissions.netTuitionFee,
        depositDate: admissions.depositDate,
        visaDate: admissions.visaDate,
        visaStatus: admissions.visaStatus,
          admissionId: admissions.admissionId,
          createdAt: admissions.createdAt,
          updatedAt: admissions.updatedAt
        })
        .from(admissions)
        .innerJoin(students, eq(admissions.studentId, students.id))
        .where(eq(students.regionId, regionId))
        .orderBy(desc(admissions.createdAt));
      }
      return [];
    }

    if (regionId && userRole !== 'super_admin') {
      return await db.select({
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
        fullTuitionFee: admissions.fullTuitionFee,
        netTuitionFee: admissions.netTuitionFee,
        depositDate: admissions.depositDate,
        visaDate: admissions.visaDate,
        visaStatus: admissions.visaStatus,
        admissionId: admissions.admissionId,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt
      })
      .from(admissions)
      .innerJoin(students, eq(admissions.studentId, students.id))
      .where(eq(students.regionId, regionId))
      .orderBy(desc(admissions.createdAt));
    }

    return await AdmissionModel.findAll();
  }

  static async getAdmission(id: string, userId?: string, userRole?: string): Promise<Admission | undefined> {
    const admission = await AdmissionModel.findById(id);

    if (!admission) return undefined;

    // Check role-based access
    if (userRole === 'counselor' && userId) {
      const student = await StudentModel.findById(admission.studentId);
      if (!student || student.counselorId !== userId) {
        return undefined;
      }
    }
    if (userRole === 'admission_officer' && userId) {
      const student = await StudentModel.findById(admission.studentId);
      if (!student || (student as any).admissionOfficerId !== userId) {
        return undefined;
      }
    }

    return admission;
  }

  static async getAdmissionsByStudent(studentId: string, userId?: string, userRole?: string): Promise<Admission[]> {
    // Check role-based access
    if (userRole === 'counselor' && userId) {
      const student = await StudentModel.findById(studentId);
      if (!student || student.counselorId !== userId) {
        return [];
      }
    }
    if (userRole === 'admission_officer' && userId) {
      const student = await StudentModel.findById(studentId);
      if (!student || (student as any).admissionOfficerId !== userId) {
        return [];
      }
    }

    return await AdmissionModel.findByStudent(studentId);
  }

  static async createAdmission(admissionData: InsertAdmission): Promise<Admission> {
    // Generate an admission code (ADM-YYMMDD-XXX) using timestamp-based sequence to avoid heavy COUNT queries
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    // use milliseconds since epoch modulo 1000 as a simple sequence for uniqueness within the day
    const seqNum = String(now.getTime() % 1000).padStart(3, '0');
    const admissionCode = `ADM-${yy}${mm}${dd}-${seqNum}`;

    const admission = await AdmissionModel.create({
      ...admissionData,
      admissionId: admissionCode,
    } as InsertAdmission);

    // Log activity for the student
    await ActivityService.logActivity(
      'student', 
      admission.studentId, 
      'admission_created', 
      'Admission decision received',
      `${admission.decision} decision received from ${admission.university} for ${admission.program}`
    );
    
    // Also log activity for the admission itself
    await ActivityService.logActivity(
      'admission', 
      admission.id, 
      'created', 
      'Admission decision recorded',
      `${admission.decision} decision from ${admission.university} for ${admission.program}`
    );
    
    return admission;
  }

  static async updateAdmission(id: string, updates: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const currentAdmission = await AdmissionModel.findById(id);
    if (!currentAdmission) return undefined;

    const admission = await AdmissionModel.update(id, updates);

    if (admission) {
      // Log changes for each updated field
      for (const [fieldName, newValue] of Object.entries(updates)) {
        if (fieldName === 'updatedAt') continue;
        
        const oldValue = (currentAdmission as any)[fieldName];
        if (oldValue !== newValue) {
          const fieldDisplayName = fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
          
          await ActivityService.logActivity(
            'admission', 
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

    return admission;
  }

  static async deleteAdmission(id: string): Promise<boolean> {
    const admission = await AdmissionModel.findById(id);
    const success = await AdmissionModel.delete(id);

    if (success && admission) {
      await ActivityService.logActivity(
        'admission', 
        id, 
        'deleted', 
        'Admission deleted',
        `Admission from ${admission.university} was deleted`
      );
    }
    
    return success;
  }
}
