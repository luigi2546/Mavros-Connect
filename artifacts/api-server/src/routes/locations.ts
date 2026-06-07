import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, locationsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

function getTenantId(req: Parameters<Parameters<IRouter["get"]>[1]>[0]): number | null {
  return req.user?.tenantId ?? null;
}

router.get("/locations", authenticate, async (req, res): Promise<void> => {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(403).json({ error: "No tenant" });
    return;
  }
  const locations = await db.select().from(locationsTable).where(eq(locationsTable.tenantId, tenantId)).orderBy(locationsTable.createdAt);
  res.json(locations);
});

router.post("/locations", authenticate, async (req, res): Promise<void> => {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(403).json({ error: "No tenant" });
    return;
  }
  const { name, address, city, country } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }
  const [location] = await db.insert(locationsTable).values({ tenantId, name, address, city, country }).returning();
  res.status(201).json(location);
});

router.get("/locations/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [location] = await db.select().from(locationsTable).where(and(eq(locationsTable.id, id), eq(locationsTable.tenantId, tenantId)));
  if (!location) { res.status(404).json({ error: "Not found" }); return; }
  res.json(location);
});

router.patch("/locations/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, address, city, country, status } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (country !== undefined) updateData.country = country;
  if (status !== undefined) updateData.status = status;
  const [location] = await db.update(locationsTable).set(updateData).where(and(eq(locationsTable.id, id), eq(locationsTable.tenantId, tenantId))).returning();
  if (!location) { res.status(404).json({ error: "Not found" }); return; }
  res.json(location);
});

router.delete("/locations/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [deleted] = await db.delete(locationsTable).where(and(eq(locationsTable.id, id), eq(locationsTable.tenantId, tenantId))).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
