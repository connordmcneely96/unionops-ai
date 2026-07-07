import {
    getFacility,
    getKpis,
    getFindings,
    getSecurityEvents,
    getWorkOrders,
    getAlarms,
    getReadinessByDomain,
    type Facility,
    type Kpis,
    type InspectionFinding,
    type SecurityEvent,
    type Alarm,
    type WorkOrder,
    type DomainReadiness,
} from "@/lib/db";
import { computeReadiness, type ReadinessResult } from "@/lib/readiness";

export interface ReportData {
    facility: Facility | null;
    readiness: ReadinessResult;
    kpis: Kpis;
    openHighFindings: InspectionFinding[];
    openSecurity: SecurityEvent[];
    openAlarms: Alarm[];
    workOrders: WorkOrder[];
    byDomain: DomainReadiness[];
    generatedAt: string;
}

/**
 * Single source of truth for every number in the board-level report.
 * All risk sections use OPEN items only. Readiness is computed deterministically
 * from open-item severity counts — the LLM never produces these numbers.
 */
export async function gatherReportData(): Promise<ReportData> {
    const [facility, kpis, findings, security, alarms, workOrders, byDomain] =
        await Promise.all([
            getFacility(),
            getKpis(),
            getFindings(),
            getSecurityEvents(),
            getAlarms(),
            getWorkOrders(),
            getReadinessByDomain(),
        ]);

    const readiness = computeReadiness({
        findingsBySeverity: kpis.findingsBySeverity,
        securityBySeverity: kpis.securityBySeverity,
        alarmsBySeverity: kpis.alarmsBySeverity,
    });

    const openHighFindings = findings.filter(
        (f) => f.severity === "high" || f.severity === "critical"
    );

    return {
        facility,
        readiness,
        kpis,
        openHighFindings,
        openSecurity: security,
        openAlarms: alarms,
        workOrders,
        byDomain,
        generatedAt: new Date().toISOString(),
    };
}
