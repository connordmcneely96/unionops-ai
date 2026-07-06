# Switchgear Doc Standards Fix — Report

## Change Scope

| Confirmation | Status |
|---|---|
| Only `src/lib/demo-docs.ts` changed | CONFIRMED — `git diff --name-only` returns exactly one file |
| Only the Switchgear doc's `content` string changed | CONFIRMED — diff hunks confined to lines 137–180, inside the Switchgear doc entry (starts line 124; next doc starts line 183) |
| Title / slug / docType unchanged | CONFIRMED — `title: "Switchgear Thermographic Inspection Procedure"`, `slug: "switchgear-thermographic-inspection"`, `docType: "procedure"` untouched |
| Other 5 docs untouched | CONFIRMED |
| No schema / workflow / bindings / deps changed | CONFIRMED |

## Diff Summary

```
 src/lib/demo-docs.ts | 46 ++++++++++++++++++++++++----------------------
 1 file changed, 24 insertions(+), 22 deletions(-)
```

Content replaced verbatim with the ANSI/NETA MTS severity criteria block:
- **2.1 Severity Criteria** — Investigate (~5 °F/3 °C), Probable deficiency (~7–27 °F/4–15 °C), Major discrepancy (>27 °F/15 °C), Emergency (>72 °F/40 °C over ambient).
- Note tying the dashboard ~28 °F drone finding to the >27 °F major-discrepancy threshold.
- PPE arc-flash category set by incident-energy analysis (not a fixed CAT value).

## Build

`npm run build` — **PASS** (typecheck clean; string-only change).

```
✓ Compiled successfully
✓ Generating static pages (3/3)

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/ask
├ ƒ /api/ingest
└ ○ /ask
```

## PR

**https://github.com/connordmcneely96/unionops-ai/pull/5** — open, not merged.
