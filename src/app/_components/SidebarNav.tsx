"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    ClipboardList,
    ShieldAlert,
    Wrench,
    FileText,
    BarChart2,
    type LucideIcon,
} from "lucide-react";

interface NavItem {
    label: string;
    href: string | null;
    icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard",   href: "/",    icon: LayoutDashboard },
    { label: "Ask Facility", href: "/ask", icon: MessageSquare },
    { label: "Inspections",  href: null,   icon: ClipboardList },
    { label: "Security",     href: null,   icon: ShieldAlert },
    { label: "Work Orders",  href: null,   icon: Wrench },
    { label: "Documents",    href: null,      icon: FileText },
    { label: "Reports",      href: "/reports", icon: BarChart2 },
];

export function SidebarNav() {
    const pathname = usePathname();

    return (
        <>
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.href !== null && pathname === item.href;
                const clickable = item.href !== null;

                const style: React.CSSProperties = {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 8px",
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: active ? 500 : 400,
                    color: active
                        ? "var(--ds-accent)"
                        : "var(--ds-text-secondary)",
                    backgroundColor: active ? "#eef3fd" : "transparent",
                    textDecoration: "none",
                    cursor: clickable ? "pointer" : "default",
                    userSelect: "none",
                };

                if (clickable && item.href) {
                    return (
                        <Link key={item.label} href={item.href} style={style}>
                            <Icon size={16} strokeWidth={1.5} />
                            {item.label}
                        </Link>
                    );
                }

                return (
                    <div key={item.label} style={style}>
                        <Icon size={16} strokeWidth={1.5} />
                        {item.label}
                    </div>
                );
            })}
        </>
    );
}
