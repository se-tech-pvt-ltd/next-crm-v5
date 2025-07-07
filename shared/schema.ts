import { pgTable, text, serial, integer, timestamp, boolean, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for role-based access control
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("counselor"), // counselor, branch_manager, admin_staff
  branchId: varchar("branch_id"), // for counselors and branch managers
  department: varchar("department"),
  phoneNumber: varchar("phone_number"),
  dateOfBirth: date("date_of_birth"),
  passwordHash: varchar("password_hash"), // hashed password for authentication
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  country: text("country"),
  program: text("program"),
  source: text("source"),
  status: text("status").notNull().default("new"),
  expectation: text("expectation"),
  type: text("type"),
  lostReason: text("lost_reason"),
  counselorId: text("counselor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
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
  counselorId: text("counselor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
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

export const admissions = pgTable("admissions", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  studentId: integer("student_id").references(() => students.id).notNull(),
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
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  country: z.union([z.string(), z.array(z.string())]).optional(),
  program: z.union([z.string(), z.array(z.string())]).optional(),
});

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

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // lead, student, application, admission
  entityId: integer("entity_id").notNull(),
  activityType: text("activity_type").notNull(), // created, updated, status_changed, comment, deleted, converted, application_created, admission_created
  title: text("title").notNull(),
  description: text("description"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  fieldName: text("field_name"),
  userId: text("user_id").references(() => users.id), // User who performed the action
  userName: text("user_name"), // For system actions, this can be "Next Bot"
  userProfileImage: text("user_profile_image"), // User's profile image URL
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Achievement system tables
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // leads, students, applications, admissions, general
  icon: text("icon").notNull(), // lucide icon name
  points: integer("points").notNull().default(10),
  requirement: integer("requirement").notNull().default(1), // number needed to unlock
  requirementType: text("requirement_type").notNull(), // count, streak, milestone
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  progress: integer("progress").notNull().default(0),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  leadsCreated: integer("leads_created").notNull().default(0),
  studentsConverted: integer("students_converted").notNull().default(0),
  applicationsSubmitted: integer("applications_submitted").notNull().default(0),
  admissionsReceived: integer("admissions_received").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: date("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;

export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Admission = typeof admissions.$inferSelect;
