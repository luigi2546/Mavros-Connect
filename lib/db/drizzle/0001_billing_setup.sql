-- Create subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "package_id" INTEGER NOT NULL REFERENCES "packages"("id") ON DELETE RESTRICT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'paused', 'cancelled', 'expired')),
  "billing_cycle" VARCHAR(20) NOT NULL CHECK ("billing_cycle" IN ('monthly', 'quarterly', 'yearly')),
  "price" DECIMAL(10, 2) NOT NULL,
  "paystack_customer_id" VARCHAR(255),
  "paystack_authorization_code" VARCHAR(255),
  "paystack_plan_id" VARCHAR(255),
  "start_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "next_billing_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP,
  "cancelled_at" TIMESTAMP,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_subscriptions_tenant_id" ON "subscriptions"("tenant_id");
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("user_id");
CREATE INDEX "idx_subscriptions_package_id" ON "subscriptions"("package_id");
CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS "promo_codes" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "description" TEXT,
  "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('percentage', 'fixed')),
  "value" DECIMAL(10, 2) NOT NULL,
  "applicable_to" VARCHAR(50) NOT NULL CHECK ("applicable_to" IN ('all_packages', 'specific_packages', 'subscriptions_only')),
  "package_ids" INTEGER[] DEFAULT '{}',
  "min_purchase_amount" DECIMAL(10, 2) DEFAULT 0,
  "max_usage_count" INTEGER,
  "current_usage_count" INTEGER DEFAULT 0,
  "max_per_customer" INTEGER,
  "valid_from" TIMESTAMP,
  "valid_until" TIMESTAMP,
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_promo_codes_tenant_id" ON "promo_codes"("tenant_id");
CREATE INDEX "idx_promo_codes_code" ON "promo_codes"("code");
CREATE INDEX "idx_promo_codes_is_active" ON "promo_codes"("is_active");

-- Create refunds table
CREATE TABLE IF NOT EXISTS "refunds" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "payment_id" INTEGER NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'GHS',
  "reason" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected', 'processed', 'failed')),
  "paystack_refund_reference" VARCHAR(255),
  "paystack_refund_status" VARCHAR(50),
  "requested_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approved_at" TIMESTAMP,
  "processed_at" TIMESTAMP,
  "rejection_reason" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_refunds_tenant_id" ON "refunds"("tenant_id");
CREATE INDEX "idx_refunds_payment_id" ON "refunds"("payment_id");
CREATE INDEX "idx_refunds_user_id" ON "refunds"("user_id");
CREATE INDEX "idx_refunds_status" ON "refunds"("status");

-- Create invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "invoice_number" VARCHAR(50) NOT NULL UNIQUE,
  "payment_id" INTEGER REFERENCES "payments"("id") ON DELETE SET NULL,
  "subscription_id" INTEGER REFERENCES "subscriptions"("id") ON DELETE SET NULL,
  "subtotal" DECIMAL(10, 2) NOT NULL,
  "tax" DECIMAL(10, 2) DEFAULT 0,
  "discount" DECIMAL(10, 2) DEFAULT 0,
  "total" DECIMAL(10, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'GHS',
  "line_items" JSONB NOT NULL DEFAULT '[]',
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  "issued_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "due_date" TIMESTAMP,
  "paid_date" TIMESTAMP,
  "notes" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_invoices_tenant_id" ON "invoices"("tenant_id");
CREATE INDEX "idx_invoices_user_id" ON "invoices"("user_id");
CREATE INDEX "idx_invoices_payment_id" ON "invoices"("payment_id");
CREATE INDEX "idx_invoices_subscription_id" ON "invoices"("subscription_id");
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- Create promo_code_usage table
CREATE TABLE IF NOT EXISTS "promo_code_usage" (
  "id" SERIAL PRIMARY KEY,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "promo_code_id" INTEGER NOT NULL REFERENCES "promo_codes"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "payment_id" INTEGER REFERENCES "payments"("id") ON DELETE SET NULL,
  "subscription_id" INTEGER REFERENCES "subscriptions"("id") ON DELETE SET NULL,
  "discount_amount" DECIMAL(10, 2) NOT NULL,
  "original_amount" DECIMAL(10, 2) NOT NULL,
  "final_amount" DECIMAL(10, 2) NOT NULL,
  "used_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_promo_code_usage_tenant_id" ON "promo_code_usage"("tenant_id");
CREATE INDEX "idx_promo_code_usage_promo_code_id" ON "promo_code_usage"("promo_code_id");
CREATE INDEX "idx_promo_code_usage_user_id" ON "promo_code_usage"("user_id");
