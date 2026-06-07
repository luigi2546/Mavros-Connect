import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./main";
import { tenantsTable } from "./main";
import { locationsTable } from "./main";

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  permissions: jsonb("permissions").default(sql`'[]'`),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const staffMembersTable = pgTable("staff_members", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  roleId: integer("role_id")
    .notNull()
    .references(() => rolesTable.id, { onDelete: "cascade" }),
  department: varchar("department", { length: 100 }),
  title: varchar("title", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const staffAssignmentsTable = pgTable("staff_assignments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staffMembersTable.id, { onDelete: "cascade" }),
  locationId: integer("location_id")
    .notNull()
    .references(() => locationsTable.id, { onDelete: "cascade" }),
  responsibilities: text("responsibilities"),
  isPrimary: boolean("is_primary").default(false),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const approvalWorkflowsTable = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  workflowName: varchar("workflow_name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'equipment', 'budget', 'policy', etc.
  approvalSteps: jsonb("approval_steps").default(sql`'[]'`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const approvalRequestsTable = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  workflowId: integer("workflow_id")
    .notNull()
    .references(() => approvalWorkflowsTable.id, { onDelete: "cascade" }),
  requesterStaffId: integer("requester_staff_id")
    .notNull()
    .references(() => staffMembersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  requestData: jsonb("request_data"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  currentApproverStaffId: integer("current_approver_staff_id").references(
    () => staffMembersTable.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const permissionLogsTable = pgTable("permission_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staffMembersTable.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: integer("resource_id"),
  status: varchar("status", { length: 20 }), // success, denied
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const shiftSchedulesTable = pgTable("shift_schedules", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staffMembersTable.id, { onDelete: "cascade" }),
  locationId: integer("location_id")
    .notNull()
    .references(() => locationsTable.id, { onDelete: "cascade" }),
  shiftName: varchar("shift_name", { length: 100 }),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  daysOfWeek: jsonb("days_of_week").default(sql`'[]'`), // [0-6] for Mon-Sun
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const performanceMetricsTable = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staffMembersTable.id, { onDelete: "cascade" }),
  metricsData: jsonb("metrics_data"),
  tasksCompleted: integer("tasks_completed"),
  ticketsResolved: integer("tickets_resolved"),
  averageResponseTime: integer("average_response_time"), // in minutes
  satisfactionScore: integer("satisfaction_score"), // 1-5
  evaluationDate: timestamp("evaluation_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
