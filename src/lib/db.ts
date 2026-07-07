import { getCloudflareContext } from "@opennextjs/cloudflare";

const FACILITY_ID = "FAC-UC";

export interface Facility {
    id: string;
    name: string;
    location: string;
    power_capacity_mw: number;
    target_power_mw: number;
    cooling_type: string;
    gas_generation: number;
    status: string;
}

export interface InspectionFinding {
    id: string;
    equipment_tag: string;
    finding_type: string;
    source: string;
    severity: string;
    summary: string;
    detected_at: string;
    status: string;
}

export interface SecurityEvent {
    id: string;
    event_type: string;
    source: string;
    severity: string;
    summary: string;
    occurred_at: string;
    status: string;
    location_note?: string | null;
}

export interface Alarm {
    id: string;
    equipment_tag: string;
    severity: string;
    alarm_name: string;
    description: string;
    status: string;
    occurred_at: string;
}

export interface WorkOrder {
    id: string;
    equipment_tag: string;
    title: string;
    priority: string;
    source_type: string;
    source_id: string;
    status: string;
    source_summary: string | null;
}

export interface Kpis {
    openFindings: number;
    openSecurityEvents: number;
    openWorkOrders: number;
    openAlarms: number;
    equipmentCount: number;
    docsCount: number;
    findingsBySeverity: Record<string, number>;
    securityBySeverity: Record<string, number>;
    alarmsBySeverity: Record<string, number>;
}

async function getDB() {
    const { env } = await getCloudflareContext({ async: true });
    return env.DB;
}

function countBySeverity(rows: { severity: string }[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of rows) {
        counts[r.severity] = (counts[r.severity] ?? 0) + 1;
    }
    return counts;
}

export async function getFacility(): Promise<Facility | null> {
    const db = await getDB();
    const result = await db
        .prepare("SELECT * FROM facilities WHERE id = ?")
        .bind(FACILITY_ID)
        .first<Facility>();
    return result ?? null;
}

export async function getKpis(): Promise<Kpis> {
    const db = await getDB();

    const [findings, security, workOrders, alarms, equipment, docs] = await Promise.all([
        db.prepare("SELECT severity FROM inspection_findings WHERE facility_id = ? AND status = 'open'")
            .bind(FACILITY_ID).all<{ severity: string }>(),
        db.prepare("SELECT severity FROM security_events WHERE facility_id = ? AND status = 'open'")
            .bind(FACILITY_ID).all<{ severity: string }>(),
        db.prepare("SELECT COUNT(*) as cnt FROM work_orders WHERE facility_id = ? AND status = 'open'")
            .bind(FACILITY_ID).first<{ cnt: number }>(),
        db.prepare("SELECT severity FROM alarms WHERE facility_id = ? AND status = 'open'")
            .bind(FACILITY_ID).all<{ severity: string }>(),
        db.prepare("SELECT COUNT(*) as cnt FROM equipment WHERE facility_id = ?")
            .bind(FACILITY_ID).first<{ cnt: number }>(),
        db.prepare("SELECT COUNT(*) as cnt FROM documents WHERE facility_id = ?")
            .bind(FACILITY_ID).first<{ cnt: number }>(),
    ]);

    return {
        openFindings: findings.results.length,
        openSecurityEvents: security.results.length,
        openWorkOrders: workOrders?.cnt ?? 0,
        openAlarms: alarms.results.length,
        equipmentCount: equipment?.cnt ?? 0,
        docsCount: docs?.cnt ?? 0,
        findingsBySeverity: countBySeverity(findings.results),
        securityBySeverity: countBySeverity(security.results),
        alarmsBySeverity: countBySeverity(alarms.results),
    };
}

export async function getFindings(): Promise<InspectionFinding[]> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT id, equipment_tag, finding_type, source, severity, summary, detected_at, status " +
            "FROM inspection_findings WHERE facility_id = ? AND status = 'open' ORDER BY detected_at DESC"
        )
        .bind(FACILITY_ID)
        .all<InspectionFinding>();
    return result.results;
}

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT id, event_type, source, severity, summary, occurred_at, status " +
            "FROM security_events WHERE facility_id = ? AND status = 'open' ORDER BY occurred_at DESC"
        )
        .bind(FACILITY_ID)
        .all<SecurityEvent>();
    return result.results;
}

