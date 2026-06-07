import { Router, type IRouter } from "express";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import {
  db,
  networkMetricsTable,
  qosConfigTable,
  networkAlertsTable,
  routerHealthHistoryTable,
  bandwidthUsageTable,
  trafficBreakdownTable,
  connectedDevicesTable,
  routerConfigSnapshotsTable,
  routersTable,
} from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

// ════════════════════════════════════════════════════════════════════════════
// NETWORK METRICS - Real-time performance data
// ════════════════════════════════════════════════════════════════════════════

// GET /api/network/metrics - Get latest metrics for routers
router.get("/network/metrics", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const metrics = await db.select({
      id: networkMetricsTable.id,
      routerId: networkMetricsTable.routerId,
      uptime: networkMetricsTable.uptime,
      cpuUsage: networkMetricsTable.cpuUsage,
      memoryUsage: networkMetricsTable.memoryUsage,
      activeConnections: networkMetricsTable.activeConnections,
      totalBandwidth: networkMetricsTable.totalBandwidth,
      downloadSpeed: networkMetricsTable.downloadSpeed,
      uploadSpeed: networkMetricsTable.uploadSpeed,
      latency: networkMetricsTable.latency,
      packetLoss: networkMetricsTable.packetLoss,
      signalStrength: networkMetricsTable.signalStrength,
      clientCount: networkMetricsTable.clientCount,
      createdAt: networkMetricsTable.createdAt,
    })
      .from(networkMetricsTable)
      .where(eq(networkMetricsTable.tenantId, tenantId))
      .orderBy(desc(networkMetricsTable.createdAt))
      .limit(50);

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// GET /api/network/metrics/:routerId - Get metrics for specific router
router.get("/network/metrics/:routerId", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const routerId = parseInt(req.params.routerId, 10);
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const metrics = await db.select()
      .from(networkMetricsTable)
      .where(and(
        eq(networkMetricsTable.tenantId, tenantId),
        eq(networkMetricsTable.routerId, routerId),
      ))
      .orderBy(desc(networkMetricsTable.createdAt))
      .limit(100);

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching router metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// QoS CONFIGURATION - Quality of Service rules
// ════════════════════════════════════════════════════════════════════════════

// GET /api/network/qos - List QoS configurations
router.get("/network/qos", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const qosConfigs = await db.select()
      .from(qosConfigTable)
      .where(eq(qosConfigTable.tenantId, tenantId))
      .orderBy(desc(qosConfigTable.createdAt));

    res.json(qosConfigs);
  } catch (error) {
    console.error("Error fetching QoS configs:", error);
    res.status(500).json({ error: "Failed to fetch QoS configs" });
  }
});

