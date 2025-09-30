import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { admissions, students, type Admission, type InsertAdmission } from "../shared/schema.js";
import { AdmissionModel } from "../models/Admission.js";
import { StudentModel } from "../models/Student.js";
import { ActivityService } from "./ActivityService.js";
import { and, gte, lt, sql, eq, desc } from "drizzle-orm";

export class AdmissionService {
  static async getAdmissions(userId?: string, userRole?: string, regionId?: string, branchId?: string): Promise<Admission[]> {
    // Avoid complex Drizzle select mappings that may error in some runtime environments.
    // Fetch all admissions and perform server-side filtering in JS for robustness.
    try {
      const all = await AdmissionModel.findAll();
      // If no role/filters, return all
      if (!userRole && !regionId && !branchId && !userId) return all;

      // Helper to fetch student for matching
      const studentCache: Record<string, any> = {};
      const getStudent = async (id: string) => {
        if (!id) return null;
        if (studentCache[id]) return studentCache[id];
        const s = await StudentModel.findById(id);
        studentCache[id] = s || null;
        return studentCache[id];
      };

      const filtered: Admission[] = [];
      for (const adm of all) {
        try {
          const student = await getStudent(adm.studentId);
          if (!student) continue;
          if (userRole === 'counselor' && userId) {
            if (student.counselorId === userId) filtered.push(adm);
            continue;
          }
          if (userRole === 'admission_officer' && userId) {
            if ((student as any).admissionOfficerId === userId) filtered.push(adm);
            continue;
          }
          if (userRole === 'branch_manager') {
            if (branchId && student.branchId === branchId) filtered.push(adm);
            continue;
          }
          if (userRole === 'regional_manager') {
            if (regionId && student.regionId === regionId) filtered.push(adm);
            continue;
          }
          if (regionId && userRole !== 'super_admin') {
            if (student.regionId === regionId) filtered.push(adm);
            continue;
          }
          // default push
          filtered.push(adm);
        } catch (e) {
          // ignore per-record failures
          console.error('Filtering admission error for id', adm.id, e);
        }
      }
      // return unique filtered (in case of duplicates)
      return filtered;
    } catch (error) {
      console.error('Get admissions fallback error:', error);
      return AdmissionModel.findAll();
    }
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
