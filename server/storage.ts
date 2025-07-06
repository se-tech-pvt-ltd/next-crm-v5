import { 
  leads, students, applications, admissions, activities, users,
  type Lead, type Student, type Application, type Admission, type Activity, type User,
  type InsertLead, type InsertStudent, type InsertApplication, type InsertAdmission, type InsertActivity, type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, desc, isNull, not, exists } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  getCounselors(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Authentication operations
  authenticateUser(email: string, password: string): Promise<User | null>;
  createUserWithPassword(user: InsertUser, password: string): Promise<User>;
  
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
  createActivityWithUser(activity: InsertActivity, userId?: string): Promise<Activity>;
  transferActivities(fromEntityType: string, fromEntityId: number, toEntityType: string, toEntityId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database storage doesn't need initialization
  }

  private async logActivity(entityType: string, entityId: number, activityType: string, title: string, description?: string, fieldName?: string, oldValue?: string, newValue?: string, userId?: string, userName?: string, userProfileImage?: string) {
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
        userId,
        userName: userName || "Next Bot",
        userProfileImage,
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Authentication operations
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user || !user.passwordHash) {
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async createUserWithPassword(userData: InsertUser, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 12);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        passwordHash,
      })
      .returning();

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // Lead operations
  async getLeads(userId?: string, userRole?: string): Promise<Lead[]> {
    if (userRole === 'counselor' && userId) {
      // Counselors can only see their assigned leads that haven't been converted
      return await db.select().from(leads)
        .where(and(
          eq(leads.counselorId, userId),
          not(exists(
            db.select().from(students).where(eq(students.leadId, leads.id))
          ))
        ))
        .orderBy(desc(leads.createdAt));
    }
    // Branch managers and admin staff can see all leads that haven't been converted
    return await db.select().from(leads)
      .where(not(exists(
        db.select().from(students).where(eq(students.leadId, leads.id))
      )))
      .orderBy(desc(leads.createdAt));
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
    // Normalize array fields to strings if they are arrays (backward compatibility)
    const processedLead = { ...insertLead } as any;
    if (Array.isArray((insertLead as any).country)) {
      processedLead.country = (insertLead as any).country[0] || null;
    }
    if (Array.isArray((insertLead as any).program)) {
      processedLead.program = (insertLead as any).program[0] || null;
    }

    const [lead] = await db
      .insert(leads)
      .values(processedLead as InsertLead)
      .returning();
    return lead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    // Get the current lead to track changes
    const currentLead = await this.getLead(id);
    if (!currentLead) return undefined;

    // Normalize array fields to strings if they are arrays (backward compatibility)
    const processedUpdates = { ...updates } as any;
    if (Array.isArray((updates as any).country)) {
      processedUpdates.country = (updates as any).country[0] || null;
    }
    if (Array.isArray((updates as any).program)) {
      processedUpdates.program = (updates as any).program[0] || null;
    }

    const [lead] = await db
      .update(leads)
      .set({ ...processedUpdates, updatedAt: new Date() } as any)
      .where(eq(leads.id, id))
      .returning();

    if (lead) {
      // Log changes for each updated field
      for (const [fieldName, newValue] of Object.entries(updates)) {
        if (fieldName === 'updatedAt') continue; // Skip timestamp fields
        
        const oldValue = (currentLead as any)[fieldName];
        if (oldValue !== newValue) {
          const fieldDisplayName = fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
          
          await this.logActivity(
            'lead', 
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
    await this.logActivity('student', student.id, 'created', 'Student record created', `Student ${student.name} was added to the system`, undefined, undefined, undefined, undefined, "Next Bot");
    
    return student;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    // Get the current student to track changes
    const currentStudent = await this.getStudent(id);
    if (!currentStudent) return undefined;

    const [student] = await db
      .update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();

    if (student) {
      // Log changes for each updated field
      for (const [fieldName, newValue] of Object.entries(updates)) {
        if (fieldName === 'updatedAt') continue; // Skip timestamp fields
        
        const oldValue = (currentStudent as any)[fieldName];
        if (oldValue !== newValue) {
          const fieldDisplayName = fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
          
          await this.logActivity(
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
        notes: applications.notes,
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
    
    // Log activity for the student
    await this.logActivity(
      'student', 
      application.studentId, 
      'application_created', 
      'Application created',
      `Application submitted to ${application.university} for ${application.program}`,
      undefined,
      undefined,
      undefined,
      undefined,
      "Next Bot"
    );
    
    // Also log activity for the application itself
    await this.logActivity(
      'application', 
      application.id, 
      'created', 
      'Application submitted',
      `Application submitted to ${application.university} for ${application.program}`,
      undefined,
      undefined,
      undefined,
      undefined,
      "Next Bot"
    );
    
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
        notes: admissions.notes,
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

  async createActivityWithUser(insertActivity: InsertActivity, userId?: string): Promise<Activity> {
    let userName = "Next Bot";
    let userProfileImage = null;
    
    if (userId) {
      const user = await this.getUser(userId);
      if (user) {
        userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "User";
        userProfileImage = user.profileImageUrl;
      }
    }
    
    const activityWithUser = {
      ...insertActivity,
      userId,
      userName,
      userProfileImage,
    };
    
    const [activity] = await db
      .insert(activities)
      .values(activityWithUser)
      .returning();
    return activity;
  }

  async transferActivities(fromEntityType: string, fromEntityId: number, toEntityType: string, toEntityId: number): Promise<void> {
    // Get all activities from the source entity
    const sourceActivities = await db.select().from(activities)
      .where(
        and(
          eq(activities.entityType, fromEntityType),
          eq(activities.entityId, fromEntityId)
        )
      );

    // Create new activities for the target entity
    for (const activity of sourceActivities) {
      await db.insert(activities).values({
        entityType: toEntityType,
        entityId: toEntityId,
        activityType: activity.activityType,
        title: activity.title,
        description: activity.description,
        oldValue: activity.oldValue,
        newValue: activity.newValue,
        fieldName: activity.fieldName,
        userId: activity.userId,
        userName: activity.userName,
        userProfileImage: activity.userProfileImage,
        createdAt: activity.createdAt, // Preserve original timestamp
      });
    }

    // Add a conversion activity
    await db.insert(activities).values({
      entityType: toEntityType,
      entityId: toEntityId,
      activityType: 'converted',
      title: `Converted from ${fromEntityType}`,
      description: `This record was converted from ${fromEntityType} ID ${fromEntityId}. All previous activities have been preserved.`,
      userName: "Next Bot",
    });
  }
}

export const storage = new DatabaseStorage();