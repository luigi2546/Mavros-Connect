-- Network Management Schema
-- Create tables for network monitoring, QoS, alerts, and device tracking

CREATE TABLE IF NOT EXISTS network_metrics (
  id SERIAL PRIMARY KEY,
  router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uptime NUMERIC(5, 2),
  cpu_usage NUMERIC(5, 2),
  memory_usage NUMERIC(5, 2),
  active_connections INTEGER,
  total_bandwidth NUMERIC(15, 2),
  download_speed NUMERIC(10, 2),
  upload_speed NUMERIC(10, 2),
  latency NUMERIC(10, 2),
  packet_loss NUMERIC(5, 2),
  signal_strength INTEGER,
  client_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS qos_config (
  id SERIAL PRIMARY KEY,
  router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  priority_level VARCHAR(20) NOT NULL,
  bandwidth_limit NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  rules JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS network_alerts (
  id SERIAL PRIMARY KEY,
  router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  threshold NUMERIC(10, 2),
  current_value NUMERIC(10, 2),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS router_health_history (
  id SERIAL PRIMARY KEY,
  router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  reason TEXT,
  previous_status VARCHAR(20),
  downtime INTEGER,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS bandwidth_usage (
  id SERIAL PRIMARY KEY,
  router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  upload_bytes NUMERIC(20, 0),
  download_bytes NUMERIC(20, 0),
  total_bytes NUMERIC(20, 0),
  peak_upload NUMERIC(15, 2),
  peak_download NUMERIC(15, 2),
  average_latency NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS traffic_breakdown (
  id SERIAL PRIMARY KEY,
  router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  protocol VARCHAR(50) NOT NULL,
  bytes NUMERIC(20, 0) NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  packet_count INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS connected_devices (
  id SERIAL PRIMARY KEY,
  router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_name VARCHAR(255),
  mac_address VARCHAR(17) NOT NULL,
  ip_address VARCHAR(45),
  device_type VARCHAR(50),
  signal_strength INTEGER,
  upload_speed NUMERIC(10, 2),
  download_speed NUMERIC(10, 2),
  connection_time TIMESTAMP,
  last_activity_at TIMESTAMP,
  is_connected BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS router_config_snapshots (
  id SERIAL PRIMARY KEY,
  router_id INTEGER NOT NULL REFERENCES routers(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  snapshot_name VARCHAR(255) NOT NULL,
  config_data JSONB NOT NULL,
  description TEXT,
  version VARCHAR(50),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_network_metrics_router ON network_metrics(router_id);
CREATE INDEX IF NOT EXISTS idx_network_metrics_tenant ON network_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qos_config_router ON qos_config(router_id);
CREATE INDEX IF NOT EXISTS idx_network_alerts_router ON network_alerts(router_id);
CREATE INDEX IF NOT EXISTS idx_network_alerts_severity ON network_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_router_health_router ON router_health_history(router_id);
CREATE INDEX IF NOT EXISTS idx_bandwidth_usage_router ON bandwidth_usage(router_id);
CREATE INDEX IF NOT EXISTS idx_bandwidth_usage_period ON bandwidth_usage(period_start);
CREATE INDEX IF NOT EXISTS idx_traffic_breakdown_router ON traffic_breakdown(router_id);
CREATE INDEX IF NOT EXISTS idx_connected_devices_router ON connected_devices(router_id);
CREATE INDEX IF NOT EXISTS idx_connected_devices_mac ON connected_devices(mac_address);
