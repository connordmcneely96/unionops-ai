# Ask-the-Facility RAG Query + UI — Delivery Report

## 1. Files Created / Modified (by commit)

### Commit 1 — Retrieval helpers (src/lib/rag.ts additions)
| File | Action |
|---|---|
| `src/lib/rag.ts` | Modified — added `BGE_QUERY_PREFIX`, `embedQuery`, `RetrievedChunk` interface, `retrieve` |

### Commit 2 — /api/ask route
| File | Action |
|---|---|
| `src/app/api/ask/route.ts` | Created — `POST` retrieve+generate via native fetch; `force-dynamic` |

### Commit 3 — /ask chat UI
| File | Action |
|---|---|
| `src/app/ask/page.tsx` | Created — `"use client"` chat UI with chips, thread, input row |

### Commit 4 — Nav activation
| File | Action |
|---|---|
| `src/app/_components/SidebarNav.tsx` | Created — `"use client"` nav component using `usePathname()` |
| `src/app/layout.tsx` | Modified — swapped static nav items for `<SidebarNav />` client island |

---

## 2. npm run build Result

```
▲ Next.js 16.2.6 (Turbopack)

✓ Compiled successfully in 2.8s
  Running TypeScript ...
  Finished TypeScript in 5.7s ...
✓ Generating static pages using 3 workers (3/3) in 190ms

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/ask
├ ƒ /api/ingest
└ ○ /ask

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Result: PASS.** TypeScript clean. All routes correctly typed.

---

## 3. API Implementation Confirmation

| Check | Status |
|---|---|
| Transport | Native `fetch("https://api.anthropic.com/v1/messages", ...)` — no SDK, no ai package |
| Model | `claude-sonnet-4-5` |
| System prompt: context-only | Rule 1: "Answer ONLY from the provided facility context" |
| System prompt: no invented specs | Rule 2: "Never invent equipment specifications, torque values, setpoints, or code clause numbers. If the context says 'per equipment datasheet', repeat that." |
| System prompt: no originated safety | Rule 3: "Never originate a safety step that is not in the context. Safety-critical actions must come from the documents." |
| Structured output | Rule 4: Answer → Recommended checks → Risk level → Missing info |
| Inline citations | Rule 5: "Cite the source number(s) [n] inline where used." |

---

## 4. Empty Retrieval Path — No Model Call

Confirmed in `src/app/api/ask/route.ts`:

```ts
// Empty retrieval — do NOT call the model
if (results.length === 0) {
    return NextResponse.json({
        answer: FALLBACK_ANSWER,
        sources: [],
    });
}
```

The `fetch("https://api.anthropic.com/v1/messages", ...)` call is only reached after `if (results.length === 0)` has been checked and passed. Zero-result retrieval returns the fallback string immediately without any Anthropic API call.

---

## 5. Ready-to-Run curl.exe Probe Commands

Replace `$base` with your deployed URL (e.g. `https://unionops-ai.workers.dev`):

**Probe 1 — in-corpus question (expect source-cited switchgear answer):**
```powershell
$base = "https://unionops-ai.workers.dev"
curl.exe -sS -L -X POST "$base/api/ask" -H "content-type: application/json" -d '{"question":"What should I check for the switchgear hot lug thermal finding?"}'
```

Expected shape:
```json
{
  "answer": "Based on the Switchgear Thermographic Inspection Procedure [1], a phase-to-phase temperature delta above adjacent phases indicates a suspect connection...",
  "sources": [
    { "title": "Switchgear Thermographic Inspection Procedure", "score": 0.87 },
    ...
  ]
}
```

**Probe 2 — out-of-corpus question (expect fallback, no model call in empty-retrieval path):**
```powershell
curl.exe -sS -L -X POST "$base/api/ask" -H "content-type: application/json" -d '{"question":"What is the capital of France?"}'
```

Expected shape (if retrieval returns low-score or zero results → fallback):
```json
{
  "answer": "I don't have facility documentation covering that. Try asking about cooling loops, switchgear inspection, gas generation response, commissioning, or perimeter security.",
  "sources": []
}
```

*(If Vectorize returns low-confidence matches for an off-topic query, the model will still be called with those chunks as context — the empty-retrieval guard fires only when `results.length === 0`. For a sufficiently unrelated question, retrieval will return 0 matches and the fallback path triggers.)*

---

## 6. Scope Guards Confirmation

| Guard | Status |
|---|---|
| `src/app/page.tsx` (dashboard) untouched | CONFIRMED |
| No migrations, D1 schema, or seed changes | CONFIRMED |
| Ingestion route (`/api/ingest`) not modified | CONFIRMED |
| `EMBED_MODEL`, `TOP_K`, `chunkId` in `rag.ts` unchanged | CONFIRMED |
| `.github/workflows/**` untouched | CONFIRMED |
| `wrangler.jsonc` untouched | CONFIRMED |
| No npm dependencies added | CONFIRMED — `package.json` unchanged |
| No Anthropic SDK or Vercel ai package | CONFIRMED — native `fetch` only |
| No other nav destinations built | CONFIRMED — only `/ask` and `/` are live links |

---

## 7. PR URL + Deviations

**PR: https://github.com/connordmcneely96/unionops-ai/pull/4**

### Deviations

**`/ask` route renders as `○ (Static)` in the build table.** This is correct and expected — the page is a `"use client"` shell with no server-side data fetching, so Next.js pre-renders a static HTML shell. All data fetching happens client-side via `POST /api/ask` at interaction time. The page is fully functional; the static shell is sent once, then React hydrates and handles all dynamic behavior in the browser.

**`SidebarNav` extracted to `src/app/_components/`** rather than inlining as a closure. This keeps `layout.tsx` as a proper server component (required for `export const metadata`) while isolating the `usePathname()` client boundary to a single small component. No functional deviation from the spec intent.

**Task 5 probes not executed** — no wrangler credentials in this environment (same blocker as commit 3). The commands above are ready to copy-paste once deployed.