// POST /api/network/qos - Create QoS configuration
router.post("/network/qos", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const { routerId, priorityLevel, bandwidthLimit, description, rules } = req.body;
    if (!routerId || !priorityLevel) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [qosConfig] = await db.insert(qosConfigTable)
      .values({
        routerId,
        tenantId,
        priorityLevel,
        bandwidthLimit: bandwidthLimit ? parseFloat(bandwidthLimit) : undefined,
        description,
        rules: rules || [],
        isActive: true,
      })
      .returning();

    res.status(201).json(qosConfig);
  } catch (error) {
    console.error("Error creating QoS config:", error);
    res.status(500).json({ error: "Failed to create QoS config" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// NETWORK ALERTS - Monitoring and notifications
// ════════════════════════════════════════════════════════════════════════════

// GET /api/network/alerts - List active/recent alerts
router.get("/network/alerts", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const alerts = await db.select()
      .from(networkAlertsTable)
      .where(eq(networkAlertsTable.tenantId, tenantId))
      .orderBy(desc(networkAlertsTable.createdAt))
      .limit(100);

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// PATCH /api/network/alerts/:id/resolve - Mark alert as resolved
router.patch("/network/alerts/:id/resolve", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const id = parseInt(req.params.id, 10);
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const [updated] = await db.update(networkAlertsTable)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(networkAlertsTable.id, id),
        eq(networkAlertsTable.tenantId, tenantId),
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ROUTER HEALTH - Historical status tracking
// ════════════════════════════════════════════════════════════════════════════

// GET /api/network/health - Get router health history
router.get("/network/health", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const health = await db.select()
      .from(routerHealthHistoryTable)
      .where(eq(routerHealthHistoryTable.tenantId, tenantId))
      .orderBy(desc(routerHealthHistoryTable.startTime))
      .limit(200);

    res.json(health);
  } catch (error) {
    console.error("Error fetching health history:", error);
    res.status(500).json({ error: "Failed to fetch health history" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// BANDWIDTH USAGE - Consumption tracking
// ════════════════════════════════════════════════════════════════════════════

// GET /api/network/bandwidth - Get bandwidth usage
router.get("/network/bandwidth", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const bandwidth = await db.select()
      .from(bandwidthUsageTable)
      .where(eq(bandwidthUsageTable.tenantId, tenantId))
      .orderBy(desc(bandwidthUsageTable.periodStart))
      .limit(60);

    res.json(bandwidth);
  } catch (error) {
    console.error("Error fetching bandwidth:", error);
    res.status(500).json({ error: "Failed to fetch bandwidth data" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// TRAFFIC BREAKDOWN - Protocol/app analysis
// ════════════════════════════════════════════════════════════════════════════

// GET /api/network/traffic - Get traffic breakdown
router.get("/network/traffic", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const traffic = await db.select()
      .from(trafficBreakdownTable)
      .where(eq(trafficBreakdownTable.tenantId, tenantId))
      .orderBy(desc(trafficBreakdownTable.timestamp))
      .limit(100);

    res.json(traffic);
  } catch (error) {
    console.error("Error fetching traffic breakdown:", error);
    res.status(500).json({ error: "Failed to fetch traffic data" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// CONNECTED DEVICES - Device tracking
// ════════════════════════════════════════════════════════════════════════════

// GET /api/network/devices - List connected devices
router.get("/network/devices", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const devices = await db.select()
      .from(connectedDevicesTable)
      .where(eq(connectedDevicesTable.tenantId, tenantId))
      .orderBy(desc(connectedDevicesTable.lastActivityAt))
      .limit(500);

    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

// GET /api/network/devices/:routerId - Get devices for router
router.get("/network/devices/:routerId", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const routerId = parseInt(req.params.routerId, 10);
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const devices = await db.select()
      .from(connectedDevicesTable)
      .where(and(
        eq(connectedDevicesTable.tenantId, tenantId),
        eq(connectedDevicesTable.routerId, routerId),
      ))
      .orderBy(desc(connectedDevicesTable.lastActivityAt));

    res.json(devices);
  } catch (error) {
    console.error("Error fetching router devices:", error);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ROUTER CONFIG SNAPSHOTS - Backup/restore
// ════════════════════════════════════════════════════════════════════════════

// GET /api/network/snapshots - List configuration snapshots
router.get("/network/snapshots", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const snapshots = await db.select()
      .from(routerConfigSnapshotsTable)
      .where(eq(routerConfigSnapshotsTable.tenantId, tenantId))
      .orderBy(desc(routerConfigSnapshotsTable.createdAt));

    res.json(snapshots);
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

// POST /api/network/snapshots - Create snapshot
router.post("/network/snapshots", authenticate, async (req, res): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const { routerId, snapshotName, configData, description, version } = req.body;
    if (!routerId || !snapshotName || !configData) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [snapshot] = await db.insert(routerConfigSnapshotsTable)
      .values({
        routerId,
        tenantId,
        snapshotName,
        configData,
        description,
        version,
        isActive: false,
        createdBy: userId,
      })
      .returning();

    res.status(201).json(snapshot);
  } catch (error) {
    console.error("Error creating snapshot:", error);
    res.status(500).json({ error: "Failed to create snapshot" });
  }
});

export default router;
