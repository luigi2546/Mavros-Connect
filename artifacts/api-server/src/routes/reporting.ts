// @ts-nocheck
import { Router, type IRouter } from "express";
import { eq, gte, lte, and, sql, desc } from "drizzle-orm";
import { db, paymentsTable, sessionsTable, vouchersTable, packagesTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

// ── Revenue trends by time period ──────────────────────────────────────
router.get("/analytics/revenue-trends/:period", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  
  const period = req.params.period as "daily" | "weekly" | "monthly";
  let dateFormat: string;
  let groupByExpr: any;
  
  switch (period) {
    case "daily":
      dateFormat = "YYYY-MM-DD";
      groupByExpr = sql`DATE(${paymentsTable.createdAt})`;
      break;
    case "weekly":
      dateFormat = "YYYY-IW";
      groupByExpr = sql`TO_CHAR(${paymentsTable.createdAt}, 'YYYY-IW')`;
      break;
    case "monthly":
      dateFormat = "YYYY-MM";
      groupByExpr = sql`TO_CHAR(${paymentsTable.createdAt}, 'YYYY-MM')`;
      break;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trends = await db.select({
    period: groupByExpr,
    revenue: sql<number>`SUM(CASE WHEN ${paymentsTable.status} = 'completed' THEN ${paymentsTable.amount} ELSE 0 END)`,
    transactionCount: sql<number>`COUNT(CASE WHEN ${paymentsTable.status} = 'completed' THEN 1 END)`,
    avgTransaction: sql<number>`AVG(CASE WHEN ${paymentsTable.status} = 'completed' THEN ${paymentsTable.amount} ELSE NULL END)`,
  })
    .from(paymentsTable)
    .where(and(eq(paymentsTable.tenantId, tenantId), gte(paymentsTable.createdAt, thirtyDaysAgo)))
    .groupBy(groupByExpr)
    .orderBy(groupByExpr);

  res.json(trends);
});

// ── Conversion rate by package ────────────────────────────────────────
router.get("/analytics/conversion-rates", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rates = await db.select({
    packageId: packagesTable.id,
    packageName: packagesTable.name,
    generatedVouchers: sql<number>`COUNT(DISTINCT ${vouchersTable.id})`,
    usedVouchers: sql<number>`COUNT(CASE WHEN ${vouchersTable.status} = 'used' THEN 1 END)`,
    conversionRate: sql<number>`ROUND(100.0 * COUNT(CASE WHEN ${vouchersTable.status} = 'used' THEN 1 END) / NULLIF(COUNT(DISTINCT ${vouchersTable.id}), 0), 2)`,
    avgTimeToConversion: sql<number>`AVG(EXTRACT(EPOCH FROM (${vouchersTable.usedAt} - ${vouchersTable.createdAt})) / 3600)`,
  })
    .from(packagesTable)
    .leftJoin(vouchersTable, and(
      eq(packagesTable.id, vouchersTable.packageId),
      eq(vouchersTable.tenantId, tenantId),
      gte(vouchersTable.createdAt, thirtyDaysAgo),
    ))
    .where(eq(packagesTable.tenantId, tenantId))
    .groupBy(packagesTable.id, packagesTable.name)
    .orderBy(desc(sql<number>`ROUND(100.0 * COUNT(CASE WHEN ${vouchersTable.status} = 'used' THEN 1 END) / NULLIF(COUNT(DISTINCT ${vouchersTable.id}), 0), 2)`));

  res.json(rates);
});

// ── Peak usage hours ──────────────────────────────────────────────────
router.get("/analytics/peak-usage-hours", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const peakHours = await db.select({
    hour: sql<number>`EXTRACT(HOUR FROM ${sessionsTable.startedAt})`,
    activeSessions: sql<number>`COUNT(CASE WHEN ${sessionsTable.status} = 'active' THEN 1 END)`,
    totalSessions: sql<number>`COUNT(*)`,
    totalDataUsed: sql<number>`SUM(${sessionsTable.bytesIn} + ${sessionsTable.bytesOut}) / 1024 / 1024`,
  })
    .from(sessionsTable)
    .where(eq(sessionsTable.tenantId, tenantId))
    .groupBy(sql`EXTRACT(HOUR FROM ${sessionsTable.startedAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${sessionsTable.startedAt})`);

  res.json(peakHours);
});

// ── Revenue forecast (simple linear regression) ────────────────────────
router.get("/analytics/revenue-forecast", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const historicalData = await db.select({
    date: sql<string>`DATE(${paymentsTable.createdAt})`,
    revenue: sql<number>`SUM(CASE WHEN ${paymentsTable.status} = 'completed' THEN ${paymentsTable.amount} ELSE 0 END)`,
  })
    .from(paymentsTable)
    .where(and(eq(paymentsTable.tenantId, tenantId), gte(paymentsTable.createdAt, sixtyDaysAgo)))
    .groupBy(sql`DATE(${paymentsTable.createdAt})`)
    .orderBy(sql`DATE(${paymentsTable.createdAt})`);

  // Simple linear regression for forecast
  const n = historicalData.length;
  if (n < 2) {
    res.json({ historical: historicalData, forecast: [] });
    return;
  }

  const sumX = historicalData.reduce((acc, _, i) => acc + i, 0);
  const sumY = historicalData.reduce((acc, d) => acc + (d.revenue || 0), 0);
  const sumXY = historicalData.reduce((acc, d, i) => acc + i * (d.revenue || 0), 0);
  const sumX2 = historicalData.reduce((acc, _, i) => acc + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const forecast = [];
  const lastDate = new Date(historicalData[n - 1].date);
  for (let i = 1; i <= 30; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    forecast.push({
      date: forecastDate.toISOString().split("T")[0],
      revenue: Math.max(0, intercept + slope * (n + i - 1)),
      isForecasted: true,
    });
  }

  res.json({ historical: historicalData, forecast });
});

// ── Cohort analysis (user retention) ──────────────────────────────────
router.get("/analytics/cohort-analysis", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const cohorts = await db.select({
    cohortMonth: sql<string>`TO_CHAR(${sessionsTable.startedAt}, 'YYYY-MM')`,
    usersCount: sql<number>`COUNT(DISTINCT ${sessionsTable.usedByMac})`,
    returnUsers: sql<number>`COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM ${sessionsTable} s2 WHERE s2.usedByMac = ${sessionsTable.usedByMac} AND EXTRACT(MONTH FROM s2.startedAt) > EXTRACT(MONTH FROM ${sessionsTable.startedAt})) THEN ${sessionsTable.usedByMac} END)`,
    totalRevenue: sql<number>`SUM(p.amount)`,
  })
    .from(sessionsTable)
    // Note: This is simplified for PostgreSQL; a full cohort analysis would be more complex
    .where(eq(sessionsTable.tenantId, tenantId))
    .groupBy(sql`TO_CHAR(${sessionsTable.startedAt}, 'YYYY-MM')`);

  res.json(cohorts);
});

export default router;
