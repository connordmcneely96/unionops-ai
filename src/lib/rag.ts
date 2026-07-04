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
