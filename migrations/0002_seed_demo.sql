-- Facilities
INSERT OR IGNORE INTO facilities (id, name, location, power_capacity_mw, target_power_mw, cooling_type, gas_generation, status, is_demo)
VALUES
  ('FAC-UC',  'Union County Campus', 'El Dorado, AR',   8,  150, 'immersion', 1, 'active',   1),
  ('FAC-SKY', 'Skycore Digital',     'United States',  24,   42, 'hybrid',    0, 'planning', 1);

-- Equipment (all FAC-UC)
INSERT OR IGNORE INTO equipment (id, facility_id, tag, name, system, equipment_type, criticality)
VALUES
  ('EQ-P-101',       'FAC-UC', 'P-101',       'Primary Loop Pump',           'immersion_cooling', 'pump',         'high'),
  ('EQ-P-102',       'FAC-UC', 'P-102',       'Standby Loop Pump',           'immersion_cooling', 'pump',         'medium'),
  ('EQ-HX-201',      'FAC-UC', 'HX-201',      'Plate Heat Exchanger',        'immersion_cooling', 'heat_exchanger','high'),
  ('EQ-F-101',       'FAC-UC', 'F-101',       'Loop Filter Housing',         'immersion_cooling', 'filter',       'medium'),
  ('EQ-TK-A',        'FAC-UC', 'TK-A',        'Immersion Tank A',            'immersion_cooling', 'tank',         'high'),
  ('EQ-SWGR-1',      'FAC-UC', 'SWGR-1',      'Main Switchgear',             'electrical',        'switchgear',   'critical'),
  ('EQ-UPS-1',       'FAC-UC', 'UPS-1',       'UPS Module',                  'electrical',        'ups',          'high'),
  ('EQ-GEN-1',       'FAC-UC', 'GEN-1',       'Behind-the-Meter Gas Genset', 'gas_generation',    'generator',    'critical'),
  ('EQ-GAS-TRAIN-1', 'FAC-UC', 'GAS-TRAIN-1', 'Gas Train Skid',              'gas_generation',    'gas_train',    'high'),
  ('EQ-FAS-1',       'FAC-UC', 'FAS-1',       'Fire Alarm System',           'fire',              'fire_alarm',   'high'),
  ('EQ-CAM-PERIM',   'FAC-UC', 'CAM-PERIM',   'Perimeter Camera Array',      'security',          'camera',       'medium');

-- Documents (all FAC-UC)
INSERT OR IGNORE INTO documents (id, facility_id, title, doc_type, r2_key, status)
VALUES
  ('DOC-1', 'FAC-UC', 'Immersion Cooling SOP',                          'sop',       'demo/uc/immersion-cooling-sop.pdf',                     'uploaded'),
  ('DOC-2', 'FAC-UC', 'Cooling Loop Startup Checklist',                 'checklist', 'demo/uc/cooling-loop-startup-checklist.pdf',             'uploaded'),
  ('DOC-3', 'FAC-UC', 'Switchgear Thermographic Inspection Procedure',  'procedure', 'demo/uc/switchgear-thermographic-inspection.pdf',        'uploaded'),
  ('DOC-4', 'FAC-UC', 'Gas Generation Startup & Leak Response SOP',     'sop',       'demo/uc/gas-generation-startup-leak-response-sop.pdf',  'uploaded'),
  ('DOC-5', 'FAC-UC', 'Data Hall Commissioning Plan',                   'plan',      'demo/uc/data-hall-commissioning-plan.pdf',               'uploaded'),
  ('DOC-6', 'FAC-UC', 'Perimeter Security & Surveillance Plan',         'plan',      'demo/uc/perimeter-security-surveillance-plan.pdf',       'uploaded');

-- Inspection Findings (all FAC-UC)
INSERT OR IGNORE INTO inspection_findings (id, facility_id, equipment_tag, finding_type, source, severity, summary, status, detected_at)
VALUES
  ('IF-1', 'FAC-UC', 'SWGR-1',      'thermal_anomaly', 'drone_thermal', 'high',   'Phase B lug ~28F above adjacent phases',              'open', '2026-07-01'),
  ('IF-2', 'FAC-UC', 'GAS-TRAIN-1', 'gas_reading',     'drone_ogi',    'medium', 'Trace methane plume near flange F-3 during OGI pass', 'open', '2026-07-01'),
  ('IF-3', 'FAC-UC', 'HX-201',      'thermal_anomaly', 'drone_thermal', 'low',    'Approach temperature trending up; monitor',           'open', '2026-07-02');

