# Browser-Triggerable Re-Ingest Route — Report

## 1. Files Created / Modified

| File | Action |
|---|---|
| `src/lib/ingest.ts` | Created — `runIngestion(env)` (pipeline moved from POST, verbatim) + `runSelfTest(env)` + `IngestEnv` type |
| `src/app/api/ingest/route.ts` | Modified — POST now delegates to `runIngestion(env)`; imports slimmed; GET self-test handler left as-is |
| `src/app/api/ingest/run/route.ts` | Created — `force-dynamic` GET, query-string token guard, HTML output |

No other files touched.

## 2. POST /api/ingest Behavior Unchanged

The inline pipeline was **moved** into `runIngestion(env)` in `src/lib/ingest.ts` without altering its logic — the same steps in the same order (R2 put → D1 update → delete old chunks from D1 + Vectorize → chunk → embed → Vectorize upsert), returning the same `{ docsProcessed, chunksCreated, vectorsUpserted, skipped }` shape. The POST handler now reads:

```ts
export async function POST(request: NextRequest) {
    const env = await getEnvAndAuth(request);
    if (!env) return unauthorized();
    const result = await runIngestion(env);
    return NextResponse.json(result);
}
```

Auth (header `x-ingest-token`), the response JSON, and the existing GET `/api/ingest` self-test handler are all unchanged. Both POST and the new GET call the **same** `runIngestion`.

## 3. npm run build Result

**PASS** — TypeScript clean. Routes list:

```
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/ask
├ ƒ /api/ingest
├ ƒ /api/ingest/run      ← new, dynamic (ƒ)
└ ○ /ask
```

## 4. Trigger URL Shape

```
https://<host>/api/ingest/run?token=YOUR_TOKEN
```

Paste directly into a browser. On success it renders an HTML page showing
docsProcessed / chunksCreated / vectorsUpserted, then the self-test top-match
title and PASS/FAIL (expected top match: *Switchgear Thermographic Inspection
Procedure*). A missing/wrong token returns a 401 HTML page; an internal error
returns a generic 500 HTML page (no env or token leaked).

## 5. Security Note (for Connor)

The token now appears in the **URL query string**, which is lower-security than
the header used by `POST /api/ingest`. Query strings can be captured in browser
history, proxy logs, and server access logs. This is acceptable for a demo
re-ingest guard, but **rotate `INGEST_TOKEN` before anything real**, and prefer
the POST + `x-ingest-token` header path for non-demo use.

## 6. PR URL + Deviations

**PR: https://github.com/connordmcneely96/unionops-ai/pull/6** — open, not merged.

### Deviations

- **Extracted `runSelfTest` in addition to `runIngestion`.** The task asked to
  extract the pipeline; the GET route also needs "the SAME self-test the GET
  /api/ingest uses." To truly reuse it (rather than copy-paste), I factored the
  self-test into `runSelfTest(env)` in the shared module. The existing GET
  `/api/ingest` handler was left untouched (still its own inline copy) to keep
  the change to that file minimal — only the POST body moved. This is a small,
  additive deviation that serves the "reuse, don't rewrite" intent.
