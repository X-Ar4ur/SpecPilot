import json
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import desc
from sqlalchemy.engine import Engine, make_url
from sqlmodel import Field, Session, SQLModel, create_engine, select

from specpilot_backend.config import get_settings


class FeatureRecord(SQLModel, table=True):
    feature_id: str = Field(primary_key=True)
    payload_json: str


class ScenarioRecord(SQLModel, table=True):
    scenario_id: str = Field(primary_key=True)
    feature_id: str = Field(index=True)
    review_status: str = Field(index=True)
    priority: str = Field(index=True)
    difficulty: str = Field(index=True)
    is_mutation: bool = Field(default=False, index=True)
    latest_result: str | None = None
    payload_json: str


class RunRecord(SQLModel, table=True):
    run_id: str = Field(primary_key=True)
    status: str = Field(index=True)
    artifact_dir: str
    payload_json: str
    created_at: str = Field(index=True)


def _database_url() -> str:
    return get_settings().database_url


engine: Engine = create_engine(
    _database_url(), connect_args={"check_same_thread": False}
)


def configure_database(database_url: str) -> None:
    global engine
    _ensure_sqlite_parent_dir(database_url)
    engine = create_engine(database_url, connect_args={"check_same_thread": False})


def create_tables() -> None:
    _ensure_sqlite_parent_dir(str(engine.url))
    SQLModel.metadata.create_all(engine)


def _ensure_sqlite_parent_dir(database_url: str) -> None:
    url = make_url(database_url)
    if not url.drivername.startswith("sqlite") or not url.database:
        return
    if url.database == ":memory:":
        return
    Path(url.database).parent.mkdir(parents=True, exist_ok=True)


def session_scope() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def save_feature_payload(payload: dict[str, object]) -> None:
    with Session(engine) as session:
        record = FeatureRecord(
            feature_id=str(payload["feature_id"]),
            payload_json=json.dumps(payload, ensure_ascii=False),
        )
        session.merge(record)
        session.commit()


def list_feature_payloads() -> list[dict[str, object]]:
    with Session(engine) as session:
        records = session.exec(select(FeatureRecord)).all()
        return [json.loads(record.payload_json) for record in records]


def save_scenario_payload(payload: dict[str, object]) -> None:
    latest_result_value = payload.get("latest_result")
    latest_result = (
        latest_result_value if isinstance(latest_result_value, str) else None
    )
    with Session(engine) as session:
        record = ScenarioRecord(
            scenario_id=str(payload["scenario_id"]),
            feature_id=str(payload["feature_id"]),
            review_status=str(payload["review_status"]),
            priority=str(payload["priority"]),
            difficulty=str(payload["difficulty"]),
            is_mutation=bool(payload.get("is_mutation", False)),
            latest_result=latest_result,
            payload_json=json.dumps(payload, ensure_ascii=False),
        )
        session.merge(record)
        session.commit()


def list_scenario_records(
    *,
    feature_id: str | None = None,
    priority: str | None = None,
    difficulty: str | None = None,
    review_status: str | None = None,
    latest_result: str | None = None,
    is_mutation: bool | None = None,
) -> list[ScenarioRecord]:
    statement = select(ScenarioRecord)
    if feature_id is not None:
        statement = statement.where(ScenarioRecord.feature_id == feature_id)
    if priority is not None:
        statement = statement.where(ScenarioRecord.priority == priority)
    if difficulty is not None:
        statement = statement.where(ScenarioRecord.difficulty == difficulty)
    if review_status is not None:
        statement = statement.where(ScenarioRecord.review_status == review_status)
    if latest_result is not None:
        statement = statement.where(ScenarioRecord.latest_result == latest_result)
    if is_mutation is not None:
        statement = statement.where(ScenarioRecord.is_mutation == is_mutation)
    with Session(engine) as session:
        return list(session.exec(statement).all())


def get_scenario_payload(scenario_id: str) -> dict[str, object] | None:
    with Session(engine) as session:
        record = session.get(ScenarioRecord, scenario_id)
        if record is None:
            return None
        return json.loads(record.payload_json)


def save_run_payload(payload: dict[str, object]) -> None:
    with Session(engine) as session:
        run_id = str(payload["run_id"])
        existing = session.get(RunRecord, run_id)
        created_at = existing.created_at if existing is not None else datetime.now(UTC).isoformat()
        record = RunRecord(
            run_id=run_id,
            status=str(payload["status"]),
            artifact_dir=str(payload["artifact_dir"]),
            payload_json=json.dumps(payload, ensure_ascii=False),
            created_at=created_at,
        )
        session.merge(record)
        session.commit()


def mark_orphaned_running_runs_cancelled(active_run_ids: set[str]) -> int:
    finished_at = datetime.now(UTC).isoformat()
    changed = 0
    statement = select(RunRecord).where(RunRecord.status == "running")
    with Session(engine) as session:
        records = session.exec(statement).all()
        for record in records:
            if record.run_id in active_run_ids:
                continue
            payload = json.loads(record.payload_json)
            if payload.get("status") != "running":
                continue
            payload["status"] = "cancelled"
            payload["finished_at"] = payload.get("finished_at") or finished_at
            payload["duration_ms"] = payload.get("duration_ms")
            payload["verdict"] = None
            payload["failure_primary"] = payload.get("failure_primary") or "interrupted"
            record.status = "cancelled"
            record.payload_json = json.dumps(payload, ensure_ascii=False)
            changed += 1
        if changed:
            session.commit()
    return changed


def list_run_payloads() -> list[dict[str, object]]:
    statement = select(RunRecord).order_by(desc(RunRecord.created_at))
    with Session(engine) as session:
        records = session.exec(statement).all()
        return [json.loads(record.payload_json) for record in records]


def get_run_payload(run_id: str) -> dict[str, object] | None:
    with Session(engine) as session:
        record = session.get(RunRecord, run_id)
        if record is None:
            return None
        return json.loads(record.payload_json)


def artifact_path_for_run(run_id: str) -> Path:
    run = get_run_payload(run_id)
    if run is None:
        return get_settings().artifact_root / run_id
    return Path(str(run["artifact_dir"]))
