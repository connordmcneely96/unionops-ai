export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getFindingById } from "@/lib/db";
import { retrieve } from "@/lib/rag";

type Env = CloudflareEnv & { ANTHROPIC_API_KEY?: string };

const SYSTEM_PROMPT = `You are UnionOps AI, drafting an industrial maintenance work order for a high-density AI/HPC data center. You are given an inspection finding and excerpts from the facility's own procedures. Rules:
1. Base the work order ONLY on the finding and the provided procedure context.
2. SAFETY NOTES must come from the provided procedure context (e.g. LOTO, gas PPE, isolation). If the context contains no safety step, write 'Refer to the applicable site procedure for safety requirements' — never invent one.
3. Do not invent equipment specifications, torque values, or setpoints. If a value is datasheet-dependent, write 'per equipment datasheet'.
4. Be concrete and technician-ready.
Return ONLY valid JSON, no markdown fences:
{ "title": string,
  "problem_statement": string,
  "probable_causes": string,
  "recommended_actions": string,
  "safety_notes": string }`;

// Deterministic priority — the LLM never sets this.
function mapPriority(severity: string): string {
    if (severity === "high" || severity === "critical") return "high";
    if (severity === "medium") return "medium";
    return "low";
}

interface DraftFields {
    title: string;
    problem_statement: string;
    probable_causes: string;
    recommended_actions: string;
    safety_notes: string;
}

function parseDraft(raw: string): DraftFields {
    let text = raw.trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(text) as Partial<DraftFields>;
    if (
        typeof parsed.title !== "string" ||
        typeof parsed.problem_statement !== "string" ||
        typeof parsed.probable_causes !== "string" ||
        typeof parsed.recommended_actions !== "string" ||
        typeof parsed.safety_notes !== "string"
    ) {
        throw new Error("Draft JSON missing required fields");
    }
    return {
        title: parsed.title,
        problem_statement: parsed.problem_statement,
        probable_causes: parsed.probable_causes,
        recommended_actions: parsed.recommended_actions,
        safety_notes: parsed.safety_notes,
    };
}

export async function POST(request: NextRequest) {
    let findingId: string;
    try {
        const body = (await request.json()) as { findingId?: unknown };
        findingId = typeof body?.findingId === "string" ? body.findingId : "";
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!findingId) {
        return NextResponse.json({ error: "findingId is required" }, { status: 400 });
    }

    const { env: rawEnv } = await getCloudflareContext({ async: true });
    const env = rawEnv as Env;

    const finding = await getFindingById(findingId);
    if (!finding) {
        return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "model key not configured" }, { status: 500 });
    }

    const priority = mapPriority(finding.severity);

    // Retrieval grounding
    const query = `${finding.equipment_tag} ${finding.summary}`;
    const retrieved = await retrieve(env, query);

    const numberedContext =
        retrieved.length > 0
            ? retrieved.map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`).join("\n\n---\n\n")
            : "(no matching procedure context found)";

    const userContent =
        `Inspection finding:\n` +
        `- Equipment: ${finding.equipment_tag}\n` +
        `- Severity: ${finding.severity}\n` +
        `- Summary: ${finding.summary}\n` +
        `- Detail: ${finding.detail ?? "(none)"}\n\n` +
        `Facility procedure context:\n${numberedContext}\n\n` +
        `Draft the work order JSON.`;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-5",
                max_tokens: 800,
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: userContent }],
            }),
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => "");
            console.error("Anthropic API error:", response.status, errText);
            return NextResponse.json({ error: "Model request failed" }, { status: 502 });
        }

        const body = (await response.json()) as {
            content?: { type: string; text: string }[];
        };

        const rawText = (body.content ?? [])
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("");

        let fields: DraftFields;
        try {
            fields = parseDraft(rawText);
        } catch (err) {
            console.error("Draft parse failure:", err);
            return NextResponse.json({ error: "Draft could not be generated" }, { status: 502 });
        }

        const sources = [...new Set(retrieved.map((r) => r.title))];

        return NextResponse.json({
            draft: {
                ...fields,
                equipment_tag: finding.equipment_tag,
                priority,
                source_type: "inspection_finding",
                source_id: findingId,
            },
            sources,
        });
    } catch (err) {
        console.error("Work-order generation error:", err);
        return NextResponse.json({ error: "Work-order generation failed" }, { status: 502 });
    }
}
