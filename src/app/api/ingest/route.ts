export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DEMO_DOCS } from "@/lib/demo-docs";
import { chunkText, embedTexts, chunkId, TOP_K, EMBED_MODEL } from "@/lib/rag";

// INGEST_TOKEN is a secret not reflected in the generated env types
type Env = CloudflareEnv & { INGEST_TOKEN?: string };

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

    const { DB, DOCS_BUCKET, AI, VECTORIZE } = env;

    let docsProcessed = 0;
    let chunksCreated = 0;
    let vectorsUpserted = 0;
    const skipped: string[] = [];

    for (const doc of DEMO_DOCS) {
        // 1. Look up document row by exact title, facility FAC-UC
        const row = await DB.prepare(
            "SELECT id FROM documents WHERE facility_id = 'FAC-UC' AND title = ?"
        )
            .bind(doc.title)
            .first<{ id: string }>();

        if (!row) {
            skipped.push(doc.title);
            continue;
        }

        const documentId = row.id;
        const r2Key = `demo/uc/${doc.slug}.md`;

        // 2. Put content to R2
        await DOCS_BUCKET.put(r2Key, doc.content, {
            httpMetadata: { contentType: "text/markdown; charset=utf-8" },
        });

        // 3. Update documents row
        await DB.prepare(
            "UPDATE documents SET r2_key = ?, doc_type = ?, status = 'indexed', indexed_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
            .bind(r2Key, doc.docType, documentId)
            .run();

        // 4. Idempotency — delete existing chunks from D1 and Vectorize
        const existingChunks = await DB.prepare(
            "SELECT id FROM document_chunks WHERE document_id = ?"
        )
            .bind(documentId)
            .all<{ id: string }>();

        if (existingChunks.results.length > 0) {
            const ids = existingChunks.results.map((r) => r.id);
            await DB.prepare(
                `DELETE FROM document_chunks WHERE document_id = ?`
            )
                .bind(documentId)
                .run();
            await VECTORIZE.deleteByIds(ids);
        }

        // 5. Chunk the content and insert into D1
        const chunks = chunkText(doc.content);

        const insertStmts = chunks.map((chunk, idx) =>
            DB.prepare(
                "INSERT INTO document_chunks (id, document_id, chunk_index, content) VALUES (?, ?, ?, ?)"
            ).bind(chunkId(documentId, idx), documentId, idx, chunk)
        );
        await DB.batch(insertStmts);

        // 6. Embed all chunks and upsert to Vectorize
        const vectors = await embedTexts(AI, chunks);

        const vectorizeVectors = vectors.map((values, idx) => ({
            id: chunkId(documentId, idx),
            values,
            metadata: {
                document_id: documentId,
                facility_id: "FAC-UC",
                title: doc.title,
                chunk_index: idx,
            },
        }));

        await VECTORIZE.upsert(vectorizeVectors);

        docsProcessed++;
        chunksCreated += chunks.length;
        vectorsUpserted += vectorizeVectors.length;
    }

    return NextResponse.json({
        docsProcessed,
        chunksCreated,
        vectorsUpserted,
        skipped,
    });
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
