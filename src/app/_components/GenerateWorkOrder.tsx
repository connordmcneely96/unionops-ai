"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";

interface FindingProps {
    id: string;
    equipment_tag: string;
    severity: string;
    summary: string;
}

interface Draft {
    title: string;
    problem_statement: string;
    probable_causes: string;
    recommended_actions: string;
    safety_notes: string;
    equipment_tag: string;
    priority: string;
    source_type: string;
    source_id: string;
}

interface GenerateResponse {
    draft: Draft;
    sources: string[];
}

function priorityColor(p: string): string {
    if (p === "high" || p === "critical") return "var(--ds-sev-high)";
    if (p === "medium") return "var(--ds-sev-medium)";
    return "var(--ds-sev-low)";
}

export function GenerateWorkOrder({ finding }: { finding: FindingProps }) {
    const [draft, setDraft] = useState<Draft | null>(null);
    const [sources, setSources] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function generate() {
        setGenerating(true);
        setError(null);
        setSavedId(null);
        try {
            const res = await fetch("/api/generate-work-order", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ findingId: finding.id }),
            });
            if (!res.ok) {
                setError("Could not draft a work order — try again.");
                return;
            }
            const data = (await res.json()) as GenerateResponse;
            setDraft(data.draft);
            setSources(data.sources ?? []);
        } catch {
            setError("Could not draft a work order — try again.");
        } finally {
            setGenerating(false);
        }
    }

    async function save() {
        if (!draft) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/work-orders", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ ...draft, findingId: draft.source_id }),
            });
            if (!res.ok) {
                setError("Could not save — try again.");
                return;
            }
            const data = (await res.json()) as { id: string };
            setSavedId(data.id);
        } catch {
            setError("Could not save — try again.");
        } finally {
            setSaving(false);
        }
    }

    function dismiss() {
        setDraft(null);
        setSources([]);
        setSavedId(null);
        setError(null);
    }

    return (
        <div style={{ width: "100%" }}>
            {!draft && (
                <button
                    onClick={generate}
                    disabled={generating}
                    style={{
                        backgroundColor: "var(--ds-card)",
                        color: generating ? "var(--ds-text-muted)" : "var(--ds-accent)",
                        border: "1px solid var(--ds-border)",
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 12.5,
                        fontWeight: 500,
                        cursor: generating ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <Wrench size={14} strokeWidth={1.5} />
                    {generating ? "Drafting from facility procedures…" : "Generate Work Order"}
                </button>
            )}

            {error && !draft && (
                <div style={{ fontSize: 12, color: "var(--ds-sev-high)", opacity: 0.8, marginTop: 6 }}>
                    {error}
                </div>
            )}

            {draft && (
                <div
                    style={{
                        marginTop: 10,
                        border: "1px solid var(--ds-border)",
                        borderRadius: 8,
                        backgroundColor: "#fafbfc",
                        padding: 16,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ds-text-primary)", flex: 1, minWidth: 200 }}>
                            {draft.title}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: priorityColor(draft.priority),
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {draft.priority} priority
                        </span>
                    </div>

                    <Field label="Problem Statement" value={draft.problem_statement} />
                    <Field label="Probable Causes" value={draft.probable_causes} />
                    <Field label="Recommended Actions" value={draft.recommended_actions} />
                    <Field label="Safety Notes" value={draft.safety_notes} />

                    {sources.length > 0 && (
                        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 10.5, color: "var(--ds-text-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                Sources
                            </span>
                            {sources.map((s) => (
                                <span
                                    key={s}
                                    style={{
                                        fontSize: 11,
                                        backgroundColor: "var(--ds-badge-bg)",
                                        color: "var(--ds-badge-text)",
                                        padding: "2px 8px",
                                        borderRadius: 4,
                                        fontWeight: 500,
                                    }}
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
                        {savedId ? (
                            <span style={{ fontSize: 13, color: "var(--ds-sev-low)", fontWeight: 500 }}>
                                Saved —{" "}
                                <Link href="/work-orders" style={{ color: "var(--ds-accent)", textDecoration: "underline" }}>
                                    view in Work Orders
                                </Link>
                            </span>
                        ) : (
                            <>
                                <button
                                    onClick={save}
                                    disabled={saving}
                                    style={{
                                        backgroundColor: "var(--ds-accent)",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: 6,
                                        padding: "6px 14px",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: saving ? "not-allowed" : "pointer",
                                        opacity: saving ? 0.6 : 1,
                                    }}
                                >
                                    {saving ? "Saving…" : "Save to Work Orders"}
                                </button>
                                <button
                                    onClick={dismiss}
                                    style={{
                                        backgroundColor: "transparent",
                                        color: "var(--ds-text-secondary)",
                                        border: "1px solid var(--ds-border)",
                                        borderRadius: 6,
                                        padding: "6px 14px",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    Dismiss
                                </button>
                            </>
                        )}
                    </div>

                    {error && (
                        <div style={{ fontSize: 12, color: "var(--ds-sev-high)", opacity: 0.8, marginTop: 8 }}>
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ds-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                {label}
            </div>
            <div style={{ fontSize: 13, color: "var(--ds-text-primary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {value}
            </div>
        </div>
    );
}
