# Board-Level Readiness Report — Delivery Report

## 1. Files Created / Modified (by commit)

### Commit 1 — Report data layer
| File | Action |
|---|---|
| `src/lib/db.ts` | Modified (additive) — added `DomainReadiness` interface + `getReadinessByDomain()` |
| `src/lib/report.ts` | Created — `ReportData` interface + `gatherReportData()` |

### Commit 2 — /api/report route
| File | Action |
|---|---|
| `src/app/api/report/route.ts` | Created — `force-dynamic` POST; deterministic data + LLM narrative |

### Commit 3 — /reports page + print/PDF + nav
| File | Action |
|---|---|
| `src/app/reports/page.tsx` | Created — `"use client"` report page + print button |
| `src/app/globals.css` | Modified — scoped `@media print` rules |
| `src/app/_components/SidebarNav.tsx` | Modified — activated "Reports" → `/reports` |

## 2. npm run build Result

**PASS** — TypeScript clean. Routes:

```
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/ask
├ ƒ /api/ingest
├ ƒ /api/report      ← new, dynamic (ƒ)
├ ○ /ask
└ ○ /reports         ← new
```

## 3. Determinism + Model Confirmation

- **All numbers are D1 / `computeReadiness`-sourced and rendered directly.** `gatherReportData()` (`src/lib/report.ts`) is the single source of truth: facility fields, `computeReadiness(...)` for the score/label, `getKpis()` counts, `getFindings/getSecurityEvents/getAlarms/getWorkOrders` lists, and `getReadinessByDomain()` for the domain table. The `/reports` page renders these values directly from the `data` object.
- **The LLM produces narrative only** — `executiveSummary`, `keyRisks`, `recommendedActions`. It receives the numbers as read-only context and is instructed (system prompt rule 1) never to state a different score or count. It cannot alter any rendered metric because the page never reads numbers from the narrative object.
- **Native fetch, model `claude-sonnet-4-5`**, `max_tokens: 900`, endpoint `https://api.anthropic.com/v1/messages`. No Anthropic SDK, no `ai` package.

## 4. Parse-Failure Path Still Renders Real Numbers

In `src/app/api/report/route.ts`, narrative parsing is wrapped:

```ts
let narrative: Narrative;
try {
    narrative = parseNarrative(rawText);
} catch {
    console.error("Narrative parse failure; returning empty narrative.");
    narrative = EMPTY_NARRATIVE;   // { executiveSummary:"", keyRisks:"", recommendedActions:[] }
}
return NextResponse.json({ data, narrative });
```

A malformed LLM response does **not** produce a 500. The route returns the deterministic `data` (all real numbers) with empty narrative fields. The page renders the full report — facility header, readiness score, domain table, findings, alarms, work orders — and simply omits the prose (showing a muted "Narrative unavailable" note for the executive summary). The numbers always survive.

## 5. Print CSS Is Scoped

Print rules in `globals.css` are all prefixed with `body:has(.reports-page)`. The `.reports-page` class exists **only** on the `/reports` page root. The dashboard (`/`) and `/ask` render no such element, so `body:has(.reports-page)` never matches on those routes and their print output is completely unaffected. In print on `/reports`: the top bar (`> header`), sidebar (`nav`), and on-screen controls (`.report-controls`) are hidden; the report card renders full-width, flat, black-on-white with page margins.

## 6. Probe + PR URL + Deviations

### Probe (run after deploy — no creds in this environment)

```powershell
$base = "https://<host>"
curl.exe -sS -L -X POST "$base/api/report" -H "content-type: application/json"
```

Expected: JSON `{ data, narrative }` with `data.readiness.score === 76`, `data.readiness.label === "Watch"` (seed data: findings −6/−3/−1, security −3/−1, alarms −4/−2/−4 = −24 → 76), and non-empty `narrative.executiveSummary` / `keyRisks` / `recommendedActions`.

### PR
**https://github.com/connordmcneely96/unionops-ai/pull/7** — open, not merged.

### Deviations

- **`gatherReportData()` takes no `env` argument.** The spec sketched `gatherReportData(env)`, but the existing `src/lib/db.ts` helpers already obtain bindings internally via `getCloudflareContext()` (they take no env). To reuse them unchanged, `gatherReportData()` also resolves bindings internally rather than threading an `env` param. Functionally equivalent; no behavior difference. All db reads still go through the proven `lib/db.ts` layer.
- **Print scoping uses `:has()`** rather than a body class. Because the sidebar/top bar live in `layout.tsx` (siblings of the page, not descendants), an ancestor-scoped selector isn't possible; `body:has(.reports-page)` is the clean way to scope global print rules to just this route. Supported in all current evergreen browsers — appropriate for a demo Save-as-PDF flow.
