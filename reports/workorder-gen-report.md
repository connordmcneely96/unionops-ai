# Work-Order Generation From Finding — Delivery Report

## 1. Files Created / Modified (by commit)

### Commit 1 — db helpers
| File | Action |
|---|---|
| `src/lib/db.ts` | Modified (additive) — `FindingRow` + `getFindingById`, `SaveWorkOrderInput` + `saveWorkOrder` |

### Commit 2 — generate route (draft, no persist)
| File | Action |
|---|---|
| `src/app/api/generate-work-order/route.ts` | Created |

### Commit 3 — persist route
| File | Action |
|---|---|
| `src/app/api/work-orders/route.ts` | Created |

### Commit 4 — UI
| File | Action |
|---|---|
| `src/app/_components/GenerateWorkOrder.tsx` | Created — `"use client"` per-finding island |
| `src/app/inspections/page.tsx` | Modified — mounts the island per row (stays a server component) |

## 2. Grounding, Determinism, Safety, Model

- **Retrieval-grounded:** `/api/generate-work-order` builds `query = "${finding.equipment_tag} ${finding.summary}"` and calls `retrieve(env, query)` (topK 4). The retrieved chunks are passed as numbered procedure context in the user message and their titles are returned as `sources`.
- **Priority is deterministic:** `mapPriority(severity)` — `high`/`critical` → `"high"`, `medium` → `"medium"`, else `"low"`. The LLM never sets priority; it is attached to the draft server-side after generation.
- **Safety notes from context only:** system prompt rule 2 requires safety notes to come from the provided procedure context and to fall back to `"Refer to the applicable site procedure for safety requirements"` when the context has no safety step — never invented. Rule 3 forbids invented specs/torque/setpoints (`per equipment datasheet`).
- **Native fetch, `claude-sonnet-4-5`,** `max_tokens: 800`, endpoint `https://api.anthropic.com/v1/messages`. No Anthropic SDK, no `ai` package.

## 3. Generate Does Not Persist; Save Writes; Idempotent Id

- `/api/generate-work-order` performs **no** D1/R2/Vectorize writes. It only reads the finding, retrieves context, calls the model, and returns `{ draft, sources }`. Nothing is persisted on Generate.
- Persistence happens **only** on explicit Save → `POST /api/work-orders`, which calls `saveWorkOrder`.
- Save id is `WO-GEN-${source_id}` (e.g. `WO-GEN-IF-3`). `saveWorkOrder` uses `INSERT OR REPLACE`, so re-saving the same finding's work order **overwrites in place and never duplicates** — fully idempotent.

## 4. Write Endpoint Flagged Unauthenticated (Demo Debt)

`/api/work-orders` is the app's **first write endpoint** and is currently **UNAUTHENTICATED**. This is called out in a code comment at the top of `src/app/api/work-orders/route.ts`. Blast radius is intentionally tiny: the id is always `WO-GEN-<findingId>`, so an unauthenticated caller can at worst overwrite a generated work order tied to an existing finding — it cannot write arbitrary ids or other tables. **It must gain auth (token or session) before production use.**

## 5. npm run build Result + PR URL + Deviations

**Build: PASS** — TypeScript clean. Relevant routes:

```
ƒ /api/generate-work-order    (dynamic)
ƒ /api/work-orders            (dynamic)
ƒ /inspections                (dynamic)
ƒ /work-orders                (dynamic)
```

### Probe (run after deploy — no creds in this environment)

```powershell
$base = "https://<host>"
curl.exe -sS -L -X POST "$base/api/generate-work-order" -H "content-type: application/json" -d '{"findingId":"IF-3"}'
```

Expected: a JSON `{ draft, sources }` where `draft.priority === "low"` (IF-3 is a low-severity HX-201 approach-temp finding), the draft is grounded in the cooling / heat-exchanger docs, and `safety_notes` is drawn from the retrieved context or the explicit refer-to-procedure fallback.

### PR
**https://github.com/connordmcneely96/unionops-ai/pull/9** — open, not merged.

### Deviations

- **`/api/generate-work-order` also returns 500 for a missing key and 404 before the key check.** Spec ordering was: 400 missing → 404 not found → 500 no key. Implemented order resolves the finding (404) before the key check (500) so a bad findingId is reported precisely even when the key is present; both required status codes are still returned. No functional impact on the happy path.
- **`GenerateWorkOrder` renders the draft as an inline card** (not a modal). The spec allowed "inline card / modal"; inline was chosen to keep the interaction within the finding row and avoid a portal/overlay dependency. No other deviations.
