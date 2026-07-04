export interface ReadinessInput {
    findingsBySeverity: Record<string, number>;
    securityBySeverity: Record<string, number>;
    alarmsBySeverity: Record<string, number>;
}

export interface ReadinessResult {
    score: number;
    label: "On Track" | "Watch" | "At Risk";
}

const WEIGHTS = {
    findings: { high: 6, medium: 3, low: 1 },
    security: { high: 5, medium: 3, low: 1 },
    alarms:   { high: 4, medium: 2, low: 1 },
};

function deduct(bySeverity: Record<string, number>, weights: Record<string, number>): number {
    let total = 0;
    for (const [sev, count] of Object.entries(bySeverity)) {
        total += (weights[sev] ?? 0) * count;
    }
    return total;
}

export function computeReadiness(counts: ReadinessInput): ReadinessResult {
    const penalty =
        deduct(counts.findingsBySeverity, WEIGHTS.findings) +
        deduct(counts.securityBySeverity, WEIGHTS.security) +
        deduct(counts.alarmsBySeverity, WEIGHTS.alarms);

    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    const label =
        score >= 80 ? "On Track" :
        score >= 60 ? "Watch" : "At Risk";

    return { score, label };
}
