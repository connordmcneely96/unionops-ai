export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { classifyThermal, type ThermalPoint } from "@/lib/engine";
import { upsertFinding } from "@/lib/db";

// INGEST_TOKEN is a secret not reflected in the generated env types
type Env = CloudflareEnv & { INGEST_TOKEN?: string };

function unauthorized() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface Body {
    inspection_id?: unknown;
    source?: unknown;
    ambient_f?: unknown;
    points?: unknown;
}

function isPoint(p: unknown): p is ThermalPoint {
    if (typeof p !== "object" || p === null) return false;
    const o = p as Record<string, unknown>;
    return (
        typeof o.point_id === "string" &&
        typeof o.equipment_tag === "string" &&
        typeof o.component === "string" &&
        typeof o.temp_f === "number" &&
        typeof o.load_pct === "number"
    );
}

export async function POST(request: NextRequest) {
    const { env: rawEnv } = await getCloudflareContext({ async: true });
    const env = rawEnv as Env;

    // Fail-closed auth.
    const token = env.INGEST_TOKEN;
    const header = request.headers.get("x-ingest-token");
    if (!token || header !== token) return unauthorized();

    let body: Body;
    try {
        body = (await request.json()) as Body;
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const inspection_id = typeof body.inspection_id === "string" ? body.inspection_id : "";
    const source = typeof body.source === "string" ? body.source : "drone_thermal";
    const ambient_f = typeof body.ambient_f === "number" ? body.ambient_f : undefined;
    const points = Array.isArray(body.points) ? body.points.filter(isPoint) : [];

    if (!inspection_id || points.length === 0) {
        return NextResponse.json(
            { error: "inspection_id and non-empty points are required" },
            { status: 400 }
        );
    }

    const results = classifyThermal(points, ambient_f);

    const created: { id: string; equipment_tag: string; severity: string; summary: string }[] = [];
    for (const r of results) {
        const id = `IF-${inspection_id}-${r.equipment_tag}`;
        await upsertFinding({
            id,
            equipment_tag: r.equipment_tag,
            finding_type: r.finding_type,
            source,
            severity: r.severity,
            summary: r.summary,
            detail: r.detail,
        });
        created.push({ id, equipment_tag: r.equipment_tag, severity: r.severity, summary: r.summary });
    }

    return NextResponse.json({ created });
}
