import { Router, type IRouter } from "express";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db, sessionsTable, vouchersTable, packagesTable, routersTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

// ── Top packages by sales (Quick Win #1) ─────────────────────────────────
router.get("/analytics/top-packages", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const topPackages = await db.select({
    packageId: vouchersTable.packageId,
    packageName: packagesTable.name,
    packagePrice: packagesTable.price,
    usedCount: sql<number>`COUNT(CASE WHEN ${vouchersTable.status} = 'used' THEN 1 END)`,
    generatedCount: sql<number>`COUNT(*)`,
    revenue: sql<number>`SUM(CASE WHEN ${vouchersTable.status} = 'used' THEN ${packagesTable.price} ELSE 0 END)`,
  })
    .from(vouchersTable)
    .innerJoin(packagesTable, eq(vouchersTable.packageId, packagesTable.id))
    .where(eq(vouchersTable.tenantId, tenantId))
    .groupBy(vouchersTable.packageId, packagesTable.name, packagesTable.price)
    .orderBy(desc(sql<number>`COUNT(CASE WHEN ${vouchersTable.status} = 'used' THEN 1 END)`))
    .limit(10);

  res.json(topPackages);
});

// ── Session analytics (Quick Win #2) ─────────────────────────────────────
router.get("/analytics/session-stats", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await db.select({
    totalSessions: sql<number>`COUNT(*)`,
    avgSessionDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (COALESCE(${sessionsTable.endedAt}, NOW()) - ${sessionsTable.startedAt})))`,
    avgDataUsed: sql<number>`AVG((${sessionsTable.bytesIn} + ${sessionsTable.bytesOut}) / 1024 / 1024)`, // in MB
    totalDataUsed: sql<number>`SUM(${sessionsTable.bytesIn} + ${sessionsTable.bytesOut}) / 1024 / 1024`, // in MB
  })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.tenantId, tenantId), gte(sessionsTable.startedAt, thirtyDaysAgo)));

  res.json(stats[0] || { totalSessions: 0, avgSessionDuration: 0, avgDataUsed: 0, totalDataUsed: 0 });
});

// ── Voucher expiry alerts (Quick Win #4) ────────────────────────────────
router.get("/analytics/expiring-vouchers", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const now = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const expiringVouchers = await db.select({
    id: vouchersTable.id,
    code: vouchersTable.code,
    packageName: packagesTable.name,
    expiresAt: vouchersTable.expiresAt,
    status: vouchersTable.status,
    daysUntilExpiry: sql<number>`EXTRACT(DAY FROM ${vouchersTable.expiresAt} - NOW())`,
  })
    .from(vouchersTable)
    .innerJoin(packagesTable, eq(vouchersTable.packageId, packagesTable.id))
    .where(and(
      eq(vouchersTable.tenantId, tenantId),
      eq(vouchersTable.status, "unused"),
      gte(vouchersTable.expiresAt, now),
      lte(vouchersTable.expiresAt, sevenDaysLater),
    ))
    .orderBy(vouchersTable.expiresAt);

  res.json(expiringVouchers);
});

// ── Router health status (Quick Win #3) ────────────────────────────────
router.get("/analytics/router-health", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const routerHealth = await db.select({
    id: routersTable.id,
    name: routersTable.name,
    status: routersTable.status,
    lastSeen: routersTable.lastSeen,
    activeSessions: sql<number>`(SELECT COUNT(*) FROM ${sessionsTable} WHERE ${sessionsTable.routerId} = ${routersTable.id} AND ${sessionsTable.status} = 'active')`,
  })
    .from(routersTable)
    .where(eq(routersTable.tenantId, tenantId))
    .orderBy(routersTable.name);

  res.json(routerHealth);
});

// ── Package performance (Quick Win #7) ──────────────────────────────────
router.get("/analytics/package-performance", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const performance = await db.select({
    packageId: packagesTable.id,
    packageName: packagesTable.name,
    totalVouchers: sql<number>`COUNT(${vouchersTable.id})`,
    usedVouchers: sql<number>`COUNT(CASE WHEN ${vouchersTable.status} = 'used' THEN 1 END)`,
    conversionRate: sql<number>`ROUND(100.0 * COUNT(CASE WHEN ${vouchersTable.status} = 'used' THEN 1 END) / NULLIF(COUNT(${vouchersTable.id}), 0))`,
    revenue: sql<number>`SUM(CASE WHEN ${vouchersTable.status} = 'used' THEN ${packagesTable.price} ELSE 0 END)`,
  })
    .from(packagesTable)
    .leftJoin(vouchersTable, and(
      eq(packagesTable.id, vouchersTable.packageId),
      eq(vouchersTable.tenantId, tenantId),
      gte(vouchersTable.createdAt, thirtyDaysAgo),
    ))
    .where(eq(packagesTable.tenantId, tenantId))
    .groupBy(packagesTable.id, packagesTable.name);

  res.json(performance);
});

export default router;
