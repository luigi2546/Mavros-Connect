import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

router.get("/sessions", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.tenantId, tenantId)).orderBy(sessionsTable.startedAt);
  res.json(sessions);
});

router.get("/sessions/active", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const sessions = await db.select().from(sessionsTable).where(and(eq(sessionsTable.tenantId, tenantId), eq(sessionsTable.status, "active"))).orderBy(sessionsTable.startedAt);
  res.json(sessions);
});

router.post("/sessions/:id/terminate", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [session] = await db.update(sessionsTable).set({ status: "ended", endedAt: new Date() }).where(and(eq(sessionsTable.id, id), eq(sessionsTable.tenantId, tenantId))).returning();
  if (!session) { res.status(404).json({ error: "Not found" }); return; }
  res.json(session);
});

export default router;
