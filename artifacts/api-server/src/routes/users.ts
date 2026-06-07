import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { hashPassword } from "../lib/auth";

const router: IRouter = Router();

const safeUser = (u: typeof usersTable.$inferSelect) => ({
  id: u.id, email: u.email, name: u.name, role: u.role,
  tenantId: u.tenantId, locationId: u.locationId, status: u.status, createdAt: u.createdAt,
});

router.get("/users", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const users = await db.select().from(usersTable).where(eq(usersTable.tenantId, tenantId)).orderBy(usersTable.createdAt);
  res.json(users.map(safeUser));
});

router.post("/users", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const { email, name, role, password, locationId } = req.body;
  if (!email || !name || !role || !password) {
    res.status(400).json({ error: "email, name, role, password required" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) { res.status(409).json({ error: "Email already exists" }); return; }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ email: email.toLowerCase(), name, passwordHash, role, tenantId, locationId: locationId ?? null, status: "active" }).returning();
  res.status(201).json(safeUser(user));
});

router.get("/users/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.select().from(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.tenantId, tenantId)));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(safeUser(user));
});

router.patch("/users/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, role, locationId, status } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;
  if (locationId !== undefined) updateData.locationId = locationId;
  if (status !== undefined) updateData.status = status;
  const [user] = await db.update(usersTable).set(updateData).where(and(eq(usersTable.id, id), eq(usersTable.tenantId, tenantId))).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(safeUser(user));
});

router.delete("/users/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (id === req.user!.userId) { res.status(400).json({ error: "Cannot delete yourself" }); return; }
  const [deleted] = await db.delete(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.tenantId, tenantId))).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/users/:id/suspend", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.update(usersTable).set({ status: "suspended" }).where(and(eq(usersTable.id, id), eq(usersTable.tenantId, tenantId))).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(safeUser(user));
});

router.post("/users/:id/unsuspend", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.update(usersTable).set({ status: "active" }).where(and(eq(usersTable.id, id), eq(usersTable.tenantId, tenantId))).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(safeUser(user));
});

export default router;
