-- Integration & APIs Schema
-- Create tables for API keys, webhooks, integrations, OAuth, and API documentation

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  scopes JSONB DEFAULT '[]',
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  events JSONB DEFAULT '[]',
  description TEXT,
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  retry_delay INTEGER DEFAULT 60,
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  status_code INTEGER,
  response_body TEXT,
  attempt INTEGER DEFAULT 1,
  next_retry_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS integration_events (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  status VARCHAR(50),
  error_details TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS api_documentation (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint_path VARCHAR(255) NOT NULL,
  method VARCHAR(10),
  description TEXT,
  parameters JSONB DEFAULT '[]',
  request_body JSONB,
  response_body JSONB,
  examples JSONB DEFAULT '[]',
  deprecated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_apps (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  app_name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id VARCHAR(255) NOT NULL UNIQUE,
  client_secret VARCHAR(255) NOT NULL,
  redirect_uris JSONB DEFAULT '[]',
  scopes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 5000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  oauth_app_id INTEGER NOT NULL REFERENCES oauth_apps(id) ON DELETE CASCADE,
  access_token VARCHAR(500) NOT NULL UNIQUE,
  refresh_token VARCHAR(500),
  expires_at TIMESTAMP,
  granted_scopes JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
  requests_per_second INTEGER DEFAULT 10,
  requests_per_day INTEGER DEFAULT 100000,
  current_request_count INTEGER DEFAULT 0,
  reset_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tenant ON webhook_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_tenant ON integration_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_integration ON integration_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_api_documentation_tenant ON api_documentation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_apps_tenant ON oauth_apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_tenant ON oauth_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_tenant ON api_rate_limits(tenant_id);
