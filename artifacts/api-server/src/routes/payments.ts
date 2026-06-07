import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, paymentsTable, packagesTable, vouchersTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { generateVoucherCode } from "../lib/auth";

const router: IRouter = Router();

router.get("/payments", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.tenantId, tenantId)).orderBy(paymentsTable.createdAt);
  res.json(payments);
});

router.post("/payments", async (req, res): Promise<void> => {
  const { packageId, method, amount, phone, email, macAddress, tenantSlug } = req.body;
  if (!packageId || !method || amount == null) {
    res.status(400).json({ error: "packageId, method, amount required" });
    return;
  }
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId));
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }
  const reference = `MC-${generateVoucherCode(12)}`;
  const [payment] = await db.insert(paymentsTable).values({
    tenantId: pkg.tenantId, packageId, amount, currency: pkg.currency,
    method, status: "pending", reference, phone: phone ?? null,
    email: email ?? null, macAddress: macAddress ?? null,
  }).returning();
  res.status(201).json(payment);
});

router.get("/payments/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [payment] = await db.select().from(paymentsTable).where(and(eq(paymentsTable.id, id), eq(paymentsTable.tenantId, tenantId)));
  if (!payment) { res.status(404).json({ error: "Not found" }); return; }
  res.json(payment);
});

router.post("/payments/webhook/paystack", async (req, res): Promise<void> => {
  const event = req.body;
  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (reference) {
      const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.reference, reference));
      if (payment && payment.status === "pending") {
        const code = generateVoucherCode(8);
        const [voucher] = await db.insert(vouchersTable).values({
          tenantId: payment.tenantId, packageId: payment.packageId,
          code, status: "unused", usedByMac: payment.macAddress,
        }).returning();
        await db.update(paymentsTable).set({ status: "completed", voucherId: voucher.id, webhookPayload: JSON.stringify(event) }).where(eq(paymentsTable.id, payment.id));
      }
    }
  }
  res.json({ received: true });
});

router.post("/payments/webhook/momo", async (req, res): Promise<void> => {
  const event = req.body;
  req.log.info({ event }, "MoMo webhook received");
  res.json({ received: true });
});

export default router;
