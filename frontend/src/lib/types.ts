import { z } from "zod";

export type NotificationStatus = 'pending' | 'sent' | 'failed';

// Pure TypeScript types for frontend use (no database dependencies)
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  branchId: string | null;
  department: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  program: string | null;
  source: string | null;
  status: string;
  expectation: string | null;
  type: string | null;
  studyLevel: string | null;
  studyPlan: string | null;
  elt: string | null;
  lostReason: string | null;
  isLost?: number | boolean | string | null;
  budget: string | null;
  timeline: string | null;
  notes: string | null;
  counselorId: string | null;
  branchId?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  leadId: string | null;
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  passportNumber: string | null;
  academicBackground: string | null;
  englishProficiency: string | null;
  targetCountry: string | null;
  targetProgram: string | null;
  budget: string | null;
  status: string;
  notes: string | null;
  counselorId: string | null;
  address: string | null;
  consultancyFree: boolean | null;
  scholarship: boolean | null;
  expectation: string | null;
  eltTest: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  applicationCode: string | null;
  studentId: string;
  university: string;
  universityId?: string | null;
  program: string;
  courseId?: string | null;
  courseType: string | null;
  appStatus: string;
  caseStatus: string | null;
  country: string | null;
  channelPartner: string | null;
  intake: string | null;
  intakeId?: string | null;
  googleDriveLink: string | null;
  notes: string | null;
  // Access fields
  branchId?: string | null;
  regionId?: string | null;
  counsellorId?: string | null;
  admissionOfficerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admission {
  id: string;
  applicationId: string;
  studentId: string;
  university: string;
  program: string;
  decision: string;
  decisionDate: Date | null;
  scholarshipAmount: string | null;
  conditions: string | null;
  depositRequired: boolean | null;
  depositAmount: string | null;
  depositDeadline: Date | null;
  // Financials and dates
  fullTuitionFee?: string | null;
  netTuitionFee?: string | null;
  depositDate?: Date | null;
  visaDate?: Date | null;
  visaStatus: string | null;
  // Misc/metadata
  status?: string | null;
  caseStatus?: string | null;
  googleDriveLink?: string | null;
  admissionId?: string | null;
  // Access fields
  branchId?: string | null;
  regionId?: string | null;
  counsellorId?: string | null;
  admissionOfficerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: number;
  entityType: string;
  entityId: string | number;
  activityType: string;
  title: string;
  description: string | null;
  oldValue: string | null;
  newValue: string | null;
  fieldName: string | null;
  followUpAt?: string | Date | null;
  userId: string | null;
  createdAt: Date;
}

export interface FollowUp {
  id: string;
  userId: string;
  entityId: string;
  entityType: string;
  comments: string;
  followUpOn: string;
  createdOn: string;
  updatedOn: string;
  status: "overdue" | "upcoming";
}

// Zod validation schemas for frontend forms (without database dependencies)
export const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  role: z.string().default("counselor"),
  branchId: z.string().optional(),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export const insertLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.union([z.string(), z.array(z.string())]).optional(),
  program: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.string().optional(),
  status: z.string().default("new"),
  expectation: z.string().optional(),
  type: z.string().optional(),
  studyLevel: z.string().optional(),
  studyPlan: z.string().optional(),
  elt: z.string().optional(),
  lostReason: z.string().optional(),
  isLost: z.union([z.boolean(), z.number(), z.string()]).optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  counselorId: z.string().optional(),
  branchId: z.string().optional(),
});

export const insertStudentSchema = z.object({
  leadId: z.string().optional(),
  name: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
  nationality: z.string().trim().min(1, "Nationality is required"),
  passportNumber: z.string().trim().min(1, "Passport number is required"),
  academicBackground: z.string().trim().min(1, "Academic background is required"),
  englishProficiency: z.string().trim().min(1, "English proficiency is required"),
  targetCountry: z.string().trim().min(1, "Target country is required"),
  targetProgram: z.string().trim().min(1, "Target program is required"),
  budget: z.string().trim().min(1, "Budget range is required"),
  status: z.string().trim().min(1, "Status is required"),
  notes: z.string().optional(),
  counselorId: z.string().trim().min(1, "Counsellor is required"),
  address: z.string().optional(),
  consultancyFree: z.boolean().optional(),
  scholarship: z.boolean().optional(),
  expectation: z.string().trim().min(1, "Expectation is required"),
  eltTest: z.string().optional(),
});

export const insertApplicationSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  university: z.string().min(1, "University is required"),
  universityId: z.string().min(1, "University ID is required"),
  program: z.string().min(1, "Program is required"),
  courseId: z.string().min(1, "Course is required"),
  courseType: z.string().min(1, "Course type is required"),
  appStatus: z.string().min(1, "Application status is required"),
  caseStatus: z.string().min(1, "Case status is required"),
  country: z.string().min(1, "Country is required"),
  channelPartner: z.string().min(1, "Channel partner is required"),
  intake: z.string().min(1, "Intake is required"),
  intakeId: z.string().min(1, "Intake ID is required"),
  googleDriveLink: z.string().min(1, "Google Drive link is required").url("Invalid URL for Google Drive link"),
  notes: z.string().min(1, "Notes are required"),
  // Access fields (optional)
  branchId: z.string().optional(),
  regionId: z.string().optional(),
  counsellorId: z.string().optional(),
  admissionOfficerId: z.string().optional(),
});

export const insertAdmissionSchema = z.object({
  applicationId: z.string(),
  studentId: z.string(),
  university: z.string().min(1, "University is required"),
  program: z.string().min(1, "Program is required"),
  decision: z.string().min(1, "Decision is required"),
  decisionDate: z.union([z.string(), z.date()]).optional().transform((v) => {
    if (v instanceof Date) return v;
    if (!v) return undefined;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date format');
    }
    return d;
  }),
  // Financials
  fullTuitionFee: z.string().optional(),
  scholarshipAmount: z.string().optional(),
  netTuitionFee: z.string().optional(),
  depositRequired: z.boolean().default(false),
  depositAmount: z.string().optional(),
  initialDeposit: z.string().optional(),
  depositDeadline: z.union([z.string(), z.date()]).optional().transform((v) => {
    if (v instanceof Date) return v;
    if (!v) return undefined;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date format');
    }
    return d;
  }),
  depositDate: z.union([z.string(), z.date()]).optional().transform((v) => {
    if (v instanceof Date) return v;
    if (!v) return undefined;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date format');
    }
    return d;
  }),
  // Visa
  visaDate: z.union([z.string(), z.date()]).optional().transform((v) => {
    if (v instanceof Date) return v;
    if (!v) return undefined;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date format');
    }
    return d;
  }),
  visaStatus: z.string().default("pending"),
  // Misc/metadata
  status: z.string().optional(),
  caseStatus: z.string().optional(),
  googleDriveLink: z.preprocess((v) => (typeof v === 'string' && v.trim().length === 0 ? undefined : v), z.string().url().optional()),
  admissionId: z.string().optional(),
  // Access fields (optional)
  branchId: z.string().optional(),
  regionId: z.string().optional(),
  counsellorId: z.string().optional(),
  admissionOfficerId: z.string().optional(),
});

export const insertActivitySchema = z.object({
  entityType: z.string(),
  entityId: z.union([z.string(), z.number()]),
  activityType: z.string(),
  title: z.string(),
  description: z.string().optional(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  fieldName: z.string().optional(),
  followUpAt: z.union([z.string(), z.date(), z.null()]).optional().transform((value) => {
    if (value == null) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid date format");
    }
    return parsed;
  }),
  userId: z.string().optional(),
});

// Insert types for forms
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
