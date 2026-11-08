"""Unit tests for SyncEngine."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.memory.hindsight_client import (
    HindsightAuthError,
    HindsightClient,
    HindsightNetworkError,
    HindsightTimeoutError,
)
from app.memory.sync import MAX_RETRY_COUNT, SyncEngine
from app.models.entities import MemoryEvent as MemoryEventORM, Outbox as OutboxORM


def make_test_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def make_mock_hindsight(success: bool = True, error: Exception | None = None) -> HindsightClient:
    client = MagicMock(spec=HindsightClient)
    if error is not None:
        client.write_event.side_effect = error
    elif not success:
        client.write_event.side_effect = HindsightTimeoutError("timed out")
    else:
        client.write_event.return_value = {"status": "retained", "source_record_id": "rec-123"}
    return client


def _make_event_and_outbox(db: Session, source_record_id="dev-001", status="PENDING", event_sync_status="PENDING"):
    event = MemoryEventORM(
        source_record_id=source_record_id,
        event_type="DEVIATION_RETAINED",
        plant_id="PLANT-001",
        payload={"failure_mode": "seal integrity"},
        sync_status=event_sync_status,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    outbox = OutboxORM(
        event_id=event.id,
        status=status,
        retry_count=0,
        last_error=None,
    )
    db.add(outbox)
    db.commit()
    return event.id, outbox.id


def _get_outbox(db: Session, outbox_id: str) -> OutboxORM:
    return db.get(OutboxORM, outbox_id)


def test_sync_reconciles_pending_outbox_success():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        event_id, outbox_id = _make_event_and_outbox(db)
        engine = SyncEngine(db=db, hindsight_client=hindsight)
        result = engine.reconcile_outbox()
    finally:
        db.close()
    assert result["processed"] == 1
    assert result["synced"] == 1
    assert result["failed"] == 0
    assert result["remaining"] == 0
    hindsight.write_event.assert_called_once()
    event = db.get(MemoryEventORM, event_id)
    assert event.sync_status == "SYNCED"
    outbox = _get_outbox(db, outbox_id)
    assert outbox.status == "SYNCED"


def test_sync_skips_already_synced_event():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        event_id, outbox_id = _make_event_and_outbox(db, event_sync_status="SYNCED", status="FAILED")
        engine = SyncEngine(db=db, hindsight_client=hindsight)
        result = engine.reconcile_outbox()
    finally:
        db.close()
    assert result["processed"] == 1
    assert result["synced"] == 0
    assert result["failed"] == 0
    hindsight.write_event.assert_not_called()
    outbox = _get_outbox(db, outbox_id)
    assert outbox.status == "SYNCED"


def test_sync_auth_error_not_retried():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True, error=HindsightAuthError("bad credentials"))
    try:
        event_id, outbox_id = _make_event_and_outbox(db)
        engine = SyncEngine(db=db, hindsight_client=hindsight)
        result = engine.reconcile_outbox()
    finally:
        db.close()
    assert result["processed"] == 1
    assert result["synced"] == 0
    assert result["failed"] == 1
    hindsight.write_event.assert_called_once()
    outbox = _get_outbox(db, outbox_id)
    assert outbox.retry_count == 1
    assert "Auth error" in outbox.last_error


def test_sync_network_error_increments_retry():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True, error=HindsightNetworkError("connection refused"))
    try:
        event_id, outbox_id = _make_event_and_outbox(db)
        engine = SyncEngine(db=db, hindsight_client=hindsight)
        result = engine.reconcile_outbox()
    finally:
        db.close()
    assert result["failed"] == 1
    outbox = _get_outbox(db, outbox_id)
    assert outbox.retry_count == 1
    assert outbox.status == "FAILED"
    assert "connection refused" in outbox.last_error


def test_sync_max_retries_exceeded():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True, error=HindsightNetworkError("connection refused"))
    try:
        event_id, outbox_id = _make_event_and_outbox(db)
        engine = SyncEngine(db=db, hindsight_client=hindsight)
        for _ in range(MAX_RETRY_COUNT + 1):
            engine.reconcile_outbox()
    finally:
        db.close()
    outbox = _get_outbox(db, outbox_id)
    assert outbox.retry_count >= MAX_RETRY_COUNT
    assert outbox.status == "FAILED"
    assert "Max retries" in outbox.last_error


def test_sync_no_hindsight_client():
    db = make_test_session()
    try:
        event_id, outbox_id = _make_event_and_outbox(db)
        engine = SyncEngine(db=db, hindsight_client=None)
        result = engine.reconcile_outbox()
    finally:
        db.close()
    assert result["processed"] == 0
    assert result["synced"] == 0
    assert result["failed"] == 0
    assert "No Hindsight client configured" in result["error"]


def test_sync_event_not_found():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        outbox = OutboxORM(event_id="nonexistent-id", status="PENDING", retry_count=0, last_error=None)
        db.add(outbox)
        db.commit()
        db.refresh(outbox)
        outbox_id = outbox.id
        engine = SyncEngine(db=db, hindsight_client=hindsight)
        result = engine.reconcile_outbox()
    finally:
        db.close()
    assert result["processed"] == 1
    assert result["failed"] == 1
    assert result["synced"] == 0
    hindsight.write_event.assert_not_called()


def test_sync_get_outbox_status():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        _make_event_and_outbox(db, source_record_id="dev-001", status="PENDING")
        _make_event_and_outbox(db, source_record_id="dev-002", status="FAILED")
        engine = SyncEngine(db=db, hindsight_client=hindsight)
        status = engine.get_outbox_status()
    finally:
        db.close()
    assert status["total"] == 2
    assert status["pending"] == 1
    assert status["failed"] == 1
    assert status["synced"] == 0


def test_sync_multiple_events_batch():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        _make_event_and_outbox(db, source_record_id="dev-001")
        _make_event_and_outbox(db, source_record_id="dev-002")
        _make_event_and_outbox(db, source_record_id="dev-003")
        engine = SyncEngine(db=db, hindsight_client=hindsight)
        result = engine.reconcile_outbox()
    finally:
        db.close()
    assert result["processed"] == 3
    assert result["synced"] == 3
    assert result["failed"] == 0
    assert hindsight.write_event.call_count == 3
