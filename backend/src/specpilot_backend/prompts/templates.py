from __future__ import annotations

import json
from collections.abc import Iterable, Mapping
from typing import Any

FEATURE_EXTRACTION_PROMPT = """You extract user-visible 4ga Boards feature points from manual evidence.

Return only JSON with this shape:
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

Rules:
- Do not invent features not supported by quotes.
- Every feature must cite source_urls and evidence_quotes from the supplied chunks.
- Every evidence quote must be copied from a supplied chunk.
- Use stable snake_case ids beginning with ft_.
- Keep feature granularity at user-visible capability level, not individual button level.
- Do not include secrets, credentials, API keys, or test passwords.
"""

SCENARIO_GENERATION_PROMPT = """You generate executable zero-locator test scenarios from one feature and manual evidence.

Return only JSON with this shape:
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
      "test_data": {"card_title": "完成季度报告"},
      "steps": [{"order": 1, "action": "在目标 List 中打开添加 Card 的入口"}],
      "expectations": [
        {
          "type": "element_visible",
          "description": "新建 Card 标题在目标 List 中可见",
          "params": {"text": "完成季度报告", "container_text": "To Do"}
        }
      ],
      "max_steps": 10,
      "requires_visual_check": false,
      "review_status": "auto_validated"
    }
  ]
}

Rules:
- Never output selector, locator, xpath, element_id, element_index, css, or css_selector fields.
- Step actions must be natural-language user intentions, not DOM targeting instructions.
- Every scenario must include evidence quotes from the supplied chunks.
- Every evidence quote must be copied from supplied evidence.
- Prefer 2-6 user action steps.
- Use semantic expectation only when DOM/text/URL checks are insufficient.
- Mark unsupported or weak-evidence scenarios as rejected.
- Do not include secrets, credentials, API keys, or test passwords.
"""


def build_feature_extraction_prompt(
    evidence_chunks: Iterable[Mapping[str, Any]],
) -> str:
    return "\n\n".join(
        (
            FEATURE_EXTRACTION_PROMPT,
            "Evidence chunks:",
            json.dumps(list(evidence_chunks), ensure_ascii=False, indent=2),
        )
    )


def build_scenario_generation_prompt(
    *,
    feature: Mapping[str, Any],
    evidence_chunks: Iterable[Mapping[str, Any]],
) -> str:
    return "\n\n".join(
        (
            SCENARIO_GENERATION_PROMPT,
            "Feature:",
            json.dumps(feature, ensure_ascii=False, indent=2),
            "Evidence chunks:",
            json.dumps(list(evidence_chunks), ensure_ascii=False, indent=2),
        )
    )
