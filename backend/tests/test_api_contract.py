from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from specpilot_backend.config import Settings
from specpilot_backend.main import app
from specpilot_backend.services import persistence


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    tmp_path = Path(".pytest_cache") / "specpilot-tests" / uuid4().hex
    tmp_path.mkdir(parents=True, exist_ok=True)
    settings = Settings(
        _env_file=None,
        database_url=f"sqlite:///{tmp_path / 'specpilot.db'}",
        artifact_root=tmp_path / "runs",
        openai_compatible_api_key=None,
        deepseek_api_key="deepseek-test-key",
        browser_use_api_key=None,
        glm_api_key="glm-test-key",
    )
    monkeypatch.setattr("specpilot_backend.api.settings.get_settings", lambda: settings)
    monkeypatch.setattr("specpilot_backend.api.runs.get_settings", lambda: settings)
    monkeypatch.setattr(
        "specpilot_backend.services.artifacts.get_settings", lambda: settings
    )
    persistence.configure_database(settings.database_url)
    persistence.create_tables()
    with TestClient(app) as test_client:
        yield test_client


def test_health_still_returns_ok(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ingestion_and_generation_job_endpoints_return_real_job_ids(
    client: TestClient,
) -> None:
    crawl = client.post(
        "/api/ingestion/crawl",
        json={
            "base_url": "https://docs.4gaboards.com/",
            "sections": ["user-manual", "admin-manual"],
            "language": "en",
        },
    )
    index = client.post(
        "/api/ingestion/index",
        json={"crawl_id": crawl.json()["crawl_id"], "force": False},
    )
    features = client.post(
        "/api/features/extract",
        json={"index_id": index.json()["index_id"], "min_evidence": 1},
    )
    scenarios = client.post(
        "/api/scenarios/generate",
        json={"feature_ids": ["ft_card_creation"], "max_scenarios_per_feature": 3},
    )

    assert crawl.status_code == 200
    assert crawl.json()["crawl_id"].startswith("crawl_")
    assert crawl.json()["status"] == "queued"
    assert index.json()["index_id"].startswith("idx_")
    assert features.json()["job_id"].startswith("job_")
    assert scenarios.json()["job_id"].startswith("job_")
    assert client.get(f"/api/jobs/{features.json()['job_id']}").status_code == 200


def test_features_are_persisted_and_listed(client: TestClient) -> None:
    feature = {
        "feature_id": "ft_card_creation",
        "module": "Card",
        "title": "创建 Card",
        "summary": "用户可以在指定 List 中创建 Card。",
        "source_urls": ["https://docs.4gaboards.com/cards/create"],
        "evidence_quotes": ["Click Add Card to create a new card."],
        "coverage_status": "covered",
        "confidence": 0.91,
    }

    persistence.save_feature_payload(feature)
    response = client.get("/api/features")

    assert response.status_code == 200
    assert response.json()["items"] == [feature]


def valid_scenario_payload() -> dict[str, object]:
    return {
        "scenario_id": "sc_create_card_001",
        "feature_id": "ft_card_creation",
        "title": "在指定 List 中创建新 Card",
        "priority": "P0",
        "difficulty": "simple",
        "source_urls": ["https://docs.4gaboards.com/cards/create"],
        "evidence_quotes": ["Click Add Card to create a new card."],
        "preconditions": ["用户已进入一个 Board"],
        "test_data": {"card_title": "完成季度报告"},
        "steps": [{"order": 1, "action": "在目标 List 中打开添加 Card 的入口"}],
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
        "is_mutation": False,
    }


def test_scenarios_are_persisted_listed_and_returned_by_id(
    client: TestClient,
) -> None:
    scenario = valid_scenario_payload()
    persistence.save_scenario_payload(scenario)

    listing = client.get("/api/scenarios")
    detail = client.get("/api/scenarios/sc_create_card_001")
    missing = client.get("/api/scenarios/sc_missing")

    assert listing.status_code == 200
    assert listing.json()["items"] == [
        {
            "scenario_id": "sc_create_card_001",
            "feature_id": "ft_card_creation",
            "title": "在指定 List 中创建新 Card",
            "priority": "P0",
            "difficulty": "simple",
            "review_status": "auto_validated",
            "latest_result": None,
            "is_mutation": False,
        }
    ]
    assert detail.status_code == 200
    assert detail.json() == scenario
    assert missing.status_code == 404


def test_create_run_persists_run_and_artifact_directory(client: TestClient) -> None:
    response = client.post(
        "/api/runs",
        json={
            "scenario_ids": ["sc_create_card_001"],
            "mode": "single",
            "config": {"max_steps": 10, "retry_limit": 1},
        },
    )
    run_id = response.json()["run_id"]
    detail = client.get(f"/api/runs/{run_id}")
    listing = client.get("/api/runs")

    assert response.status_code == 200
    assert response.json()["status"] == "queued"
    assert response.json()["live_url"] == f"/runs/live/{run_id}"
    assert detail.status_code == 200
    assert detail.json()["run_id"] == run_id
    assert listing.json()["items"][0]["run_id"] == run_id
    assert Path(detail.json()["artifact_dir"]).exists()


def test_trace_and_artifact_endpoints_return_safe_empty_shapes(
    client: TestClient,
) -> None:
    run = client.post(
        "/api/runs",
        json={"scenario_ids": ["sc_create_card_001"], "mode": "single", "config": {}},
    ).json()

    events = client.get(f"/api/runs/{run['run_id']}/events")
    trace = client.get(f"/api/runs/{run['run_id']}/trace")
    artifacts = client.get(f"/api/runs/{run['run_id']}/artifacts")

    assert events.status_code == 200
    assert events.headers["content-type"].startswith("text/event-stream")
    assert trace.status_code == 200
    assert trace.json() == {"items": []}
    assert artifacts.status_code == 200
    assert artifacts.json()["run_id"] == run["run_id"]


def test_mutation_endpoint_returns_empty_stub(client: TestClient) -> None:
    response = client.post(
        "/api/mutations/generate",
        json={
            "scenario_ids": ["sc_create_card_001"],
            "mutation_types": ["data", "flow", "expectation_inversion"],
            "max_per_scenario": 3,
        },
    )

    assert response.status_code == 200
    assert response.json() == {"mutations": []}


def test_settings_do_not_echo_secrets_and_reject_cloud_browser(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "\n".join(
            [
                "# keep comments",
                "TEXT_LLM_PROVIDER=deepseek",
                "OPENAI_COMPATIBLE_API_KEY=existing-openai-secret",
                "OPENAI_COMPATIBLE_MODEL=old-model",
                "UNRELATED_KEY=keep-me",
                "",
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr("specpilot_backend.api.settings.ENV_FILE_PATH", env_file)
    settings = client.get("/api/settings")
    patch = client.patch(
        "/api/settings",
        json={
            "models": {
                "text_llm_provider": "openai_compatible",
                "openai_compatible_provider_name": "Clauddy",
                "openai_compatible_home_url": "https://clauddy.com",
                "openai_compatible_base_url": "https://clauddy.com/v1",
                "openai_compatible_api_key": "",
                "openai_compatible_model": "gpt-5.5",
                "openai_compatible_note": "公司专用账号",
                "browser_use_model": "bu-latest",
                "browser_use_api_key": "browser-secret",
                "browser_use_llm_fallback_enabled": False,
                "browser_use_cloud_browser_enabled": False,
                "glm_vision_model": "glm-4.6v",
                "glm_api_key": "glm-secret",
            }
        },
    )
    rejected = client.patch(
        "/api/settings",
        json={"models": {"browser_use_cloud_browser_enabled": True}},
    )

    assert settings.status_code == 200
    assert "deepseek-test-key" not in str(settings.json())
    assert "glm-test-key" not in str(settings.json())
    assert settings.json()["models"]["deepseek_api_key_configured"] is True
    assert settings.json()["models"]["openai_compatible_api_key_configured"] is False
    assert settings.json()["models"]["browser_use_cloud_browser_enabled"] is False
    assert patch.status_code == 200
    assert "existing-openai-secret" not in str(patch.json())
    assert patch.json()["models"]["text_llm_provider"] == "openai_compatible"
    assert patch.json()["models"]["openai_compatible_api_key_configured"] is True
    env_text = env_file.read_text(encoding="utf-8")
    assert "# keep comments" in env_text
    assert "UNRELATED_KEY=keep-me" in env_text
    assert "TEXT_LLM_PROVIDER=openai_compatible" in env_text
    assert "OPENAI_COMPATIBLE_PROVIDER_NAME=Clauddy" in env_text
    assert "OPENAI_COMPATIBLE_BASE_URL=https://clauddy.com/v1" in env_text
    assert "OPENAI_COMPATIBLE_API_KEY=existing-openai-secret" in env_text
    assert "OPENAI_COMPATIBLE_MODEL=gpt-5.5" in env_text
    assert rejected.status_code == 422


def test_reports_endpoint_returns_stub_metadata(client: TestClient) -> None:
    response = client.get("/api/reports/report_001")

    assert response.status_code == 200
    assert response.json()["report_id"] == "report_001"
