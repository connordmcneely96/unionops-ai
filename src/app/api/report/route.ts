export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { gatherReportData, type ReportData } from "@/lib/report";

type Env = CloudflareEnv & { ANTHROPIC_API_KEY?: string };

interface Narrative {
    executiveSummary: string;
    keyRisks: string;
    recommendedActions: string[];
}

const EMPTY_NARRATIVE: Narrative = {
    executiveSummary: "",
    keyRisks: "",
    recommendedActions: [],
};

const SYSTEM_PROMPT = `You are UnionOps AI, generating a board-level operational readiness report for a high-density AI/HPC data center campus. You are given the facility's current state as structured data. Rules:
1. Use ONLY the provided data. Do not invent equipment, incidents, metrics, or numbers. Never state a readiness score or count different from the data.
2. Write for an executive/board audience: concise, direct, decision-oriented.
3. Do not fabricate engineering specifications or safety procedures.
4. Frame risks by business impact (uptime, commissioning readiness, ability to accept customer compute), not just technical detail.
Return ONLY valid JSON, no markdown fences:
{ "executiveSummary": string (2-3 sentences),
  "keyRisks": string (2-4 sentences framing the open high-severity items),
  "recommendedActions": string[] (3-5 imperative next-7-day actions) }`;

function buildSummary(data: ReportData): string {
    const f = data.facility;
    const lines: string[] = [];

    lines.push(
        `Facility: ${f?.name ?? "Unknown"} (${f?.location ?? "?"}), ` +
        `power ${f?.power_capacity_mw ?? "?"} -> ${f?.target_power_mw ?? "?"} MW, ` +
        `cooling ${f?.cooling_type ?? "?"}, gas generation ${f?.gas_generation === 1 ? "yes" : "no"}.`
    );
    lines.push(`Readiness score: ${data.readiness.score}/100 (${data.readiness.label}).`);
    lines.push(
        `Open item counts — findings: ${data.kpis.openFindings}, ` +
        `security events: ${data.kpis.openSecurityEvents}, ` +
        `alarms: ${data.kpis.openAlarms}, work orders in progress: ${data.kpis.openWorkOrders}.`
    );

    lines.push("");
    lines.push("Open high-severity inspection findings:");
    if (data.openHighFindings.length === 0) {
        lines.push("- none");
    } else {
        for (const item of data.openHighFindings) {
            lines.push(
                `- [${item.equipment_tag}] ${item.summary} (severity ${item.severity}, source ${item.source})`
            );
        }
    }

    lines.push("");
    lines.push("Open alarms:");
    if (data.openAlarms.length === 0) {
        lines.push("- none");
    } else {
        for (const a of data.openAlarms) {
            lines.push(`- [${a.equipment_tag}] ${a.alarm_name} (severity ${a.severity})`);
        }
    }

    lines.push("");
    lines.push("Open security events:");
    if (data.openSecurity.length === 0) {
        lines.push("- none");
    } else {
        for (const s of data.openSecurity) {
            lines.push(`- ${s.event_type}: ${s.summary} (severity ${s.severity}, source ${s.source})`);
        }
    }

    lines.push("");
    lines.push("Work orders in progress (remediation):");
    if (data.workOrders.length === 0) {
        lines.push("- none");
    } else {
        for (const wo of data.workOrders) {
            lines.push(
                `- ${wo.title} (priority ${wo.priority})` +
                (wo.source_summary ? ` from: ${wo.source_summary}` : "")
            );
        }
    }

    lines.push("");
    lines.push("Readiness by domain (system: status, open high/medium/low):");
    if (data.byDomain.length === 0) {
        lines.push("- no open items across any domain");
    } else {
        for (const d of data.byDomain) {
            lines.push(
                `- ${d.system}: ${d.status} (high ${d.openHigh}, medium ${d.openMedium}, low ${d.openLow})`
            );
        }
    }

    return lines.join("\n");
}

function parseNarrative(raw: string): Narrative {
    // Strip markdown code fences if present
    let text = raw.trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    const parsed = JSON.parse(text) as Partial<Narrative>;
    return {
        executiveSummary:
            typeof parsed.executiveSummary === "string" ? parsed.executiveSummary : "",
        keyRisks: typeof parsed.keyRisks === "string" ? parsed.keyRisks : "",
        recommendedActions: Array.isArray(parsed.recommendedActions)
            ? parsed.recommendedActions.filter((a): a is string => typeof a === "string")
            : [],
    };
}

export async function POST() {
    const { env: rawEnv } = await getCloudflareContext({ async: true });
    const env = rawEnv as Env;

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "model key not configured" }, { status: 500 });
    }

    // Deterministic data — the single source of truth for all numbers.
    const data = await gatherReportData();
    const summary = buildSummary(data);

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
                max_tokens: 900,
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: "user",
                        content: `Facility data:\n${summary}\n\nGenerate the report JSON.`,
                    },
                ],
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

        let narrative: Narrative;
        try {
            narrative = parseNarrative(rawText);
        } catch {
            // Parse failure must NOT break the report — render the real numbers
            // with empty narrative fields.
            console.error("Narrative parse failure; returning empty narrative.");
            narrative = EMPTY_NARRATIVE;
        }

        return NextResponse.json({ data, narrative });
    } catch (err) {
        console.error("Report generation error:", err);
        return NextResponse.json({ error: "Report generation failed" }, { status: 502 });
    }
}
