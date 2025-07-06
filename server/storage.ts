import { 
  leads, students, applications, admissions, activities,
  type Lead, type Student, type Application, type Admission, type Activity,
  type InsertLead, type InsertStudent, type InsertApplication, type InsertAdmission, type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, desc } from "drizzle-orm";

export interface IStorage {
  // Lead operations
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Application operations
  getApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByStudent(studentId: number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  
  // Admission operations
  getAdmissions(): Promise<Admission[]>;
  getAdmission(id: number): Promise<Admission | undefined>;
  getAdmissionsByStudent(studentId: number): Promise<Admission[]>;
  createAdmission(admission: InsertAdmission): Promise<Admission>;
  updateAdmission(id: number, admission: Partial<InsertAdmission>): Promise<Admission | undefined>;
  deleteAdmission(id: number): Promise<boolean>;
  
  // Search operations
  searchLeads(query: string): Promise<Lead[]>;
  searchStudents(query: string): Promise<Student[]>;
  
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

  // Lead operations
  async getLeads(): Promise<Lead[]> {
    return db.select().from(leads);
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
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
  async getStudents(): Promise<Student[]> {
    return db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
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
  async getApplications(): Promise<Application[]> {
    return db.select().from(applications);
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async getApplicationsByStudent(studentId: number): Promise<Application[]> {
    return db.select().from(applications).where(eq(applications.studentId, studentId));
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
  async getAdmissions(): Promise<Admission[]> {
    return db.select().from(admissions);
  }

  async getAdmission(id: number): Promise<Admission | undefined> {
    const [admission] = await db.select().from(admissions).where(eq(admissions.id, id));
    return admission || undefined;
  }

  async getAdmissionsByStudent(studentId: number): Promise<Admission[]> {
    return db.select().from(admissions).where(eq(admissions.studentId, studentId));
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
  async searchLeads(query: string): Promise<Lead[]> {
    return db.select().from(leads).where(
      or(
        ilike(leads.name, `%${query}%`),
        ilike(leads.email, `%${query}%`),
        ilike(leads.program, `%${query}%`),
        ilike(leads.country, `%${query}%`)
      )
    );
  }

  async searchStudents(query: string): Promise<Student[]> {
    return db.select().from(students).where(
      or(
        ilike(students.name, `%${query}%`),
        ilike(students.email, `%${query}%`),
        ilike(students.targetProgram, `%${query}%`),
        ilike(students.targetCountry, `%${query}%`)
      )
    );
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