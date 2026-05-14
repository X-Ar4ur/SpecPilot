# SpecPilot Data Schemas

These schemas define the project contracts. Backend Pydantic/SQLModel models and frontend TypeScript types must stay aligned with this document.

## Feature

```python
class Feature:
    feature_id: str
    module: Literal["Project", "Board", "List", "Card", "Views", "Settings", "Admin", "Other"]
    title: str
    summary: str
    source_urls: list[str]
    evidence_quotes: list[str]
    confidence: float
    coverage_status: Literal["uncovered", "covered", "partial"]
```

Rules:

- `evidence_quotes` must not be empty for generated features.
- Every quote must come from an indexed manual chunk.

## Test Scenario

```python
class TestStep:
    order: int
    action: str

class Expectation:
    type: Literal[
        "element_visible",
        "text_present",
        "url_match",
        "element_state",
        "containment",
        "semantic",
    ]
    description: str
    params: dict[str, object]

class TestScenario:
    scenario_id: str
    feature_id: str
    title: str
    priority: Literal["P0", "P1", "P2"]
    difficulty: Literal["simple", "medium", "hard"]
    source_urls: list[str]
    evidence_quotes: list[str]
    preconditions: list[str]
    test_data: dict[str, object]
    steps: list[TestStep]
    expectations: list[Expectation]
    max_steps: int
    requires_visual_check: bool
    review_status: Literal["auto_validated", "needs_review", "rejected"]
    is_mutation: bool = False
```

Zero-locator rule:

- These field names are forbidden anywhere inside a scenario object: `locator`, `selector`, `xpath`, `element_id`, `element_index`, `css`, `css_selector`.
- Step actions must be natural language intentions.
- Runtime browser-use element indices may appear in traces, not in scenarios.

## Mutated Scenario

```python
class MutatedScenario(TestScenario):
    mutation_id: str                              # Stable mutation id, distinct from scenario_id
    source_scenario_id: str                       # Original scenario this mutation is derived from
    mutation_type: Literal["data", "flow", "expectation_inversion"]
    mutation_description: str                     # Natural-language description of the mutation
    mutation_params: dict[str, object]            # Mutation parameters; shape depends on mutation_type
    expected_detection: bool                      # True if FailureClassifier should flag this mutation
    detection_outcome: Optional[Literal[          # Filled in after the run completes
        "detected_correctly",                     # detected and expected_detection == True
        "missed",                                 # not detected but expected_detection == True
        "false_positive",                         # detected but expected_detection == False
        "true_negative",                          # not detected and expected_detection == False
    ]] = None
```

Default `expected_detection` per mutation type:

- `data`: depends on the mutated value. Legal-but-extreme boundary data (e.g. 5000-character title) → `False` (the application should accept it; only an unexpected failure counts as a bug). Illegal data (e.g. empty title) → `True` (the application should reject it).
- `flow`: depends on the flow change. Removing a critical step usually `True` (functionality should break). Swapping independent steps may be `False` (should not break).
- `expectation_inversion`: always `True` — an inverted expectation must conflict with the run result, so the verifier must catch it.

Mutation score:

```text
mutation_score = count(detection_outcome == "detected_correctly")
               / count(expected_detection == True)
```

MVP behavior:

- The API and schema exist.
- Generation may return an empty list or a small fixed example list to wire up the frontend.
- Full mutation algorithms are deferred to a later milestone.

## Run

```python
class Run:
    run_id: str
    scenario_ids: list[str]
    status: Literal["queued", "running", "pass", "fail", "needs_review", "cancelled", "error"]
    started_at: str | None
    finished_at: str | None
    duration_ms: int | None
    verdict: Literal["pass", "fail", "needs_review"] | None
    failure_primary: str | None
    failure_secondary: list[str]
    artifact_dir: str
    report_id: str | None
```

## Trace Event

```python
class TraceEvent:
    event_id: str
    run_id: str
    ts: str
    type: Literal[
        "node_status",
        "browser_step",
        "browser_frame",
        "verification",
        "classification",
        "repair",
        "report",
        "error",
    ]
    node: str | None
    status: str | None
    message: str | None
    payload: dict[str, object]
```

Rules:

- SSE events and `trace.jsonl` must use the same event schema.
- `browser_frame` may contain base64 data in SSE only.
- `trace.jsonl` should store screenshot paths, not base64 image bodies.

