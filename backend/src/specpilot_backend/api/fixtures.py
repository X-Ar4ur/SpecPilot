from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from specpilot_backend.fixtures.fourga_client import (
    FourgaApiError,
    build_fourga_client,
)
from specpilot_backend.fixtures.models import FixtureInventory

router = APIRouter(prefix="/api/fixtures", tags=["fixtures"])


@router.get("/inventory")
async def get_inventory(kind: str | None = None) -> FixtureInventory:
    """List the target instance's Project/Board/List/Card tree for binding.

    `kind` is reserved for the binding modal to scope selection client-side; the
    endpoint returns the full tree for context.
    """
    _ = kind
    client = build_fourga_client()
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="4ga target instance is not configured",
        )
    try:
        return await client.list_inventory()
    except FourgaApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="could not reach the 4ga target instance",
        ) from exc
