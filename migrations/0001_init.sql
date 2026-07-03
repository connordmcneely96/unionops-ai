CREATE TABLE facilities (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT,
  power_capacity_mw REAL, target_power_mw REAL, cooling_type TEXT,
  gas_generation INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
  is_demo INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE equipment (
  id TEXT PRIMARY KEY, facility_id TEXT NOT NULL, tag TEXT NOT NULL,
  name TEXT NOT NULL, system TEXT, equipment_type TEXT, manufacturer TEXT,
  model TEXT, criticality TEXT DEFAULT 'medium', status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE documents (
  id TEXT PRIMARY KEY, facility_id TEXT NOT NULL, title TEXT NOT NULL,
  doc_type TEXT, r2_key TEXT, status TEXT DEFAULT 'uploaded',
  indexed_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE document_chunks (
  id TEXT PRIMARY KEY, document_id TEXT NOT NULL, chunk_index INTEGER,
  content TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE inspection_findings (
  id TEXT PRIMARY KEY, facility_id TEXT NOT NULL, equipment_tag TEXT,
  finding_type TEXT, source TEXT, severity TEXT, summary TEXT, detail TEXT,
  detected_at TEXT, status TEXT DEFAULT 'open', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE security_events (
  id TEXT PRIMARY KEY, facility_id TEXT NOT NULL, event_type TEXT, source TEXT,
  severity TEXT, summary TEXT, location_note TEXT, occurred_at TEXT,
  status TEXT DEFAULT 'open', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE alarms (
  id TEXT PRIMARY KEY, facility_id TEXT NOT NULL, equipment_tag TEXT,
  severity TEXT, alarm_name TEXT, description TEXT, status TEXT DEFAULT 'open',
  occurred_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE work_orders (
  id TEXT PRIMARY KEY, facility_id TEXT NOT NULL, equipment_tag TEXT,
  title TEXT NOT NULL, problem_statement TEXT, priority TEXT,
  probable_causes TEXT, recommended_actions TEXT, safety_notes TEXT,
  source_type TEXT, source_id TEXT, status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ai_runs (
  id TEXT PRIMARY KEY, facility_id TEXT, run_type TEXT, model TEXT,
  tokens_in INTEGER, tokens_out INTEGER, cost_estimate REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_equipment_facility ON equipment(facility_id);
CREATE INDEX idx_findings_facility ON inspection_findings(facility_id);
CREATE INDEX idx_security_facility ON security_events(facility_id);
CREATE INDEX idx_workorders_facility ON work_orders(facility_id);
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
