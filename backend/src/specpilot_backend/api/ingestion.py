from fastapi import APIRouter
from pydantic import BaseModel, Field

from specpilot_backend.ids import new_id

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


class CrawlRequest(BaseModel):
    base_url: str = "https://docs.4gaboards.com/"
    sections: list[str] = Field(default_factory=lambda: ["user-manual", "admin-manual"])
    language: str = "en"


class IndexRequest(BaseModel):
    crawl_id: str
    force: bool = False


@router.post("/crawl")
def crawl_manual(_: CrawlRequest) -> dict[str, str]:
    return {"crawl_id": new_id("crawl"), "status": "queued"}


@router.post("/index")
def index_manual(_: IndexRequest) -> dict[str, str]:
    return {"index_id": new_id("idx"), "status": "queued"}
