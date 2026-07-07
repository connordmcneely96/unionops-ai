export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { saveWorkOrder } from "@/lib/db";

// NOTE: This is the app's first WRITE endpoint and is currently UNAUTHENTICATED.
// Blast radius is tiny — INSERT OR REPLACE on a deterministic id
// (WO-GEN-<findingId>) only, so it can at worst overwrite a generated work order
// for an existing finding. Acceptable for the demo; it MUST gain auth (token or
// session) before production use.

interface WorkOrderBody {
    source_id?: unknown;
    equipment_tag?: unknown;
    title?: unknown;
    priority?: unknown;
    problem_statement?: unknown;
    probable_causes?: unknown;
    recommended_actions?: unknown;
    safety_notes?: unknown;
    source_type?: unknown;
}

function str(value: unknown): string {
    return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
    let body: WorkOrderBody;
    try {
        body = (await request.json()) as WorkOrderBody;
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const title = str(body.title);
    const equipment_tag = str(body.equipment_tag);
    const priority = str(body.priority);
    const source_id = str(body.source_id);

    if (!title || !equipment_tag || !priority || !source_id) {
        return NextResponse.json(
            { error: "title, equipment_tag, priority, and source_id are required" },
            { status: 400 }
        );
    }

    // Idempotent id — re-saving the same finding's work order overwrites.
    const id = `WO-GEN-${source_id}`;

    await saveWorkOrder({
        id,
        equipment_tag,
        title,
        problem_statement: str(body.problem_statement),
        priority,
        probable_causes: str(body.probable_causes),
        recommended_actions: str(body.recommended_actions),
        safety_notes: str(body.safety_notes),
        source_type: str(body.source_type) || "inspection_finding",
        source_id,
    });

    return NextResponse.json({ id, saved: true });
}
