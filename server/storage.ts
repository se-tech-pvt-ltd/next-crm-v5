import { 
  leads, students, applications, admissions,
  type Lead, type Student, type Application, type Admission,
  type InsertLead, type InsertStudent, type InsertApplication, type InsertAdmission
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private leads: Map<number, Lead>;
  private students: Map<number, Student>;
  private applications: Map<number, Application>;
  private admissions: Map<number, Admission>;
  private currentLeadId: number;
  private currentStudentId: number;
  private currentApplicationId: number;
  private currentAdmissionId: number;

  constructor() {
    this.leads = new Map();
    this.students = new Map();
    this.applications = new Map();
    this.admissions = new Map();
    this.currentLeadId = 1;
    this.currentStudentId = 1;
    this.currentApplicationId = 1;
    this.currentAdmissionId = 1;
  }

  // Lead operations
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const now = new Date();
    const lead: Lead = {
      ...insertLead,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;
    
    const updatedLead: Lead = {
      ...lead,
      ...updates,
      updatedAt: new Date(),
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values()).sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const now = new Date();
    const student: Student = {
      ...insertStudent,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updatedStudent: Student = {
      ...student,
      ...updates,
      updatedAt: new Date(),
    };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  // Application operations
  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values()).sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByStudent(studentId: number): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const now = new Date();
    const application: Application = {
      ...insertApplication,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: number, updates: Partial<InsertApplication>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication: Application = {
      ...application,
      ...updates,
      updatedAt: new Date(),
    };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async deleteApplication(id: number): Promise<boolean> {
    return this.applications.delete(id);
  }

  // Admission operations
  async getAdmissions(): Promise<Admission[]> {
    return Array.from(this.admissions.values()).sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  }

  async getAdmission(id: number): Promise<Admission | undefined> {
    return this.admissions.get(id);
  }

  async getAdmissionsByStudent(studentId: number): Promise<Admission[]> {
    return Array.from(this.admissions.values())
      .filter(admission => admission.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }

  async createAdmission(insertAdmission: InsertAdmission): Promise<Admission> {
    const id = this.currentAdmissionId++;
    const now = new Date();
    const admission: Admission = {
      ...insertAdmission,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.admissions.set(id, admission);
    return admission;
  }

  async updateAdmission(id: number, updates: Partial<InsertAdmission>): Promise<Admission | undefined> {
    const admission = this.admissions.get(id);
    if (!admission) return undefined;
    
    const updatedAdmission: Admission = {
      ...admission,
      ...updates,
      updatedAt: new Date(),
    };
    this.admissions.set(id, updatedAdmission);
    return updatedAdmission;
  }

  async deleteAdmission(id: number): Promise<boolean> {
    return this.admissions.delete(id);
  }

  // Search operations
  async searchLeads(query: string): Promise<Lead[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.leads.values()).filter(lead =>
      lead.name.toLowerCase().includes(lowerQuery) ||
      lead.email.toLowerCase().includes(lowerQuery) ||
      (lead.phone && lead.phone.toLowerCase().includes(lowerQuery)) ||
      (lead.country && lead.country.toLowerCase().includes(lowerQuery)) ||
      (lead.program && lead.program.toLowerCase().includes(lowerQuery))
    );
  }

  async searchStudents(query: string): Promise<Student[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.students.values()).filter(student =>
      student.name.toLowerCase().includes(lowerQuery) ||
      student.email.toLowerCase().includes(lowerQuery) ||
      (student.phone && student.phone.toLowerCase().includes(lowerQuery)) ||
      (student.targetCountry && student.targetCountry.toLowerCase().includes(lowerQuery)) ||
      (student.targetProgram && student.targetProgram.toLowerCase().includes(lowerQuery))
    );
  }
}

export const storage = new MemStorage();
