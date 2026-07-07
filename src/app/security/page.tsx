export const dynamic = "force-dynamic";

import { getAllSecurityEvents } from "@/lib/db";
import {
    PageHeader,
    Card,
    EmptyState,
    SeverityDot,
    SourceBadge,
    StatusPill,
    severityTextColor,
} from "@/app/_components/ui";

export default async function SecurityPage() {
    const events = await getAllSecurityEvents();

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <PageHeader
                title="Security"
                subtitle="Security events and access anomalies across the Union County Campus."
            />
            <Card>
                {events.length === 0 ? (
                    <EmptyState />
                ) : (
                    events.map((e, i) => (
                        <div
                            key={e.id}
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
                                <SeverityDot severity={e.severity} />
                            </div>
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text-muted)", textTransform: "capitalize" }}>
                                        {e.event_type.replace(/_/g, " ")}
                                    </span>
                                    <span style={{ fontSize: 12, color: severityTextColor(e.severity), fontWeight: 500, textTransform: "capitalize" }}>
                                        {e.severity}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13.5, color: "var(--ds-text-primary)", lineHeight: 1.4 }}>
                                    {e.summary}
                                </div>
                            </div>
                            <SourceBadge source={e.source} />
                            <StatusPill status={e.status} />
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}
