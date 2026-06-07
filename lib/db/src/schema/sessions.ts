import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { locationsTable } from "./locations";
import { routersTable } from "./routers";
import { vouchersTable } from "./vouchers";
import { paymentsTable } from "./payments";

export const sessionStatusEnum = pgEnum("session_status", ["active", "ended", "expired"]);

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  locationId: integer("location_id").references(() => locationsTable.id),
  routerId: integer("router_id").references(() => routersTable.id),
  voucherId: integer("voucher_id").references(() => vouchersTable.id),
  paymentId: integer("payment_id").references(() => paymentsTable.id),
  macAddress: text("mac_address").notNull(),
  ipAddress: text("ip_address"),
  username: text("username"),
  bytesIn: integer("bytes_in").notNull().default(0),
  bytesOut: integer("bytes_out").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  status: sessionStatusEnum("session_status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
