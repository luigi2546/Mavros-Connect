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
import { tenantsTable } from "./tenants";

export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  keyName: varchar("key_name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  description: text("description"),
  scopes: jsonb("scopes").default(sql`'[]'`),
  rateLimit: integer("rate_limit").default(1000),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

export const webhooksTable = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 2048 }).notNull(),
  events: jsonb("events").default(sql`'[]'`),
  description: text("description"),
  secret: varchar("secret", { length: 255 }),
  isActive: boolean("is_active").default(true),
  retryCount: integer("retry_count").default(3),
  retryDelay: integer("retry_delay").default(60),
  headers: jsonb("headers").default(sql`'{}'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const webhookLogsTable = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  webhookId: integer("webhook_id")
    .notNull()
    .references(() => webhooksTable.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload"),
  statusCode: integer("status_code"),
  responseBody: text("response_body"),
  attempt: integer("attempt").default(1),
  nextRetryAt: timestamp("next_retry_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const integrationsTable = pgTable("integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  serviceType: varchar("service_type", { length: 100 }).notNull(), // 'slack', 'stripe', 'salesforce', etc.
  description: text("description"),
  config: jsonb("config").default(sql`'{}'`),
  credentials: jsonb("credentials").default(sql`'{}'`),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: varchar("sync_status", { length: 50 }), // 'success', 'failed', 'pending'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const integrationEventsTable = pgTable("integration_events", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  integrationId: integer("integration_id")
    .notNull()
    .references(() => integrationsTable.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data"),
  status: varchar("status", { length: 50 }), // 'processed', 'failed', 'pending'
  errorDetails: text("error_details"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiDocumentationTable = pgTable("api_documentation", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  endpointPath: varchar("endpoint_path", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }), // 'GET', 'POST', 'PUT', 'DELETE'
  description: text("description"),
  parameters: jsonb("parameters").default(sql`'[]'`),
  requestBody: jsonb("request_body"),
  responseBody: jsonb("response_body"),
  examples: jsonb("examples").default(sql`'[]'`),
  deprecatedAt: timestamp("deprecated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const oauthAppsTable = pgTable("oauth_apps", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  appName: varchar("app_name", { length: 255 }).notNull(),
  description: text("description"),
  clientId: varchar("client_id", { length: 255 }).notNull().unique(),
  clientSecret: varchar("client_secret", { length: 255 }).notNull(),
  redirectUris: jsonb("redirect_uris").default(sql`'[]'`),
  scopes: jsonb("scopes").default(sql`'[]'`),
  isActive: boolean("is_active").default(true),
  rateLimit: integer("rate_limit").default(5000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const oauthTokensTable = pgTable("oauth_tokens", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  oauthAppId: integer("oauth_app_id")
    .notNull()
    .references(() => oauthAppsTable.id, { onDelete: "cascade" }),
  accessToken: varchar("access_token", { length: 500 }).notNull().unique(),
  refreshToken: varchar("refresh_token", { length: 500 }),
  expiresAt: timestamp("expires_at"),
  grantedScopes: jsonb("granted_scopes").default(sql`'[]'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiRateLimitsTable = pgTable("api_rate_limits", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  apiKeyId: integer("api_key_id").references(() => apiKeysTable.id, {
    onDelete: "cascade",
  }),
  requestsPerSecond: integer("requests_per_second").default(10),
  requestsPerDay: integer("requests_per_day").default(100000),
  currentRequestCount: integer("current_request_count").default(0),
  resetAt: timestamp("reset_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
