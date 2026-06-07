import { pgTable, text, serial, timestamp, integer, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { usersTable } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "payment_success",
  "payment_failed",
  "voucher_expiring",
  "router_offline",
  "session_started",
  "low_balance",
  "system_alert",
]);

export const notificationStatusEnum = pgEnum("notification_status", ["unread", "read", "archived"]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  type: notificationTypeEnum("notification_type").notNull(),
  status: notificationStatusEnum("notification_status").notNull().default("unread"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  icon: text("icon"),
  metadata: text("metadata"), // JSON
  sentViaEmail: boolean("sent_via_email").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true, readAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;

// Alert preferences
export const notificationPreferencesTable = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  paymentNotifications: boolean("payment_notifications").default(true),
  voucherNotifications: boolean("voucher_notifications").default(true),
  routerAlerts: boolean("router_alerts").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferencesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;
