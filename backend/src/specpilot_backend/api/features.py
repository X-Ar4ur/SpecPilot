from fastapi import APIRouter
from pydantic import BaseModel, Field

from specpilot_backend.ids import new_id
from specpilot_backend.services.persistence import list_feature_payloads

router = APIRouter(prefix="/api/features", tags=["features"])


class FeatureExtractRequest(BaseModel):
    index_id: str
    min_evidence: int = Field(default=1, ge=1)


@router.post("/extract")
def extract_features(_: FeatureExtractRequest) -> dict[str, str]:
    return {"job_id": new_id("job"), "status": "queued"}


@router.get("")
def list_features() -> dict[str, list[dict[str, object]]]:
    return {"items": list_feature_payloads()}
