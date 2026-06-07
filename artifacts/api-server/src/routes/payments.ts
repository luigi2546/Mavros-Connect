import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, paymentsTable, packagesTable, vouchersTable, tenantsTable } from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";
import { generateVoucherCode } from "../lib/auth";

const PAYSTACK_SECRET = process.env["PAYSTACK_SECRET_KEY"] ?? "";

const router: IRouter = Router();

// ── List payments (admin) ─────────────────────────────────────────────────────
router.get("/payments", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const payments = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.tenantId, tenantId))
    .orderBy(paymentsTable.createdAt);
  res.json(payments);
});

// ── Get single payment ────────────────────────────────────────────────────────
router.get("/payments/:id", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [payment] = await db.select().from(paymentsTable)
    .where(and(eq(paymentsTable.id, id), eq(paymentsTable.tenantId, tenantId)));
  if (!payment) { res.status(404).json({ error: "Not found" }); return; }
  res.json(payment);
});

// ── Paystack: initialize a transaction ────────────────────────────────────────
// Called from the portal when a customer wants to pay for a package.
// Returns { authorizationUrl, reference } for redirect to Paystack checkout.
router.post("/payments/paystack/initialize", async (req, res): Promise<void> => {
  const { packageId, email, phone, macAddress, tenantSlug } = req.body;

  if (!packageId || !email) {
    res.status(400).json({ error: "packageId and email required" });
    return;
  }

  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, packageId));
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }

  if (!PAYSTACK_SECRET) {
    res.status(503).json({ error: "Paystack is not configured on this server" });
    return;
  }

  const reference = `MC-${generateVoucherCode(12)}`;
  const amountKobo = Math.round(pkg.price * 100); // Paystack uses pesewas (GHS × 100)

  // Call Paystack initialize API
  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: "GHS",
      reference,
      metadata: {
        packageId,
        macAddress: macAddress ?? null,
        tenantId: pkg.tenantId,
        custom_fields: [
          { display_name: "Package", variable_name: "package", value: pkg.name },
          { display_name: "Hotspot MAC", variable_name: "mac_address", value: macAddress ?? "N/A" },
        ],
      },
    }),
  });

  if (!paystackRes.ok) {
    const err = await paystackRes.json().catch(() => ({})) as Record<string, unknown>;
    req.log.error({ err }, "Paystack initialize failed");
    res.status(502).json({ error: "Paystack initialization failed", details: err });
    return;
  }

  const paystackData = await paystackRes.json() as { status: boolean; data: { authorization_url: string; access_code: string; reference: string } };

  if (!paystackData.status) {
    res.status(502).json({ error: "Paystack rejected the request" });
    return;
  }

  // Store a pending payment record
  await db.insert(paymentsTable).values({
    tenantId: pkg.tenantId,
    packageId: pkg.id,
    amount: pkg.price,
    currency: pkg.currency,
    method: "paystack",
    status: "pending",
    reference,
    email,
    phone: phone ?? null,
    macAddress: macAddress ?? null,
  });

  res.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference,
    accessCode: paystackData.data.access_code,
  });
});

// ── Paystack: verify a transaction manually (for callback page) ───────────────
router.get("/payments/paystack/verify/:reference", async (req, res): Promise<void> => {
  const ref = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;

  if (!PAYSTACK_SECRET) {
    res.status(503).json({ error: "Paystack not configured" });
    return;
  }

  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const data = await paystackRes.json() as { status: boolean; data: { status: string; reference: string; metadata?: { packageId?: number; macAddress?: string } } };

  if (!data.status || data.data.status !== "success") {
    res.json({ success: false, message: "Payment not verified" });
    return;
  }

  // Already processed by webhook? Just return success.
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.reference, ref));
  if (!payment) { res.status(404).json({ error: "Payment record not found" }); return; }

  if (payment.status === "completed") {
    // Get the voucher that was already created
    const [voucher] = payment.voucherId
      ? await db.select().from(vouchersTable).where(eq(vouchersTable.id, payment.voucherId))
      : [];
    res.json({ success: true, alreadyProcessed: true, voucherCode: voucher?.code ?? null });
    return;
  }

  // Process now (in case webhook was missed)
  const code = generateVoucherCode(8);
  const [voucher] = await db.insert(vouchersTable).values({
    tenantId: payment.tenantId,
    packageId: payment.packageId,
    code,
    status: "unused",
    usedByMac: payment.macAddress ?? null,
  }).returning();

  await db.update(paymentsTable)
    .set({ status: "completed", voucherId: voucher.id })
    .where(eq(paymentsTable.id, payment.id));

  res.json({ success: true, voucherCode: voucher.code });
});

// ── Paystack webhook ──────────────────────────────────────────────────────────
router.post("/payments/webhook/paystack", async (req, res): Promise<void> => {
  const event = req.body as { event: string; data?: { reference?: string } };

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (reference) {
      const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.reference, reference));
      if (payment && payment.status === "pending") {
        const code = generateVoucherCode(8);
        const [voucher] = await db.insert(vouchersTable).values({
          tenantId: payment.tenantId,
          packageId: payment.packageId,
          code,
          status: "unused",
          usedByMac: payment.macAddress ?? null,
        }).returning();
        await db.update(paymentsTable)
          .set({ status: "completed", voucherId: voucher.id, webhookPayload: JSON.stringify(event) })
          .where(eq(paymentsTable.id, payment.id));
        req.log.info({ reference, voucherCode: code }, "Paystack payment completed, voucher created");
      }
    }
  }

  res.json({ received: true });
});

// ── MoMo webhook ──────────────────────────────────────────────────────────────
router.post("/payments/webhook/momo", async (req, res): Promise<void> => {
  req.log.info({ body: req.body }, "MoMo webhook received");
  res.json({ received: true });
});

export default router;
