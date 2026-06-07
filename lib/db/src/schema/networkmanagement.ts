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
  serial,
} from "drizzle-orm/pg-core";
import { routersTable, tenantsTable, locationsTable } from "./index";

// Network performance metrics
export const networkMetricsTable = pgTable("network_metrics", {
  id: serial("id").primaryKey(),
  routerId: integer("router_id")
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  uptime: numeric("uptime", { precision: 5, scale: 2 }), // percentage
  cpuUsage: numeric("cpu_usage", { precision: 5, scale: 2 }), // percentage
  memoryUsage: numeric("memory_usage", { precision: 5, scale: 2 }), // percentage
  activeConnections: integer("active_connections"),
  totalBandwidth: numeric("total_bandwidth", { precision: 15, scale: 2 }), // in bytes
  downloadSpeed: numeric("download_speed", { precision: 10, scale: 2 }), // Mbps
  uploadSpeed: numeric("upload_speed", { precision: 10, scale: 2 }), // Mbps
  latency: numeric("latency", { precision: 10, scale: 2 }), // milliseconds
  packetLoss: numeric("packet_loss", { precision: 5, scale: 2 }), // percentage
  signalStrength: integer("signal_strength"), // -30 to -90 dBm for WiFi
  clientCount: integer("client_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// QoS (Quality of Service) configuration
export const qosConfigTable = pgTable("qos_config", {
  id: serial("id").primaryKey(),
  routerId: integer("router_id")
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  priorityLevel: varchar("priority_level", { length: 20 }).notNull(), // "high" | "medium" | "low"
  bandwidthLimit: numeric("bandwidth_limit", { precision: 10, scale: 2 }), // Mbps
  isActive: boolean("is_active").default(true),
  description: text("description"),
  rules: jsonb("rules").default("[]"), // Array of QoS rules
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Network alerts and warnings
export const networkAlertsTable = pgTable("network_alerts", {
  id: serial("id").primaryKey(),
  routerId: integer("router_id")
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // "high_cpu" | "low_memory" | "high_latency" | "packet_loss" | "offline"
  severity: varchar("severity", { length: 20 }).notNull(), // "critical" | "warning" | "info"
  message: text("message").notNull(),
  threshold: numeric("threshold", { precision: 10, scale: 2 }),
  currentValue: numeric("current_value", { precision: 10, scale: 2 }),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Router health status history
export const routerHealthHistoryTable = pgTable("router_health_history", {
  id: serial("id").primaryKey(),
  routerId: integer("router_id")
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull(), // "online" | "offline" | "degraded" | "warning"
  reason: text("reason"),
  previousStatus: varchar("previous_status", { length: 20 }),
  downtime: integer("downtime"), // seconds
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bandwidth usage tracking
export const bandwidthUsageTable = pgTable("bandwidth_usage", {
  id: serial("id").primaryKey(),
  routerId: integer("router_id")
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  uploadBytes: numeric("upload_bytes", { precision: 20, scale: 0 }),
  downloadBytes: numeric("download_bytes", { precision: 20, scale: 0 }),
  totalBytes: numeric("total_bytes", { precision: 20, scale: 0 }),
  peakUpload: numeric("peak_upload", { precision: 15, scale: 2 }), // Mbps
  peakDownload: numeric("peak_download", { precision: 15, scale: 2 }), // Mbps
  averageLatency: numeric("average_latency", { precision: 10, scale: 2 }), // ms
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Network traffic by application/protocol
export const trafficBreakdownTable = pgTable("traffic_breakdown", {
  id: serial("id").primaryKey(),
  routerId: integer("router_id")
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  protocol: varchar("protocol", { length: 50 }).notNull(), // "http" | "https" | "dns" | "ftp" | etc
  bytes: numeric("bytes", { precision: 20, scale: 0 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  packetCount: integer("packet_count"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Connected devices on network
export const connectedDevicesTable = pgTable("connected_devices", {
  id: serial("id").primaryKey(),
  routerId: integer("router_id")
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  deviceName: varchar("device_name", { length: 255 }),
  macAddress: varchar("mac_address", { length: 17 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  deviceType: varchar("device_type", { length: 50 }), // "phone" | "laptop" | "tablet" | "iot" | "unknown"
  signalStrength: integer("signal_strength"), // -30 to -90 dBm
  uploadSpeed: numeric("upload_speed", { precision: 10, scale: 2 }), // Mbps
  downloadSpeed: numeric("download_speed", { precision: 10, scale: 2 }), // Mbps
  connectionTime: timestamp("connection_time"),
  lastActivityAt: timestamp("last_activity_at"),
  isConnected: boolean("is_connected").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Router configuration snapshots (for backup/rollback)
export const routerConfigSnapshotsTable = pgTable("router_config_snapshots", {
  id: serial("id").primaryKey(),
  routerId: integer("router_id")
    .notNull()
    .references(() => routersTable.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  snapshotName: varchar("snapshot_name", { length: 255 }).notNull(),
  configData: jsonb("config_data").notNull(), // Full router configuration
  description: text("description"),
  version: varchar("version", { length: 50 }),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by"),
});
