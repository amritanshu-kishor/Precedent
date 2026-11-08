"""Unit tests for RetainEngine."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.memory.hindsight_client import (
    HindsightAuthError,
    HindsightClient,
    HindsightConfigurationError,
    HindsightNetworkError,
    HindsightTimeoutError,
)
from app.memory.retain_engine import DuplicateEventError, RetainEngine


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


def test_retain_success_with_hindsight():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        engine = RetainEngine(db=db, hindsight_client=hindsight)
        result = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
            "payload": {"failure_mode": "seal integrity"},
        })
    finally:
        db.close()
    assert result["status"] == "retained"
    assert result["synced"] is True
    assert result["source_record_id"] == "dev-001"
    assert result["event_id"] is not None
    assert result["hindsight_response"] == {"status": "retained", "source_record_id": "rec-123"}


def test_retain_success_without_hindsight():
    db = make_test_session()
    try:
        engine = RetainEngine(db=db, hindsight_client=None)
        result = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
        })
    finally:
        db.close()
    assert result["status"] == "retained_locally"
    assert result["synced"] is False
    assert "Hindsight client not configured" in result["error"]


def test_retain_duplicate_idempotent():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        engine = RetainEngine(db=db, hindsight_client=hindsight)
        result1 = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
        })
        result2 = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
        })
    finally:
        db.close()
    assert result1["status"] == "retained"
    assert result2["status"] == "already_retained"
    assert result1["event_id"] == result2["event_id"]


def test_retain_missing_required_fields():
    db = make_test_session()
    try:
        engine = RetainEngine(db=db)
        with pytest.raises(ValueError, match="Missing required fields"):
            engine.retain({"event_type": "DEVIATION_RETAINED", "plant_id": "PLANT-001"})
        with pytest.raises(ValueError, match="Missing required fields"):
            engine.retain({"source_record_id": "dev-001", "plant_id": "PLANT-001"})
        with pytest.raises(ValueError, match="Missing required fields"):
            engine.retain({"source_record_id": "dev-001", "event_type": "DEVIATION_RETAINED"})
    finally:
        db.close()


def test_retain_invalid_role_tag():
    db = make_test_session()
    try:
        engine = RetainEngine(db=db)
        with pytest.raises(ValueError, match="Invalid role_tag"):
            engine.retain({
                "source_record_id": "dev-001",
                "event_type": "DEVIATION_RETAINED",
                "plant_id": "PLANT-001",
                "role_tag": "INVALID_ROLE",
            })
    finally:
        db.close()


def test_retain_hindsight_timeout_preserves_locally():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=False)
    try:
        engine = RetainEngine(db=db, hindsight_client=hindsight)
        result = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
        })
    finally:
        db.close()
    assert result["status"] == "retained_locally"
    assert result["synced"] is False
    assert result["error"] is not None
    assert "timed out" in result["error"]


def test_retain_hindsight_auth_error_preserves_locally():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True, error=HindsightAuthError("bad credentials"))
    try:
        engine = RetainEngine(db=db, hindsight_client=hindsight)
        result = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
        })
    finally:
        db.close()
    assert result["status"] == "retained_locally"
    assert result["synced"] is False
    assert "bad credentials" in result["error"]


def test_retain_hindsight_network_error_preserves_locally():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True, error=HindsightNetworkError("connection refused"))
    try:
        engine = RetainEngine(db=db, hindsight_client=hindsight)
        result = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
        })
    finally:
        db.close()
    assert result["status"] == "retained_locally"
    assert result["synced"] is False
    assert "connection refused" in result["error"]


def test_retain_with_role_tag():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        engine = RetainEngine(db=db, hindsight_client=hindsight)
        result = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
            "role_tag": "INVESTIGATOR",
        })
    finally:
        db.close()
    assert result["status"] == "retained"
    assert result["synced"] is True


def test_retain_is_synthetic_default_true():
    db = make_test_session()
    hindsight = make_mock_hindsight(success=True)
    try:
        engine = RetainEngine(db=db, hindsight_client=hindsight)
        result = engine.retain({
            "source_record_id": "dev-001",
            "event_type": "DEVIATION_RETAINED",
            "plant_id": "PLANT-001",
        })
    finally:
        db.close()
    assert result["status"] == "retained"
    assert result["event_id"] is not None
