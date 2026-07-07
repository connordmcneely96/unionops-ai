export const dynamic = "force-dynamic";

import { getAllDocuments } from "@/lib/db";
import { PageHeader, Card, EmptyState, StatusPill } from "@/app/_components/ui";

function formatDate(value: string | null): string {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DocumentsPage() {
    const docs = await getAllDocuments();

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <PageHeader
                title="Documents"
                subtitle="Facility procedures, SOPs, and plans in the knowledge base."
            />
            <Card>
                {docs.length === 0 ? (
                    <EmptyState />
                ) : (
                    docs.map((doc, i) => (
                        <div
                            key={doc.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "12px 0",
                                borderTop: i > 0 ? "1px solid var(--ds-border)" : "none",
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ds-text-primary)", marginBottom: 2 }}>
                                    {doc.title}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--ds-text-muted)", textTransform: "capitalize" }}>
                                    {doc.doc_type.replace(/_/g, " ")}
                                </div>
                            </div>
                            <span style={{ fontSize: 12, color: "var(--ds-text-muted)", whiteSpace: "nowrap" }}>
                                {formatDate(doc.indexed_at)}
                            </span>
                            <StatusPill status={doc.status} />
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}
