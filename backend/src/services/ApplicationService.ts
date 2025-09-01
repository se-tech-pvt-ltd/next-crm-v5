import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { applications, students, type Application, type InsertApplication } from "../shared/schema.js";
import { ApplicationModel } from "../models/Application.js";
import { StudentModel } from "../models/Student.js";
import { ActivityService } from "./ActivityService.js";

export class ApplicationService {
  static async getApplications(userId?: string, userRole?: string): Promise<Application[]> {
    if (userRole === 'counselor' && userId) {
      // Counselors can only see applications for their assigned students
      return await db.select({
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
        updatedAt: applications.updatedAt
      })
      .from(applications)
      .innerJoin(students, eq(applications.studentId, students.id))
      .where(eq(students.counselorId, userId))
      .orderBy(desc(applications.createdAt));
    }
    return await ApplicationModel.findAll();
  }

  static async getApplication(id: string, userId?: string, userRole?: string): Promise<Application | undefined> {
    const application = await ApplicationModel.findById(id);
    
    if (!application) return undefined;
    
    // Check role-based access for counselors
    if (userRole === 'counselor' && userId) {
      const student = await StudentModel.findById(application.studentId);
      if (!student || student.counselorId !== userId) {
        return undefined;
      }
    }
    
    return application;
  }

  static async getApplicationsByStudent(studentId: string, userId?: string, userRole?: string): Promise<Application[]> {
    // Check role-based access for counselors
    if (userRole === 'counselor' && userId) {
      const student = await StudentModel.findById(studentId);
      if (!student || student.counselorId !== userId) {
        return [];
      }
    }
    
    return await ApplicationModel.findByStudent(studentId);
  }

  static async createApplication(applicationData: InsertApplication): Promise<Application> {
    const application = await ApplicationModel.create(applicationData);
    
    // Log activity for the student
    await ActivityService.logActivity(
      'student', 
      application.studentId, 
      'application_created', 
      'Application created',
      `Application submitted to ${application.university} for ${application.program}`
    );
    
    // Also log activity for the application itself
    await ActivityService.logActivity(
      'application', 
      application.id, 
      'created', 
      'Application submitted',
      `Application submitted to ${application.university} for ${application.program}`
    );
    
    return application;
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
            .replace(/^./, str => str.toUpperCase());
          
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
            "Next Bot"
          );
        }
      }
    }

    return application;
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
