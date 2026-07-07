"use client";

import { useState } from "react";
import { FileText, Printer } from "lucide-react";

// ── Types mirror the /api/report response ────────────────────────────────────

interface Facility {
    name: string;
    location: string;
    power_capacity_mw: number;
    target_power_mw: number;
    cooling_type: string;
    gas_generation: number;
}
interface Finding {
    id: string;
    equipment_tag: string;
    summary: string;
    severity: string;
    source: string;
}
interface Alarm {
    id: string;
    equipment_tag: string;
    alarm_name: string;
    severity: string;
}
interface WorkOrder {
    id: string;
    title: string;
    priority: string;
    source_summary: string | null;
}
interface DomainReadiness {
    system: string;
    openHigh: number;
    openMedium: number;
    openLow: number;
    status: string;
}
interface ReportData {
    facility: Facility | null;
    readiness: { score: number; label: string };
    openHighFindings: Finding[];
    openAlarms: Alarm[];
    workOrders: WorkOrder[];
    byDomain: DomainReadiness[];
    generatedAt: string;
}
interface Narrative {
    executiveSummary: string;
    keyRisks: string;
    recommendedActions: string[];
}
interface ReportResponse {
    data: ReportData;
    narrative: Narrative;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(sev: string): string {
    if (sev === "high" || sev === "critical") return "var(--ds-sev-high)";
    if (sev === "medium") return "var(--ds-sev-medium)";
    return "var(--ds-sev-low)";
}

function statusColor(status: string): string {
    if (status === "At Risk") return "var(--ds-sev-high)";
    if (status === "Watch") return "var(--ds-sev-medium)";
    return "var(--ds-sev-low)";
}

function formatSource(raw: string): string {
    return raw
        .replace(/_/g, " ")
        .replace("drone thermal", "DRONE·THERMAL")
        .replace("drone ogi", "DRONE·OGI")
        .replace("drone patrol", "DRONE·PATROL")
        .toUpperCase();
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
            }}
        >
            {formatSource(source)}
        </span>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2
            style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ds-text-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "24px 0 12px",
            }}
        >
            {children}
        </h2>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    async function generate() {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch("/api/report", {
                method: "POST",
                headers: { "content-type": "application/json" },
            });
            if (!res.ok) {
                setError(true);
                return;
            }
            const data = (await res.json()) as ReportResponse;
            setReport(data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    const data = report?.data;
    const narrative = report?.narrative;
    const facility = data?.facility;

    const generatedDate = data
        ? new Date(data.generatedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : "";

    return (
        <div className="reports-page" style={{ maxWidth: 820, margin: "0 auto" }}>
            {/* Controls — hidden in print */}
            <div className="report-controls">
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 20,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 4,
                            }}
                        >
                            <h1
                                style={{
                                    fontSize: 20,
                                    fontWeight: 600,
                                    color: "var(--ds-text-primary)",
                                    margin: 0,
                                }}
                            >
                                Board-Level Readiness Report
                            </h1>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    backgroundColor: "#fef3c7",
                                    color: "#92400e",
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    border: "1px solid #fde68a",
                                }}
                            >
                                Demo Data
                            </span>
                        </div>
                        <p
                            style={{
                                fontSize: 13.5,
                                color: "var(--ds-text-secondary)",
                                margin: 0,
                            }}
                        >
                            Generate an executive readiness summary from current facility data.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                            onClick={generate}
                            disabled={loading}
                            style={{
                                backgroundColor: "var(--ds-accent)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 8,
                                padding: "0 16px",
                                height: 40,
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.6 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 13.5,
                                fontWeight: 500,
                            }}
                        >
                            <FileText size={16} strokeWidth={1.5} />
                            {loading ? "Compiling facility readiness…" : "Generate Board-Level Readiness Report"}
                        </button>

                        {report && (
                            <button
                                onClick={() => window.print()}
                                style={{
                                    backgroundColor: "var(--ds-card)",
                                    color: "var(--ds-text-secondary)",
                                    border: "1px solid var(--ds-border)",
                                    borderRadius: 8,
                                    padding: "0 14px",
                                    height: 40,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 13.5,
                                    fontWeight: 500,
                                }}
                            >
                                <Printer size={16} strokeWidth={1.5} />
                                Print / Save as PDF
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div
                        style={{
                            fontSize: 13,
                            color: "var(--ds-sev-high)",
                            opacity: 0.8,
                            marginBottom: 16,
                        }}
                    >
                        Something went wrong — try again.
                    </div>
                )}
            </div>

            {/* Report card */}
            {data && (
                <div
                    className="report-card"
                    style={{
                        backgroundColor: "var(--ds-card)",
                        border: "1px solid var(--ds-border)",
                        borderRadius: "var(--ds-radius)",
                        boxShadow: "var(--ds-shadow)",
                        padding: 32,
                    }}
                >
                    {/* 1. Facility header */}
                    <div style={{ borderBottom: "1px solid var(--ds-border)", paddingBottom: 16, marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--ds-text-primary)", margin: 0 }}>
                                {facility?.name ?? "Facility"}
                            </h1>
                            <span style={{ fontSize: 14, color: "var(--ds-text-muted)" }}>
                                {facility?.location}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
                            {facility && (
                                <>
                                    <span style={badgeStyle}>{facility.power_capacity_mw} → {facility.target_power_mw} MW</span>
                                    <span style={{ ...badgeStyle, textTransform: "capitalize" }}>{facility.cooling_type} Cooling</span>
                                    {facility.gas_generation === 1 && <span style={badgeStyle}>Gas Generation</span>}
                                </>
                            )}
                            <span style={{ fontSize: 12, color: "var(--ds-text-muted)", marginLeft: "auto" }}>
                                {generatedDate}
                            </span>
                        </div>
                    </div>

                    {/* 2. Readiness (deterministic — from data) */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "20px 0" }}>
                        <div style={{ fontSize: 44, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--ds-text-primary)", lineHeight: 1 }}>
                            {data.readiness.score}
                            <span style={{ fontSize: 20, fontWeight: 400, color: "var(--ds-text-muted)" }}>/100</span>
                        </div>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 12px",
                                borderRadius: 12,
                                backgroundColor: `${statusColor(data.readiness.label)}18`,
                                border: `1px solid ${statusColor(data.readiness.label)}40`,
                            }}
                        >
                            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: statusColor(data.readiness.label), display: "inline-block" }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: statusColor(data.readiness.label) }}>
                                {data.readiness.label}
                            </span>
                        </div>
                    </div>

                    {/* 3. Executive Summary */}
                    <SectionTitle>Executive Summary</SectionTitle>
                    <p style={paraStyle}>
                        {narrative?.executiveSummary || <span style={{ color: "var(--ds-text-muted)" }}>Narrative unavailable — numbers above and below are current facility data.</span>}
                    </p>

                    {/* 4. Readiness by Domain */}
                    <SectionTitle>Readiness by Domain</SectionTitle>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--ds-border)" }}>
                                <th style={thStyle}>System</th>
                                <th style={thStyle}>Status</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>High</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>Medium</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>Low</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.byDomain.length === 0 ? (
                                <tr><td colSpan={5} style={{ ...tdStyle, color: "var(--ds-text-muted)" }}>No open items across any domain.</td></tr>
                            ) : (
                                data.byDomain.map((d) => (
                                    <tr key={d.system} style={{ borderBottom: "1px solid var(--ds-border)" }}>
                                        <td style={{ ...tdStyle, textTransform: "capitalize" }}>{d.system.replace(/_/g, " ")}</td>
                                        <td style={tdStyle}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: statusColor(d.status), display: "inline-block" }} />
                                                <span style={{ color: statusColor(d.status), fontWeight: 500 }}>{d.status}</span>
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.openHigh}</td>
                                        <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.openMedium}</td>
                                        <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.openLow}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* 5. Key Risks */}
                    <SectionTitle>Key Risks</SectionTitle>
                    {narrative?.keyRisks && <p style={paraStyle}>{narrative.keyRisks}</p>}

                    <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text-secondary)", marginBottom: 8 }}>
                            Open High-Severity Findings
                        </div>
                        {data.openHighFindings.length === 0 ? (
                            <p style={{ ...paraStyle, color: "var(--ds-text-muted)" }}>None.</p>
                        ) : (
                            data.openHighFindings.map((f) => (
                                <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: severityColor(f.severity), display: "inline-block", marginTop: 6, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text-muted)", fontVariantNumeric: "tabular-nums" }}>{f.equipment_tag}</span>
                                    <span style={{ fontSize: 13, color: "var(--ds-text-primary)", flex: 1, minWidth: 200 }}>{f.summary}</span>
                                    <SourceBadge source={f.source} />
                                </div>
                            ))
                        )}

                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text-secondary)", margin: "16px 0 8px" }}>
                            Open Alarms
                        </div>
                        {data.openAlarms.length === 0 ? (
                            <p style={{ ...paraStyle, color: "var(--ds-text-muted)" }}>None.</p>
                        ) : (
                            data.openAlarms.map((a) => (
                                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                                    <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: severityColor(a.severity), display: "inline-block", flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: "var(--ds-text-primary)" }}>{a.alarm_name}</span>
                                    <span style={{ fontSize: 12, color: "var(--ds-text-muted)" }}>· {a.equipment_tag}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 6. Remediation In Progress */}
                    <SectionTitle>Remediation In Progress</SectionTitle>
                    {data.workOrders.length === 0 ? (
                        <p style={{ ...paraStyle, color: "var(--ds-text-muted)" }}>No work orders in progress.</p>
                    ) : (
                        data.workOrders.map((wo) => (
                            <div key={wo.id} style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ds-text-primary)" }}>{wo.title}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: severityColor(wo.priority), textTransform: "uppercase", letterSpacing: "0.05em" }}>{wo.priority}</span>
                                </div>
                                {wo.source_summary && (
                                    <div style={{ fontSize: 12, color: "var(--ds-text-muted)", fontStyle: "italic" }}>
                                        from: <span style={{ color: "var(--ds-text-secondary)" }}>{wo.source_summary}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* 7. Recommended Next Actions */}
                    <SectionTitle>Recommended Next Actions</SectionTitle>
                    {narrative && narrative.recommendedActions.length > 0 ? (
                        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: "var(--ds-text-primary)", lineHeight: 1.6 }}>
                            {narrative.recommendedActions.map((action, i) => (
                                <li key={i} style={{ marginBottom: 4 }}>{action}</li>
                            ))}
                        </ol>
                    ) : (
                        <p style={{ ...paraStyle, color: "var(--ds-text-muted)" }}>No recommended actions available.</p>
                    )}

                    {/* 8. Footer */}
                    <div style={{ borderTop: "1px solid var(--ds-border)", marginTop: 28, paddingTop: 14, fontSize: 11.5, color: "var(--ds-text-muted)" }}>
                        Illustrative demo content — generated from current facility data.
                    </div>
                </div>
            )}
        </div>
    );
}

const badgeStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--ds-text-secondary)",
    backgroundColor: "var(--ds-badge-bg)",
    padding: "3px 10px",
    borderRadius: 4,
    fontWeight: 500,
};

const paraStyle: React.CSSProperties = {
    fontSize: 13.5,
    color: "var(--ds-text-primary)",
    lineHeight: 1.6,
    margin: 0,
};

const thStyle: React.CSSProperties = {
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--ds-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "6px 8px",
};

const tdStyle: React.CSSProperties = {
    padding: "8px",
    color: "var(--ds-text-primary)",
};