## Verification Result

```python
class VerificationResult:
    expectation_index: int
    channel: Literal["deterministic", "vision"]
    verdict: Literal["pass", "fail", "needs_review"]
    confidence: float
    reason: str
    evidence: dict[str, object]
```

## Runtime Settings

```python
class ModelSettings:
    text_llm_provider: Literal["openai_compatible", "deepseek", "browser_use"]
    openai_compatible_provider_name: str = "Codex API"
    openai_compatible_home_url: str = "https://openai.com"
    openai_compatible_base_url: str = "https://api.openai.com/v1"
    openai_compatible_model: str = "gpt-5.5"
    openai_compatible_note: str | None = None
    deepseek_model: str = "deepseek-v4-pro"
    browser_use_model: str = "bu-latest"
    browser_use_llm_fallback_enabled: bool = False
    browser_use_cloud_browser_enabled: bool = False
    glm_vision_model: str = "glm-4.6v"
```

Rules:

- `openai_compatible` is the default text provider and supports Codex API, OpenAI, DeepSeek-compatible gateways, and other OpenAI-compatible `/v1/chat/completions` endpoints through `base_url + api_key + model`.
- `deepseek` is retained as a legacy compatibility provider.
- `browser_use` means Browser Use hosted LLM through `BROWSER_USE_API_KEY`; it does not mean Browser Use Cloud Browser.
- `browser_use_cloud_browser_enabled` must remain `False` in the MVP.
- Secret values such as `OPENAI_COMPATIBLE_API_KEY`, `DEEPSEEK_API_KEY`, `BROWSER_USE_API_KEY`, and `GLM_API_KEY` are never returned to the frontend, logs, traces, scenarios, screenshots metadata, or reports.

## Verification Failure (input to FailureClassifier)

When the arbitration step in the verifier yields `fail`, `fail_soft`, or `needs_review`, the verifier must hand the FailureClassifier an unmerged record containing every signal source so the classifier can apply rules and LLM-as-Judge logic without losing context.

```python
class VerificationFailure:
    expectation_id: str
    expectation_type: str                          # element_visible / semantic / ...
    expectation_description: str

    # DeterministicVerifier output (None when not invoked)
    deterministic_verdict: Optional[Literal["pass", "fail"]]
    deterministic_reason: Optional[str]
    deterministic_evidence: Optional[dict[str, object]]

    # VisionVerifier output (None when not invoked)
    vision_verdict: Optional[Literal["pass", "fail", "uncertain"]]
    vision_confidence: Optional[float]
    vision_reasoning: Optional[str]
    vision_evidence: Optional[str]
    vision_suggested_failure_type: Optional[str]

    # browser-use agent self-report (extracted from history)
    agent_self_reported_success: Optional[bool]
    agent_done_message: Optional[str]              # done(success=False, message=...) text
    agent_errors: list[str]                        # history.errors()

    # Context
    final_url: str
    screenshots: list[str]                         # Key-frame screenshot paths
    final_dom_summary: str                         # DOM summary for classifier reasoning
    arbitration_label: Literal["fail", "fail_soft", "needs_review"]
```

Rule: the three signal sources (deterministic / vision / agent self-report) must remain unmerged. The verifier does not pre-classify; the FailureClassifier consumes all signals together.

## Failure Classification

```python
FailureCategory = Literal[
    "navigation_failure",
    "element_not_found",
    "interaction_failure",
    "timing_issue",
    "state_mismatch",
    "visual_regression",
    "agent_planning_error",
    "dom_mismatch_visually_correct",
    "unknown",
]

class FailureClassification:
    primary: FailureCategory                       # Single primary category
    secondary: list[FailureCategory]               # Optional secondary categories
    primary_reason: str                            # Diagnostic text; LLM categories include LLM reasoning
    deviation_step: Optional[int]                  # Required only for agent_planning_error / state_mismatch
    raw_signals: VerificationFailure               # Original three-source signals retained for the report
```

Rules:

- `unknown` does not count toward the public "8 effective failure categories" metric; it is for internal diagnosis only.
- Repair eligibility is decided by the RepairPlanner strategy table, not by a `repairable` field on this record.
- One failure may match multiple categories; only the `primary` counts toward the failure-category coverage metric.