export async function getWorkOrders(): Promise<WorkOrder[]> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT wo.id, wo.equipment_tag, wo.title, wo.priority, wo.source_type, wo.source_id, wo.status, " +
            "CASE " +
            "  WHEN wo.source_type = 'inspection_finding' THEN if_.summary " +
            "  WHEN wo.source_type = 'alarm' THEN al.alarm_name " +
            "  ELSE NULL " +
            "END as source_summary " +
            "FROM work_orders wo " +
            "LEFT JOIN inspection_findings if_ ON wo.source_type = 'inspection_finding' AND wo.source_id = if_.id " +
            "LEFT JOIN alarms al ON wo.source_type = 'alarm' AND wo.source_id = al.id " +
            "WHERE wo.facility_id = ? AND wo.status = 'open' " +
            "ORDER BY wo.created_at DESC"
        )
        .bind(FACILITY_ID)
        .all<WorkOrder>();
    return result.results;
}

export async function getAlarms(): Promise<Alarm[]> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT id, equipment_tag, severity, alarm_name, description, status, occurred_at " +
            "FROM alarms WHERE facility_id = ? AND status = 'open' ORDER BY occurred_at DESC"
        )
        .bind(FACILITY_ID)
        .all<Alarm>();
    return result.results;
}

// ── All-status read helpers (list pages show every status, not just open) ────

export async function getAllFindings(): Promise<InspectionFinding[]> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT id, equipment_tag, finding_type, source, severity, summary, status, detected_at " +
            "FROM inspection_findings WHERE facility_id = ? ORDER BY detected_at DESC"
        )
        .bind(FACILITY_ID)
        .all<InspectionFinding>();
    return result.results;
}

export async function getAllSecurityEvents(): Promise<SecurityEvent[]> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT id, event_type, source, severity, summary, location_note, status, occurred_at " +
            "FROM security_events WHERE facility_id = ? ORDER BY occurred_at DESC"
        )
        .bind(FACILITY_ID)
        .all<SecurityEvent>();
    return result.results;
}

export async function getAllWorkOrders(): Promise<WorkOrder[]> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT wo.id, wo.equipment_tag, wo.title, wo.priority, wo.source_type, wo.source_id, wo.status, " +
            "CASE " +
            "  WHEN wo.source_type = 'inspection_finding' THEN if_.summary " +
            "  WHEN wo.source_type = 'alarm' THEN al.alarm_name " +
            "  ELSE NULL " +
            "END as source_summary " +
            "FROM work_orders wo " +
            "LEFT JOIN inspection_findings if_ ON wo.source_type = 'inspection_finding' AND wo.source_id = if_.id " +
            "LEFT JOIN alarms al ON wo.source_type = 'alarm' AND wo.source_id = al.id " +
            "WHERE wo.facility_id = ? " +
            "ORDER BY wo.created_at DESC"
        )
        .bind(FACILITY_ID)
        .all<WorkOrder>();
    return result.results;
}

export interface DocumentRow {
    id: string;
    title: string;
    doc_type: string;
    status: string;
    indexed_at: string | null;
}

export async function getAllDocuments(): Promise<DocumentRow[]> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT id, title, doc_type, status, indexed_at " +
            "FROM documents WHERE facility_id = ? ORDER BY title ASC"
        )
        .bind(FACILITY_ID)
        .all<DocumentRow>();
    return result.results;
}

export interface DomainReadiness {
    system: string;
    openHigh: number;
    openMedium: number;
    openLow: number;
    status: "At Risk" | "Watch" | "On Track";
}

/**
 * Groups OPEN inspection_findings and OPEN alarms by the owning equipment's
 * `system` (joined on equipment tag). status = "At Risk" if any high,
 * "Watch" if any medium, else "On Track".
 */
