from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any

from pydantic import SecretStr

from specpilot_backend.agent.task_builder import build_browser_use_task
from specpilot_backend.config import Settings, get_settings
from specpilot_backend.events.bus import get_event_bus
from specpilot_backend.ids import new_event_id
from specpilot_backend.llm.deepseek import build_browser_use_deepseek_model
from specpilot_backend.llm.openai_compatible import (
    build_browser_use_openai_compatible_model,
)
from specpilot_backend.models.events import TraceEvent
from specpilot_backend.models.scenarios import TestScenario


@dataclass(frozen=True)
class BrowserUseRunResult:
    success: bool | None
    final_result: str | None
    urls: list[str] = field(default_factory=list)
    action_names: list[str] = field(default_factory=list)
    screenshot_paths: list[str] = field(default_factory=list)
    errors: list[str | None] = field(default_factory=list)
    steps: int | None = None


def create_browser_session(settings: Settings | None = None) -> Any:
    resolved_settings = settings or get_settings()
    from browser_use import Browser

    return Browser(
        headless=resolved_settings.browser_headless,
        user_data_dir=None,
        allowed_domains=_allowed_domains(resolved_settings.browser_allowed_domains),
    )


def build_sensitive_data(
    settings: Settings | None = None,
) -> dict[str, str | dict[str, str]]:
    resolved_settings = settings or get_settings()
    values: dict[str, str] = {}
    if resolved_settings.fourga_username:
        values["FOURGA_USERNAME"] = resolved_settings.fourga_username
    if resolved_settings.fourga_password:
        fourga_password = _secret_value(resolved_settings.fourga_password)
        if fourga_password is not None:
            values["FOURGA_PASSWORD"] = fourga_password
    return {"*.4gaboards.com": values} if values else {}


def create_browser_use_llm(settings: Settings | None = None) -> Any:
    resolved_settings = settings or get_settings()
    if resolved_settings.text_llm_provider == "openai_compatible":
        return build_browser_use_openai_compatible_model(settings=resolved_settings)
    if resolved_settings.text_llm_provider == "browser_use":
        from browser_use import ChatBrowserUse

        api_key = _secret_value(resolved_settings.browser_use_api_key)
        if api_key is None:
            msg = "BROWSER_USE_API_KEY is required for Browser Use hosted LLM"
            raise ValueError(msg)
        return ChatBrowserUse(
            model=resolved_settings.browser_use_model,
            api_key=api_key,
        )
    return build_browser_use_deepseek_model(settings=resolved_settings)


async def run_scenario_with_browser_use(
    scenario: TestScenario,
    *,
    run_id: str,
    settings: Settings | None = None,
    publish_history_events: bool = True,
) -> BrowserUseRunResult:
    resolved_settings = settings or get_settings()
    task = build_browser_use_task(
        scenario,
        target_app_url=resolved_settings.target_app_url,
    )
    browser = create_browser_session(resolved_settings)
    llm = create_browser_use_llm(resolved_settings)
    sensitive_data = build_sensitive_data(resolved_settings) or None

    from browser_use import Agent

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        sensitive_data=sensitive_data,
    )
    history = await agent.run(max_steps=scenario.max_steps)
    result = history_to_run_result(history)
    if publish_history_events:
        await _publish_history_events(run_id, result)
    return result


def run_scenario_with_browser_use_sync(
    scenario: TestScenario,
    *,
    run_id: str,
    settings: Settings | None = None,
) -> BrowserUseRunResult:
    return asyncio.run(
        run_scenario_with_browser_use(scenario, run_id=run_id, settings=settings)
    )


def history_to_run_result(history: Any) -> BrowserUseRunResult:
    return BrowserUseRunResult(
        success=_call_history_method(history, "is_successful"),
        final_result=_call_history_method(history, "final_result"),
        urls=list(_call_history_method(history, "urls") or []),
        action_names=list(_call_history_method(history, "action_names") or []),
        screenshot_paths=list(_call_history_method(history, "screenshot_paths") or []),
        errors=list(_call_history_method(history, "errors") or []),
        steps=_call_history_method(history, "number_of_steps"),
    )


def _allowed_domains(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _secret_value(secret: SecretStr | None) -> str | None:
    return secret.get_secret_value() if secret is not None else None


def _call_history_method(history: Any, name: str) -> Any:
    method = getattr(history, name, None)
    if method is None:
        return None
    return method()


async def _publish_history_events(run_id: str, result: BrowserUseRunResult) -> None:
    bus = get_event_bus()
    for index, action_name in enumerate(result.action_names, start=1):
        await bus.publish(
            TraceEvent(
                event_id=new_event_id(),
                run_id=run_id,
                ts=_utc_now(),
                type="browser_step",
                node="BrowserUseRun",
                status="running",
                message=f"browser-use action {index}: {action_name}",
                payload={"step": index, "action": action_name},
            )
        )
    for index, screenshot_path in enumerate(result.screenshot_paths, start=1):
        await bus.publish(
            TraceEvent(
                event_id=new_event_id(),
                run_id=run_id,
                ts=_utc_now(),
                type="browser_frame",
                node="BrowserUseRun",
                status="running",
                message=f"browser frame {index}",
                payload={"frame_index": index, "screenshot_path": screenshot_path},
            )
        )


def _utc_now() -> str:
    from datetime import UTC, datetime

    return datetime.now(UTC).isoformat()
