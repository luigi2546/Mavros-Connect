import {
  integer,
  varchar,
  boolean,
  timestamp,
  text,
  jsonb,
  pgTable,
  primaryKey,
} from "drizzle-orm/pg-core";
import { usersTable, tenantsTable } from "./index";

// User profiles with extended information
export const userProfilesTable = pgTable("user_profiles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  firstName: varchar(100),
  lastName: varchar(100),
  avatarUrl: varchar(500),
  bio: text(),
  phone: varchar(20),
  department: varchar(100),
  jobTitle: varchar(100),
  timezone: varchar(50).default("UTC"),
  language: varchar(10).default("en"),
  theme: varchar(20).default("light"),
  twoFactorEnabled: boolean().default(false),
  twoFactorSecret: varchar(255),
  twoFactorBackupCodes: jsonb().default("[]"),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Two-Factor Authentication codes
export const twoFactorCodesTable = pgTable("two_factor_codes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  code: varchar(10).notNull(),
  type: varchar(20).notNull(), // "email" | "sms"
  expiresAt: timestamp().notNull(),
  isUsed: boolean().default(false),
  usedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Security questions and answers for account recovery
export const securityQuestionsTable = pgTable("security_questions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  question: varchar(255).notNull().unique(),
  isActive: boolean().default(true),
  createdAt: timestamp().defaultNow().notNull(),
});

// User security question answers
export const userSecurityAnswersTable = pgTable("user_security_answers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  questionId: integer()
    .notNull()
    .references(() => securityQuestionsTable.id, { onDelete: "restrict" }),
  answerHash: varchar(255).notNull(), // bcrypt hashed answer
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Session and device tracking
export const deviceSessionsTable = pgTable("device_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  deviceName: varchar(255),
  deviceType: varchar(50), // "web" | "mobile" | "desktop" | "tablet"
  userAgent: text(),
  ipAddress: varchar(45),
  browser: varchar(100),
  os: varchar(100),
  isActive: boolean().default(true),
  lastActivityAt: timestamp(),
  loginAt: timestamp().defaultNow().notNull(),
  logoutAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Language translations cache
export const translationsTable = pgTable("translations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  language: varchar(10).notNull(),
  key: varchar(255).notNull(),
  value: text().notNull(),
  namespace: varchar(50).default("common"),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// User notification preferences by language
export const userPreferencesTable = pgTable("user_preferences", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  emailNotifications: boolean().default(true),
  smsNotifications: boolean().default(false),
  pushNotifications: boolean().default(true),
  marketingEmails: boolean().default(false),
  weeklyReport: boolean().default(true),
  dailyDigest: boolean().default(false),
  preferences: jsonb().default("{}"),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar(500).notNull().unique(),
  expiresAt: timestamp().notNull(),
  isUsed: boolean().default(false),
  usedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Account recovery attempts and tracking
export const accountRecoveryTable = pgTable("account_recovery", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  recoveryMethod: varchar(50).notNull(), // "email" | "security_questions" | "support"
  status: varchar(20).notNull().default("pending"), // "pending" | "verified" | "completed" | "failed"
  ipAddress: varchar(45),
  verificationCode: varchar(50),
  verificationCodeExpiresAt: timestamp(),
  completedAt: timestamp(),
  metadata: jsonb().default("{}"),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});
