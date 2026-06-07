import { Router, type IRouter } from "express";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { 
  db, 
  subscriptionsTable,
  promoCodesTable,
  refundsTable,
  invoicesTable,
  promoCodeUsageTable,
  paymentsTable,
  packagesTable,
  vouchersTable,
} from "@workspace/db";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

// ════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS - Recurring payments management
// ════════════════════════════════════════════════════════════════════════════

// GET /api/billing/subscriptions - List user's subscriptions
router.get("/billing/subscriptions", authenticate, async (req, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const subscriptions = await db.select({
      id: subscriptionsTable.id,
      packageId: subscriptionsTable.packageId,
      packageName: packagesTable.name,
      status: subscriptionsTable.status,
      billingCycle: subscriptionsTable.billingCycle,
      price: subscriptionsTable.price,
      nextBillingDate: subscriptionsTable.nextBillingDate,
      startDate: subscriptionsTable.startDate,
      cancelledAt: subscriptionsTable.cancelledAt,
    })
      .from(subscriptionsTable)
      .innerJoin(packagesTable, eq(subscriptionsTable.packageId, packagesTable.id))
      .where(and(
        eq(subscriptionsTable.tenantId, tenantId),
        eq(subscriptionsTable.userId, userId),
      ))
      .orderBy(desc(subscriptionsTable.createdAt));

    res.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// POST /api/billing/subscriptions - Create subscription
router.post("/billing/subscriptions", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const tenantId = req.user!.tenantId;
  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const { packageId, billingCycle } = req.body;
  if (!packageId || !billingCycle) {
    res.status(400).json({ error: "Missing required fields: packageId, billingCycle" });
    return;
  }

  // Get package price
  const pkg = await db.select({
    id: packagesTable.id,
    price: packagesTable.price,
  })
    .from(packagesTable)
    .where(and(
      eq(packagesTable.id, packageId),
      eq(packagesTable.tenantId, tenantId),
    ))
    .limit(1);

  if (pkg.length === 0) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  const startDate = new Date();
  const nextBillingDate = new Date();
  switch (billingCycle) {
    case "monthly":
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      break;
    case "quarterly":
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
      break;
    case "yearly":
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      break;
  }

  const result = await db.insert(subscriptionsTable).values({
    tenantId,
    userId,
    packageId: packageId as number,
    status: "active",
    billingCycle: billingCycle as "monthly" | "quarterly" | "yearly",
    price: pkg[0].price,
    currency: "GHS",
    startDate,
    nextBillingDate,
  }).returning();

  res.status(201).json(result[0]);
});

// PATCH /api/billing/subscriptions/:id - Update subscription (pause/resume)
router.patch("/billing/subscriptions/:id", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  const { status } = req.body;

  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }
  if (!["active", "paused", "cancelled"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const result = await db.update(subscriptionsTable)
    .set({
      status: status as "active" | "paused" | "cancelled" | "expired",
      cancelledAt: status === "cancelled" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(and(
      eq(subscriptionsTable.id, parseInt(id)),
      eq(subscriptionsTable.tenantId, tenantId),
      eq(subscriptionsTable.userId, userId),
    ))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json(result[0]);
});

// ════════════════════════════════════════════════════════════════════════════
// PROMO CODES - Discount code management
// ════════════════════════════════════════════════════════════════════════════

// POST /api/billing/promo-codes/validate - Validate a promo code
router.post("/billing/promo-codes/validate", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const tenantId = req.user!.tenantId;
  const { code, amount, packageIds } = req.body;

  if (!tenantId || !code) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const promoCode = await db.select()
    .from(promoCodesTable)
    .where(and(
      eq(promoCodesTable.tenantId, tenantId),
      eq(promoCodesTable.code, code),
      eq(promoCodesTable.isActive, true),
      gte(promoCodesTable.validUntil, new Date()),
      lte(promoCodesTable.validFrom, new Date()),
    ))
    .limit(1);

  if (promoCode.length === 0) {
    res.status(404).json({ error: "Invalid or expired promo code" });
    return;
  }

  const promo = promoCode[0];

  // Check usage limits
  if (promo.maxUsageCount && promo.currentUsageCount >= promo.maxUsageCount) {
    res.status(400).json({ error: "Promo code usage limit exceeded" });
    return;
  }

  // Check minimum purchase
  if (promo.minPurchaseAmount && parseFloat(amount) < parseFloat(promo.minPurchaseAmount.toString())) {
    res.status(400).json({ error: `Minimum purchase of ₵${promo.minPurchaseAmount} required` });
    return;
  }

  // Check applicability
  if (promo.applicableTo === "specific_packages") {
    const applicableIds = promo.packageIds as number[];
    const packageId = (packageIds as number[])[0];
    if (!applicableIds.includes(packageId)) {
      res.status(400).json({ error: "This promo code is not applicable to selected package" });
      return;
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (promo.type === "percentage") {
    discountAmount = (parseFloat(amount) * parseFloat(promo.value.toString())) / 100;
  } else {
    discountAmount = parseFloat(promo.value.toString());
  }

  res.json({
    isValid: true,
    code: promo.code,
    discountType: promo.type,
    discountValue: promo.value,
    discountAmount: discountAmount,
    originalAmount: parseFloat(amount),
    finalAmount: parseFloat(amount) - discountAmount,
  });
});

// ════════════════════════════════════════════════════════════════════════════
// REFUNDS - Refund request management
// ════════════════════════════════════════════════════════════════════════════

// GET /api/billing/refunds - List user's refunds
router.get("/billing/refunds", authenticate, async (req, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const refunds = await db.select({
      id: refundsTable.id,
      paymentId: refundsTable.paymentId,
      amount: refundsTable.amount,
      reason: refundsTable.reason,
      status: refundsTable.status,
      requestedAt: refundsTable.requestedAt,
      processedAt: refundsTable.processedAt,
    })
      .from(refundsTable)
      .where(and(
        eq(refundsTable.tenantId, tenantId),
        eq(refundsTable.userId, userId),
      ))
      .orderBy(desc(refundsTable.requestedAt));

    res.json(refunds);
  } catch (error) {
    console.error("Error fetching refunds:", error);
    res.status(500).json({ error: "Failed to fetch refunds" });
  }
});

// POST /api/billing/refunds - Request refund
router.post("/billing/refunds", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const tenantId = req.user!.tenantId;
  const { paymentId, amount, reason } = req.body;

  if (!tenantId || !paymentId || !amount || !reason) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Verify payment exists and belongs to user
  const payment = await db.select()
    .from(paymentsTable)
    .where(and(
      eq(paymentsTable.id, paymentId),
      eq(paymentsTable.tenantId, tenantId),
    ))
    .limit(1);

  if (payment.length === 0) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const result = await db.insert(refundsTable).values({
    tenantId,
    paymentId,
    userId,
    amount: parseFloat(amount),
    currency: "GHS",
    reason,
    status: "pending",
  }).returning();

  res.status(201).json(result[0]);
});

// PATCH /api/billing/refunds/:id/approve - Approve refund request
router.patch("/billing/refunds/:id/approve", authenticate, async (req, res): Promise<void> => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;

  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const result = await db.update(refundsTable)
    .set({
      status: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(refundsTable.id, parseInt(id)),
      eq(refundsTable.tenantId, tenantId),
    ))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Refund not found" });
    return;
  }

  res.json(result[0]);
});

