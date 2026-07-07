export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { evaluateTelemetry, type TelemetryReading } from "@/lib/engine";
import { upsertFinding, upsertAlarm } from "@/lib/db";

// INGEST_TOKEN is a secret not reflected in the generated env types
type Env = CloudflareEnv & { INGEST_TOKEN?: string };

function unauthorized() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface Body {
    source?: unknown;
    readings?: unknown;
}

function isReading(r: unknown): r is TelemetryReading {
    if (typeof r !== "object" || r === null) return false;
    const o = r as Record<string, unknown>;
    return (
        typeof o.equipment_tag === "string" &&
        typeof o.metric === "string" &&
        typeof o.value === "number" &&
        typeof o.unit === "string"
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

    const source = typeof body.source === "string" ? body.source : "telemetry";
    const readings = Array.isArray(body.readings) ? body.readings.filter(isReading) : [];

    if (readings.length === 0) {
        return NextResponse.json({ error: "non-empty readings are required" }, { status: 400 });
    }

    const { findings, alarms } = evaluateTelemetry(readings);

    const findingIds: string[] = [];
    for (const f of findings) {
        // One open finding per equipment+condition, updated on repeat.
        const id = `IF-TEL-${f.equipment_tag}-${f.finding_type}`;
        await upsertFinding({
            id,
            equipment_tag: f.equipment_tag,
            finding_type: f.finding_type,
            source,
            severity: f.severity,
            summary: f.summary,
            detail: f.detail,
        });
        findingIds.push(id);
    }

    const alarmIds: string[] = [];
    for (const a of alarms) {
        const id = `AL-TEL-${a.equipment_tag}-${a.metric}`;
        await upsertAlarm({
            id,
            equipment_tag: a.equipment_tag,
            severity: a.severity,
            alarm_name: a.alarm_name,
            description: a.description,
        });
        alarmIds.push(id);
    }

    return NextResponse.json({ findings: findingIds, alarms: alarmIds });
}
