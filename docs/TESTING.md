# SpecPilot Testing Contract

Every milestone must run the tests relevant to files changed. Do not claim completion without reporting the exact commands and outcomes.

## Environment

This project uses a single project-level `uv`-managed virtual environment at `<repo-root>/.venv`. All Python commands run from the **repository root** via `uv run <cmd>`. Do not `cd backend` before invoking `uv`. Do not create per-subdirectory virtualenvs.

Bootstrap once:

```bash
uv venv --python 3.12 .venv
uv sync
```

## Backend Commands

Expected backend test command (run from repository root):

```bash
uv run pytest
```

To run a subset of tests, point pytest at the relevant files under `backend/tests/`:

```bash
uv run pytest backend/tests/test_scenario_schema.py
```

Expected backend lint/type commands:

```bash
uv run ruff check .
uv run pyright
```

## Frontend Commands

Expected frontend test command after the Next.js project exists:

```bash
cd frontend
pnpm test
```

Expected frontend quality command:

```bash
cd frontend
pnpm lint
pnpm typecheck
```

Expected frontend build command:

```bash
cd frontend
pnpm build
```

## Required Unit Tests

Backend:

- scenario schema rejects forbidden locator fields;
- feature schema requires source URLs and evidence quotes;
- quote validator rejects quotes absent from source chunks;
- expectation type dispatches to the correct verifier;
- GLM vision verifier adapter parses valid JSON;
- GLM confidence thresholds produce pass/fail/needs_review correctly;
- mutation endpoint returns a valid stub schema.
- settings endpoint never returns secret values and rejects `browser_use_cloud_browser_enabled=true` in the MVP.

Frontend:

- navigation renders all required routes;
- scenario table renders steps, expectations, evidence, and JSON detail;
- live run page handles `node_status`, `browser_step`, `browser_frame`, `verification`, and `classification` events;
- settings form stores text provider choice, model names, optional Browser Use hosted LLM fallback, and execution configuration without exposing secret values.

## Required Integration Tests

- crawl/index pipeline stores user/admin manual chunks and excludes developer manual pages;
- feature extraction returns at least 8 features when model credentials are configured;
- scenario generation returns zero-locator scenarios with evidence;
- creating a run creates a database record and artifact directory;
- SSE stream emits trace-compatible events;
- report generation writes `report.json` and `report.html`.

## Required Configuration Tests

- default text provider is `deepseek`;
- default DeepSeek model is `deepseek-v4-pro`;
- `BROWSER_USE_API_KEY` is optional unless `TEXT_LLM_PROVIDER=browser_use` or Browser Use LLM fallback is enabled;
- Browser Use hosted LLM selection does not enable Browser Use Cloud Browser, `use_cloud=True`, `@sandbox`, or `cdp_url`.

## Required E2E Acceptance

When credentials and model keys are configured, run these scenarios through browser-use only:

- create board and verify its name is visible;
- create list and verify the list is visible;
- create card and verify the card appears in the target list;
- edit card title/description and verify the update;
- drag card to another list and verify containment;
- switch board/list view and verify visual state.

## Manual Acceptance Targets

- at least 8 features;
- at least 16 valid scenarios;
- simple scenario pass rate >= 80%;
- medium scenario pass rate >= 60%;
- at least 6 failure categories represented in real or seeded failure examples;
- all generated scenarios remain zero-locator.

## Documentation Checks

Before handing the repo to another agent, run:

```bash
rg -n "TBD|TODO|implement later|fill in|placeholder|待定|后续补充" .
rg -n "selector|locator|xpath|element_index|element_id|css_selector" docs AGENTS.md CLAUDE.md
```

Allowed matches:

- `AGENTS.md`, `PLANv2.md`, `README.md`, `docs/REQUIREMENTS.md`, `docs/SCHEMAS.md`, `docs/PROMPTS.md`, `docs/API.md`, `docs/TESTING.md`, and tests may mention forbidden locator terms only as prohibitions or validation checks.
- `docs/SPEC.md` and `PLANv2.md` may mention deferred P2 features only as explicit non-MVP scope.
- `docs/browser-use.md` may contain upstream browser-use examples that mention ChatBrowserUse, Browser Use Cloud, Playwright integration, or selectors, but its SpecPilot Project Override at the top controls project behavior.
