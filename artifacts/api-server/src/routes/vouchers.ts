import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, vouchersTable, packagesTable, tenantsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { generateVoucherCode } from "../lib/auth";

const router: IRouter = Router();

async function getVoucherWithPackage(id: number, tenantId: number) {
  const [v] = await db.select().from(vouchersTable).where(and(eq(vouchersTable.id, id), eq(vouchersTable.tenantId, tenantId)));
  if (!v) return null;
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, v.packageId));
  return { ...v, package: pkg };
}

router.get("/vouchers", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const vouchers = await db.select().from(vouchersTable).where(eq(vouchersTable.tenantId, tenantId)).orderBy(vouchersTable.createdAt);
  const packageIds = [...new Set(vouchers.map(v => v.packageId))];
  const packages = await db.select().from(packagesTable).where(eq(packagesTable.tenantId, tenantId));
  const pkgMap = Object.fromEntries(packages.map(p => [p.id, p]));
  res.json(vouchers.map(v => ({ ...v, package: pkgMap[v.packageId] })));
});

router.post("/vouchers", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const { packageId, locationId, expiresAt } = req.body;
  if (!packageId) { res.status(400).json({ error: "packageId required" }); return; }
  let code = generateVoucherCode(8);
  let attempts = 0;
  while (attempts < 10) {
    const [existing] = await db.select().from(vouchersTable).where(eq(vouchersTable.code, code));
    if (!existing) break;
    code = generateVoucherCode(8);
    attempts++;
  }
  const [voucher] = await db.insert(vouchersTable).values({
    tenantId, packageId, locationId: locationId ?? null, code,
    expiresAt: expiresAt ? new Date(expiresAt) : null, status: "unused",
  }).returning();
  const result = await getVoucherWithPackage(voucher.id, tenantId);
  res.status(201).json(result);
});

router.post("/vouchers/bulk", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const { packageId, locationId, quantity, expiresAt } = req.body;
  if (!packageId || !quantity) { res.status(400).json({ error: "packageId and quantity required" }); return; }
  const count = Math.min(parseInt(String(quantity), 10), 1000);
  const codes: string[] = [];
  const used = new Set<string>();
  while (codes.length < count) {
    const code = generateVoucherCode(8);
    if (!used.has(code)) { codes.push(code); used.add(code); }
  }
  const rows = codes.map(code => ({
    tenantId, packageId, locationId: locationId ?? null, code,
    expiresAt: expiresAt ? new Date(expiresAt) : null, status: "unused" as const,
  }));
  const vouchers = await db.insert(vouchersTable).values(rows).returning();
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId));
  res.status(201).json(vouchers.map(v => ({ ...v, package: pkg })));
});

router.get("/vouchers/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const result = await getVoucherWithPackage(id, tenantId);
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.delete("/vouchers/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [deleted] = await db.delete(vouchersTable).where(and(eq(vouchersTable.id, id), eq(vouchersTable.tenantId, tenantId))).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/vouchers/validate", async (req, res): Promise<void> => {
  const { code, tenantSlug, macAddress } = req.body;
  if (!code || !tenantSlug) { res.status(400).json({ error: "code and tenantSlug required" }); return; }
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, tenantSlug));
  if (!tenant) { res.json({ valid: false, message: "Unknown tenant" }); return; }
  const [voucher] = await db.select().from(vouchersTable).where(and(eq(vouchersTable.code, code.toUpperCase()), eq(vouchersTable.tenantId, tenant.id)));
  if (!voucher) { res.json({ valid: false, message: "Invalid voucher code" }); return; }
  if (voucher.status !== "unused") { res.json({ valid: false, message: `Voucher is ${voucher.status}` }); return; }
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    await db.update(vouchersTable).set({ status: "expired" }).where(eq(vouchersTable.id, voucher.id));
    res.json({ valid: false, message: "Voucher has expired" }); return;
  }
  await db.update(vouchersTable).set({ status: "active", usedAt: new Date(), usedByMac: macAddress ?? null }).where(eq(vouchersTable.id, voucher.id));
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, voucher.packageId));
  res.json({ valid: true, message: "Voucher activated", voucher: { ...voucher, status: "active", package: pkg } });
});

export default router;
