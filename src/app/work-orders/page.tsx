export const dynamic = "force-dynamic";

import { getAllWorkOrders } from "@/lib/db";
import {
    PageHeader,
    Card,
    EmptyState,
    StatusPill,
    severityTextColor,
} from "@/app/_components/ui";

export default async function WorkOrdersPage() {
    const orders = await getAllWorkOrders();

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <PageHeader
                title="Work Orders"
                subtitle="Remediation work orders and their source finding or alarm."
            />
            <Card>
                {orders.length === 0 ? (
                    <EmptyState />
                ) : (
                    orders.map((wo, i) => (
                        <div
                            key={wo.id}
                            style={{
                                padding: "12px 0",
                                borderTop: i > 0 ? "1px solid var(--ds-border)" : "none",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ds-text-primary)", flex: 1, minWidth: 200 }}>
                                    {wo.title}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: severityTextColor(wo.priority), textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {wo.priority}
                                </span>
                                <StatusPill status={wo.status} />
                            </div>
                            {wo.source_summary && (
                                <div style={{ fontSize: 12, color: "var(--ds-text-muted)", fontStyle: "italic", lineHeight: 1.4 }}>
                                    from:{" "}
                                    <span style={{ color: "var(--ds-text-secondary)" }}>{wo.source_summary}</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}
