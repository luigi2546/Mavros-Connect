-- Business Features Schema
-- Create tables for reports, metrics, insights, forecasts, and business intelligence

CREATE TABLE IF NOT EXISTS business_reports (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  generated_at TIMESTAMP NOT NULL,
  generated_by INTEGER,
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency VARCHAR(50),
  next_scheduled_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS business_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  value NUMERIC(15, 2),
  unit VARCHAR(50),
  target_value NUMERIC(15, 2),
  status VARCHAR(20),
  trend VARCHAR(20),
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_insights (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id INTEGER,
  segment_name VARCHAR(100),
  insights JSONB DEFAULT '[]',
  churn_risk VARCHAR(20),
  lifetime NUMERIC(15, 2),
  contact_frequency INTEGER,
  last_interaction TIMESTAMP,
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS revenue_summary (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_revenue NUMERIC(15, 2),
  subscription_revenue NUMERIC(15, 2),
  one_time_revenue NUMERIC(15, 2),
  refunds_total NUMERIC(15, 2),
  net_revenue NUMERIC(15, 2),
  avg_transaction_value NUMERIC(15, 2),
  transaction_count INTEGER,
  conversion_rate NUMERIC(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS operational_metrics (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  system_uptime NUMERIC(5, 2),
  avg_response_time NUMERIC(10, 2),
  ticket_resolution_time NUMERIC(10, 2),
  customer_satisfaction NUMERIC(3, 1),
  bug_count INTEGER,
  deployment_frequency INTEGER,
  failure_rate NUMERIC(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS competitor_analysis (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  competitor_name VARCHAR(255) NOT NULL,
  market_share NUMERIC(5, 2),
  price_point NUMERIC(15, 2),
  features JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  customer_reviews NUMERIC(3, 1),
  last_analyzed TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS forecasts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  forecast_type VARCHAR(50) NOT NULL,
  forecast_data JSONB DEFAULT '[]',
  confidence_level NUMERIC(5, 2),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  model_used VARCHAR(100),
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS market_trends (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trend_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  impact VARCHAR(20),
  relevance NUMERIC(5, 2),
  trend_data JSONB DEFAULT '[]',
  source VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS business_goals (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  goal_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  target_value NUMERIC(15, 2),
  current_value NUMERIC(15, 2),
  unit VARCHAR(50),
  status VARCHAR(20),
  priority VARCHAR(20),
  due_date TIMESTAMP,
  owner INTEGER,
  progress NUMERIC(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_reports_tenant ON business_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_metrics_tenant ON business_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_metrics_category ON business_metrics(category);
CREATE INDEX IF NOT EXISTS idx_customer_insights_tenant ON customer_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_summary_tenant ON revenue_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_summary_period ON revenue_summary(period_start);
CREATE INDEX IF NOT EXISTS idx_operational_metrics_tenant ON operational_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_tenant ON competitor_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_tenant ON forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_market_trends_tenant ON market_trends(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_goals_tenant ON business_goals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_goals_status ON business_goals(status);
