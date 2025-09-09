import { mysqlTable, text, int, timestamp, boolean, varchar, date } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for role-based access control
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  role: text("role").notNull().default("counselor"), // counselor, branch_manager, admin_staff
  branchId: varchar("branch_id", { length: 255 }), // for counselors and branch managers
  department: varchar("department", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  passwordHash: varchar("password_hash", { length: 255 }), // hashed password for authentication
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  lostReason: text("lost_reason"),
  notes: text("notes"),
  counselorId: varchar("counselor_id", { length: 255 }),
  eventRegId: varchar("event_reg_id", { length: 255 }).nullable(),
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const students = mysqlTable("students", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
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
  counselorId: varchar("counselor_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  address: varchar("address", { length: 255 }),
  consultancyFree: boolean("consultancy_free").notNull(),
  scholarship: boolean("scholarship").notNull(),
  expectation: varchar("expectation", { length: 255 }).notNull(),
  eltTest: varchar("elt_test", { length: 255 }).notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const admissions = mysqlTable("admissions", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  applicationId: varchar("application_id", { length: 255 }).notNull(),
  studentId: varchar("student_id", { length: 255 }).notNull(),
  university: text("university").notNull(),
  program: text("program").notNull(),
  decision: text("decision").notNull(),
  decisionDate: timestamp("decision_date"),
  scholarshipAmount: text("scholarship_amount"),
  conditions: text("conditions"),
  depositRequired: boolean("deposit_required").default(false),
  depositAmount: text("deposit_amount"),
  depositDeadline: timestamp("deposit_deadline"),
  visaStatus: text("visa_status").default("pending"),
  admissionId: varchar("admission_id", { length: 255 }),
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
});

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
  userName: text("user_name"), // For system actions, this can be "Next Bot"
  userProfileImage: text("user_profile_image"), // User's profile image URL
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
