from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from specpilot_backend.ids import new_id
from specpilot_backend.services.persistence import (
    get_scenario_payload,
    list_scenario_records,
)

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


class ScenarioGenerateRequest(BaseModel):
    feature_ids: list[str]
    max_scenarios_per_feature: int = Field(default=3, ge=1)


@router.post("/generate")
def generate_scenarios(_: ScenarioGenerateRequest) -> dict[str, str]:
    return {"job_id": new_id("job"), "status": "queued"}


@router.get("")
def list_scenarios(
    feature_id: str | None = None,
    priority: str | None = None,
    difficulty: str | None = None,
    review_status: str | None = None,
    latest_result: str | None = None,
    is_mutation: bool | None = Query(default=None),
) -> dict[str, list[dict[str, object]]]:
    records = list_scenario_records(
        feature_id=feature_id,
        priority=priority,
        difficulty=difficulty,
        review_status=review_status,
        latest_result=latest_result,
        is_mutation=is_mutation,
    )
    return {
        "items": [
            {
                "scenario_id": record.scenario_id,
                "feature_id": record.feature_id,
                "title": _scenario_title(record.scenario_id),
                "priority": record.priority,
                "difficulty": record.difficulty,
                "review_status": record.review_status,
                "latest_result": record.latest_result,
                "is_mutation": record.is_mutation,
            }
            for record in records
        ]
    }


@router.get("/{scenario_id}")
def get_scenario(scenario_id: str) -> dict[str, object]:
    scenario = get_scenario_payload(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


def _scenario_title(scenario_id: str) -> object:
    scenario = get_scenario_payload(scenario_id)
    if scenario is None:
        return scenario_id
    return scenario["title"]
