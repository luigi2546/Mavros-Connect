import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenantsTable } from "./tenants";
import { locationsTable } from "./locations";

export const routerStatusEnum = pgEnum("router_status", ["online", "offline", "unknown"]);

export const routersTable = pgTable("routers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id),
  locationId: integer("location_id").notNull().references(() => locationsTable.id),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  apiPort: integer("api_port").notNull().default(8728),
  username: text("username").notNull(),
  passwordEncrypted: text("password_encrypted").notNull(),
  status: routerStatusEnum("router_status").notNull().default("unknown"),
  model: text("model"),
  firmwareVersion: text("firmware_version"),
  lastSeen: timestamp("last_seen", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRouterSchema = createInsertSchema(routersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRouter = z.infer<typeof insertRouterSchema>;
export type Router = typeof routersTable.$inferSelect;
