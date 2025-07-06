import { 
  leads, students, applications, admissions, activities, users,
  type Lead, type Student, type Application, type Admission, type Activity, type User,
  type InsertLead, type InsertStudent, type InsertApplication, type InsertAdmission, type InsertActivity, type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  getCounselors(): Promise<User[]>;
  
  // Lead operations (with role-based access)
  getLeads(userId?: string, userRole?: string): Promise<Lead[]>;
  getLead(id: number, userId?: string, userRole?: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  assignLeadToCounselor(leadId: number, counselorId: string): Promise<boolean>;
  
  // Student operations (with role-based access)
  getStudents(userId?: string, userRole?: string): Promise<Student[]>;
  getStudent(id: number, userId?: string, userRole?: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Application operations (with role-based access)
  getApplications(userId?: string, userRole?: string): Promise<Application[]>;
  getApplication(id: number, userId?: string, userRole?: string): Promise<Application | undefined>;
  getApplicationsByStudent(studentId: number, userId?: string, userRole?: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  
  // Admission operations (with role-based access)
  getAdmissions(userId?: string, userRole?: string): Promise<Admission[]>;
  getAdmission(id: number, userId?: string, userRole?: string): Promise<Admission | undefined>;
  getAdmissionsByStudent(studentId: number, userId?: string, userRole?: string): Promise<Admission[]>;
  createAdmission(admission: InsertAdmission): Promise<Admission>;
  updateAdmission(id: number, admission: Partial<InsertAdmission>): Promise<Admission | undefined>;
  deleteAdmission(id: number): Promise<boolean>;
  
  // Search operations (with role-based access)
  searchLeads(query: string, userId?: string, userRole?: string): Promise<Lead[]>;
  searchStudents(query: string, userId?: string, userRole?: string): Promise<Student[]>;
  
  // Activity operations
  getActivities(entityType: string, entityId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database storage doesn't need initialization
  }

  private async logActivity(entityType: string, entityId: number, activityType: string, title: string, description?: string, fieldName?: string, oldValue?: string, newValue?: string) {
    try {
      await this.createActivity({
        entityType,
        entityId,
        activityType,
        title,
        description,
        fieldName,
        oldValue,
        newValue,
      });
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getCounselors(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'counselor'));
  }

  // Lead operations
  async getLeads(userId?: string, userRole?: string): Promise<Lead[]> {
    if (userRole === 'counselor' && userId) {
      // Counselors can only see their assigned leads
      return await db.select().from(leads)
        .where(eq(leads.counselorId, userId))
        .orderBy(desc(leads.createdAt));
    }
    // Branch managers and admin staff can see all leads
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: number, userId?: string, userRole?: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    
    if (!lead) return undefined;
    
    // Check role-based access
    if (userRole === 'counselor' && userId && lead.counselorId !== userId) {
      return undefined; // Counselors can only see their assigned leads
    }
    
    return lead;
  }

  async assignLeadToCounselor(leadId: number, counselorId: string): Promise<boolean> {
    const [updated] = await db
      .update(leads)
      .set({ counselorId, updatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning();
    
    if (updated) {
      await this.logActivity('lead', leadId, 'assigned', 'Lead assigned to counselor', `Lead assigned to counselor ${counselorId}`);
      return true;
    }
    return false;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();
    return lead || undefined;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Student operations
  async getStudents(userId?: string, userRole?: string): Promise<Student[]> {
    if (userRole === 'counselor' && userId) {
      // Counselors can only see their assigned students
      return await db.select().from(students)
        .where(eq(students.counselorId, userId))
        .orderBy(desc(students.createdAt));
    }
    // Branch managers and admin staff can see all students
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  async getStudent(id: number, userId?: string, userRole?: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    
    if (!student) return undefined;
    
    // Check role-based access
    if (userRole === 'counselor' && userId && student.counselorId !== userId) {
      return undefined; // Counselors can only see their assigned students
    }
    
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    
    // Log activity
    await this.logActivity('student', student.id, 'created', 'Student record created', `Student ${student.name} was added to the system`);
    
    return student;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();
    return student || undefined;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Application operations
  async getApplications(userId?: string, userRole?: string): Promise<Application[]> {
    if (userRole === 'counselor' && userId) {
      // Counselors can only see applications for their assigned students
      return await db.select({ 
        id: applications.id,
        studentId: applications.studentId,
        university: applications.university,
        program: applications.program,
        degree: applications.degree,
        intakeYear: applications.intakeYear,
        intakeSemester: applications.intakeSemester,
        applicationFee: applications.applicationFee,
        status: applications.status,
        submissionDate: applications.submissionDate,
        decisionDate: applications.decisionDate,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt
      })
      .from(applications)
      .innerJoin(students, eq(applications.studentId, students.id))
      .where(eq(students.counselorId, userId))
      .orderBy(desc(applications.createdAt));
    }
    // Branch managers and admin staff can see all applications
    return await db.select().from(applications).orderBy(desc(applications.createdAt));
  }

  async getApplication(id: number, userId?: string, userRole?: string): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    
    if (!application) return undefined;
    
    // Check role-based access for counselors
    if (userRole === 'counselor' && userId) {
      const [student] = await db.select().from(students).where(eq(students.id, application.studentId));
      if (!student || student.counselorId !== userId) {
        return undefined; // Counselors can only see applications for their assigned students
      }
    }
    
    return application;
  }

  async getApplicationsByStudent(studentId: number, userId?: string, userRole?: string): Promise<Application[]> {
    // Check role-based access for counselors
    if (userRole === 'counselor' && userId) {
      const [student] = await db.select().from(students).where(eq(students.id, studentId));
      if (!student || student.counselorId !== userId) {
        return []; // Counselors can only see applications for their assigned students
      }
    }
    
    return await db.select().from(applications).where(eq(applications.studentId, studentId));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application | undefined> {
    const [application] = await db
      .update(applications)
      .set(updates)
      .where(eq(applications.id, id))
      .returning();
    return application || undefined;
  }

  async deleteApplication(id: number): Promise<boolean> {
    const result = await db.delete(applications).where(eq(applications.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Admission operations
  async getAdmissions(userId?: string, userRole?: string): Promise<Admission[]> {
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
        createdAt: admissions.createdAt,
        updatedAt: admissions.updatedAt
      })
      .from(admissions)
      .innerJoin(students, eq(admissions.studentId, students.id))
      .where(eq(students.counselorId, userId))
      .orderBy(desc(admissions.createdAt));
    }
    // Branch managers and admin staff can see all admissions
    return await db.select().from(admissions).orderBy(desc(admissions.createdAt));
  }

  async getAdmission(id: number, userId?: string, userRole?: string): Promise<Admission | undefined> {
    const [admission] = await db.select().from(admissions).where(eq(admissions.id, id));
    
    if (!admission) return undefined;
    
    // Check role-based access for counselors
    if (userRole === 'counselor' && userId) {
      const [student] = await db.select().from(students).where(eq(students.id, admission.studentId));
      if (!student || student.counselorId !== userId) {
        return undefined; // Counselors can only see admissions for their assigned students
      }
    }
    
    return admission;
  }

  async getAdmissionsByStudent(studentId: number, userId?: string, userRole?: string): Promise<Admission[]> {
    // Check role-based access for counselors
    if (userRole === 'counselor' && userId) {
      const [student] = await db.select().from(students).where(eq(students.id, studentId));
      if (!student || student.counselorId !== userId) {
        return []; // Counselors can only see admissions for their assigned students
      }
    }
    
    return await db.select().from(admissions).where(eq(admissions.studentId, studentId));
  }

  async createAdmission(insertAdmission: InsertAdmission): Promise<Admission> {
    const [admission] = await db
      .insert(admissions)
      .values(insertAdmission)
      .returning();
    return admission;
  }

  async updateAdmission(id: number, updates: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const [admission] = await db
      .update(admissions)
      .set(updates)
      .where(eq(admissions.id, id))
      .returning();
    return admission || undefined;
  }

  async deleteAdmission(id: number): Promise<boolean> {
    const result = await db.delete(admissions).where(eq(admissions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Search operations
  async searchLeads(query: string, userId?: string, userRole?: string): Promise<Lead[]> {
    const searchConditions = or(
      ilike(leads.name, `%${query}%`),
      ilike(leads.email, `%${query}%`),
      ilike(leads.program, `%${query}%`),
      ilike(leads.country, `%${query}%`)
    );
    
    if (userRole === 'counselor' && userId) {
      // Counselors can only search their assigned leads
      return await db.select().from(leads).where(
        and(
          eq(leads.counselorId, userId),
          searchConditions
        )
      );
    }
    
    // Branch managers and admin staff can search all leads
    return await db.select().from(leads).where(searchConditions);
  }

  async searchStudents(query: string, userId?: string, userRole?: string): Promise<Student[]> {
    const searchConditions = or(
      ilike(students.name, `%${query}%`),
      ilike(students.email, `%${query}%`),
      ilike(students.targetProgram, `%${query}%`),
      ilike(students.targetCountry, `%${query}%`)
    );
    
    if (userRole === 'counselor' && userId) {
      // Counselors can only search their assigned students
      return await db.select().from(students).where(
        and(
          eq(students.counselorId, userId),
          searchConditions
        )
      );
    }
    
    // Branch managers and admin staff can search all students
    return await db.select().from(students).where(searchConditions);
  }

  // Activity operations
  async getActivities(entityType: string, entityId: number): Promise<Activity[]> {
    return db.select().from(activities)
      .where(
        and(
          eq(activities.entityType, entityType),
          eq(activities.entityId, entityId)
        )
      )
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }
}

export const storage = new DatabaseStorage();