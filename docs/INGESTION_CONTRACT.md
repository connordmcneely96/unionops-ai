# Ingestion Contract

The contract the edge gateway / drone-platform integration posts to. The engine
applies deterministic thresholds (`src/lib/thresholds.ts`) — **no LLM in the
number path** — and emits findings/alarms into D1 for facility `FAC-UC`.

## Auth

All ingestion endpoints require a header:

```
x-ingest-token: <INGEST_TOKEN>
```

Missing or mismatched token → `401` (fail-closed).

## POST /api/ingest/thermal-roi

Thermographic scan points (e.g. from a drone thermal pass).

### Request body

```json
{
  "inspection_id": "INSP-2026-07-07-01",
  "source": "drone_thermal",
  "ambient_f": 78,
  "points": [
    { "point_id": "A", "equipment_tag": "SWGR-1", "component": "phase A lug", "temp_f": 90,  "load_pct": 62 },
    { "point_id": "B", "equipment_tag": "SWGR-1", "component": "phase B lug", "temp_f": 118, "load_pct": 62 },
    { "point_id": "C", "equipment_tag": "SWGR-1", "component": "phase C lug", "temp_f": 91,  "load_pct": 62 }
  ]
}
```

- `inspection_id` (string, required)
- `source` (string, optional; default `drone_thermal`)
- `ambient_f` (number, optional) — enables the ambient-emergency override
- `points` (array, required, non-empty): `{ point_id, equipment_tag, component, temp_f, load_pct }`

`inspection_id` missing or `points` empty → `400`.

### Response

```json
{ "created": [ { "id": "IF-INSP-2026-07-07-01-SWGR-1", "equipment_tag": "SWGR-1", "severity": "high", "summary": "..." } ] }
```

### Idempotency

One finding per equipment per inspection:

```
IF-<inspection_id>-<equipment_tag>
```

Re-posting the same `inspection_id` updates in place — never duplicates.

## POST /api/ingest/telemetry

Metric readings (e.g. from the BMS).

### Request body

```json
{
  "source": "bms",
  "readings": [
    { "equipment_tag": "P-101", "metric": "coolant_return_f", "value": 107, "unit": "F" }
  ]
}
```

- `source` (string, optional; default `telemetry`)
- `readings` (array, required, non-empty): `{ equipment_tag, metric, value, unit }`

Empty `readings` → `400`.

### Known metrics

| metric | threshold | emits |
|---|---|---|
| `coolant_return_f` | `> 105` | alarm (high) High Coolant Return Temp |
| `loop_flow_gpm` | `< 390` | finding (medium) low_flow |
| `filter_dp_psi` | `> 10` | finding (medium) filter_dp |

Unknown metrics are ignored.

### Response

```json
{ "findings": ["IF-TEL-P-101-low_flow"], "alarms": ["AL-TEL-P-101-coolant_return_f"] }
```

### Idempotency

One open finding per equipment+condition; one open alarm per equipment+metric:

```
IF-TEL-<equipment_tag>-<finding_type>
AL-TEL-<equipment_tag>-<metric>
```

Repeat posts update in place — no pile-up.

## Thresholds

All threshold numbers live in `src/lib/thresholds.ts` (`THRESHOLDS`) — the single
source of truth. Thermal ΔT criteria mirror the validated NETA switchgear
severity bands (investigate ≤5°F, probable 7–27°F, major >27°F, ambient-emergency
>72°F over ambient); cooling values are demo defaults pending PE validation.
