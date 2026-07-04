export const dynamic = "force-dynamic";

import {
    getFacility,
    getKpis,
    getFindings,
    getSecurityEvents,
    getWorkOrders,
    getAlarms,
} from "@/lib/db";
import { computeReadiness } from "@/lib/readiness";
import type { InspectionFinding, SecurityEvent, WorkOrder, Alarm } from "@/lib/db";
import { AlertTriangle, Zap, Thermometer, Shield, Wrench, FileText, Bell } from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatSource(raw: string): string {
    return raw
        .replace(/_/g, " ")
        .replace("drone thermal", "DRONE·THERMAL")
        .replace("drone ogi", "DRONE·OGI")
        .replace("drone patrol", "DRONE·PATROL")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .toUpperCase();
}

function severityColor(sev: string): string {
    if (sev === "high" || sev === "critical") return "var(--ds-sev-high)";
    if (sev === "medium") return "var(--ds-sev-medium)";
    return "var(--ds-sev-low)";
}

// ── Shared primitives ────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div
            style={{
                backgroundColor: "var(--ds-card)",
                border: "1px solid var(--ds-border)",
                borderRadius: "var(--ds-radius)",
                boxShadow: "var(--ds-shadow)",
                padding: "20px",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
            }}
        >
            <span
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ds-text-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                }}
            >
                {title}
            </span>
            {count !== undefined && (
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: "var(--ds-badge-bg)",
                        color: "var(--ds-text-secondary)",
                        padding: "1px 6px",
                        borderRadius: 10,
                    }}
                >
                    {count}
                </span>
            )}
        </div>
    );
}

function SeverityDot({ severity }: { severity: string }) {
    return (
        <span
            style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: severityColor(severity),
                flexShrink: 0,
            }}
        />
    );
}

function SourceBadge({ source }: { source: string }) {
    return (
        <span
            style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                backgroundColor: "var(--ds-badge-bg)",
                color: "var(--ds-badge-text)",
                padding: "2px 6px",
                borderRadius: 4,
                whiteSpace: "nowrap",
                flexShrink: 0,
            }}
        >
            {formatSource(source)}
        </span>
    );
}

function Divider() {
    return (
        <div
            style={{
                borderTop: "1px solid var(--ds-border)",
                margin: "0 -20px",
                marginBottom: 0,
            }}
        />
    );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    accent?: boolean;
}) {
    return (
        <Card style={{ padding: "16px 20px", flex: 1, minWidth: 120 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                }}
            >
                <span
                    style={{
                        fontSize: 12,
                        color: "var(--ds-text-secondary)",
                        fontWeight: 500,
                    }}
                >
                    {label}
                </span>
                <Icon
                    size={16}
                    strokeWidth={1.5}
                    style={{ color: "var(--ds-text-muted)" }}
                />
            </div>
            <div
                style={{
                    fontSize: 28,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: accent ? "var(--ds-sev-high)" : "var(--ds-text-primary)",
                    lineHeight: 1,
                }}
            >
                {value}
            </div>
        </Card>
    );
}

// ── Readiness Card ───────────────────────────────────────────────────────────

function ReadinessCard({ score, label }: { score: number; label: string }) {
    const statusColor =
        label === "On Track"
            ? "var(--ds-sev-low)"
            : label === "Watch"
            ? "var(--ds-sev-medium)"
            : "var(--ds-sev-high)";

    return (
        <Card style={{ padding: "20px", minWidth: 180 }}>
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ds-text-secondary)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                }}
            >
                Readiness
            </div>
            <div
                style={{
                    fontSize: 48,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--ds-text-primary)",
                    lineHeight: 1,
                    marginBottom: 8,
                }}
            >
                {score}
                <span style={{ fontSize: 22, fontWeight: 400, color: "var(--ds-text-muted)" }}>
                    /100
                </span>
            </div>
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: 12,
                    backgroundColor: `${statusColor}18`,
                    border: `1px solid ${statusColor}40`,
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: statusColor,
                        display: "inline-block",
                    }}
                />
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: statusColor,
                    }}
                >
                    {label}
                </span>
            </div>
        </Card>
    );
}

