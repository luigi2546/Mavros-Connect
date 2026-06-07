import {
  integer,
  varchar,
  boolean,
  timestamp,
  text,
  jsonb,
  pgTable,
  serial,
} from "drizzle-orm/pg-core";
import { usersTable, tenantsTable } from "./index";

// User profiles
export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  avatar: varchar("avatar", { length: 500 }),
  bio: text("bio"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  timeZone: varchar("time_zone", { length: 50 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),
  preferredTheme: varchar("preferred_theme", { length: 20 }).default("light"), // "light" | "dark" | "system"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Two-Factor Authentication codes
export const twoFactorCodesTable = pgTable("two_factor_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 10 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "email" | "sms"
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security questions and answers for account recovery
export const securityQuestionsTable = pgTable("security_questions", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User security question answers
export const userSecurityAnswersTable = pgTable("user_security_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => securityQuestionsTable.id, { onDelete: "restrict" }),
  answerHash: varchar("answer_hash", { length: 255 }).notNull(), // bcrypt hashed answer
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session and device tracking
export const deviceSessionsTable = pgTable("device_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  deviceName: varchar("device_name", { length: 255 }),
  deviceType: varchar("device_type", { length: 50 }), // "web" | "mobile" | "desktop" | "tablet"
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  isActive: boolean("is_active").default(true),
  lastActivityAt: timestamp("last_activity_at"),
  loginAt: timestamp("login_at").defaultNow().notNull(),
  logoutAt: timestamp("logout_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Language translations cache
export const translationsTable = pgTable("translations", {
  id: serial("id").primaryKey(),
  language: varchar("language", { length: 10 }).notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(),
  namespace: varchar("namespace", { length: 50 }).default("common"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User notification preferences by language
export const userPreferencesTable = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
  weeklyReport: boolean("weekly_report").default(true),
  dailyDigest: boolean("daily_digest").default(false),
  preferences: jsonb("preferences").default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 500 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Account recovery attempts and tracking
export const accountRecoveryTable = pgTable("account_recovery", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  recoveryMethod: varchar("recovery_method", { length: 50 }).notNull(), // "email" | "security_questions" | "support"
  status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending" | "verified" | "completed" | "failed"
  ipAddress: varchar("ip_address", { length: 45 }),
  verificationCode: varchar("verification_code", { length: 50 }),
  verificationCodeExpiresAt: timestamp("verification_code_expires_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
