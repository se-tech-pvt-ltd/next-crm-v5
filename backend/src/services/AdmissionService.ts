import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { admissions, students, type Admission, type InsertAdmission } from "../shared/schema.js";
import { AdmissionModel } from "../models/Admission.js";
import { StudentModel } from "../models/Student.js";
import { ActivityService } from "./ActivityService.js";

export class AdmissionService {
  static async getAdmissions(userId?: string, userRole?: string): Promise<Admission[]> {
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
        visaStatus: admissions.visaStatus,
        notes: admissions.notes,
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt
      })
      .from(admissions)
      .innerJoin(students, eq(admissions.studentId, students.id))
      .where(eq(students.counselorId, userId))
      .orderBy(desc(admissions.createdAt));
    }
    return await AdmissionModel.findAll();
  }

  static async getAdmission(id: number, userId?: string, userRole?: string): Promise<Admission | undefined> {
    const admission = await AdmissionModel.findById(id);
    
    if (!admission) return undefined;
    
    // Check role-based access for counselors
    if (userRole === 'counselor' && userId) {
      const student = await StudentModel.findById(admission.studentId);
      if (!student || student.counselorId !== userId) {
        return undefined;
      }
    }
    
    return admission;
  }

  static async getAdmissionsByStudent(studentId: number, userId?: string, userRole?: string): Promise<Admission[]> {
    // Check role-based access for counselors
    if (userRole === 'counselor' && userId) {
      const student = await StudentModel.findById(studentId);
      if (!student || student.counselorId !== userId) {
        return [];
      }
    }
    
    return await AdmissionModel.findByStudent(studentId);
  }

  static async createAdmission(admissionData: InsertAdmission): Promise<Admission> {
    const admission = await AdmissionModel.create(admissionData);
    
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

  static async updateAdmission(id: number, updates: Partial<InsertAdmission>): Promise<Admission | undefined> {
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

  static async deleteAdmission(id: number): Promise<boolean> {
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
