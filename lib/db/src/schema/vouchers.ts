import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { packagesTable } from "./packages";
import { locationsTable } from "./locations";

export const voucherStatusEnum = pgEnum("voucher_status", ["unused", "active", "used", "expired", "revoked"]);

export const vouchersTable = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  packageId: integer("package_id").notNull().references(() => packagesTable.id),
  locationId: integer("location_id").references(() => locationsTable.id),
  code: text("code").notNull().unique(),
  status: voucherStatusEnum("voucher_status").notNull().default("unused"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  usedAt: timestamp("used_at", { withTimezone: true }),
  usedByMac: text("used_by_mac"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVoucherSchema = createInsertSchema(vouchersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = typeof vouchersTable.$inferSelect;
