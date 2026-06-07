import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tenantsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

router.get("/tenants", authenticate, async (req, res): Promise<void> => {
  if (req.user!.role !== "super_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const tenants = await db.select().from(tenantsTable).orderBy(tenantsTable.createdAt);
  res.json(tenants);
});

router.post("/tenants", authenticate, async (req, res): Promise<void> => {
  if (req.user!.role !== "super_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { name, slug, contactEmail, contactPhone, plan } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: "Name and slug required" });
    return;
  }
  const [tenant] = await db.insert(tenantsTable).values({ name, slug, contactEmail, contactPhone, plan: plan ?? "starter" }).returning();
  res.status(201).json(tenant);
});

router.get("/tenants/me", authenticate, async (req, res): Promise<void> => {
  if (!req.user!.tenantId) {
    res.status(404).json({ error: "No tenant associated" });
    return;
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, req.user!.tenantId));
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(tenant);
});

router.get("/tenants/:id", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  if (req.user!.role !== "super_admin" && req.user!.tenantId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id));
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(tenant);
});

router.patch("/tenants/:id", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  if (req.user!.role !== "super_admin" && req.user!.tenantId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { name, logoUrl, primaryColor, contactEmail, contactPhone, status, plan, welcomeMessage, supportPhone } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
  if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
  if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
  if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
  if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage;
  if (supportPhone !== undefined) updateData.supportPhone = supportPhone;
  if (status !== undefined && req.user!.role === "super_admin") updateData.status = status;
  if (plan !== undefined && req.user!.role === "super_admin") updateData.plan = plan;
  const [tenant] = await db.update(tenantsTable).set(updateData).where(eq(tenantsTable.id, id)).returning();
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(tenant);
});

export default router;
