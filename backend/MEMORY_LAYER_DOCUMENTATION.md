# PRECEDENT Member 1 — Hindsight Memory Intelligence Layer
## Development Documentation

**Project:** PRECEDENT — Advisory Pharmaceutical Manufacturing Quality Intelligence Backend  
**Layer:** Member 1 — Hindsight Memory Intelligence Layer  
**Backend:** `precedent_member2/backend/`  
**Status:** All 11 milestones complete (implementation); Hindsight external integration BLOCKED (no credentials)  
**Tests:** 108 passed, 0 failed, 0 errors  
**Date:** 2026-11-07

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Files Created](#files-created)
4. [Files Modified](#files-modified)
5. [Module Details](#module-details)
6. [API Endpoints](#api-endpoints)
7. [Database Models](#database-models)
8. [Schemas](#schemas)
9. [Security & Constraints](#security--constraints)
10. [Test Coverage](#test-coverage)
11. [BLOCKED Status](#blocked-status)
12. [Remaining Work](#remaining-work)

---

## Overview

The Hindsight Memory Intelligence Layer is Member 1's contribution to PRECEDENT — an AI quality intelligence agent for pharmaceutical manufacturing. This layer provides the system's memory capabilities: it remembers deviations, investigations, CAPAs, recommendations, human decisions, and whether corrective actions actually worked.

It integrates with Member 2's backend through documented contracts (the `MemoryAdapter` Protocol) without exposing Hindsight SDK internals to Member 2 or Member 3.

**Key design principles:**
- All records are synthetic; explicitly labelled `is_synthetic=True`
- Not GMP-validated or 21 CFR Part 11 compliant
- No credentials in logs; no insecure fallback; no fake client responses
- Memory ON/OFF enforced at the backend; memory-disabled requests cannot access historical context
- Role-based memory tagging (INVESTIGATOR/SKEPTIC/AUDITOR) with no cross-role leakage
- Hindsight outage does not destroy events; failed sync recovers safely via the outbox pattern

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI REST API                         │
│  /memory/retain  /memory/recall  /memory/reflect            │
│  /memory/governance  /memory/sync  /analytics/calibration   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 HindsightAdapter (MemoryAdapter Protocol)   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ RetainEngine│  │ RecallEngine│  │ ReflectEngine   │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │ HindsightClient│ │Calibration││ SyncEngine   │
    │ (HTTP client)  │ │Engine    │ │ (outbox)     │
    └──────────────┘  └──────────┘  └──────────────┘
              │               │               │
              ▼               ▼               �ivot
    ┌──────────────────────────────────────────────────────┐
    │                    SQL Database                        │
    │  memory_events  outbox  memory_settings  ...          │
    └──────────────────────────────────────────────────────┘
```

**Layers:**
1. **API Layer** — FastAPI endpoints in `app/api/v1/router.py`
2. **Adapter Layer** — `HindsightAdapter` implements `MemoryAdapter` Protocol (retain/recall/reflect)
3. **Engine Layer** — RetainEngine, RecallEngine, ReflectEngine, CalibrationEngine, SyncEngine
4. **Client Layer** — `HindsightClient` — HTTP client with auth, retries, error classification
5. **Data Layer** — SQLAlchemy ORM models (MemoryEvent, Outbox, MemorySetting, etc.)

---

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `app/memory/hindsight_client.py` | Hindsight SDK client: auth, config, health, retries, error classification, structured logging | ~215 |
| `app/memory/hindsight_adapter.py` | HindsightAdapter implementing MemoryAdapter Protocol (replaces MockMemoryAdapter) | ~50 |
| `app/memory/event_models.py` | Typed memory event models with schema validation | ~150 |
| `app/memory/retain_engine.py` | RETAIN engine: persistence, deduplication, idempotency, synchronization | ~160 |
| `app/memory/recall_engine.py` | RECALL engine: retrieval by plant, role, dimension | ~100 |
| `app/memory/reflect_engine.py` | REFLECT engine: structured analytical output, no invented precedents | ~100 |
| `app/memory/evidence_resolution.py` | Citation resolution, source validation, claim-to-source mapping, contradiction detection | ~100 |
| `app/memory/governance.py` | Memory ON/OFF controller, enforcement, authorization, audit history | ~100 |
| `app/memory/tagging.py` | Role-based memory tagging (INVESTIGATOR/SKEPTIC/AUDITOR) | ~100 |
| `app/memory/calibration.py` | Self-calibration engine: effectiveness, recurrence, by equipment/action class | ~160 |
| `app/memory/sync.py` | Synchronization and recovery: outbox pattern, retry-safe, duplicate detection | ~160 |
| `app/services/hindsight_service.py` | High-level service orchestrating retain/recall/reflect/calibration/sync | ~90 |
| `tests/test_sync.py` | Unit tests for SyncEngine (9 tests) | ~200 |

---

## Files Modified

| File | Change |
|------|--------|
| `app/memory/__init__.py` | Exports HindsightAdapter, HindsightClient, all client error types, event models, EventType, RoleTag, SyncStatus, EvidenceReference, SyncEngine |
| `app/api/v1/router.py` | Added memory endpoints: retain, recall, reflect, governance (ON/OFF), calibration, sync, memory status, inspector evidence |
| `app/core/config.py` | Added Hindsight config: `hindsight_api_key`, `hindsight_endpoint`, `hindsight_timeout` (30.0), `hindsight_max_retries` (3) |
| `app/models/entities.py` | Added MemoryEvent, Outbox, MemorySetting SQLAlchemy models |
| `app/schemas/contracts.py` | Added MemoryRetainRequest/Response, MemoryRecallResponse, MemoryReflectRequest/Response, MemoryGovernanceRequest/Response, MemoryStatusResponse |

---

## Module Details

### 1. HindsightClient (`app/memory/hindsight_client.py`)

Thin synchronous HTTP client for the Hindsight memory service.

**Authentication:** Bearer token from `HINDSIGHT_API_KEY`  
**Endpoint:** `HINDSIGHT_ENDPOINT`  
**Retry policy:** Exponential backoff (2^attempt seconds), max 3 retries  
**Timeout:** Configurable, default 30.0s

**Error classes:**
| Error | HTTP Status | Retryable |
|-------|-------------|-----------|
| `HindsightConfigurationError` | N/A (missing credentials) | No |
| `HindsightTimeoutError` | Request timeout | Yes |
| `HindsightRateLimitError` | 429 | Yes |
| `HindsightAuthError` | 401/403 | No |
| `HindsightServerError` | 5xx | Yes |
| `HindsightNetworkError` | Unreachable | Yes |
| `HindsightJSONParseError` | Malformed JSON | No |

**Methods:**
- `health()` — Check Hindsight service health (GET /health)
- `write_event(event)` — Write a memory event (POST /events)
- `read_events(plant_id, deviation_id, limit)` — Read events filtered by plant/deviation (GET /events)
- `close()` — Close HTTP connection pool

**Security:** API keys are redacted in logs (`_redact_api_key()` shows only last 4 chars). Never logs full credentials.

---

### 2. HindsightAdapter (`app/memory/hindsight_adapter.py`)

Implements the `MemoryAdapter` Protocol (recall/retain/reflect). Delegates to RetainEngine, RecallEngine, ReflectEngine. Falls back to local-only mode when Hindsight is not configured.

**Methods:**
- `retain(event)` → dict — Retain a memory event, sync to Hindsight if configured
- `recall(deviation)` → list[dict] — Recall events matching deviation context (filtered by plant_id)
- `reflect(deviation, evidence)` → dict — Structured reflection on a deviation

---

### 3. Event Models (`app/memory/event_models.py`)

Typed Pydantic models for memory events.

**Enums:**
- `EventType` — DEVIATION_RETAINED, INVESTIGATION_COMPLETED, CAPA_CREATED, RECOMMENDATION_ISSUED, DECISION_MADE, EFFECTIVENESS_ASSESSED
- `RoleTag` — INVESTIGATOR, SKEPTIC, AUDITOR
- `SyncStatus` — PENDING, SYNCED, FAILED

**Models:**
- `EvidenceReference` — source_record_id, claim, confidence
- `MemoryEvent` — Base model with source_record_id, event_type, plant_id, deviation_id, role_tag, is_synthetic, payload, sync_status
- Subclasses: `DeviationEvent`, `InvestigationEvent`, `CAPAEvent`, `RecommendationEvent`, `DecisionEvent`, `EffectivenessEvent`

All synthetic data is explicitly labelled (`is_synthetic=True`).

---

### 4. RetainEngine (`app/memory/retain_engine.py`)

**`retain(event)` — Retain a memory event:**

1. Validates required fields (source_record_id, event_type, plant_id)
2. Idempotency check — returns existing record if source_record_id already retained
3. Validates role_tag if present (INVESTIGATOR/SKEPTIC/AUDITOR)
4. Persists locally to MemoryEvent table (sync_status=PENDING)
5. Writes to Hindsight (if client configured)
6. On success: marks SYNCED
7. On failure: marks FAILED, writes to outbox for later recovery

**Returns:**
```json
{
  "status": "retained" | "retained_locally" | "already_retained",
  "source_record_id": "...",
  "event_id": "...",
  "synced": true/false,
  "error": null | "...",
  "hindsight_response": null | {...}
}
```

**Errors:** `DuplicateEventError` — raised when retaining the same source_record_id twice (idempotency path returns existing instead).

---

### 5. RecallEngine (`app/memory/recall_engine.py`)

**`recall(deviation, role_tag)` — Recall memory events:**

- Filters by plant_id (no cross-plant leakage)
- Role-based access control (no cross-role leakage)
- Dimension filtering support

**Methods:**
- `recall_by_dimension(deviation, dimension)` — Retrieve by equipment, line, failure mode, etc.
- `recall_by_source_record_id(source_record_id)` — Retrieve by original identity

---

### 6. ReflectEngine (`app/memory/reflect_engine.py`)

**`reflect(deviation, role_tag)` — Produce structured reflection:**

- Similar deviations from history
- Verified interventions (outcome=VERIFIED_EFFECTIVE)
- Failed interventions (outcome=RECURRENCE_OBSERVED)
- Evidence references mapping claims to sources
- Uncertainty flags
- `no_invented_precedents=True` — never fabricates historical precedents

---

### 7. Evidence Resolution (`app/memory/evidence_resolution.py`)

- `resolve_citation(source_record_id)` — Resolve a citation to its source record
- `map_claims_to_sources(claims, sources)` — Map evidence-backed claims to source records
- `detect_contradictions(claims)` — Detect contradictory claims

**Errors:** `SourceNotFoundError`, `ContradictionError`

---

### 8. Memory Governance (`app/memory/governance.py`)

**Memory ON/OFF controller — per-plant or global (plant_id=None).**

**Methods:**
- `is_enabled(plant_id)` — Check if memory is enabled for a plant
- `set_enabled(plant_id, enabled, actor)` — Enable/disable memory, audit-logged
- `enforce(plant_id)` — Raise if memory is disabled (blocks access to historical context)

**AuditEvent logging** on every toggle (who, when, what changed).

**Enforcement:** Memory-disabled requests cannot access historical context — enforced at the backend in all memory endpoints.

---

### 9. Role-Based Memory Tagging (`app/memory/tagging.py`)

**Role tags:** INVESTIGATOR, SKEPTIC, AUDITOR

**Functions:**
- `validate_role_tag(role_tag)` — Validate against allowed roles
- `can_access_event(user_role, event_role_tag)` — Check role-based access
- `filter_events_by_role(events, user_role)` — Filter events by role (no cross-role leakage)
- `tag_event(event, role_tag)` — Tag an event with a role

**Error:** `InvalidRoleTagError`

---

### 10. Self-Calibration Engine (`app/memory/calibration.py`)

Computes reproducible calibration metrics from persisted EffectivenessCheck records.

**Methods:**
- `compute_effectiveness_rate(plant_id)` — VERIFIED_EFFECTIVE / total assessed
- `compute_recurrence_rate(plant_id)` — RECURRENCE_OBSERVED / total assessed
- `compute_by_equipment_class(plant_id)` — Grouped by equipment_code
- `compute_by_action_class(plant_id)` — Grouped by CAPA action_class
- `compute_all(plant_id)` — All metrics combined

All metrics include `is_synthetic=True` and note that predictive accuracy is not calculated until explicit expected-vs-observed evaluation.

---

### 11. Synchronization & Recovery Engine (`app/memory/sync.py`)

**`SyncEngine` — Outbox pattern for sync/recovery.**

**`reconcile_outbox()` — Process all pending/failed outbox entries:**

- Processes PENDING/FAILED outbox entries in created_at order
- Duplicate detection: skips events already marked SYNCED
- Auth errors: not retried (permanent failure)
- Transient errors (timeout/network): retried, retry_count incremented
- Max retry limit: 5 attempts, then permanent failure
- Each entry committed individually (transaction boundaries)

**Returns:**
```json
{
  "processed": N,
  "synced": N,
  "failed": N,
  "remaining": N,
  "error": null | "No Hindsight client configured"
}
```

**`get_outbox_status()` — Outbox summary:**
```json
{
  "total": N,
  "pending": N,
  "syncing": N,
  "synced": N,
  "failed": N
}
```

**Acceptance criterion met:** Hindsight outage does not destroy events; failed sync recovers safely via the outbox.

---

### 12. Hindsight Service (`app/services/hindsight_service.py`)

High-level service orchestrating all memory operations through a unified interface.

**Methods:**
- `retain_event(event)` — Delegate to HindsightAdapter.retain
- `recall_events(deviation)` — Delegate to HindsightAdapter.recall
- `reflect_deviation(deviation, evidence)` — Delegate to HindsightAdapter.reflect
- `calibration_metrics(plant_id)` — Delegate to CalibrationEngine.compute_all
- `reconcile_outbox()` — Delegate to SyncEngine.reconcile_outbox
- `outbox_status()` — Delegate to SyncEngine.get_outbox_status

Uses context manager pattern (`__enter__`/`__exit__`) for database session management.

---

## API Endpoints

All memory endpoints enforce Memory Governance (ON/OFF) at the backend.

| Method | Endpoint | Description | Governance |
|--------|----------|-------------|------------|
| POST | `/memory/retain` | Retain a memory event | ✅ Enforced |
| GET | `/memory/recall` | Recall events (plant_id, deviation_id, role_tag) | ✅ Enforced |
| POST | `/memory/reflect` | Reflect on a deviation | ✅ Enforced |
| POST | `/memory/governance` | Set memory ON/OFF for a plant | N/A (control endpoint) |
| GET | `/memory/governance/{plant_id}` | Get memory status for a plant | N/A (status endpoint) |
| POST | `/memory/sync` | Reconcile outbox (retry failed syncs) | ✅ Enforced |
| GET | `/memory/sync/status` | Get outbox status summary | ✅ Enforced |
| GET | `/memory/{deviation_id}` | Memory status for a deviation | N/A (status only) |
| GET | `/analytics/calibration` | Calibration metrics | ✅ Enforced |

Existing endpoints updated:
- `POST /deviations/{deviation_id}/investigate` — Uses HindsightAdapter, reports memory_enabled
- `GET /deviations/{deviation_id}/precedents` — Uses HindsightAdapter.recall
- `GET /inspector/{deviation_id}` — Uses HindsightAdapter.recall for evidence

---

## Database Models

| Table | Fields | Purpose |
|-------|--------|---------|
| `memory_events` | id, source_record_id, event_type, plant_id, deviation_id, role_tag, is_synthetic, payload, created_at, synced_at, sync_status | Persisted memory events with identity and provenance |
| `outbox` | id, event_id, status, retry_count, last_error, created_at, updated_at | Outbox for sync/recovery (events not yet synced to Hindsight) |
| `memory_settings` | id, plant_id, enabled, updated_at, updated_by | Memory ON/OFF governance setting per plant |

Indexes: source_record_id, event_type, plant_id, deviation_id, role_tag, sync_status

---

## Schemas

| Schema | Fields |
|--------|--------|
| `MemoryRetainRequest` | source_record_id, event_type, plant_id, deviation_id?, role_tag?, payload, is_synthetic |
| `MemoryRetainResponse` | status, source_record_id, event_id, synced, error?, hindsight_response? |
| `MemoryRecallResponse` | deviation_id, records, adapter |
| `MemoryReflectRequest` | plant_id, deviation_id?, failure_mode?, role_tag? |
| `MemoryReflectResponse` | deviation_id?, plant_id, similar_deviations, verified_interventions, failed_interventions, evidence_references, uncertainty, no_invented_precedents, role_tag? |
| `MemoryGovernanceRequest` | plant_id?, enabled, actor? |
| `MemoryGovernanceResponse` | id, plant_id?, enabled, updated_at?, updated_by? |
| `MemoryStatusResponse` | deviation_id, adapter, status, memory_enabled, note |

---

## Security & Constraints

| Constraint | Implementation |
|------------|----------------|
| No credentials in logs | API keys redacted (`***<last4>`) in all log output |
| No insecure fallback | HindsightClient raises on error; never falls back to mock/fabricated |
| No fake client responses | All HindsightClient methods raise on error |
| Synthetic data labelled | `is_synthetic=True` on all events and metrics |
| Not 21 CFR Part 11 compliant | Explicitly stated; demo/hackathon MVP |
| Hindsight unavailable → BLOCKED | Recorded as BLOCKED; no fabrication |
| Memory ON/OFF enforced | `require_memory_enabled()` in all memory endpoints |
| No cross-role leakage | Role-based filtering in tagging and recall engines |
| No cross-plant leakage | plant_id filtering in all recall operations |

---

## Test Coverage

**108 tests total** across 10 test files:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `test_hindsight_client.py` | 17 | Client init, headers, error classification, retry, redaction |
| `test_event_models.py` | 15 | Event creation, enums, serialization |
| `test_retain_engine.py` | 10 | Success, duplicate, missing fields, invalid role, Hindsight failures |
| `test_recall_engine.py` | 12 | Plant filtering, role access, dimension filtering |
| `test_evidence_resolution.py` | 8 | Citation resolution, claim mapping, contradiction detection |
| `test_reflect_engine.py` | 6 | Similar deviations, verified/failed interventions, no invented precedents |
| `test_governance.py` | 8 | Enable/disable, enforcement, audit logging |
| `test_tagging.py` | 12 | Role validation, access control, filtering |
| `test_calibration.py` | 8 | Effectiveness rate, recurrence rate, grouping |
| `test_sync.py` | 9 | Sync success, skip synced, auth error, retry, max retries, no client, not found, status, batch |

**Run:** `python -m pytest tests/`

---

## BLOCKED Status — Hindsight Credentials

**Status:** BLOCKED (recorded 2026-11-07)

**Reason:** `HINDSIGHT_API_KEY` and `HINDSIGHT_ENDPOINT` are not configured:
- No `.env` file exists (only `.env.example` with empty values)
- No `HINDSIGHT_*` environment variables set in the runtime environment

**Per security constraints:**
- The Hindsight external integration remains BLOCKED
- No fabricated results will be produced
- All local modules, unit tests (108 passed), and offline functionality are complete
- PHASE D QA against real Hindsight cannot proceed until credentials are provided

**To unblock:** Create a `.env` file with valid `HINDSIGHT_API_KEY` and `HINDSIGHT_ENDPOINT` values, or set them as environment variables.

---

## Remaining Work (per plan)

| Phase | Status | Notes |
|-------|--------|-------|
| PHASE A — Product Discovery | Complete | — |
| PHASE B — Plan Review | Complete | — |
| PHASE C — Implementation (Milestones 1–11) | Complete | All 11 milestones implemented |
| PHASE D — QA | **Blocked** | Requires Hindsight credentials for integration testing |
| PHASE E — Release Review | **Pending** | Depends on PHASE D completion |

**Next steps when credentials are available:**
1. Provide HINDSIGHT_API_KEY and HINDSIGHT_ENDPOINT
2. Run PHASE D QA against the running application
3. Test actual Hindsight integration paths
4. Run failure recovery tests (outage simulation)
5. Proceed to PHASE E: `/review`, `/qa`, `/ship` (if authorized), `/retro`, `/learn`

---

## Extra Functionalities Added (beyond plan)

The following were added during implementation beyond the original plan scope:

1. **`app/memory/sync.py`** — SyncEngine with outbox reconciliation (Milestone 11, was pending)
2. **`app/services/hindsight_service.py`** — High-level service layer (listed in plan but was missing; now created)
3. **`POST /memory/sync`** and **`GET /memory/sync/status`** API endpoints — Expose sync/recovery through the REST API
4. **`tests/test_sync.py`** — 9 unit tests for SyncEngine (batch processing, duplicate detection, retry limits, auth error handling)

---
