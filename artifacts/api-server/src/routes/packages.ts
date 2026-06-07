import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, packagesTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

router.get("/packages", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const packages = await db.select().from(packagesTable).where(eq(packagesTable.tenantId, tenantId)).orderBy(packagesTable.createdAt);
  res.json(packages);
});

router.post("/packages", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const { name, description, price, currency, duration, durationUnit, downloadSpeed, uploadSpeed, dataCapMb } = req.body;
  if (!name || price == null || !duration || !durationUnit) {
    res.status(400).json({ error: "name, price, duration, durationUnit required" });
    return;
  }
  const [pkg] = await db.insert(packagesTable).values({
    tenantId, name, description: description ?? null, price, currency: currency ?? "GHS",
    duration, durationUnit, downloadSpeed: downloadSpeed ?? null, uploadSpeed: uploadSpeed ?? null,
    dataCapMb: dataCapMb ?? null, status: "active",
  }).returning();
  res.status(201).json(pkg);
});

router.get("/packages/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [pkg] = await db.select().from(packagesTable).where(and(eq(packagesTable.id, id), eq(packagesTable.tenantId, tenantId)));
  if (!pkg) { res.status(404).json({ error: "Not found" }); return; }
  res.json(pkg);
});

router.patch("/packages/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, description, price, duration, durationUnit, downloadSpeed, uploadSpeed, dataCapMb, status } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (duration !== undefined) updateData.duration = duration;
  if (durationUnit !== undefined) updateData.durationUnit = durationUnit;
  if (downloadSpeed !== undefined) updateData.downloadSpeed = downloadSpeed;
  if (uploadSpeed !== undefined) updateData.uploadSpeed = uploadSpeed;
  if (dataCapMb !== undefined) updateData.dataCapMb = dataCapMb;
  if (status !== undefined) updateData.status = status;
  const [pkg] = await db.update(packagesTable).set(updateData).where(and(eq(packagesTable.id, id), eq(packagesTable.tenantId, tenantId))).returning();
  if (!pkg) { res.status(404).json({ error: "Not found" }); return; }
  res.json(pkg);
});

router.delete("/packages/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [deleted] = await db.delete(packagesTable).where(and(eq(packagesTable.id, id), eq(packagesTable.tenantId, tenantId))).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
