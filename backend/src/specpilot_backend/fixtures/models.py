from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class InventoryCard(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str


class InventoryList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    cards: list[InventoryCard] = Field(default_factory=list)


class InventoryBoard(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    lists: list[InventoryList] = Field(default_factory=list)


class InventoryProject(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    boards: list[InventoryBoard] = Field(default_factory=list)


class FixtureInventory(BaseModel):
    """Project -> Board -> List -> Card tree of the target 4ga instance.

    Backs the interactive fixture-binding modal. Contains domain data only; no
    DOM locators (zero-locator rule).
    """

    model_config = ConfigDict(extra="forbid")

    target_app_url: str
    projects: list[InventoryProject] = Field(default_factory=list)
