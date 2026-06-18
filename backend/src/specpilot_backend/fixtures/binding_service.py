from __future__ import annotations

from datetime import UTC, datetime
from typing import cast

from specpilot_backend.config import Settings, get_settings
from specpilot_backend.fixtures.fourga_client import (
    build_fourga_client,
    resolve_target_base_url,
)
from specpilot_backend.fixtures.models import (
    FixtureBindRequest,
    FixtureInventory,
    FixtureSlotBindingState,
    ScenarioBindingStatus,
    ScenarioFixtureBinding,
)
from specpilot_backend.models.scenarios import DataDependency, FixtureSlot
from specpilot_backend.services.persistence import (
    get_fixture_binding,
    get_scenario_payload,
    save_fixture_binding,
)


class FixtureNotConfiguredError(Exception):
    """The target 4ga instance is not configured (missing credentials)."""


class FixtureBindError(ValueError):
    """The bind request is invalid."""


class ScenarioNotFoundError(Exception):
    """No scenario exists with the requested id."""


async def bind_slot(
    request: FixtureBindRequest, *, settings: Settings | None = None
) -> ScenarioFixtureBinding:
    """Bind one fixture slot to an existing or newly created element."""
    resolved_settings = settings or get_settings()
    target = resolve_target_base_url(resolved_settings)

    if request.mode == "existing":
        if not request.entity_id:
            raise FixtureBindError("existing binding requires entity_id")
        entity_id = request.entity_id
        created = False
    else:
        client = build_fourga_client(resolved_settings)
        if client is None:
            raise FixtureNotConfiguredError(
                "4ga target instance is not configured"
            )
        if request.kind != "card":
            raise FixtureBindError(
                "create mode supports kind 'card' only in the MVP"
            )
        if not request.parent_id:
            raise FixtureBindError("create mode requires parent_id (list id)")
        title = request.attributes.get("title")
        if not isinstance(title, str) or not title:
            raise FixtureBindError("create mode requires attributes.title")
        entity_id = await client.create_card(
            list_id=request.parent_id, title=title
        )
        created = True

    binding = ScenarioFixtureBinding(
        scenario_id=request.scenario_id,
        target_app_url=target,
        ref=request.ref,
        entity_kind=request.kind,
        entity_id=entity_id,
        resolved_values=dict(request.attributes),
        created_by_specpilot=created,
        bound_at=datetime.now(UTC).isoformat(),
    )
    save_fixture_binding(binding.model_dump())
    return binding


async def get_binding_status(
    scenario_id: str, *, settings: Settings | None = None
) -> ScenarioBindingStatus:
    """Report per-slot binding state, including a live existence check."""
    resolved_settings = settings or get_settings()
    target = resolve_target_base_url(resolved_settings)
    scenario = get_scenario_payload(scenario_id)
    if scenario is None:
        raise ScenarioNotFoundError(scenario_id)

    raw_fixtures = scenario.get("fixtures", [])
    slots = [
        FixtureSlot.model_validate(slot)
        for slot in (raw_fixtures if isinstance(raw_fixtures, list) else [])
    ]
    data_dependency = cast(
        DataDependency, scenario.get("data_dependency", "none")
    )

    if not slots:
        return ScenarioBindingStatus(
            scenario_id=scenario_id,
            target_app_url=target,
            data_dependency=data_dependency,
            ready=True,
            slots=[],
        )

    existing_ids = await _existing_entity_ids(resolved_settings)
    slot_states: list[FixtureSlotBindingState] = []
    for slot in slots:
        binding_payload = get_fixture_binding(scenario_id, target, slot.ref)
        binding = (
            ScenarioFixtureBinding.model_validate(binding_payload)
            if binding_payload is not None
            else None
        )
        exists = binding is not None and binding.entity_id in existing_ids
        slot_states.append(
            FixtureSlotBindingState(
                ref=slot.ref,
                kind=slot.kind,
                bound=binding is not None,
                exists=exists,
                binding=binding,
            )
        )

    return ScenarioBindingStatus(
        scenario_id=scenario_id,
        target_app_url=target,
        data_dependency=data_dependency,
        ready=all(state.exists for state in slot_states),
        slots=slot_states,
    )


async def _existing_entity_ids(settings: Settings) -> set[str]:
    client = build_fourga_client(settings)
    if client is None:
        raise FixtureNotConfiguredError("4ga target instance is not configured")
    return _flatten_entity_ids(await client.list_inventory())


def _flatten_entity_ids(inventory: FixtureInventory) -> set[str]:
    ids: set[str] = set()
    for project in inventory.projects:
        ids.add(project.id)
        for board in project.boards:
            ids.add(board.id)
            for fixture_list in board.lists:
                ids.add(fixture_list.id)
                for card in fixture_list.cards:
                    ids.add(card.id)
    return ids
