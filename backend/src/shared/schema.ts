import { mysqlTable, text, int, timestamp, boolean, varchar, date, decimal, mysqlEnum, tinyint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
const PriorityEnum = mysqlEnum("priority", ["High", "Medium", "Low"]);
const CategoryEnum = mysqlEnum("category", ["UG", "PG", "Research", "Top up"]);
const NotificationStatusEnum = mysqlEnum("status", [
  "pending",
  "sent",
  "failed",
]);

export const notifications = mysqlTable("notifications", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  templateId: char("template_id", { length: 36 }).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  status: NotificationStatusEnum.default("pending").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const universityCourses = mysqlTable("university_courses", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  universityId: varchar("university_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: CategoryEnum.notNull(),
  fees: decimal("fees", { precision: 12, scale: 2 }),
  isTopCourse: tinyint("is_top_course").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const universityIntakes = mysqlTable("university_intakes", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  universityId: varchar("university_id", { length: 36 }).notNull(),
  intakeLabel: varchar("intake_label", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const universityAcceptedElts = mysqlTable("university_accepted_elts", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  universityId: varchar("university_id", { length: 36 }).notNull(),
  eltName: varchar("elt_name", { length: 128 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const universities = mysqlTable("universities", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 255 }),
  priority: PriorityEnum,
  about: text("about"),
  campusCity: varchar("campus_city", { length: 255 }),
  website: text("website"),
  totalFees: decimal("total_fees", { precision: 12, scale: 2 }),
  initialDepositAmount: decimal("initial_deposit_amount", { precision: 12, scale: 2 }),
  scholarshipFee: decimal("scholarship_fee", { precision: 12, scale: 2 }),
  meritScholarships: text("merit_scholarships"),
  ugEntryCriteria: text("ug_entry_criteria"),
  pgEntryCriteria: text("pg_entry_criteria"),
  eltRequirements: text("elt_requirements"),
  moiPolicy: text("moi"),
  studyGap: text("study_gap"),
  driveUrl: text("drive_url"),
  notes: text("notes"),

  coverImageUrl: text("cover_image_url").default(""), // 📌 Cover image URL
  logoImageUrl: text("logo_image_url").default(""),   // 📌 Logo image URL

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 36 }),
  updatedBy: varchar("updated_by", { length: 36 }),
});


// Attachments table (for uploaded files/images)
export const attachments = mysqlTable("attachments", {
  id: varchar("id", { length: 50 }).primaryKey().notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  createdOn: timestamp("created_on").defaultNow().notNull(),
  updatedOn: timestamp("updated_on").defaultNow().notNull(),
});

// Users table for role-based access control
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageId: varchar("profile_image_id", { length: 50 }),
  roleId: text("role_id").notNull(), // references user_roles.role_name or id
  departmentId: varchar("department_id", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 255 }), // hashed password for authentication
  isActive: boolean("is_active").notNull().default(true),
  isRegistrationEmailSent: boolean("is_registration_email_sent").notNull().default(true),
  isProfileComplete: boolean("is_profile_complete").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User departments table
export const userDepartments = mysqlTable("user_departments", {
  id: varchar("id", { length: 100 }).primaryKey().notNull(),
  departmentName: varchar("department_name", { length: 255 }).notNull(),
  createdOn: timestamp("created_on").defaultNow().notNull(),
  updatedOn: timestamp("updated_on").defaultNow().notNull(),
});

// User roles table
export const userRoles = mysqlTable("user_roles", {
  id: varchar("id", { length: 100 }).primaryKey().notNull(),
  roleName: varchar("role_name", { length: 255 }).notNull(),
  departmentId: varchar("department_id", { length: 255 }).notNull(),
  createdOn: timestamp("created_on").defaultNow().notNull(),
  updatedOn: timestamp("updated_on").defaultNow().notNull(),
});

// Role access controls table
export const userAccess = mysqlTable("user_access", {
  id: varchar("id", { length: 100 }).primaryKey().notNull(),
  moduleName: varchar("module_name", { length: 255 }).notNull(),
  roleId: varchar("role_id", { length: 100 }).notNull(),
  viewLevel: varchar("view_level", { length: 255 }).notNull(),
  canCreate: boolean("can_create").notNull().default(false),
  canEdit: boolean("can_edit").notNull().default(false),
  createdOn: timestamp("created_on").defaultNow().notNull(),
  updatedOn: timestamp("updated_on").defaultNow().notNull(),
});

export const insertUserAccessSchema = createInsertSchema(userAccess).omit({
  createdOn: true,
  updatedOn: true,
}).partial({ id: true });

export type UserAccess = typeof userAccess.$inferSelect;
export type InsertUserAccess = z.infer<typeof insertUserAccessSchema>;

// Insert schemas for departments and roles
export const insertUserDepartmentSchema = createInsertSchema(userDepartments).omit({
  createdOn: true,
  updatedOn: true,
}).partial({ id: true });

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  createdOn: true,
  updatedOn: true,
}).partial({ id: true });

// Types
export type UserDepartment = typeof userDepartments.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserDepartment = z.infer<typeof insertUserDepartmentSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

export const leads = mysqlTable("leads", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city"),
  country: text("country"),
  program: text("program"),
  source: text("source"),
  status: text("status").notNull().default("new"),
  expectation: text("expectation"),
  type: text("type"),
  studyLevel: text("study_level"),
  studyPlan: text("study_plan"),
  elt: text("elt"),
  isLost: tinyint("is_lost").default(0),
  lostReason: text("lost_reason"),
  isLost: tinyint("is_lost").default(0),
  notes: text("notes"),
  counselorId: varchar("counsellor_id", { length: 255 }),
  admissionOfficerId: varchar("admission_officer_id", { length: 50 }),
  eventRegId: varchar("event_reg_id", { length: 255 }),
  branchId: varchar("branch_id", { length: 255 }),
  regionId: varchar("region_id", { length: 50 }),
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const students = mysqlTable("students", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  studentId: varchar("student_id", { length: 50 }).notNull(),
  leadId: varchar("lead_id", { length: 255 }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  nationality: text("nationality"),
  passportNumber: text("passport_number"),
  academicBackground: text("academic_background"),
  englishProficiency: text("english_proficiency"),
  targetCountry: text("target_country"),
  targetProgram: text("target_program"),
  budget: text("budget"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  address: varchar("address", { length: 255 }),
  consultancyFree: boolean("consultancy_free").notNull(),
  scholarship: boolean("scholarship").notNull(),
  expectation: varchar("expectation", { length: 255 }).notNull(),
  eltTest: varchar("elt_test", { length: 255 }).notNull(),

  // ✅ corrected/added fields
  branchId: varchar("branch_id", { length: 255 }),
  regionId: varchar("region_id", { length: 50 }),
  counsellorId: varchar("counsellor_id", { length: 50 }),
  admissionOfficerId: varchar("admission_officer_id", { length: 50 }),
});


export const applications = mysqlTable("applications", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  applicationCode: varchar("application_code", { length: 255 }),
  studentId: varchar("student_id", { length: 255 }).notNull(),
  university: text("university").notNull(),
  program: text("program").notNull(),
  courseType: text("course_type"),
  appStatus: text("app_status").notNull().default("Open"),
  caseStatus: text("case_status").default("Raw"),
  country: text("country"),
  channelPartner: text("channel_partner"),
  intake: text("intake"),
  googleDriveLink: text("google_drive_link"),
  notes: text("notes"),
  branchId: varchar("branch_id", { length: 255 }),
  regionId: varchar("region_id", { length: 50 }),
  counsellorId: varchar("counsellor_id", { length: 50 }),
  admissionOfficerId: varchar("admission_officer_id", { length: 50 }),
  universityId: varchar("university_id", { length: 50 }),
  courseId: varchar("course_id", { length: 50 }),
  intakeId: varchar("intake_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const admissions = mysqlTable("admissions", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  applicationId: varchar("application_id", { length: 255 }).notNull(),
  studentId: varchar("student_id", { length: 255 }).notNull(),
  university: text("university").notNull(),
  program: text("program").notNull(),
  scholarshipAmount: text("scholarship_amount"),
  admissionId: varchar("admission_id", { length: 255 }),
  branchId: varchar("branch_id", { length: 255 }),
  regionId: varchar("region_id", { length: 50 }),
  counsellorId: varchar("counsellor_id", { length: 50 }),
  admissionOfficerId: varchar("admission_officer_id", { length: 50 }),

  // Tuition and important dates
  fullTuitionFee: text("full_tuition_fee"),
  netTuitionFee: text("net_tuition_fee"),
  initialDeposit: text("initial_deposit"),
  depositDate: timestamp("deposit_date"),
  visaDate: timestamp("visa_date"),

  // Extra fields
  status: text("status"),
  caseStatus: text("case_status"),
  googleDriveLink: text("google_drive_link"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Events module
export const events = mysqlTable("events", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  date: date("date").notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  time: varchar("time", { length: 50 }).notNull(),
  branchId: varchar("branch_id", { length: 255 }),
  regionId: varchar("region_id", { length: 50 }),
  counsellorId: varchar("counsellor_id", { length: 50 }),
  admissionOfficerId: varchar("admission_officer_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventRegistrations = mysqlTable("event_registrations", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  registrationCode: varchar("registration_code", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  number: varchar("number", { length: 50 }),
  email: varchar("email", { length: 255 }),
  city: varchar("city", { length: 255 }),
  source: varchar("source", { length: 255 }),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  isConverted: int("is_converted").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  passwordHash: true, // Password is handled separately for security
}).extend({
  isActive: z.boolean().optional(),
  isRegistrationEmailSent: z.boolean().optional(),
  isProfileComplete: z.boolean().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
}).partial({ id: true });

export const insertLeadSchema = createInsertSchema(leads).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  country: z.union([z.string(), z.array(z.string())]).optional(),
  program: z.union([z.string(), z.array(z.string())]).optional(),
  eventRegId: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
}).partial({ id: true }); // id is optional since it will be generated

export const insertStudentSchema = createInsertSchema(students).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  address: z.string().optional(),
  consultancyFree: z.boolean().optional(),
  scholarship: z.boolean().optional(),
  expectation: z.string().optional(),
  eltTest: z.string().optional(),
  studentId: z.string().optional(),
}).partial({ id: true });

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdmissionSchema = createInsertSchema(admissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  decisionDate: z.union([z.string(), z.date()]).optional().transform((v) => {
    if (v instanceof Date) return v;
    if (!v) return undefined;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date format');
    return d;
  }),
  depositDeadline: z.union([z.string(), z.date()]).optional().transform((v) => {
    if (v instanceof Date) return v;
    if (!v) return undefined;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date format');
    return d;
  }),
  depositDate: z.union([z.string(), z.date()]).optional().transform((v) => {
    if (v instanceof Date) return v;
    if (!v) return undefined;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date format');
    return d;
  }),
  visaDate: z.union([z.string(), z.date()]).optional().transform((v) => {
    if (v instanceof Date) return v;
    if (!v) return undefined;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date format');
    return d;
  }),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform((v) => {
    if (v instanceof Date) return v;
    const d = new Date(v as string);
    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date format');
    }
    return d;
  }),
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registrationCode: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.string().min(1, 'Status is required'),
  name: z.string().min(1, 'Name is required'),
  number: z.string().min(1, 'Number is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  city: z.string().min(1, 'City is required'),
  source: z.string().min(1, 'Source is required'),
  eventId: z.string().min(1, 'Event is required'),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export const activities = mysqlTable("activities", {
  id: int("id").primaryKey().autoincrement(),
  entityType: text("entity_type").notNull(), // lead, student, application, admission
  entityId: varchar("entity_id", { length: 255 }).notNull(), // supports both string UUIDs and number IDs
  activityType: text("activity_type").notNull(), // created, updated, status_changed, comment, deleted, converted, application_created, admission_created
  title: text("title").notNull(),
  description: text("description"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  fieldName: text("field_name"),
  userId: varchar("user_id", { length: 255 }), // User who performed the action
  createdAt: timestamp("created_at").defaultNow(),
});

export const dropdowns = mysqlTable("dropdown", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  moduleName: varchar("module_name", { length: 255 }).notNull(),
  fieldName: varchar("field_name", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  sequence: int("sequence"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
}).extend({
  entityId: z.union([z.string(), z.number()]).transform(String), // Accept both but convert to string
});

export const insertDropdownSchema = createInsertSchema(dropdowns);

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertDropdown = z.infer<typeof insertDropdownSchema>;
export type Dropdown = typeof dropdowns.$inferSelect & { key?: string };

export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Admission = typeof admissions.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type University = typeof universities.$inferSelect;
export type UniversitySummary = Pick<University, "id" | "name" | "country" | "website" | "coverImageUrl" | "logoImageUrl">;
 export type UniversityDetail = {
  overview: {
    id: string;
    name: string;
    website: string | null;
    coverImageUrl: string | null;
    logoImageUrl: string | null;
    about: string | null;
    campusCity: string | null;
  };
  feesAndFunding: {
    totalFees: number | null;
    initialDepositAmount: number | null;
    scholarshipFee: number | null;
    meritScholarships: string | null;
  };
  admissionRequirements: {
    ugEntryCriteria: string | null;
    pgEntryCriteria: string | null;
    eltRequirements: string | null;
    moiPolicy: string | null;
    studyGap: string | null;
    priority: "High" | "Medium" | "Low" | null;
    intakes: string[];
    acceptedElts: string[];
  };
  resources: {
    driveUrl: string | null;
    notes: string | null;
  };
  courses: {
    id: string;
    name: string;
    category: string;
    fees: number | null;
    isTopCourse: boolean;
  }[];
};
export type UniversityCourse = typeof universityCourses.$inferSelect;
export type UniversityIntake = typeof universityIntakes.$inferSelect;
export type UniversityAcceptedElt = typeof universityAcceptedElts.$inferSelect;
// Branch employees table (renamed from user_link)
export const branchEmps = mysqlTable("branch_emps", {
  id: varchar("id", { length: 50 }).primaryKey().notNull(),
  branchId: varchar("branch_id", { length: 50 }).notNull(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  createdOn: timestamp("created_on").defaultNow().notNull(),
  updatedOn: timestamp("updated_on").defaultNow().notNull(),
});

export const insertBranchEmpSchema = createInsertSchema(branchEmps).omit({
  createdOn: true,
  updatedOn: true,
}).partial({ id: true });

export type BranchEmp = typeof branchEmps.$inferSelect;
export type InsertBranchEmp = z.infer<typeof insertBranchEmpSchema>;
