import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenantsTable } from "./tenants";

export const businessReportsTable = pgTable("business_reports", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  reportName: varchar("report_name", { length: 255 }).notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(), // 'revenue', 'customer', 'operational', etc.
  description: text("description"),
  data: jsonb("data").default(sql`'{}'`),
  generatedAt: timestamp("generated_at").notNull(),
  generatedBy: integer("generated_by"),
  isScheduled: boolean("is_scheduled").default(false),
  scheduleFrequency: varchar("schedule_frequency", { length: 50 }), // 'daily', 'weekly', 'monthly'
  nextScheduledRun: timestamp("next_scheduled_run"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const businessMetricsTable = pgTable("business_metrics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  metricName: varchar("metric_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // 'revenue', 'customer', 'operational'
  value: numeric("value", { precision: 15, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  targetValue: numeric("target_value", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 20 }), // 'on-track', 'at-risk', 'exceeded'
  trend: varchar("trend", { length: 20 }), // 'up', 'down', 'stable'
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  metadata: jsonb("metadata").default(sql`'{}'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customerInsightsTable = pgTable("customer_insights", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  customerId: integer("customer_id"),
  segmentName: varchar("segment_name", { length: 100 }),
  insights: jsonb("insights").default(sql`'[]'`),
  churnRisk: varchar("churn_risk", { length: 20 }), // 'low', 'medium', 'high'
  lifetime: numeric("lifetime", { precision: 15, scale: 2 }),
  contactFrequency: integer("contact_frequency"),
  lastInteraction: timestamp("last_interaction"),
  recommendations: jsonb("recommendations").default(sql`'[]'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const revenueSummaryTable = pgTable("revenue_summary", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalRevenue: numeric("total_revenue", { precision: 15, scale: 2 }),
  subscriptionRevenue: numeric("subscription_revenue", { precision: 15, scale: 2 }),
  oneTimeRevenue: numeric("one_time_revenue", { precision: 15, scale: 2 }),
  refundsTotal: numeric("refunds_total", { precision: 15, scale: 2 }),
  netRevenue: numeric("net_revenue", { precision: 15, scale: 2 }),
  avgTransactionValue: numeric("avg_transaction_value", { precision: 15, scale: 2 }),
  transactionCount: integer("transaction_count"),
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const operationalMetricsTable = pgTable("operational_metrics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  systemUptime: numeric("system_uptime", { precision: 5, scale: 2 }),
  avgResponseTime: numeric("avg_response_time", { precision: 10, scale: 2 }),
  ticketResolutionTime: numeric("ticket_resolution_time", { precision: 10, scale: 2 }),
  customerSatisfaction: numeric("customer_satisfaction", { precision: 3, scale: 1 }),
  bugCount: integer("bug_count"),
  deploymentFrequency: integer("deployment_frequency"),
  failureRate: numeric("failure_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const competitorAnalysisTable = pgTable("competitor_analysis", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  competitorName: varchar("competitor_name", { length: 255 }).notNull(),
  marketShare: numeric("market_share", { precision: 5, scale: 2 }),
  pricePoint: numeric("price_point", { precision: 15, scale: 2 }),
  features: jsonb("features").default(sql`'[]'`),
  strengths: jsonb("strengths").default(sql`'[]'`),
  weaknesses: jsonb("weaknesses").default(sql`'[]'`),
  customerReviews: numeric("customer_reviews", { precision: 3, scale: 1 }),
  lastAnalyzed: timestamp("last_analyzed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const forecastsTable = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  forecastType: varchar("forecast_type", { length: 50 }).notNull(), // 'revenue', 'churn', 'growth'
  forecastData: jsonb("forecast_data").default(sql`'[]'`),
  confidenceLevel: numeric("confidence_level", { precision: 5, scale: 2 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  modelUsed: varchar("model_used", { length: 100 }),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketTrendsTable = pgTable("market_trends", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  trendName: varchar("trend_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  impact: varchar("impact", { length: 20 }), // 'high', 'medium', 'low'
  relevance: numeric("relevance", { precision: 5, scale: 2 }),
  trendData: jsonb("trend_data").default(sql`'[]'`),
  source: varchar("source", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const businessGoalsTable = pgTable("business_goals", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  goalName: varchar("goal_name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  targetValue: numeric("target_value", { precision: 15, scale: 2 }),
  currentValue: numeric("current_value", { precision: 15, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  status: varchar("status", { length: 20 }), // 'on-track', 'at-risk', 'completed'
  priority: varchar("priority", { length: 20 }), // 'high', 'medium', 'low'
  dueDate: timestamp("due_date"),
  owner: integer("owner"),
  progress: numeric("progress", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
