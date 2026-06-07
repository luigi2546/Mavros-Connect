import { pgTable, serial, text, integer, boolean, timestamp, decimal, varchar, uuid, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ────────────────────────────────────────────────────────────────────────────
// Subscriptions: Recurring payment plans
// ────────────────────────────────────────────────────────────────────────────
export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  packageId: integer("package_id").notNull(),
  
  // Subscription details
  status: varchar("status", { enum: ["active", "paused", "cancelled", "expired"] }).default("active").notNull(),
  billingCycle: varchar("billing_cycle", { enum: ["monthly", "quarterly", "yearly"] }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").default("GHS").notNull(),
  
  // Paystack recurring setup
  paystackCustomerId: text("paystack_customer_id"),
  paystackAuthorizationCode: text("paystack_authorization_code"),
  paystackPlanId: text("paystack_plan_id"),
  
  // Subscription timeline
  startDate: timestamp("start_date").notNull(),
  nextBillingDate: timestamp("next_billing_date"),
  endDate: timestamp("end_date"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Metadata
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ────────────────────────────────────────────────────────────────────────────
// Promo Codes: Discount codes for packages and subscriptions
// ────────────────────────────────────────────────────────────────────────────
export const promoCodesTable = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  
  // Code details
  code: varchar("code").notNull().unique(),
  description: text("description"),
  type: varchar("type", { enum: ["percentage", "fixed"] }).notNull(), // percentage (0-100) or fixed amount
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  
  // Application rules
  applicableTo: varchar("applicable_to", { enum: ["all_packages", "specific_packages", "subscriptions_only"] }).notNull(),
  packageIds: json("package_ids"), // For specific_packages
  minPurchaseAmount: decimal("min_purchase_amount", { precision: 12, scale: 2 }),
  
  // Usage limits
  maxUsageCount: integer("max_usage_count"), // null = unlimited
  currentUsageCount: integer("current_usage_count").default(0),
  maxPerCustomer: integer("max_per_customer").default(1),
  
  // Timeline
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ────────────────────────────────────────────────────────────────────────────
// Refunds: Track refund requests and status
// ────────────────────────────────────────────────────────────────────────────
export const refundsTable = pgTable("refunds", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  paymentId: integer("payment_id").notNull(),
  userId: uuid("user_id").notNull(),
  
  // Refund details
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").default("GHS").notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "processed", "failed"] }).default("pending").notNull(),
  
  // Paystack refund info
  paystackRefundReference: text("paystack_refund_reference"),
  paystackRefundStatus: varchar("paystack_refund_status"),
  
  // Timeline
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  rejectionReason: text("rejection_reason"),
  
  // Metadata
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ────────────────────────────────────────────────────────────────────────────
// Invoices: Generated billing documents for payments/subscriptions
// ────────────────────────────────────────────────────────────────────────────
export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id").notNull(),
  
  // Invoice identification
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  paymentId: integer("payment_id"), // Link to payment
  subscriptionId: integer("subscription_id"), // Link to subscription
  
  // Amount details
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").default("GHS").notNull(),
  
  // Line items
  lineItems: json("line_items").notNull(), // [{description, quantity, unitPrice, total}]
  
  // Invoice status
  status: varchar("status", { enum: ["draft", "sent", "paid", "overdue", "cancelled"] }).default("draft").notNull(),
  
  // Timeline
  issuedDate: timestamp("issued_date").notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  
  // Notes
  notes: text("notes"),
  metadata: json("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ────────────────────────────────────────────────────────────────────────────
// Promo Code Usage: Track which customers used which promo codes
// ────────────────────────────────────────────────────────────────────────────
export const promoCodeUsageTable = pgTable("promo_code_usage", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  promoCodeId: integer("promo_code_id").notNull(),
  userId: uuid("user_id").notNull(),
  paymentId: integer("payment_id"), // Link to payment
  subscriptionId: integer("subscription_id"), // Link to subscription
  
  // Discount details
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).notNull(),
  originalAmount: decimal("original_amount", { precision: 12, scale: 2 }).notNull(),
  finalAmount: decimal("final_amount", { precision: 12, scale: 2 }).notNull(),
  
  usedAt: timestamp("used_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ────────────────────────────────────────────────────────────────────────────
// Relations
// ────────────────────────────────────────────────────────────────────────────
export const subscriptionsRelations = relations(subscriptionsTable, ({ one, many }) => ({
  invoices: many(invoicesTable),
}));

export const invoicesRelations = relations(invoicesTable, ({ one }) => ({
  subscription: one(subscriptionsTable, {
    fields: [invoicesTable.subscriptionId],
    references: [subscriptionsTable.id],
  }),
}));

export const promoCodeUsageRelations = relations(promoCodeUsageTable, ({ one }) => ({
  promoCode: one(promoCodesTable, {
    fields: [promoCodeUsageTable.promoCodeId],
    references: [promoCodesTable.id],
  }),
}));