export async function getReadinessByDomain(): Promise<DomainReadiness[]> {
    const db = await getDB();

    // Union open findings + open alarms, resolve owning system via equipment tag.
    const result = await db
        .prepare(
            "SELECT e.system AS system, x.severity AS severity FROM (" +
            "  SELECT equipment_tag, severity FROM inspection_findings " +
            "    WHERE facility_id = ? AND status = 'open' " +
            "  UNION ALL " +
            "  SELECT equipment_tag, severity FROM alarms " +
            "    WHERE facility_id = ? AND status = 'open' " +
            ") x " +
            "JOIN equipment e ON e.tag = x.equipment_tag AND e.facility_id = ?"
        )
        .bind(FACILITY_ID, FACILITY_ID, FACILITY_ID)
        .all<{ system: string | null; severity: string }>();

    const bySystem = new Map<string, DomainReadiness>();
    for (const row of result.results) {
        const system = row.system ?? "unassigned";
        let entry = bySystem.get(system);
        if (!entry) {
            entry = { system, openHigh: 0, openMedium: 0, openLow: 0, status: "On Track" };
            bySystem.set(system, entry);
        }
        if (row.severity === "high" || row.severity === "critical") entry.openHigh++;
        else if (row.severity === "medium") entry.openMedium++;
        else entry.openLow++;
    }

    for (const entry of bySystem.values()) {
        entry.status =
            entry.openHigh > 0 ? "At Risk" :
            entry.openMedium > 0 ? "Watch" : "On Track";
    }

    return [...bySystem.values()].sort((a, b) => a.system.localeCompare(b.system));
}

// ── Work-order generation helpers ────────────────────────────────────────────

export interface FindingRow {
    id: string;
    equipment_tag: string;
    finding_type: string;
    source: string;
    severity: string;
    summary: string;
    detail: string | null;
    status: string;
}

export async function getFindingById(id: string): Promise<FindingRow | null> {
    const db = await getDB();
    const result = await db
        .prepare(
            "SELECT id, equipment_tag, finding_type, source, severity, summary, detail, status " +
            "FROM inspection_findings WHERE facility_id = ? AND id = ?"
        )
        .bind(FACILITY_ID, id)
        .first<FindingRow>();
    return result ?? null;
}

export interface SaveWorkOrderInput {
    id: string;
    equipment_tag: string;
    title: string;
    problem_statement: string;
    priority: string;
    probable_causes: string;
    recommended_actions: string;
    safety_notes: string;
    source_type: string;
    source_id: string;
}

/**
 * Idempotent persist — INSERT OR REPLACE on the caller-supplied fixed id.
 * facility_id is always FAC-UC and status is always 'open'.
 */
export async function saveWorkOrder(wo: SaveWorkOrderInput): Promise<string> {
    const db = await getDB();
    await db
        .prepare(
            "INSERT OR REPLACE INTO work_orders " +
            "(id, facility_id, equipment_tag, title, problem_statement, priority, " +
            "probable_causes, recommended_actions, safety_notes, source_type, source_id, status) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')"
        )
        .bind(
            wo.id,
            FACILITY_ID,
            wo.equipment_tag,
            wo.title,
            wo.problem_statement,
            wo.priority,
            wo.probable_causes,
            wo.recommended_actions,
            wo.safety_notes,
            wo.source_type,
            wo.source_id
        )
        .run();
    return wo.id;
}

// ── Ingestion engine upsert helpers (idempotent, caller-supplied ids) ─────────

export interface UpsertFindingInput {
    id: string;
    equipment_tag: string;
    finding_type: string;
    source: string;
    severity: string;
    summary: string;
    detail: string;
}

/**
 * Idempotent finding write — INSERT OR REPLACE on the caller-supplied id.
 * facility_id is always FAC-UC, status 'open', detected_at set to now.
 */
export async function upsertFinding(f: UpsertFindingInput): Promise<string> {
    const db = await getDB();
    await db
        .prepare(
            "INSERT OR REPLACE INTO inspection_findings " +
            "(id, facility_id, equipment_tag, finding_type, source, severity, summary, detail, detected_at, status) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')"
        )
        .bind(
            f.id,
            FACILITY_ID,
            f.equipment_tag,
            f.finding_type,
            f.source,
            f.severity,
            f.summary,
            f.detail,
            new Date().toISOString()
        )
        .run();
    return f.id;
}

export interface UpsertAlarmInput {
    id: string;
    equipment_tag: string;
    severity: string;
    alarm_name: string;
    description: string;
}

/**
 * Idempotent alarm write — INSERT OR REPLACE on the caller-supplied id.
 * facility_id is always FAC-UC, status 'open', occurred_at set to now.
 */
export async function upsertAlarm(a: UpsertAlarmInput): Promise<string> {
    const db = await getDB();
    await db
        .prepare(
            "INSERT OR REPLACE INTO alarms " +
            "(id, facility_id, equipment_tag, severity, alarm_name, description, occurred_at, status) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, 'open')"
        )
        .bind(
            a.id,
            FACILITY_ID,
            a.equipment_tag,
            a.severity,
            a.alarm_name,
            a.description,
            new Date().toISOString()
        )
        .run();
    return a.id;
}