// ════════════════════════════════════════════════════════════════════════════
// INVOICES - Invoice generation and retrieval
// ════════════════════════════════════════════════════════════════════════════

// GET /api/billing/invoices - List user's invoices
router.get("/billing/invoices", authenticate, async (req, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

    const invoices = await db.select({
      id: invoicesTable.id,
      invoiceNumber: invoicesTable.invoiceNumber,
      total: invoicesTable.total,
      status: invoicesTable.status,
      issuedDate: invoicesTable.issuedDate,
      dueDate: invoicesTable.dueDate,
      paidDate: invoicesTable.paidDate,
    })
      .from(invoicesTable)
      .where(and(
        eq(invoicesTable.tenantId, tenantId),
        eq(invoicesTable.userId, userId),
      ))
      .orderBy(desc(invoicesTable.issuedDate));

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET /api/billing/invoices/:id - Get specific invoice
router.get("/billing/invoices/:id", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const tenantId = req.user!.tenantId;
  const { id } = req.params;

  if (!tenantId) { res.status(403).json({ error: "No tenant" }); return; }

  const invoice = await db.select()
    .from(invoicesTable)
    .where(and(
      eq(invoicesTable.id, parseInt(id)),
      eq(invoicesTable.tenantId, tenantId),
      eq(invoicesTable.userId, userId),
    ))
    .limit(1);

  if (invoice.length === 0) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(invoice[0]);
});

// POST /api/billing/invoices - Generate invoice
router.post("/billing/invoices", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const tenantId = req.user!.tenantId;
  const { paymentId, subscriptionId, lineItems, notes } = req.body;

  if (!tenantId || !lineItems) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const subtotal = (lineItems as any[]).reduce((sum: number, item: any) => sum + (item.total || 0), 0);
  const invoiceNumber = `INV-${Date.now()}`;

  const result = await db.insert(invoicesTable).values({
    tenantId,
    userId,
    invoiceNumber,
    paymentId: paymentId ? parseInt(paymentId) : undefined,
    subscriptionId: subscriptionId ? parseInt(subscriptionId) : undefined,
    subtotal: subtotal,
    tax: 0,
    discount: 0,
    total: subtotal,
    currency: "GHS",
    lineItems: lineItems as any,
    status: "draft",
    issuedDate: new Date(),
    notes,
  }).returning();

  res.status(201).json(result[0]);
});

export default router;
