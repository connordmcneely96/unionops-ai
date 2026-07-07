# Ingestion Contract + Threshold Engine — Delivery Report

## 1. Files Created / Modified (by commit)

### Commit 1 — threshold config + pure engine
| File | Action |
|---|---|
| `src/lib/thresholds.ts` | Created — `THRESHOLDS` single source of truth |
| `src/lib/engine.ts` | Created — pure `classifyThermal` + `evaluateTelemetry` |

### Commit 2 — idempotent db upserts
| File | Action |
|---|---|
| `src/lib/db.ts` | Modified (additive) — `upsertFinding`, `upsertAlarm` |

### Commit 3 — thermal route
| File | Action |
|---|---|
| `src/app/api/ingest/thermal-roi/route.ts` | Created |

### Commit 4 — telemetry route + contract doc
| File | Action |
|---|---|
| `src/app/api/ingest/telemetry/route.ts` | Created |
| `docs/INGESTION_CONTRACT.md` | Created |

## 2. Engine Is Pure Arithmetic — No LLM Anywhere

`src/lib/engine.ts` contains only arithmetic and comparisons against `THRESHOLDS`. There is no `fetch`, no Anthropic call, no `@/lib/rag` import, no I/O, and no `env` in the engine. Both route handlers call the engine and then the D1 upsert helpers — no model call is made anywhere in this slice. The number path (severity, deltas, thresholds) is 100% deterministic.

## 3. All Thresholds in THRESHOLDS, Matching the Switchgear Doc

Every threshold number lives in `src/lib/thresholds.ts` (`THRESHOLDS`) — nothing is scattered. Thermal values mirror the validated NETA switchgear criteria:

| Band | Rule | Severity |
|---|---|---|
| Investigate | ΔT ≤ 5°F (`investigateMax`) | low |
| Probable deficiency | 5°F < ΔT ≤ 27°F | medium |
| Major discrepancy | ΔT > 27°F (`probableMax`) | high |
| Ambient emergency | maxTemp − ambient > 72°F (`deltaAmbientEmergencyF`) | forced high |
| Invalid load | all points < 40% (`minValidLoadPct`) | low advisory, no delta severity |

Cooling: coolant return > 105°F alarm, loop flow < 390 GPM finding, filter DP > 10 psi finding.

## 4. Idempotency Keys

| Endpoint | Emitted record | Deterministic id |
|---|---|---|
| thermal-roi | finding per equipment | `IF-<inspection_id>-<equipment_tag>` |
| telemetry | finding per condition | `IF-TEL-<equipment_tag>-<finding_type>` |
| telemetry | alarm per metric | `AL-TEL-<equipment_tag>-<metric>` |

All writes are `INSERT OR REPLACE`, so re-posting the same inspection/reading updates the row in place and never duplicates.

## 5. Build + Probes + PR + Deviations

**Build: PASS** — TypeScript clean. New routes:

```
ƒ /api/ingest/thermal-roi   (dynamic)
ƒ /api/ingest/telemetry     (dynamic)
```

### Probes (run after deploy — no creds in this environment)

```powershell
# switchgear, 28°F delta, valid load -> expect one HIGH finding
curl.exe -sS -L -X POST "$base/api/ingest/thermal-roi" -H "x-ingest-token: $token" -H "content-type: application/json" -d '{"inspection_id":"INSP-TEST-1","source":"drone_thermal","ambient_f":78,"points":[{"point_id":"A","equipment_tag":"SWGR-1","component":"phase A lug","temp_f":90,"load_pct":62},{"point_id":"B","equipment_tag":"SWGR-1","component":"phase B lug","temp_f":118,"load_pct":62},{"point_id":"C","equipment_tag":"SWGR-1","component":"phase C lug","temp_f":91,"load_pct":62}]}'

# cooling telemetry breach -> expect one HIGH alarm
curl.exe -sS -L -X POST "$base/api/ingest/telemetry" -H "x-ingest-token: $token" -H "content-type: application/json" -d '{"source":"bms","readings":[{"equipment_tag":"P-101","metric":"coolant_return_f","value":107,"unit":"F"}]}'
```

Expected: probe 1 → `{ created: [{ id: "IF-INSP-TEST-1-SWGR-1", severity: "high", ... }] }` (ΔT = 118−90 = 28°F > 27°F; ambient delta 118−78 = 40°F, below the 72°F emergency threshold, so high but not emergency). Probe 2 → `{ findings: [], alarms: ["AL-TEL-P-101-coolant_return_f"] }` (107 > 105).

### PR
**https://github.com/connordmcneely96/unionops-ai/pull/10** — open, not merged.

### Deviations

- **`thermal-roi` filters malformed points rather than 400-ing the whole batch.** Points failing the shape guard are dropped; the request still 400s if *no* valid points remain. This keeps a partially-malformed drone payload from being fully rejected while still enforcing "non-empty points." No functional impact on well-formed payloads.
- No other deviations. Severity stays `high|medium|low`; no `critical` introduced; engine emits findings/alarms only (no work-order chaining).
