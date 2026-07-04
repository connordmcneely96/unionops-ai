export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { retrieve } from "@/lib/rag";

type Env = CloudflareEnv & { ANTHROPIC_API_KEY?: string };

const SYSTEM_PROMPT = `You are UnionOps AI, an operations copilot for a high-density AI/HPC data center. Answer ONLY from the provided facility context. Rules:
1. If the context does not contain the answer, say what is missing and what document or measurement is needed — do not guess.
2. Never invent equipment specifications, torque values, setpoints, or code clause numbers. If the context says 'per equipment datasheet', repeat that rather than inventing a number.
3. Never originate a safety step that is not in the context. Safety-critical actions (lockout/tagout, gas PPE, isolation) must come from the documents.
4. Structure: Answer, then Recommended checks, then Risk level (Low/Medium/High) when equipment/safety/uptime is involved, then Missing info if any.
5. Cite the source number(s) [n] inline where used. Be concise and operational.`;

const FALLBACK_ANSWER =
    "I don't have facility documentation covering that. Try asking about cooling loops, switchgear inspection, gas generation response, commissioning, or perimeter security.";

export async function POST(request: NextRequest) {
    // Parse and validate body
    let question: string;
    try {
        const body = await request.json() as { question?: unknown };
        question = (typeof body?.question === "string" ? body.question : "").trim();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!question) {
        return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const { env: rawEnv } = await getCloudflareContext({ async: true });
    const env = rawEnv as Env;

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "model key not configured" }, { status: 500 });
    }

    // Retrieve relevant chunks
    const results = await retrieve(env, question);

    // Empty retrieval — do NOT call the model
    if (results.length === 0) {
        return NextResponse.json({
            answer: FALLBACK_ANSWER,
            sources: [],
        });
    }

    // Build numbered context string
    const numberedContext = results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
        .join("\n\n---\n\n");

    // Call Anthropic Messages API via native fetch
    let answer: string;
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
                max_tokens: 700,
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: "user",
                        content: `Facility context:\n${numberedContext}\n\nQuestion: ${question}`,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => "");
            console.error("Anthropic API error:", response.status, errText);
            return NextResponse.json(
                { error: "Model request failed" },
                { status: 502 }
            );
        }

        const data = await response.json() as {
            content?: { type: string; text: string }[];
        };

        answer = (data.content ?? [])
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("");
    } catch (err) {
        console.error("Anthropic fetch error:", err);
        return NextResponse.json({ error: "Model request failed" }, { status: 502 });
    }

    return NextResponse.json({
        answer,
        sources: results.map((r) => ({ title: r.title, score: r.score })),
    });
}
