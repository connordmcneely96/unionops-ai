import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import {
    LayoutDashboard,
    MessageSquare,
    ClipboardList,
    ShieldAlert,
    Wrench,
    FileText,
    BarChart2,
} from "lucide-react";

export const metadata: Metadata = {
    title: "UnionOps AI — Union County Campus",
    description: "Facility operations dashboard for Union County Campus",
};

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, active: true },
    { label: "Ask Facility", href: null, icon: MessageSquare, active: false },
    { label: "Inspections", href: null, icon: ClipboardList, active: false },
    { label: "Security", href: null, icon: ShieldAlert, active: false },
    { label: "Work Orders", href: null, icon: Wrench, active: false },
    { label: "Documents", href: null, icon: FileText, active: false },
    { label: "Reports", href: null, icon: BarChart2, active: false },
];

function TopBar() {
    const today = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <header
            style={{
                height: 52,
                borderBottom: "1px solid var(--ds-border)",
                backgroundColor: "var(--ds-card)",
                display: "flex",
                alignItems: "center",
                paddingLeft: 24,
                paddingRight: 24,
                gap: 12,
                flexShrink: 0,
            }}
        >
            <span
                style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--ds-text-primary)",
                    flex: 1,
                }}
            >
                Union County Campus
                <span style={{ color: "var(--ds-text-muted)", fontWeight: 400 }}>
                    {" "}
                    · El Dorado, AR
                </span>
            </span>

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

            <span style={{ fontSize: 13, color: "var(--ds-text-muted)" }}>{today}</span>
        </header>
    );
}

function Sidebar() {
    return (
        <nav
            style={{
                width: 220,
                flexShrink: 0,
                backgroundColor: "var(--ds-card)",
                borderRight: "1px solid var(--ds-border)",
                display: "flex",
                flexDirection: "column",
                padding: "20px 12px",
                gap: 2,
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--ds-text-muted)",
                    padding: "0 8px 12px",
                }}
            >
                UnionOps
            </div>

            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const baseStyle: React.CSSProperties = {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 8px",
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: item.active ? 500 : 400,
                    color: item.active ? "var(--ds-accent)" : "var(--ds-text-secondary)",
                    backgroundColor: item.active ? "#eef3fd" : "transparent",
                    textDecoration: "none",
                    cursor: item.active ? "pointer" : "default",
                    userSelect: "none",
                };

                if (item.href && item.active) {
                    return (
                        <Link key={item.label} href={item.href} style={baseStyle}>
                            <Icon size={16} strokeWidth={1.5} />
                            {item.label}
                        </Link>
                    );
                }

                return (
                    <div key={item.label} style={baseStyle}>
                        <Icon size={16} strokeWidth={1.5} />
                        {item.label}
                    </div>
                );
            })}
        </nav>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body
                style={{
                    margin: 0,
                    padding: 0,
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--ds-bg)",
                }}
            >
                <TopBar />
                <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    <Sidebar />
                    <main
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "24px",
                            backgroundColor: "var(--ds-bg)",
                        }}
                    >
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
