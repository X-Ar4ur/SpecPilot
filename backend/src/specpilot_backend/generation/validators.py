from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from specpilot_backend.ingestion.chunker import ManualChunk
from specpilot_backend.models.features import Feature
from specpilot_backend.models.scenarios import TestScenario, find_forbidden_field


class EvidenceValidationError(ValueError):
    """Raised when generated evidence is not supported by supplied chunks."""


class ZeroLocatorValidationError(ValueError):
    """Raised when generated scenarios contain forbidden locator-like fields."""


def validate_evidence_quotes(
    evidence_quotes: list[str],
    source_chunks: list[ManualChunk],
) -> None:
    if not evidence_quotes:
        raise EvidenceValidationError("Generated item has no evidence quotes.")

    source_texts = [chunk.content for chunk in source_chunks]
    for quote in evidence_quotes:
        if not quote.strip():
            raise EvidenceValidationError("Generated item has a blank evidence quote.")
        if not any(quote in source_text for source_text in source_texts):
            raise EvidenceValidationError(
                f"Evidence quote is not present in source chunks: {quote!r}"
            )


def validate_zero_locator_payload(payload: dict[str, Any]) -> None:
    found = find_forbidden_field(payload)
    if found is not None:
        raise ZeroLocatorValidationError(
            f"Scenario contains forbidden zero-locator field: {found}"
        )


def validate_feature_payload(
    payload: dict[str, Any],
    source_chunks: list[ManualChunk],
) -> Feature:
    feature = Feature.model_validate(payload)
    validate_evidence_quotes(feature.evidence_quotes, source_chunks)
    return feature


def validate_scenario_payload(
    payload: dict[str, Any],
    source_chunks: list[ManualChunk],
) -> TestScenario:
    validate_zero_locator_payload(payload)
    try:
        scenario = TestScenario.model_validate(payload)
    except ValidationError as exc:
        raise ZeroLocatorValidationError(str(exc)) from exc
    validate_evidence_quotes(scenario.evidence_quotes, source_chunks)
    return scenario
