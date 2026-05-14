import pytest

from specpilot_backend.agent.browser_use_runner import (
    build_sensitive_data,
    create_browser_session,
)
from specpilot_backend.agent.task_builder import build_browser_use_task
from specpilot_backend.config import Settings
from specpilot_backend.models.scenarios import TestScenario


def scenario_payload() -> dict[str, object]:
    return {
        "scenario_id": "sc_create_card_001",
        "feature_id": "ft_card_creation",
        "title": "在指定 List 中创建新 Card",
        "priority": "P0",
        "difficulty": "simple",
        "source_urls": ["https://docs.4gaboards.com/cards/create"],
        "evidence_quotes": ["Click Add Card to create a new card."],
        "preconditions": ["用户已进入一个 Board"],
        "test_data": {
            "card_title": "完成季度报告",
            "target_list_name": "To Do",
            "password": "should-not-enter-task",
            "api_key": "should-not-enter-task",
        },
        "steps": [
            {"order": 1, "action": "在目标 List 中打开添加 Card 的入口"},
            {"order": 2, "action": "输入 Card 标题"},
        ],
        "expectations": [
            {
                "type": "element_visible",
                "description": "新建 Card 标题在目标 List 中可见",
                "params": {"text": "完成季度报告"},
            }
        ],
        "max_steps": 10,
        "requires_visual_check": False,
        "review_status": "auto_validated",
    }


def test_task_builder_uses_steps_preconditions_and_non_sensitive_test_data_only() -> None:
    scenario = TestScenario.model_validate(scenario_payload())
    task = build_browser_use_task(
        scenario,
        target_app_url="https://demo.4gaboards.com/",
    )

    assert "You are testing 4ga Boards at https://demo.4gaboards.com/" in task
    assert "用户已进入一个 Board" in task
    assert "完成季度报告" in task
    assert "To Do" in task
    assert "在目标 List 中打开添加 Card 的入口" in task
    assert "新建 Card 标题在目标 List 中可见" not in task
    assert "expectations" not in task.lower()
    assert "should-not-enter-task" not in task
    assert "password" not in task.lower()
    assert "api_key" not in task.lower()


def test_task_builder_rejects_sensitive_key_inside_steps() -> None:
    payload = scenario_payload()
    payload["steps"] = [{"order": 1, "action": "输入 password 明文"}]
    scenario = TestScenario.model_validate(payload)

    with pytest.raises(ValueError, match="sensitive"):
        build_browser_use_task(scenario, target_app_url="https://demo.4gaboards.com/")


def test_sensitive_data_uses_browser_use_domain_scoped_shape_without_task_leak() -> None:
    settings = Settings(
        _env_file=None,
        fourga_username="alice@example.com",
        fourga_password="secret-password",
        deepseek_api_key="deepseek-key",
        browser_use_api_key=None,
    )

    assert build_sensitive_data(settings) == {
        "*.4gaboards.com": {
            "FOURGA_USERNAME": "alice@example.com",
            "FOURGA_PASSWORD": "secret-password",
        }
    }


def test_browser_session_is_local_managed_locked_down_and_not_cloud() -> None:
    settings = Settings(
        _env_file=None,
        deepseek_api_key="deepseek-key",
        browser_use_api_key=None,
        browser_headless=True,
        browser_allowed_domains="*.4gaboards.com",
    )

    browser = create_browser_session(settings)

    assert browser.browser_profile.headless is True
    assert browser.browser_profile.allowed_domains == ["*.4gaboards.com"]
    assert browser.browser_profile.user_data_dir is not None
    assert "browser-use-user-data-dir-" in str(browser.browser_profile.user_data_dir)
    assert browser.browser_profile.use_cloud is False
    assert browser.browser_profile.cdp_url is None
