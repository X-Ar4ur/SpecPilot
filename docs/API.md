# SpecPilot API Contract

All API paths are served by the FastAPI backend. JSON is UTF-8. Datetimes use ISO 8601 UTC strings.

## Ingestion

### `POST /api/ingestion/crawl`

Starts or refreshes the manual crawl.

Request:

```json
{
  "base_url": "https://docs.4gaboards.com/",
  "sections": ["user-manual", "admin-manual"],
  "language": "en"
}
```

Response:

```json
{
  "crawl_id": "crawl_20260506_001",
  "status": "queued"
}
```

### `POST /api/ingestion/index`

Indexes crawled manual chunks into ChromaDB.

Request:

```json
{
  "crawl_id": "crawl_20260506_001",
  "force": false
}
```

Response:

```json
{
  "index_id": "idx_20260506_001",
  "status": "queued"
}
```

## Features

### `POST /api/features/extract`

Extracts feature points from indexed manual evidence.

Request:

```json
{
  "index_id": "idx_20260506_001",
  "min_evidence": 1
}
```

Response:

```json
{
  "job_id": "job_features_001",
  "status": "queued"
}
```

### `GET /api/features`

Response:

```json
{
  "items": [
    {
      "feature_id": "ft_card_creation",
      "module": "Card",
      "title": "创建 Card",
      "summary": "用户可以在指定 List 中创建 Card。",
      "source_urls": ["https://docs.4gaboards.com/cards/create"],
      "evidence_quotes": ["在 List 中点击 Add Card 即可创建新的卡片。"],
      "coverage_status": "covered",
      "confidence": 0.91
    }
  ]
}
```

## Scenarios

### `POST /api/scenarios/generate`

Generates zero-locator test scenarios from extracted features.

Request:

```json
{
  "feature_ids": ["ft_card_creation"],
  "max_scenarios_per_feature": 3
}
```

Response:

```json
{
  "job_id": "job_scenarios_001",
  "status": "queued"
}
```

### `GET /api/scenarios`

Query parameters:

- `feature_id`;
- `priority`;
- `difficulty`;
- `review_status`;
- `latest_result`;
- `is_mutation`.

Response:

```json
{
  "items": [
    {
      "scenario_id": "sc_create_card_001",
      "feature_id": "ft_card_creation",
      "title": "在指定 List 中创建新 Card",
      "priority": "P0",
      "difficulty": "simple",
      "review_status": "auto_validated",
      "latest_result": "pass",
      "is_mutation": false
    }
  ]
}
```

### `GET /api/scenarios/{scenario_id}`

Returns the full scenario schema defined in `docs/SCHEMAS.md`.

## Runs

### `POST /api/runs`

Creates a run for one or more scenarios.

Request:

```json
{
  "scenario_ids": ["sc_create_card_001"],
  "mode": "single",
  "config": {
    "max_steps": 10,
    "retry_limit": 1
  }
}
```

Response:

```json
{
  "run_id": "run_20260506_001",
  "status": "queued",
  "live_url": "/runs/live/run_20260506_001"
}
```

### `GET /api/runs`

Returns paginated run metadata for the history table.

### `GET /api/runs/{run_id}`

Returns run summary, verification result, failure classification, and report links.

### `GET /api/runs/{run_id}/events`

SSE stream. Event payloads use `TraceEvent` from `docs/SCHEMAS.md`.

### `GET /api/runs/{run_id}/trace`

Returns `trace.jsonl` as structured JSON lines or a parsed array.

### `GET /api/runs/{run_id}/artifacts`

Lists the artifact tree for the run.

### `GET /api/runs/{run_id}/artifacts/{path}`

Returns a file under `data/runs/{run_id}/`. The backend must reject path traversal.

## Mutations

### `POST /api/mutations/generate`

MVP stub endpoint. It must return a valid schema with an empty list or 1-2 fixed example mutations to wire up the frontend.

Request:

```json
{
  "scenario_ids": ["sc_create_card_001"],
  "mutation_types": ["data", "flow", "expectation_inversion"],
  "max_per_scenario": 3
}
```

Field defaults:

- `mutation_types` is optional; defaults to all three types.
- `max_per_scenario` is optional; defaults to `3`.

Response:

```json
{
  "mutations": []
}
```

Each item in `mutations` follows `MutatedScenario` in `docs/SCHEMAS.md`.

## Reports

### `GET /api/reports/{report_id}`

Returns report metadata and links to `report.json` and `report.html`.

## System

### `GET /health`

Liveness probe. Returns `{"status": "ok"}`. Exposed from Milestone 0.

### `GET /api/settings`

Returns runtime settings for the frontend settings drawer. Secret values are never returned; only `configured` booleans are exposed.

Response:

```json
{
  "models": {
    "text_llm_provider": "deepseek",
    "deepseek_model": "deepseek-v4-pro",
    "deepseek_api_key_configured": true,
    "browser_use_model": "bu-latest",
    "browser_use_api_key_configured": false,
    "browser_use_llm_fallback_enabled": false,
    "browser_use_cloud_browser_enabled": false,
    "glm_vision_model": "glm-4.6v",
    "glm_api_key_configured": true
  }
}
```

### `PATCH /api/settings`

Updates runtime settings. Secret fields are write-only. The MVP must reject `browser_use_cloud_browser_enabled=true`.

Request:

```json
{
  "models": {
    "text_llm_provider": "browser_use",
    "deepseek_model": "deepseek-v4-pro",
    "deepseek_api_key": null,
    "browser_use_model": "bu-latest",
    "browser_use_api_key": "write-only-new-key",
    "browser_use_llm_fallback_enabled": false,
    "browser_use_cloud_browser_enabled": false,
    "glm_vision_model": "glm-4.6v",
    "glm_api_key": null
  }
}
```

Response returns the same shape as `GET /api/settings`, with no secret values.

### `GET /api/doctor`

Environment readiness check used by the frontend settings drawer. Verifies selected text model provider keys, GLM vision key, browser-use installation, database, ChromaDB, and artifact root.

Response:

```json
{
  "status": "ok",
  "checks": {
    "text_llm_provider": {"status": "ok", "detail": "deepseek"},
    "deepseek_api": {"status": "ok", "detail": "key configured for deepseek-v4-pro"},
    "browser_use_llm": {"status": "warning", "detail": "not selected"},
    "browser_use_cloud_browser": {"status": "ok", "detail": "disabled for MVP"},
    "glm_vision_api": {"status": "ok", "detail": "key configured"},
    "browser_use": {"status": "ok", "detail": "browser-use 0.12.x installed"},
    "database": {"status": "ok", "detail": "sqlite reachable"},
    "chroma": {"status": "ok", "detail": "persist dir writable"},
    "artifact_root": {"status": "ok", "detail": "data/runs writable"}
  }
}
```

Each check status is `ok`, `warning`, or `error`. Top-level `status` is the worst child status.
