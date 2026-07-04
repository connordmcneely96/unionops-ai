/**
 * RAG utilities — shared by ingestion and query paths.
 *
 * Retrieval contract:
 *   Vectorize match.id === document_chunks.id (format: "{documentId}:{chunkIndex}")
 *   Vectorize metadata shape: { document_id, facility_id, title, chunk_index }
 *   Use match.id to fetch chunk text from D1, or match.metadata for display.
 */

export const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";
export const EMBED_DIM = 768;
export const TOP_K = 4;

// ~3600 chars ≈ 900 tokens at 4 chars/token; ~600 overlap ≈ 150 tokens
const CHUNK_SIZE = 3600;
const OVERLAP = 600;

/**
 * Split text into overlapping chunks on paragraph boundaries.
 * Short documents may produce a single chunk — that is expected.
 */
export function chunkText(text: string): string[] {
    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let current = "";

    for (const para of paragraphs) {
        const candidate = current ? current + "\n\n" + para : para;

        if (candidate.length > CHUNK_SIZE && current) {
            chunks.push(current.trim());
            // Carry overlap: last OVERLAP chars of the previous chunk
            const tail = current.slice(-OVERLAP);
            // Find a word boundary to start the overlap cleanly
            const wordBoundary = tail.search(/\s/);
            current = (wordBoundary !== -1 ? tail.slice(wordBoundary).trimStart() : tail) + "\n\n" + para;
        } else {
            current = candidate;
        }
    }

    if (current.trim()) {
        chunks.push(current.trim());
    }

    return chunks.length > 0 ? chunks : [text.trim()];
}

/**
 * Embed a batch of texts using Workers AI.
 * Returns one vector per input text (shape: texts.length × EMBED_DIM).
 */
export async function embedTexts(
    ai: Ai,
    texts: string[]
): Promise<number[][]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (ai.run as any)(EMBED_MODEL, { text: texts });
    // Workers AI returns { data: number[][] } for embedding models
    const data: number[][] = result?.data ?? result;
    return data;
}

/**
 * Canonical chunk id — used as BOTH document_chunks.id AND Vectorize vector id.
 */
export function chunkId(documentId: string, index: number): string {
    return `${documentId}:${index}`;
}

// ── Retrieval helpers ────────────────────────────────────────────────────────

/**
 * BGE asymmetric retrieval: prefix applied to QUERIES ONLY, never to stored docs.
 * This improves retrieval accuracy for passage-search use cases.
 */
export const BGE_QUERY_PREFIX =
    "Represent this sentence for searching relevant passages: ";

/**
 * Embed a single query string with the BGE query prefix applied.
 * Returns the single 768-dim vector.
 */
export async function embedQuery(ai: Ai, text: string): Promise<number[]> {
    const vectors = await embedTexts(ai, [BGE_QUERY_PREFIX + text]);
    return vectors[0];
}

export interface RetrievedChunk {
    id: string;
    title: string;
    content: string;
    score: number;
}

/**
 * Full retrieval pipeline: embed question → Vectorize query → D1 chunk fetch.
 * Returns chunks ordered by Vectorize score (best first).
 * Skips any match whose chunk row is missing in D1 (defensive).
 */
export async function retrieve(
    env: { AI: Ai; VECTORIZE: VectorizeIndex; DB: D1Database },
    question: string
): Promise<RetrievedChunk[]> {
    const vector = await embedQuery(env.AI, question);

    const queryResult = await env.VECTORIZE.query(vector, {
        topK: TOP_K,
        returnMetadata: "all",
    });

    if (!queryResult.matches.length) return [];

    const ids = queryResult.matches.map((m) => m.id);
    const placeholders = ids.map(() => "?").join(", ");

    const rows = await env.DB.prepare(
        `SELECT id, content FROM document_chunks WHERE id IN (${placeholders})`
    )
        .bind(...ids)
        .all<{ id: string; content: string }>();

    const rowMap = new Map(rows.results.map((r) => [r.id, r.content]));

    const results: RetrievedChunk[] = [];
    for (const match of queryResult.matches) {
        const content = rowMap.get(match.id);
        if (content === undefined) continue;
        const metadata = match.metadata as Record<string, string> | undefined;
        results.push({
            id: match.id,
            title: metadata?.title ?? "Unknown Document",
            content,
            score: match.score,
        });
    }

    return results;
}
