import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tenantsTable, packagesTable, vouchersTable, paymentsTable, sessionsTable } from "@workspace/db";
import { generateVoucherCode } from "../lib/auth";

const router: IRouter = Router();

router.get("/portal/:tenantSlug/config", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.tenantSlug) ? req.params.tenantSlug[0] : req.params.tenantSlug;
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, slug));
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
  res.json({
    tenantId: tenant.id,
    tenantName: tenant.name,
    logoUrl: tenant.logoUrl,
    primaryColor: tenant.primaryColor ?? "#4F46E5",
    welcomeMessage: tenant.welcomeMessage,
    supportPhone: tenant.supportPhone,
  });
});

router.get("/portal/:tenantSlug/packages", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.tenantSlug) ? req.params.tenantSlug[0] : req.params.tenantSlug;
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, slug));
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
  const packages = await db.select().from(packagesTable).where(eq(packagesTable.tenantId, tenant.id)).orderBy(packagesTable.price);
  res.json(packages.filter(p => p.status === "active"));
});

router.post("/portal/:tenantSlug/connect", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.tenantSlug) ? req.params.tenantSlug[0] : req.params.tenantSlug;
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, slug));
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

  const { type, voucherCode, packageId, phone, email, macAddress, paymentMethod } = req.body;

  if (type === "voucher") {
    if (!voucherCode) { res.status(400).json({ error: "voucherCode required" }); return; }
    const [voucher] = await db.select().from(vouchersTable).where(eq(vouchersTable.code, voucherCode.toUpperCase()));
    if (!voucher || voucher.tenantId !== tenant.id || voucher.status !== "unused") {
      res.json({ success: false, message: "Invalid or already used voucher code" });
      return;
    }
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      await db.update(vouchersTable).set({ status: "expired" }).where(eq(vouchersTable.id, voucher.id));
      res.json({ success: false, message: "Voucher has expired" });
      return;
    }
    await db.update(vouchersTable).set({ status: "active", usedAt: new Date(), usedByMac: macAddress ?? null }).where(eq(vouchersTable.id, voucher.id));
    const [session] = await db.insert(sessionsTable).values({
      tenantId: tenant.id, voucherId: voucher.id, macAddress: macAddress ?? "unknown",
      bytesIn: 0, bytesOut: 0, status: "active",
    }).returning();
    res.json({ success: true, message: "Connected! Enjoy your internet access.", sessionId: session.id, redirectUrl: null });
    return;
  }

  if (type === "purchase") {
    if (!packageId || !paymentMethod) { res.status(400).json({ error: "packageId and paymentMethod required" }); return; }
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId));
    if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }
    const reference = `MC-${generateVoucherCode(12)}`;
    const [payment] = await db.insert(paymentsTable).values({
      tenantId: tenant.id, packageId, amount: pkg.price, currency: pkg.currency,
      method: paymentMethod, status: "pending", reference,
      phone: phone ?? null, email: email ?? null, macAddress: macAddress ?? null,
    }).returning();
    res.json({ success: true, message: "Payment initiated. Complete payment to get access.", paymentReference: reference, redirectUrl: null, sessionId: null });
    return;
  }

  res.status(400).json({ error: "type must be voucher or purchase" });
});

export default router;
