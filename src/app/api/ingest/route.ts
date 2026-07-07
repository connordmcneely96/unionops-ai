export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { embedTexts, TOP_K, EMBED_MODEL } from "@/lib/rag";
import { runIngestion, type IngestEnv } from "@/lib/ingest";

// INGEST_TOKEN is a secret not reflected in the generated env types
type Env = IngestEnv;

function unauthorized() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function getEnvAndAuth(request: NextRequest): Promise<Env | null> {
    const { env } = await getCloudflareContext({ async: true });
    const typedEnv = env as Env;
    const token = typedEnv.INGEST_TOKEN;
    const header = request.headers.get("x-ingest-token");
    if (!token || header !== token) return null;
    return typedEnv;
}

// ── POST /api/ingest — full idempotent ingestion pipeline ────────────────────

export async function POST(request: NextRequest) {
    const env = await getEnvAndAuth(request);
    if (!env) return unauthorized();

    const result = await runIngestion(env);

    return NextResponse.json(result);
}

// ── GET /api/ingest — self-test: embed a probe query and check top match ─────

export async function GET(request: NextRequest) {
    const env = await getEnvAndAuth(request);
    if (!env) return unauthorized();

    const { AI, VECTORIZE } = env;

    const probe = "what should I check for the switchgear hot lug thermal finding";

    const [probeVector] = await embedTexts(AI, [probe]);

    const queryResult = await VECTORIZE.query(probeVector, {
        topK: TOP_K,
        returnMetadata: "all",
    });

    const matches = queryResult.matches.map((m) => ({
        id: m.id,
        score: m.score,
        title: (m.metadata as Record<string, string> | undefined)?.title ?? null,
    }));

    const topTitle = matches[0]?.title ?? null;
    const pass = topTitle === "Switchgear Thermographic Inspection Procedure";

    return NextResponse.json({
        probe,
        model: EMBED_MODEL,
        topK: TOP_K,
        matches,
        selfTest: {
            expectedTopTitle: "Switchgear Thermographic Inspection Procedure",
            actualTopTitle: topTitle,
            result: pass ? "PASS" : "FAIL",
        },
    });
}
