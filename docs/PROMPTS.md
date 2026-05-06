# SpecPilot Prompt Contracts

Prompts must be implemented as backend templates, not scattered inline strings. Every prompt must request structured JSON and must include evidence constraints.

## UI Operational Classifier

Purpose: decide whether a manual chunk describes UI operations relevant to testing.

Input:

- URL;
- heading path;
- chunk text.

Output JSON:

```json
{
  "is_ui_operational": true,
  "module": "Card",
  "reason": "The chunk describes creating and editing cards through the UI."
}
```

Rules:

- Return `false` for developer APIs, deployment, database schema, CLI commands, package installation, and environment variables.
- Return `true` for user-visible UI operations, settings, permissions, navigation, board/list/card operations, views, and admin UI flows.

## Feature Extraction

Purpose: extract feature points from manual evidence.

Required output:

```json
{
  "features": [
    {
      "feature_id": "ft_card_creation",
      "module": "Card",
      "title": "创建 Card",
      "summary": "用户可以在指定 List 中创建 Card。",
      "source_urls": ["https://docs.4gaboards.com/cards/create"],
      "evidence_quotes": ["..."],
      "confidence": 0.91
    }
  ]
}
```

Rules:

- Do not invent features not supported by quotes.
- Use stable snake_case ids.
- Keep feature granularity at user-visible capability level, not individual button level.

## Scenario Generation

Purpose: generate executable zero-locator test scenarios for each feature.

Required output:

```json
{
  "scenarios": [
    {
      "scenario_id": "sc_create_card_001",
      "feature_id": "ft_card_creation",
      "title": "在指定 List 中创建新 Card",
      "priority": "P0",
      "difficulty": "simple",
      "source_urls": ["https://docs.4gaboards.com/cards/create"],
      "evidence_quotes": ["..."],
      "preconditions": ["用户已进入一个 Board"],
      "test_data": {
        "card_title": "完成季度报告"
      },
      "steps": [
        {
          "order": 1,
          "action": "在目标 List 中打开添加 Card 的入口"
        }
      ],
      "expectations": [
        {
          "type": "element_visible",
          "description": "新建 Card 标题在目标 List 中可见",
          "params": {
            "text": "完成季度报告",
            "container_text": "To Do"
          }
        }
      ],
      "max_steps": 10,
      "requires_visual_check": false,
      "review_status": "auto_validated"
    }
  ]
}
```

Rules:

- Never output selectors, locators, xpaths, DOM ids, CSS selectors, or browser-use element indices.
- Every scenario must include evidence quotes from the supplied chunks.
- Prefer 2-6 user action steps.
- Use `semantic` expectation only when DOM/text/URL checks are insufficient.
- Mark unsupported or weak-evidence scenarios as `rejected`.

## Browser Task Construction

Purpose: transform one scenario into a task string for browser-use.

Template:

```text
You are testing 4ga Boards at {target_app_url}. Complete this scenario using the UI like a human user.

Scenario: {scenario.title}

Preconditions:
{preconditions}

Test data:
{test_data}

Task steps:
{ordered_steps}

Rules:
- Stay within 4gaboards.com.
- Use the UI like a human user.
- Do not use selectors or developer tools.
- Do not expose credentials in logs.
- Stop when the requested task steps are complete.
```

Rules:

- Do not include `expectations` in the browser-use task string. Expectations are consumed only by DeterministicVerifier and VisionVerifier after execution.
- Non-sensitive `test_data` may be rendered as literal values in steps. Credentials and API keys must use browser-use `sensitive_data` placeholders instead.

## Vision Verification

Purpose: use GLM-4.6V to compare start and final screenshots or judge semantic visual expectations.

Required output:

```json
{
  "verdict": "pass",
  "confidence": 0.88,
  "reason": "The final screenshot shows the expected card in the target list.",
  "suggested_failure_type": null
}
```

Rules:

- Return only JSON.
- Use `needs_review` when visual evidence is ambiguous.
- Suggested failure types must match `docs/SCHEMAS.md`.

## Failure Classification

Purpose: classify failed runs from trace, verification results, and browser-use history.

Required output:

```json
{
  "primary": "element_not_found",
  "secondary": ["agent_planning_error"],
  "primary_reason": "The agent never found the Add Card entry before max_steps.",
  "deviation_step": null
}
```

Rules:

- Use one primary category.
- Use secondary categories only when supported by trace evidence.
- Prefer deterministic trace evidence over model speculation.
- Do not output a `repairable` field. Repair eligibility is decided by RepairPlanner, not FailureClassifier.
