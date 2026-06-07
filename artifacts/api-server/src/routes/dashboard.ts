import { Router, type IRouter } from "express";
import { eq, and, gte, count, sum, sql } from "drizzle-orm";
import { db, paymentsTable, vouchersTable, sessionsTable, routersTable, locationsTable, usersTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

router.get("/dashboard/stats", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalRevenueRow] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(and(eq(paymentsTable.tenantId, tenantId), eq(paymentsTable.status, "completed")));
  const [todayRevenueRow] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(and(eq(paymentsTable.tenantId, tenantId), eq(paymentsTable.status, "completed"), gte(paymentsTable.createdAt, today)));
  const [totalVouchersRow] = await db.select({ total: count() }).from(vouchersTable).where(eq(vouchersTable.tenantId, tenantId));
  const [usedVouchersRow] = await db.select({ total: count() }).from(vouchersTable).where(and(eq(vouchersTable.tenantId, tenantId), eq(vouchersTable.status, "used")));
  const [activeSessionsRow] = await db.select({ total: count() }).from(sessionsTable).where(and(eq(sessionsTable.tenantId, tenantId), eq(sessionsTable.status, "active")));
  const [totalSessionsRow] = await db.select({ total: count() }).from(sessionsTable).where(eq(sessionsTable.tenantId, tenantId));
  const [onlineRoutersRow] = await db.select({ total: count() }).from(routersTable).where(and(eq(routersTable.tenantId, tenantId), eq(routersTable.status, "online")));
  const [totalLocationsRow] = await db.select({ total: count() }).from(locationsTable).where(eq(locationsTable.tenantId, tenantId));
  const [activeUsersRow] = await db.select({ total: count() }).from(usersTable).where(and(eq(usersTable.tenantId, tenantId), eq(usersTable.status, "active")));

  res.json({
    totalRevenue: Number(totalRevenueRow?.total ?? 0),
    revenueToday: Number(todayRevenueRow?.total ?? 0),
    activeUsers: Number(activeUsersRow?.total ?? 0),
    totalVouchers: Number(totalVouchersRow?.total ?? 0),
    usedVouchers: Number(usedVouchersRow?.total ?? 0),
    activeRouters: Number(onlineRoutersRow?.total ?? 0),
    totalLocations: Number(totalLocationsRow?.total ?? 0),
    totalSessions: Number(totalSessionsRow?.total ?? 0),
    activeSessions: Number(activeSessionsRow?.total ?? 0),
  });
});

router.get("/dashboard/revenue", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const period = String(req.query.period ?? "30d");
  const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "1y" ? 365 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db.select({
    date: sql<string>`date_trunc('day', ${paymentsTable.createdAt})::date::text`,
    amount: sum(paymentsTable.amount),
    count: count(),
  }).from(paymentsTable)
    .where(and(eq(paymentsTable.tenantId, tenantId), eq(paymentsTable.status, "completed"), gte(paymentsTable.createdAt, startDate)))
    .groupBy(sql`date_trunc('day', ${paymentsTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${paymentsTable.createdAt})`);

  res.json(rows.map(r => ({ date: r.date, amount: Number(r.amount ?? 0), count: Number(r.count) })));
});

router.get("/dashboard/traffic", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const period = String(req.query.period ?? "7d");
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db.select({
    date: sql<string>`date_trunc('day', ${sessionsTable.startedAt})::date::text`,
    bytesIn: sum(sessionsTable.bytesIn),
    bytesOut: sum(sessionsTable.bytesOut),
    sessions: count(),
  }).from(sessionsTable)
    .where(and(eq(sessionsTable.tenantId, tenantId), gte(sessionsTable.startedAt, startDate)))
    .groupBy(sql`date_trunc('day', ${sessionsTable.startedAt})`)
    .orderBy(sql`date_trunc('day', ${sessionsTable.startedAt})`);

  res.json(rows.map(r => ({ date: r.date, bytesIn: Number(r.bytesIn ?? 0), bytesOut: Number(r.bytesOut ?? 0), sessions: Number(r.sessions) })));
});

router.get("/dashboard/top-packages", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const rows = await db.select({
    packageId: paymentsTable.packageId,
    count: count(),
    revenue: sum(paymentsTable.amount),
  }).from(paymentsTable)
    .where(and(eq(paymentsTable.tenantId, tenantId), eq(paymentsTable.status, "completed")))
    .groupBy(paymentsTable.packageId)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  const { packagesTable: pkgs } = await import("@workspace/db");
  const packages = await db.select().from(pkgs).where(eq(pkgs.tenantId, tenantId));
  const pkgMap = Object.fromEntries(packages.map(p => [p.id, p.name]));

  res.json(rows.map(r => ({
    packageId: r.packageId,
    packageName: pkgMap[r.packageId] ?? "Unknown",
    count: Number(r.count),
    revenue: Number(r.revenue ?? 0),
  })));
});

router.get("/dashboard/recent-activity", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.tenantId, tenantId)).orderBy(paymentsTable.createdAt).limit(5);
  const vouchers = await db.select().from(vouchersTable).where(eq(vouchersTable.tenantId, tenantId)).orderBy(vouchersTable.createdAt).limit(5);

  const items = [
    ...payments.map(p => ({ id: p.id, type: "payment" as const, description: `Payment ${p.reference} — ${p.method} ${p.currency} ${p.amount}`, amount: p.amount, createdAt: p.createdAt.toISOString() })),
    ...vouchers.map(v => ({ id: v.id, type: "voucher" as const, description: `Voucher ${v.code} — ${v.status}`, amount: null, createdAt: v.createdAt.toISOString() })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  res.json(items);
});

export default router;
