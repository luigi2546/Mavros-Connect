import {
  integer,
  varchar,
  boolean,
  timestamp,
  text,
  numeric,
  real,
  jsonb,
  pgTable,
  index,
} from "drizzle-orm/pg-core";
import { routersTable, tenantsTable, locationsTable } from "./index";

// Network performance metrics
export const networkMetricsTable = pgTable("network_metrics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routerId: integer()
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  uptime: numeric({ precision: 5, scale: 2 }), // percentage
  cpuUsage: numeric({ precision: 5, scale: 2 }), // percentage
  memoryUsage: numeric({ precision: 5, scale: 2 }), // percentage
  activeConnections: integer(),
  totalBandwidth: numeric({ precision: 15, scale: 2 }), // in bytes
  downloadSpeed: numeric({ precision: 10, scale: 2 }), // Mbps
  uploadSpeed: numeric({ precision: 10, scale: 2 }), // Mbps
  latency: numeric({ precision: 10, scale: 2 }), // milliseconds
  packetLoss: numeric({ precision: 5, scale: 2 }), // percentage
  signalStrength: integer(), // -30 to -90 dBm for WiFi
  clientCount: integer(),
  createdAt: timestamp().defaultNow().notNull(),
});

// QoS (Quality of Service) configuration
export const qosConfigTable = pgTable("qos_config", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routerId: integer()
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  priorityLevel: varchar(20).notNull(), // "high" | "medium" | "low"
  bandwidthLimit: numeric({ precision: 10, scale: 2 }), // Mbps
  isActive: boolean().default(true),
  description: text(),
  rules: jsonb().default("[]"), // Array of QoS rules
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Network alerts and warnings
export const networkAlertsTable = pgTable("network_alerts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routerId: integer()
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  alertType: varchar(50).notNull(), // "high_cpu" | "low_memory" | "high_latency" | "packet_loss" | "offline"
  severity: varchar(20).notNull(), // "critical" | "warning" | "info"
  message: text().notNull(),
  threshold: numeric({ precision: 10, scale: 2 }),
  currentValue: numeric({ precision: 10, scale: 2 }),
  isResolved: boolean().default(false),
  resolvedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Router health status history
export const routerHealthHistoryTable = pgTable("router_health_history", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routerId: integer()
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  status: varchar(20).notNull(), // "online" | "offline" | "degraded" | "warning"
  reason: text(),
  previousStatus: varchar(20),
  downtime: integer(), // seconds
  startTime: timestamp().notNull(),
  endTime: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Bandwidth usage tracking
export const bandwidthUsageTable = pgTable("bandwidth_usage", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routerId: integer()
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  periodStart: timestamp().notNull(),
  periodEnd: timestamp().notNull(),
  uploadBytes: numeric({ precision: 20, scale: 0 }),
  downloadBytes: numeric({ precision: 20, scale: 0 }),
  totalBytes: numeric({ precision: 20, scale: 0 }),
  peakUpload: numeric({ precision: 15, scale: 2 }), // Mbps
  peakDownload: numeric({ precision: 15, scale: 2 }), // Mbps
  averageLatency: numeric({ precision: 10, scale: 2 }), // ms
  createdAt: timestamp().defaultNow().notNull(),
});

// Network traffic by application/protocol
export const trafficBreakdownTable = pgTable("traffic_breakdown", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routerId: integer()
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  protocol: varchar(50).notNull(), // "http" | "https" | "dns" | "ftp" | etc
  bytes: numeric({ precision: 20, scale: 0 }).notNull(),
  percentage: numeric({ precision: 5, scale: 2 }).notNull(),
  packetCount: integer(),
  timestamp: timestamp().defaultNow().notNull(),
});

// Connected devices on network
export const connectedDevicesTable = pgTable("connected_devices", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routerId: integer()
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  deviceName: varchar(255),
  macAddress: varchar(17).notNull(),
  ipAddress: varchar(45),
  deviceType: varchar(50), // "phone" | "laptop" | "tablet" | "iot" | "unknown"
  signalStrength: integer(), // -30 to -90 dBm
  uploadSpeed: numeric({ precision: 10, scale: 2 }), // Mbps
  downloadSpeed: numeric({ precision: 10, scale: 2 }), // Mbps
  connectionTime: timestamp(),
  lastActivityAt: timestamp(),
  isConnected: boolean().default(true),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Router configuration snapshots (for backup/rollback)
export const routerConfigSnapshotsTable = pgTable("router_config_snapshots", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  routerId: integer()
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer()
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  snapshotName: varchar(255).notNull(),
  configData: jsonb().notNull(), // Full router configuration
  description: text(),
  version: varchar(50),
  isActive: boolean().default(false),
  createdAt: timestamp().defaultNow().notNull(),
  createdBy: integer(),
});

// Create indexes
index("idx_network_metrics_router").on(networkMetricsTable.routerId);
index("idx_network_metrics_tenant").on(networkMetricsTable.tenantId);
index("idx_qos_config_router").on(qosConfigTable.routerId);
index("idx_network_alerts_router").on(networkAlertsTable.routerId);
index("idx_network_alerts_severity").on(networkAlertsTable.severity);
index("idx_router_health_router").on(routerHealthHistoryTable.routerId);
index("idx_bandwidth_usage_router").on(bandwidthUsageTable.routerId);
index("idx_bandwidth_usage_period").on(bandwidthUsageTable.periodStart);
index("idx_traffic_breakdown_router").on(trafficBreakdownTable.routerId);
index("idx_connected_devices_router").on(connectedDevicesTable.routerId);
index("idx_connected_devices_mac").on(connectedDevicesTable.macAddress);
