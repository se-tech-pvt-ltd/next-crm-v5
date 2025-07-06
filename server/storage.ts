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
    
    // Add sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample leads
    const sampleLeads = [
      {
        name: 'Emma Thompson',
        email: 'emma.thompson@email.com',
        phone: '+1-555-0123',
        country: 'Canada',
        program: 'Computer Science',
        source: 'website',
        status: 'new',
        notes: 'Interested in AI and machine learning programs'
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+1-555-0124',
        country: 'USA',
        program: 'Business Administration',
        source: 'referral',
        status: 'contacted',
        notes: 'Looking for MBA programs with tech focus'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@email.com',
        phone: '+1-555-0125',
        country: 'UK',
        program: 'Medicine',
        source: 'social-media',
        status: 'qualified',
        notes: 'Pre-med student, excellent grades'
      }
    ];

    sampleLeads.forEach(lead => {
      this.createLead(lead);
    });

    // Sample students (converted from leads)
    const sampleStudents = [
      {
        leadId: 1,
        name: 'John Davis',
        email: 'john.davis@email.com',
        phone: '+1-555-0126',
        dateOfBirth: '1998-05-15',
        nationality: 'American',
        passportNumber: 'US123456789',
        academicBackground: 'Bachelor of Engineering, GPA: 3.8/4.0',
        englishProficiency: 'IELTS 7.5',
        targetCountry: 'Canada',
        targetProgram: 'Master of Computer Science',
        budget: '$50,000 - $70,000',
        status: 'active',
        notes: 'Strong programming background, interested in AI research'
      },
      {
        leadId: null,
        name: 'Lisa Rodriguez',
        email: 'lisa.rodriguez@email.com',
        phone: '+1-555-0127',
        dateOfBirth: '1997-08-22',
        nationality: 'Mexican',
        passportNumber: 'MX987654321',
        academicBackground: 'Bachelor of Business, GPA: 3.9/4.0',
        englishProficiency: 'TOEFL 110+',
        targetCountry: 'USA',
        targetProgram: 'MBA',
        budget: '$70,000+',
        status: 'applied',
        notes: 'Outstanding academic record, leadership experience'
      }
    ];

    sampleStudents.forEach(student => {
      this.createStudent(student);
    });

    // Sample applications
    const sampleApplications = [
      {
        studentId: 1,
        university: 'University of Toronto',
        program: 'Master of Computer Science',
        degree: 'Master\'s',
        intakeYear: '2025',
        intakeSemester: 'Fall',
        applicationFee: '$125',
        status: 'submitted',
        submissionDate: new Date('2024-12-01'),
        decisionDate: new Date('2025-03-15'),
        notes: 'Focus on artificial intelligence track'
      },
      {
        studentId: 2,
        university: 'Stanford University',
        program: 'MBA',
        degree: 'Master\'s',
        intakeYear: '2025',
        intakeSemester: 'Fall',
        applicationFee: '$275',
        status: 'under-review',
        submissionDate: new Date('2024-11-15'),
        decisionDate: new Date('2025-04-01'),
        notes: 'Applied for entrepreneurship concentration'
      },
      {
        studentId: 1,
        university: 'University of British Columbia',
        program: 'Master of Computer Science',
        degree: 'Master\'s',
        intakeYear: '2025',
        intakeSemester: 'Fall',
        applicationFee: '$168',
        status: 'accepted',
        submissionDate: new Date('2024-11-20'),
        decisionDate: new Date('2024-12-15'),
        notes: 'Backup option, good program'
      }
    ];

    sampleApplications.forEach(app => {
      this.createApplication(app);
    });

    // Sample admissions
    const sampleAdmissions = [
      {
        applicationId: 3,
        studentId: 1,
        university: 'University of British Columbia',
        program: 'Master of Computer Science',
        decision: 'accepted',
        decisionDate: new Date('2024-12-15'),
        scholarshipAmount: '$15,000',
        conditions: 'Maintain minimum GPA of 3.5',
        depositRequired: true,
        depositAmount: '$2,000',
        depositDeadline: new Date('2025-02-01'),
        visaStatus: 'pending',
        notes: 'Excellent academic performance, partial scholarship awarded'
      }
    ];

    sampleAdmissions.forEach(admission => {
      this.createAdmission(admission);
    });
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
      phone: insertLead.phone || null,
      country: insertLead.country || null,
      program: insertLead.program || null,
      source: insertLead.source || null,
      status: insertLead.status || 'new',
      notes: insertLead.notes || null,
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
      phone: insertStudent.phone || null,
      notes: insertStudent.notes || null,
      leadId: insertStudent.leadId || null,
      dateOfBirth: insertStudent.dateOfBirth || null,
      nationality: insertStudent.nationality || null,
      passportNumber: insertStudent.passportNumber || null,
      academicBackground: insertStudent.academicBackground || null,
      englishProficiency: insertStudent.englishProficiency || null,
      targetCountry: insertStudent.targetCountry || null,
      targetProgram: insertStudent.targetProgram || null,
      budget: insertStudent.budget || null,
      status: insertStudent.status || 'active',
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
      notes: insertApplication.notes || null,
      degree: insertApplication.degree || null,
      intakeYear: insertApplication.intakeYear || null,
      intakeSemester: insertApplication.intakeSemester || null,
      applicationFee: insertApplication.applicationFee || null,
      submissionDate: insertApplication.submissionDate || null,
      decisionDate: insertApplication.decisionDate || null,
      status: insertApplication.status || 'draft',
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
      decisionDate: insertAdmission.decisionDate || null,
      scholarshipAmount: insertAdmission.scholarshipAmount || null,
      conditions: insertAdmission.conditions || null,
      depositRequired: insertAdmission.depositRequired || null,
      depositAmount: insertAdmission.depositAmount || null,
      depositDeadline: insertAdmission.depositDeadline || null,
      notes: insertAdmission.notes || null,
      visaStatus: insertAdmission.visaStatus || 'pending',
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
