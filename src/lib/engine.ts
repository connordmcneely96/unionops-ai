// Deterministic threshold engine — PURE arithmetic, no I/O, no env, no LLM.
// Applies THRESHOLDS to measured data and emits findings/alarms. Unit-testable.

import { THRESHOLDS } from "@/lib/thresholds";

export type Severity = "high" | "medium" | "low";

export interface ThermalPoint {
    point_id: string;
    equipment_tag: string;
    component: string;
    temp_f: number;
    load_pct: number;
}

export interface ThermalResult {
    equipment_tag: string;
    severity: Severity;
    finding_type: string;
    summary: string;
    detail: string;
}

/**
 * Classify thermographic scan points per equipment group.
 * maxDeltaSimilar = hottest − coolest point in the group (phase-to-phase).
 * Returns one result per equipment_tag.
 */
export function classifyThermal(
    points: ThermalPoint[],
    ambientF?: number
): ThermalResult[] {
    const { deltaSimilarF, deltaAmbientEmergencyF, minValidLoadPct } =
        THRESHOLDS.thermal;

    // Group by equipment_tag, preserving first-seen order.
    const groups = new Map<string, ThermalPoint[]>();
    for (const p of points) {
        const list = groups.get(p.equipment_tag);
        if (list) list.push(p);
        else groups.set(p.equipment_tag, [p]);
    }

    const results: ThermalResult[] = [];

    for (const [equipment_tag, groupPoints] of groups) {
        // Invalid-load guard: if EVERY point is below the valid survey load,
        // the scan is inconclusive — do not raise severity from the delta.
        const allBelowLoad = groupPoints.every(
            (p) => p.load_pct < minValidLoadPct
        );
        if (allBelowLoad) {
            results.push({
                equipment_tag,
                severity: "low",
                finding_type: "thermal_invalid_load",
                summary:
                    "Scan below valid survey load (<40%); results inconclusive.",
                detail:
                    `All ${groupPoints.length} scan point(s) on ${equipment_tag} were recorded below ` +
                    `${minValidLoadPct}% rated load, so the thermographic comparison is not valid ` +
                    `per site standard. Re-scan under representative load.`,
            });
            continue;
        }

        const temps = groupPoints.map((p) => p.temp_f);
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const maxDeltaSimilar = maxTemp - minTemp;
        const hottest = groupPoints.find((p) => p.temp_f === maxTemp)!;

        // Severity from phase-to-phase delta.
        let severity: Severity;
        if (maxDeltaSimilar > deltaSimilarF.probableMax) severity = "high";
        else if (maxDeltaSimilar > deltaSimilarF.investigateMax) severity = "medium";
        else severity = "low";

        // Emergency override from ΔT over ambient air.
        let emergency = false;
        if (ambientF !== undefined && maxTemp - ambientF > deltaAmbientEmergencyF) {
            severity = "high";
            emergency = true;
        }

        const deltaRounded = Math.round(maxDeltaSimilar);
        let summary: string;
        if (emergency) {
            summary =
                `${hottest.component} ${Math.round(maxTemp)}°F, ${deltaRounded}°F above coolest phase and ` +
                `>${deltaAmbientEmergencyF}°F over ambient — emergency: component failure may be imminent.`;
        } else if (severity === "high") {
            summary =
                `${hottest.component} ${Math.round(maxTemp)}°F, ${deltaRounded}°F above coolest phase — ` +
                `exceeds NETA ${deltaSimilarF.probableMax}°F immediate-action threshold.`;
        } else if (severity === "medium") {
            summary =
                `${hottest.component} ${Math.round(maxTemp)}°F, ${deltaRounded}°F above coolest phase — ` +
                `probable deficiency (NETA ${deltaSimilarF.investigateMax}–${deltaSimilarF.probableMax}°F band).`;
        } else {
            summary =
                `${hottest.component} ${Math.round(maxTemp)}°F, ${deltaRounded}°F above coolest phase — ` +
                `within investigate/monitor range.`;
        }

        const detail =
            `Hottest point ${hottest.point_id} (${hottest.component}) at ${Math.round(maxTemp)}°F; ` +
            `coolest ${Math.round(minTemp)}°F; ΔT ${deltaRounded}°F across ${groupPoints.length} similar points` +
            (ambientF !== undefined ? `; ambient ${Math.round(ambientF)}°F` : "") +
            `. Thresholds: investigate ≤${deltaSimilarF.investigateMax}°F, ` +
            `probable ${deltaSimilarF.investigateMax}–${deltaSimilarF.probableMax}°F, ` +
            `major >${deltaSimilarF.probableMax}°F, ambient-emergency >${deltaAmbientEmergencyF}°F.`;

        results.push({
            equipment_tag,
            severity,
            finding_type: "thermal_anomaly",
            summary,
            detail,
        });
    }

    return results;
}

export interface TelemetryReading {
    equipment_tag: string;
    metric: string;
    value: number;
    unit: string;
}

export interface TelemetryFinding {
    equipment_tag: string;
    severity: Severity;
    finding_type: string;
    summary: string;
    detail: string;
}

export interface TelemetryAlarm {
    equipment_tag: string;
    metric: string;
    severity: Severity;
    alarm_name: string;
    description: string;
}

export interface TelemetryResult {
    findings: TelemetryFinding[];
    alarms: TelemetryAlarm[];
}

/**
 * Evaluate telemetry readings against cooling thresholds.
 * Known metrics: coolant_return_f, loop_flow_gpm, filter_dp_psi.
 * Unknown metrics are ignored.
 */
export function evaluateTelemetry(readings: TelemetryReading[]): TelemetryResult {
    const { coolantReturnF, loopFlowGpm, filterDpPsi } = THRESHOLDS.cooling;
    const findings: TelemetryFinding[] = [];
    const alarms: TelemetryAlarm[] = [];

    for (const r of readings) {
        switch (r.metric) {
            case "coolant_return_f":
                if (r.value > coolantReturnF.alarm) {
                    alarms.push({
                        equipment_tag: r.equipment_tag,
                        metric: r.metric,
                        severity: "high",
                        alarm_name: "High Coolant Return Temp",
                        description:
                            `Coolant return temperature ${r.value}°F exceeds high setpoint ` +
                            `${coolantReturnF.alarm}°F on ${r.equipment_tag}.`,
                    });
                }
                break;
            case "loop_flow_gpm":
                if (r.value < loopFlowGpm.low) {
                    findings.push({
                        equipment_tag: r.equipment_tag,
                        severity: "medium",
                        finding_type: "low_flow",
                        summary:
                            `Loop flow ${r.value} GPM below ${loopFlowGpm.low} GPM design minimum on ${r.equipment_tag}.`,
                        detail:
                            `Measured loop flow ${r.value} GPM is under the ${loopFlowGpm.low} GPM ` +
                            `alert threshold. Investigate pump status, valve positions, and filter condition.`,
                    });
                }
                break;
            case "filter_dp_psi":
                if (r.value > filterDpPsi.inspect) {
                    findings.push({
                        equipment_tag: r.equipment_tag,
                        severity: "medium",
                        finding_type: "filter_dp",
                        summary:
                            `Filter ΔP ${r.value} psi exceeds ${filterDpPsi.inspect} psi inspection threshold on ${r.equipment_tag}.`,
                        detail:
                            `Measured filter differential pressure ${r.value} psi is above the ` +
                            `${filterDpPsi.inspect} psi threshold; inspect/replace the filter element per SOP.`,
                    });
                }
                break;
            default:
                // Unknown metric — ignored.
                break;
        }
    }

    return { findings, alarms };
}
