import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, routersTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

const safeRouter = (r: typeof routersTable.$inferSelect) => ({
  id: r.id, tenantId: r.tenantId, locationId: r.locationId, name: r.name,
  ipAddress: r.ipAddress, apiPort: r.apiPort, username: r.username,
  status: r.status, model: r.model, firmwareVersion: r.firmwareVersion,
  lastSeen: r.lastSeen, createdAt: r.createdAt,
});

router.get("/routers", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const routers = await db.select().from(routersTable).where(eq(routersTable.tenantId, tenantId)).orderBy(routersTable.createdAt);
  res.json(routers.map(safeRouter));
});

router.post("/routers", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const { name, ipAddress, apiPort, username, password, locationId, model } = req.body;
  if (!name || !ipAddress || !apiPort || !username || !password || !locationId) {
    res.status(400).json({ error: "All fields required" });
    return;
  }
  const [r] = await db.insert(routersTable).values({
    tenantId, locationId, name, ipAddress, apiPort,
    username, passwordEncrypted: password, model: model ?? null, status: "unknown",
  }).returning();
  res.status(201).json(safeRouter(r));
});

router.get("/routers/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [r] = await db.select().from(routersTable).where(and(eq(routersTable.id, id), eq(routersTable.tenantId, tenantId)));
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json(safeRouter(r));
});

router.patch("/routers/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, ipAddress, apiPort, username, password, locationId } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (ipAddress !== undefined) updateData.ipAddress = ipAddress;
  if (apiPort !== undefined) updateData.apiPort = apiPort;
  if (username !== undefined) updateData.username = username;
  if (password !== undefined) updateData.passwordEncrypted = password;
  if (locationId !== undefined) updateData.locationId = locationId;
  const [r] = await db.update(routersTable).set(updateData).where(and(eq(routersTable.id, id), eq(routersTable.tenantId, tenantId))).returning();
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json(safeRouter(r));
});

router.delete("/routers/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [deleted] = await db.delete(routersTable).where(and(eq(routersTable.id, id), eq(routersTable.tenantId, tenantId))).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/routers/:id/test", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [r] = await db.select().from(routersTable).where(and(eq(routersTable.id, id), eq(routersTable.tenantId, tenantId)));
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  // Simulate connection test (real MikroTik API would use routeros-client)
  const isOnline = Math.random() > 0.3;
  await db.update(routersTable).set({ status: isOnline ? "online" : "offline", lastSeen: isOnline ? new Date() : undefined }).where(eq(routersTable.id, id));
  res.json({
    success: isOnline,
    message: isOnline ? "Connected successfully" : "Connection failed — check IP, port, and credentials",
    routerInfo: isOnline ? { model: r.model ?? "MikroTik RB941", version: "6.49.8", uptime: "14d 2h 35m" } : null,
  });
});

router.get("/routers/:id/active-users", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  // Return simulated active users (real implementation would call MikroTik API)
  const macs = ["AA:BB:CC:DD:EE:01", "AA:BB:CC:DD:EE:02", "AA:BB:CC:DD:EE:03"];
  const names = ["user_abc123", "user_def456", "user_ghi789"];
  const users = macs.map((mac, i) => ({
    mac,
    ip: `192.168.88.${10 + i}`,
    username: names[i],
    uptime: `${Math.floor(Math.random() * 300)}m`,
    bytesIn: Math.floor(Math.random() * 50000000),
    bytesOut: Math.floor(Math.random() * 10000000),
  }));
  res.json(users);
});

export default router;
