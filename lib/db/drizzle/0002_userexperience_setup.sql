-- Create user_profiles table
CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "first_name" VARCHAR(100),
  "last_name" VARCHAR(100),
  "avatar_url" VARCHAR(500),
  "bio" TEXT,
  "phone" VARCHAR(20),
  "department" VARCHAR(100),
  "job_title" VARCHAR(100),
  "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
  "language" VARCHAR(10) NOT NULL DEFAULT 'en',
  "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
  "two_factor_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "two_factor_secret" VARCHAR(255),
  "two_factor_backup_codes" JSONB DEFAULT '[]',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles"("user_id");
CREATE INDEX "idx_user_profiles_tenant_id" ON "user_profiles"("tenant_id");

-- Create two_factor_codes table
CREATE TABLE IF NOT EXISTS "two_factor_codes" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "code" VARCHAR(10) NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "is_used" BOOLEAN NOT NULL DEFAULT FALSE,
  "used_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_two_factor_codes_user_id" ON "two_factor_codes"("user_id");
CREATE INDEX "idx_two_factor_codes_code" ON "two_factor_codes"("code");

-- Create security_questions table
CREATE TABLE IF NOT EXISTS "security_questions" (
  "id" SERIAL PRIMARY KEY,
  "question" VARCHAR(255) NOT NULL UNIQUE,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_security_answers table
CREATE TABLE IF NOT EXISTS "user_security_answers" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "question_id" INTEGER NOT NULL REFERENCES "security_questions"("id") ON DELETE RESTRICT,
  "answer_hash" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_user_security_answers_user_id" ON "user_security_answers"("user_id");
CREATE INDEX "idx_user_security_answers_question_id" ON "user_security_answers"("question_id");

-- Create device_sessions table
CREATE TABLE IF NOT EXISTS "device_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "device_name" VARCHAR(255),
  "device_type" VARCHAR(50),
  "user_agent" TEXT,
  "ip_address" VARCHAR(45),
  "browser" VARCHAR(100),
  "os" VARCHAR(100),
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "last_activity_at" TIMESTAMP,
  "login_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "logout_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_device_sessions_user_id" ON "device_sessions"("user_id");
CREATE INDEX "idx_device_sessions_tenant_id" ON "device_sessions"("tenant_id");
CREATE INDEX "idx_device_sessions_is_active" ON "device_sessions"("is_active");

-- Create translations table
CREATE TABLE IF NOT EXISTS "translations" (
  "id" SERIAL PRIMARY KEY,
  "language" VARCHAR(10) NOT NULL,
  "key" VARCHAR(255) NOT NULL,
  "value" TEXT NOT NULL,
  "namespace" VARCHAR(50) DEFAULT 'common',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_translations_language" ON "translations"("language");
CREATE INDEX "idx_translations_key" ON "translations"("key");
CREATE UNIQUE INDEX "idx_translations_lang_key" ON "translations"("language", "key", "namespace");

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "email_notifications" BOOLEAN NOT NULL DEFAULT TRUE,
  "sms_notifications" BOOLEAN NOT NULL DEFAULT FALSE,
  "push_notifications" BOOLEAN NOT NULL DEFAULT TRUE,
  "marketing_emails" BOOLEAN NOT NULL DEFAULT FALSE,
  "weekly_report" BOOLEAN NOT NULL DEFAULT TRUE,
  "daily_digest" BOOLEAN NOT NULL DEFAULT FALSE,
  "preferences" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_user_preferences_user_id" ON "user_preferences"("user_id");

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" VARCHAR(500) NOT NULL UNIQUE,
  "expires_at" TIMESTAMP NOT NULL,
  "is_used" BOOLEAN NOT NULL DEFAULT FALSE,
  "used_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id");
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens"("token");

-- Create account_recovery table
CREATE TABLE IF NOT EXISTS "account_recovery" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_id" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "recovery_method" VARCHAR(50) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "ip_address" VARCHAR(45),
  "verification_code" VARCHAR(50),
  "verification_code_expires_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_account_recovery_user_id" ON "account_recovery"("user_id");
CREATE INDEX "idx_account_recovery_status" ON "account_recovery"("status");

-- Insert default security questions
INSERT INTO "security_questions" ("question", "is_active") VALUES
  ('What is the name of the city where you were born?', TRUE),
  ('What was the name of your first pet?', TRUE),
  ('What is your mother''s maiden name?', TRUE),
  ('In what city did your mother and father meet?', TRUE),
  ('What is the name of the elementary school you attended?', TRUE),
  ('What is your favorite book?', TRUE),
  ('What was the make and model of your first car?', TRUE),
  ('What is your favorite sports team?', TRUE),
  ('What is your favorite movie?', TRUE),
  ('In what city was your best friend born?', TRUE)
ON CONFLICT DO NOTHING;
