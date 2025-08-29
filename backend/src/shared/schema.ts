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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const students = mysqlTable("students", {
  id: int("id").primaryKey().autoincrement(),
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
});

export const applications = mysqlTable("applications", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id").notNull(),
  university: text("university").notNull(),
  program: text("program").notNull(),
  degree: text("degree"),
  intakeYear: text("intake_year"),
  intakeSemester: text("intake_semester"),
  applicationFee: text("application_fee"),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  decisionDate: timestamp("decision_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const admissions = mysqlTable("admissions", {
  id: int("id").primaryKey().autoincrement(),
  applicationId: int("application_id").notNull(),
  studentId: int("student_id").notNull(),
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
  notes: text("notes"),
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
}).partial({ id: true }); // id is optional since it will be generated

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;

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
  key: varchar("key", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
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
export type Dropdown = typeof dropdowns.$inferSelect;

export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Admission = typeof admissions.$inferSelect;
