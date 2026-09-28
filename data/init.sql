-- ============================================================
-- IARI Monitor — PostgreSQL Schema
-- Indian Antarctic Research Station Monitoring System
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & AUTH
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'scientist', 'guest');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'guest',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STATIONS
-- ============================================================
CREATE TABLE stations (
  id VARCHAR(20) PRIMARY KEY,  -- 'maitri' or 'bharati'
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  established_year INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO stations VALUES
  ('maitri', 'Maitri Station', 'Schirmacher Oasis, Queen Maud Land, Antarctica', -70.7667, 11.7333, 1989, TRUE, NOW()),
  ('bharati', 'Bharati Station', 'Larsemann Hills, East Antarctica', -69.4069, 76.1919, 2012, TRUE, NOW());

-- ============================================================
-- SENSOR READINGS (Time-series)
-- ============================================================
CREATE TABLE sensor_readings (
  id UUID DEFAULT uuid_generate_v4(),
  station_id VARCHAR(20) REFERENCES stations(id),
  sensor_type VARCHAR(50) NOT NULL,  -- 'temperature', 'power_gen', 'power_cons', 'fuel', 'water', 'wind', 'solar', 'battery'
  sensor_name VARCHAR(100),
  value DECIMAL(10, 3) NOT NULL,
  unit VARCHAR(20),                   -- '°C', 'kW', 'L', '%', 'km/h'
  quality VARCHAR(20) DEFAULT 'good', -- 'good', 'warning', 'critical'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
);

-- Create index for fast time-series queries
CREATE INDEX idx_sensor_readings_station_type_time
  ON sensor_readings(station_id, sensor_type, created_at DESC);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TYPE alert_level AS ENUM ('green', 'yellow', 'red');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved');

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id VARCHAR(20) REFERENCES stations(id),
  alert_type VARCHAR(50) NOT NULL,   -- 'low_fuel', 'high_temp', 'equipment_failure', 'maintenance_due', etc.
  level alert_level NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  value DECIMAL(10, 3),              -- The triggering sensor value
  threshold DECIMAL(10, 3),          -- The threshold that was breached
  status alert_status DEFAULT 'active',
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_station_status ON alerts(station_id, status, created_at DESC);

-- ============================================================
-- EQUIPMENT
-- ============================================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id VARCHAR(20) REFERENCES stations(id),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),              -- 'generator', 'solar_panel', 'wind_turbine', 'hvac', 'water_purifier'
  model VARCHAR(100),
  serial_number VARCHAR(100),
  installed_date DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  usage_hours INT DEFAULT 0,
  health_score INT DEFAULT 100,      -- 0-100
  status VARCHAR(20) DEFAULT 'online', -- 'online', 'warning', 'critical', 'offline'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TYPE inventory_category AS ENUM ('food', 'fuel', 'water', 'equipment_parts', 'medical', 'consumables');

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id VARCHAR(20) REFERENCES stations(id),
  name VARCHAR(150) NOT NULL,
  category inventory_category NOT NULL,
  current_quantity DECIMAL(12, 2) NOT NULL,
  max_capacity DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  expiry_date DATE,
  reorder_threshold DECIMAL(5, 2) DEFAULT 20.0,  -- % when to alert
  critical_threshold DECIMAL(5, 2) DEFAULT 10.0, -- % critical alert
  consumption_rate DECIMAL(10, 3),               -- per day
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA — Default admin user
-- Password: Admin@1234 (bcrypt hash)
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES
  ('NCPOR Admin', 'admin@ncpor.res.in', '$2b$10$rQZ8K1mN3pL9wX2vY4uJ5e6kH7mN8pQ9rS0tU1vW2xY3zA4bB5cC6', 'admin'),
  ('Station Operator', 'operator@maitri.in', '$2b$10$rQZ8K1mN3pL9wX2vY4uJ5e6kH7mN8pQ9rS0tU1vW2xY3zA4bB5cC6', 'operator'),
  ('Dr. Priya Sharma', 'scientist@bharati.in', '$2b$10$rQZ8K1mN3pL9wX2vY4uJ5e6kH7mN8pQ9rS0tU1vW2xY3zA4bB5cC6', 'scientist');

-- Seed equipment for both stations
INSERT INTO equipment (station_id, name, category, installed_date, health_score, status) VALUES
  ('maitri', 'Diesel Generator #1', 'generator', '2018-01-15', 78, 'online'),
  ('maitri', 'Solar Array Block A', 'solar_panel', '2020-06-01', 92, 'online'),
  ('maitri', 'Wind Turbine #1', 'wind_turbine', '2019-03-20', 85, 'online'),
  ('maitri', 'HVAC Unit - Main Building', 'hvac', '2021-09-10', 70, 'warning'),
  ('maitri', 'Water Purification System', 'water_purifier', '2020-11-05', 95, 'online'),
  ('bharati', 'Diesel Generator #1', 'generator', '2013-02-01', 65, 'warning'),
  ('bharati', 'Solar Array Block A', 'solar_panel', '2015-08-15', 88, 'online'),
  ('bharati', 'Wind Turbine #1', 'wind_turbine', '2016-04-12', 72, 'online'),
  ('bharati', 'HVAC Unit - Lab Block', 'hvac', '2018-07-22', 91, 'online'),
  ('bharati', 'Water Purification System', 'water_purifier', '2014-10-30', 80, 'online');

-- Seed inventory
INSERT INTO inventory_items (station_id, name, category, current_quantity, max_capacity, unit, expiry_date) VALUES
  ('maitri', 'Diesel Fuel', 'fuel', 18500, 25000, 'litres', NULL),
  ('maitri', 'Drinking Water Reserve', 'water', 12000, 20000, 'litres', NULL),
  ('maitri', 'Ration Pack A', 'food', 450, 600, 'units', '2027-03-01'),
  ('maitri', 'Medical Kit Basic', 'medical', 25, 50, 'kits', '2026-12-31'),
  ('maitri', 'AA Batteries (pack)', 'consumables', 80, 200, 'packs', NULL),
  ('bharati', 'Diesel Fuel', 'fuel', 9500, 30000, 'litres', NULL),
  ('bharati', 'Drinking Water Reserve', 'water', 8000, 15000, 'litres', NULL),
  ('bharati', 'Ration Pack B', 'food', 320, 500, 'units', '2027-01-15'),
  ('bharati', 'Medical Kit Advanced', 'medical', 12, 30, 'kits', '2026-11-30'),
  ('bharati', 'Filter Cartridges', 'consumables', 15, 100, 'units', NULL);
