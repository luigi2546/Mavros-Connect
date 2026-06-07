import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { packagesTable } from "./packages";
import { vouchersTable } from "./vouchers";

export const paymentMethodEnum = pgEnum("payment_method", ["paystack", "momo", "cash", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  packageId: integer("package_id").notNull().references(() => packagesTable.id),
  voucherId: integer("voucher_id").references(() => vouchersTable.id),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("GHS"),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("payment_status").notNull().default("pending"),
  reference: text("reference").unique(),
  phone: text("phone"),
  email: text("email"),
  macAddress: text("mac_address"),
  webhookPayload: text("webhook_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
