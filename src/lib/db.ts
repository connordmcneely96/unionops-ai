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
