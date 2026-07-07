export const dynamic = "force-dynamic";

import { getAllFindings } from "@/lib/db";
import {
    PageHeader,
    Card,
    EmptyState,
    SeverityDot,
    SourceBadge,
    StatusPill,
    severityTextColor,
} from "@/app/_components/ui";
import { GenerateWorkOrder } from "@/app/_components/GenerateWorkOrder";

const SEVERITY_RANK: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
};

export default async function InspectionsPage() {
    const findings = await getAllFindings();

    const sorted = [...findings].sort(
        (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9)
    );

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <PageHeader
                title="Inspections"
                subtitle="Inspection findings across the Union County Campus, highest severity first."
            />
            <Card>
                {sorted.length === 0 ? (
                    <EmptyState />
                ) : (
                    sorted.map((f, i) => (
                        <div
                            key={f.id}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "12px 0",
                                borderTop: i > 0 ? "1px solid var(--ds-border)" : "none",
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ marginTop: 5 }}>
                                <SeverityDot severity={f.severity} />
                            </div>
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                                        {f.equipment_tag}
                                    </span>
                                    <span style={{ fontSize: 12, color: severityTextColor(f.severity), fontWeight: 500, textTransform: "capitalize" }}>
                                        {f.severity}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13.5, color: "var(--ds-text-primary)", lineHeight: 1.4 }}>
                                    {f.summary}
                                </div>
                            </div>
                            <SourceBadge source={f.source} />
                            <StatusPill status={f.status} />
                            <div style={{ width: "100%", marginLeft: 17 }}>
                                <GenerateWorkOrder
                                    finding={{
                                        id: f.id,
                                        equipment_tag: f.equipment_tag,
                                        severity: f.severity,
                                        summary: f.summary,
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}
