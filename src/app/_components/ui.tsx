// Shared read-only presentational helpers for the list pages.
// Matches the severity-dot + source-badge language used on the dashboard/reports.

function severityColor(sev: string): string {
    if (sev === "high" || sev === "critical") return "var(--ds-sev-high)";
    if (sev === "medium") return "var(--ds-sev-medium)";
    return "var(--ds-sev-low)";
}

export function SeverityDot({ severity }: { severity: string }) {
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

export function severityTextColor(sev: string): string {
    return severityColor(sev);
}

function formatSource(raw: string): string {
    return raw
        .replace(/_/g, " ")
        .replace("drone thermal", "DRONE·THERMAL")
        .replace("drone ogi", "DRONE·OGI")
        .replace("drone patrol", "DRONE·PATROL")
        .toUpperCase();
}

export function SourceBadge({ source }: { source: string }) {
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

export function StatusPill({ status }: { status: string }) {
    return (
        <span
            style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--ds-text-secondary)",
                backgroundColor: "var(--ds-badge-bg)",
                padding: "2px 8px",
                borderRadius: 10,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
            }}
        >
            {status.replace(/_/g, " ")}
        </span>
    );
}

// Page-level shell primitives ------------------------------------------------

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <h1
                style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--ds-text-primary)",
                    margin: "0 0 4px",
                }}
            >
                {title}
            </h1>
            <p style={{ fontSize: 13.5, color: "var(--ds-text-secondary)", margin: 0 }}>
                {subtitle}
            </p>
        </div>
    );
}

export function Card({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                backgroundColor: "var(--ds-card)",
                border: "1px solid var(--ds-border)",
                borderRadius: "var(--ds-radius)",
                boxShadow: "var(--ds-shadow)",
                padding: "8px 20px",
            }}
        >
            {children}
        </div>
    );
}

export function EmptyState() {
    return (
        <div style={{ padding: "16px 0", fontSize: 13.5, color: "var(--ds-text-muted)" }}>
            No records.
        </div>
    );
}