-- Security Events (all FAC-UC)
INSERT OR IGNORE INTO security_events (id, facility_id, event_type, source, severity, summary, occurred_at)
VALUES
  ('SE-1', 'FAC-UC', 'perimeter_intrusion', 'drone_patrol',   'medium', 'After-hours motion at NE fence line; no access breach confirmed', '2026-07-02'),
  ('SE-2', 'FAC-UC', 'access_anomaly',      'access_control', 'low',    'Badge used outside assigned schedule at electrical room',         '2026-07-02');

-- Alarms (all FAC-UC)
INSERT OR IGNORE INTO alarms (id, facility_id, equipment_tag, severity, alarm_name, description, status, occurred_at)
VALUES
  ('AL-1', 'FAC-UC', 'P-101',  'high',   'High Coolant Return Temp',   'Coolant return temperature exceeds high setpoint on primary loop pump', 'open', '2026-07-03'),
  ('AL-2', 'FAC-UC', 'F-101',  'medium', 'High Filter DP',             'Differential pressure across loop filter housing above normal range',   'open', '2026-07-03'),
  ('AL-3', 'FAC-UC', 'GEN-1',  'high',   'Generator Test Incomplete',  'Scheduled load test did not complete successfully',                     'open', '2026-07-03');

-- Work Orders (all FAC-UC)
INSERT OR IGNORE INTO work_orders (id, facility_id, equipment_tag, title, problem_statement, priority, probable_causes, recommended_actions, safety_notes, source_type, source_id)
VALUES
  (
    'WO-1', 'FAC-UC', 'SWGR-1',
    'Switchgear Hot Lug — Phase B',
    'Drone thermal inspection identified Phase B lug running approximately 28°F above adjacent phases on main switchgear SWGR-1, indicating elevated resistance.',
    'high',
    'Loose or corroded lug connection; inadequate torque on Phase B conductor termination; oxidation at contact interface.',
    'Schedule outage window; inspect and re-torque Phase B lug to manufacturer spec; apply anti-oxidant compound; retest with thermal camera post-repair.',
    'LOTO required — full lockout/tagout of SWGR-1 before any contact. Verify zero energy state with calibrated meter. Arc flash PPE (minimum CAT 2) mandatory.',
    'inspection_finding', 'IF-1'
  ),
  (
    'WO-2', 'FAC-UC', 'GAS-TRAIN-1',
    'Methane Plume at Gas Train Flange F-3',
    'OGI drone survey detected trace methane plume near flange F-3 on gas train skid GAS-TRAIN-1 during scheduled patrol.',
    'medium',
    'Worn or damaged flange gasket at F-3; under-torqued bolts; thread sealant failure on fitting.',
    'Isolate gas supply to train; perform soap-bubble and/or combustible gas detector survey to confirm and localize leak; replace gasket and re-torque bolts to spec; re-verify with OGI before returning to service.',
    'Gas PPE required — flame-resistant clothing, H2S/CH4 monitor mandatory. Isolate and bleed gas train before disassembly. Confirm no ignition sources within 25 ft.',
    'inspection_finding', 'IF-2'
  ),
  (
    'WO-3', 'FAC-UC', 'F-101',
    'Inspect and Replace Filter Element — F-101',
    'High differential pressure alarm (AL-2) on loop filter housing F-101 indicates element is near or at end of service life.',
    'medium',
    'Filter element loaded with particulate from coolant loop; element past replacement interval; bypass valve partially closed.',
    'Isolate F-101 from loop using isolation valves; drain and capture coolant per spill procedure; remove and inspect element; replace with new element of correct micron rating; return to service and verify DP returns to normal range.',
    'Wear chemical splash goggles and fluid-resistant gloves when handling dielectric coolant. Dispose of spent element per site waste procedure.',
    'alarm', 'AL-2'
  );
