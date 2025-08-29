import { z } from "zod";

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
  budget: string | null;
  timeline: string | null;
  notes: string | null;
  counselorId: string | null;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: number;
  studentId: string;
  university: string;
  program: string;
  degree: string | null;
  intakeYear: string | null;
  intakeSemester: string | null;
  applicationFee: string | null;
  status: string;
  notes: string | null;
  decisionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admission {
  id: number;
  applicationId: number;
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
  visaStatus: string | null;
  notes: string | null;
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
  userId: string | null;
  userName: string | null;
  userProfileImage: string | null;
  createdAt: Date;
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
  budget: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  counselorId: z.string().optional(),
});

export const insertStudentSchema = z.object({
  leadId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  academicBackground: z.string().optional(),
  englishProficiency: z.string().optional(),
  targetCountry: z.string().optional(),
  targetProgram: z.string().optional(),
  budget: z.string().optional(),
  status: z.string().default("active"),
  notes: z.string().optional(),
  counselorId: z.string().optional(),
});

export const insertApplicationSchema = z.object({
  studentId: z.string(),
  university: z.string().min(1, "University is required"),
  program: z.string().min(1, "Program is required"),
  degree: z.string().optional(),
  intakeYear: z.string().optional(),
  intakeSemester: z.string().optional(),
  applicationFee: z.string().optional(),
  status: z.string().default("draft"),
  notes: z.string().optional(),
  decisionDate: z.date().optional(),
});

export const insertAdmissionSchema = z.object({
  applicationId: z.number(),
  studentId: z.string(),
  university: z.string().min(1, "University is required"),
  program: z.string().min(1, "Program is required"),
  decision: z.string().min(1, "Decision is required"),
  decisionDate: z.date().optional(),
  scholarshipAmount: z.string().optional(),
  conditions: z.string().optional(),
  depositRequired: z.boolean().default(false),
  depositAmount: z.string().optional(),
  depositDeadline: z.date().optional(),
  visaStatus: z.string().default("pending"),
  notes: z.string().optional(),
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
  userId: z.string().optional(),
  userName: z.string().optional(),
  userProfileImage: z.string().optional(),
});

// Insert types for forms
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
