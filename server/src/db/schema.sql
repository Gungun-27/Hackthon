-- TrafficMitra PostgreSQL/SQLite Unified Civic Database Schema
-- Strict adherence to Section 7 of Engineering Specification

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen', -- citizen | officer | admin
  is_phone_verified INTEGER DEFAULT 0,
  is_email_verified INTEGER DEFAULT 0,
  is_identity_verified INTEGER DEFAULT 0, -- DigiLocker-linked
  digilocker_doc_ref TEXT, -- reference token from DigiLocker sandbox, not raw doc data
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- e.g. "Traffic Police - Zone 3", "NMC Roads Dept"
  zone TEXT
);

CREATE TABLE IF NOT EXISTS officers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  department_id TEXT REFERENCES departments(id),
  badge_number TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  ticket_id TEXT UNIQUE NOT NULL, -- TM-2026-XXXXXX
  reporter_id TEXT REFERENCES users(id),
  issue_type TEXT NOT NULL, -- traffic_jam | accident | rash_driving | illegal_parking | signal_fault | road_damage | other
  description TEXT NOT NULL,
  ai_enhanced_description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  location_accuracy_m INTEGER DEFAULT 15,
  address_text TEXT,
  severity_score REAL DEFAULT 5.0, -- 0-10, LLM-generated
  severity_reasoning TEXT, -- LLM explanation, shown on hover
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | under_review | assigned | in_progress | resolved | closed
  assigned_department_id TEXT REFERENCES departments(id),
  assigned_officer_id TEXT REFERENCES officers(id),
  is_reporter_verified INTEGER DEFAULT 0, -- denormalized snapshot at submission time
  
  -- Specialized parking violation metadata
  vehicle_number TEXT,
  vehicle_type TEXT, -- 2_wheeler | auto_tempo | car_suv | heavy_truck_bus | other
  parking_violation_type TEXT, -- no_parking | footpath_encroachment | double_parking | hospital_emergency_gate | commercial_loading | abandoned_vehicle
  tow_required INTEGER DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
  id TEXT PRIMARY KEY,
  complaint_id TEXT REFERENCES complaints(id),
  status TEXT NOT NULL,
  note TEXT,
  changed_by TEXT REFERENCES users(id),
  changed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY,
  complaint_id TEXT REFERENCES complaints(id),
  file_type TEXT NOT NULL, -- photo | video | audio
  storage_url TEXT NOT NULL,
  uploaded_at TEXT DEFAULT (datetime('now'))
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_zone ON complaints(assigned_department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON complaint_status_history(complaint_id);