// ── Facility Header ──────────────────────────────────────────────────────────

function FacilityHeader({
    name,
    location,
    powerCapacity,
    targetPower,
    coolingType,
    gasGeneration,
}: {
    name: string;
    location: string;
    powerCapacity: number;
    targetPower: number;
    coolingType: string;
    gasGeneration: number;
}) {
    return (
        <div
            style={{
                marginBottom: 24,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 8,
                    flexWrap: "wrap",
                }}
            >
                <h1
                    style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: "var(--ds-text-primary)",
                        margin: 0,
                    }}
                >
                    {name}
                </h1>
                <span style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>{location}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span
                    style={{
                        fontSize: 12,
                        color: "var(--ds-text-secondary)",
                        backgroundColor: "var(--ds-badge-bg)",
                        padding: "3px 10px",
                        borderRadius: 4,
                        fontWeight: 500,
                    }}
                >
                    {powerCapacity} → {targetPower} MW
                </span>
                <span
                    style={{
                        fontSize: 12,
                        color: "var(--ds-text-secondary)",
                        backgroundColor: "var(--ds-badge-bg)",
                        padding: "3px 10px",
                        borderRadius: 4,
                        fontWeight: 500,
                        textTransform: "capitalize",
                    }}
                >
                    {coolingType} Cooling
                </span>
                {gasGeneration === 1 && (
                    <span
                        style={{
                            fontSize: 12,
                            color: "var(--ds-text-secondary)",
                            backgroundColor: "var(--ds-badge-bg)",
                            padding: "3px 10px",
                            borderRadius: 4,
                            fontWeight: 500,
                        }}
                    >
                        Gas Generation
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Detail Panels ────────────────────────────────────────────────────────────

function FindingsPanel({ findings }: { findings: InspectionFinding[] }) {
    return (
        <Card>
            <SectionHeader title="Inspection Findings" count={findings.length} />
            <div style={{ display: "flex", flexDirection: "column" }}>
                {findings.map((f, i) => (
                    <div key={f.id}>
                        {i > 0 && <Divider />}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "12px 0",
                                flexWrap: "wrap",
                            }}
                        >
                            <SeverityDot severity={f.severity} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        marginBottom: 3,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "var(--ds-text-muted)",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {f.equipment_tag}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: severityColor(f.severity),
                                            fontWeight: 500,
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {f.severity}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 13.5,
                                        color: "var(--ds-text-primary)",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {f.summary}
                                </div>
                            </div>
                            <SourceBadge source={f.source} />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function SecurityPanel({ events }: { events: SecurityEvent[] }) {
    return (
        <Card>
            <SectionHeader title="Security Events" count={events.length} />
            <div style={{ display: "flex", flexDirection: "column" }}>
                {events.map((e, i) => (
                    <div key={e.id}>
                        {i > 0 && <Divider />}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "12px 0",
                                flexWrap: "wrap",
                            }}
                        >
                            <SeverityDot severity={e.severity} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        marginBottom: 3,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "var(--ds-text-muted)",
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {e.event_type.replace(/_/g, " ")}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: severityColor(e.severity),
                                            fontWeight: 500,
                                            textTransform: "capitalize",
                                        }}
                                    >
                                        {e.severity}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 13.5,
                                        color: "var(--ds-text-primary)",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {e.summary}
                                </div>
                            </div>
                            <SourceBadge source={e.source} />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function WorkOrdersPanel({ orders }: { orders: WorkOrder[] }) {
    return (
        <Card>
            <SectionHeader title="Work Orders" count={orders.length} />
            <div style={{ display: "flex", flexDirection: "column" }}>
                {orders.map((wo, i) => (
                    <div key={wo.id}>
                        {i > 0 && <Divider />}
                        <div style={{ padding: "12px 0" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 8,
                                    marginBottom: 5,
                                    flexWrap: "wrap",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 13.5,
                                        fontWeight: 500,
                                        color: "var(--ds-text-primary)",
                                        flex: 1,
                                    }}
                                >
                                    {wo.title}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: severityColor(wo.priority),
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    {wo.priority}
                                </span>
                            </div>
                            {wo.source_summary && (
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "var(--ds-text-muted)",
                                        fontStyle: "italic",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    from:{" "}
                                    <span style={{ color: "var(--ds-text-secondary)" }}>
                                        {wo.source_summary}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function AlarmsPanel({ alarms }: { alarms: Alarm[] }) {
    return (
        <Card>
            <SectionHeader title="Alarms" count={alarms.length} />
            <div style={{ display: "flex", flexDirection: "column" }}>
                {alarms.map((a, i) => (
                    <div key={a.id}>
                        {i > 0 && <Divider />}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "11px 0",
                                flexWrap: "wrap",
                            }}
                        >
                            <SeverityDot severity={a.severity} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 13.5,
                                        fontWeight: 500,
                                        color: "var(--ds-text-primary)",
                                        marginBottom: 2,
                                    }}
                                >
                                    {a.alarm_name}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--ds-text-muted)" }}>
                                    {a.equipment_tag}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: severityColor(a.severity),
                                    textTransform: "capitalize",
                                    letterSpacing: "0.03em",
                                }}
                            >
                                {a.severity}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
    const [facility, kpis, findings, securityEvents, workOrders, alarms] = await Promise.all([
        getFacility(),
        getKpis(),
        getFindings(),
        getSecurityEvents(),
        getWorkOrders(),
        getAlarms(),
    ]);

    const readiness = computeReadiness({
        findingsBySeverity: kpis.findingsBySeverity,
        securityBySeverity: kpis.securityBySeverity,
        alarmsBySeverity: kpis.alarmsBySeverity,
    });

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {facility && (
                <FacilityHeader
                    name={facility.name}
                    location={facility.location}
                    powerCapacity={facility.power_capacity_mw}
                    targetPower={facility.target_power_mw}
                    coolingType={facility.cooling_type}
                    gasGeneration={facility.gas_generation}
                />
            )}

            {/* Top row: Readiness + KPIs */}
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 24,
                    flexWrap: "wrap",
                }}
            >
                <ReadinessCard score={readiness.score} label={readiness.label} />

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flex: 1,
                        flexWrap: "wrap",
                    }}
                >
                    <KpiCard
                        label="Open Findings"
                        value={kpis.openFindings}
                        icon={AlertTriangle}
                        accent={kpis.openFindings > 0}
                    />
                    <KpiCard
                        label="Security Events"
                        value={kpis.openSecurityEvents}
                        icon={Shield}
                        accent={kpis.openSecurityEvents > 0}
                    />
                    <KpiCard
                        label="Work Orders"
                        value={kpis.openWorkOrders}
                        icon={Wrench}
                    />
                    <KpiCard
                        label="Open Alarms"
                        value={kpis.openAlarms}
                        icon={Bell}
                        accent={kpis.openAlarms > 0}
                    />
                    <KpiCard
                        label="Equipment"
                        value={kpis.equipmentCount}
                        icon={Zap}
                    />
                    <KpiCard
                        label="Documents"
                        value={kpis.docsCount}
                        icon={FileText}
                    />
                </div>
            </div>

            {/* Detail panels: 2-column grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
                    gap: 16,
                }}
            >
                <FindingsPanel findings={findings} />
                <SecurityPanel events={securityEvents} />
                <WorkOrdersPanel orders={workOrders} />
                <AlarmsPanel alarms={alarms} />
            </div>
        </div>
    );
}
