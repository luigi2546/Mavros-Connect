import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";

export const durationUnitEnum = pgEnum("duration_unit", ["minutes", "hours", "days", "weeks", "months"]);
export const packageStatusEnum = pgEnum("package_status", ["active", "inactive"]);

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("GHS"),
  duration: integer("duration").notNull(),
  durationUnit: durationUnitEnum("duration_unit").notNull().default("hours"),
  downloadSpeed: integer("download_speed"),
  uploadSpeed: integer("upload_speed"),
  dataCapMb: integer("data_cap_mb"),
  status: packageStatusEnum("package_status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPackageSchema = createInsertSchema(packagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packagesTable.$inferSelect;
