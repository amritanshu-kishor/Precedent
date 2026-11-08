"""Unit tests for ReflectEngine."""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.memory.reflect_engine import ReflectEngine


def make_test_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def add_event(db: Session, **kwargs) -> None:
    from app.models.entities import MemoryEvent as MemoryEventORM

    defaults = {
        "source_record_id": "dev-001",
        "event_type": "DEVIATION_RETAINED",
        "plant_id": "PLANT-001",
        "role_tag": None,
        "is_synthetic": True,
        "payload": {},
        "sync_status": "SYNCED",
    }
    defaults.update(kwargs)
    db.add(MemoryEventORM(**defaults))
    db.commit()


def test_reflect_no_plant_id():
    db = make_test_session()
    try:
        engine = ReflectEngine(db)
        result = engine.reflect({"failure_mode": "seal failure"})
    finally:
        db.close()
    assert result["plant_id"] is None
    assert "error" in result
    assert result["no_invented_precedents"] is True


def test_reflect_empty_history():
    db = make_test_session()
    try:
        engine = ReflectEngine(db)
        result = engine.reflect({"deviation_id": "dev-new", "plant_id": "PLANT-001", "failure_mode": "seal failure"})
    finally:
        db.close()
    assert result["deviation_id"] == "dev-new"
    assert result["plant_id"] == "PLANT-001"
    assert result["similar_deviations"] == []
    assert result["verified_interventions"] == []
    assert result["failed_interventions"] == []
    assert result["evidence_references"] == []
    assert "No historical memory found for this plant" in result["uncertainty"]
    assert result["no_invented_precedents"] is True


def test_reflect_with_verified_and_failed():
    db = make_test_session()
    try:
        add_event(
            db,
            source_record_id="dev-001",
            plant_id="PLANT-001",
            deviation_id="dev-parent",
            event_type="DEVIATION_RETAINED",
            payload={"failure_mode": "seal integrity failure", "action_class": "heater-band recalibration", "outcome": "VERIFIED_EFFECTIVE", "monitoring_days": 420},
        )
        add_event(
            db,
            source_record_id="dev-002",
            plant_id="PLANT-001",
            deviation_id="dev-parent",
            event_type="DEVIATION_RETAINED",
            payload={"failure_mode": "seal integrity failure", "action_class": "operator retraining", "outcome": "RECURRENCE_OBSERVED", "monitoring_days": 12},
        )
        engine = ReflectEngine(db)
        result = engine.reflect({
            "deviation_id": "dev-new",
            "plant_id": "PLANT-001",
            "failure_mode": "seal integrity failure",
        })
    finally:
        db.close()
    assert len(result["verified_interventions"]) == 1
    assert result["verified_interventions"][0]["action_class"] == "heater-band recalibration"
    assert result["verified_interventions"][0]["monitoring_days"] == 420
    assert len(result["failed_interventions"]) == 1
    assert result["failed_interventions"][0]["action_class"] == "operator retraining"
    assert result["failed_interventions"][0]["monitoring_days"] == 12
    assert result["no_invented_precedents"] is True


def test_reflect_no_invented_precedents():
    """All evidence references must point to actual source records."""
    db = make_test_session()
    try:
        add_event(
            db,
            source_record_id="dev-001",
            plant_id="PLANT-001",
            deviation_id="dev-parent",
            event_type="DEVIATION_RETAINED",
            payload={"failure_mode": "seal integrity failure"},
        )
        engine = ReflectEngine(db)
        result = engine.reflect({
            "deviation_id": "dev-new",
            "plant_id": "PLANT-001",
            "failure_mode": "seal integrity failure",
        })
    finally:
        db.close()
    assert result["no_invented_precedents"] is True
    for ref in result["evidence_references"]:
        assert "source_record_id" in ref
        assert ref["source_record_id"] is not None


def test_reflect_role_tag_filtering():
    db = make_test_session()
    try:
        add_event(
            db,
            source_record_id="dev-001",
            plant_id="PLANT-001",
            event_type="DEVIATION_RETAINED",
            role_tag="INVESTIGATOR",
            payload={"failure_mode": "seal integrity failure"},
        )
        add_event(
            db,
            source_record_id="dev-002",
            plant_id="PLANT-001",
            event_type="DEVIATION_RETAINED",
            role_tag="SKEPTIC",
            payload={"failure_mode": "seal integrity failure"},
        )
        engine = ReflectEngine(db)
        result_investigator = engine.reflect({
            "plant_id": "PLANT-001",
            "failure_mode": "seal integrity failure",
        }, role_tag="INVESTIGATOR")
        result_skeptic = engine.reflect({
            "plant_id": "PLANT-001",
            "failure_mode": "seal integrity failure",
        }, role_tag="SKEPTIC")
    finally:
        db.close()
    inv_ids = {e["source_record_id"] for e in result_investigator["evidence_references"]}
    sk_ids = {e["source_record_id"] for e in result_skeptic["evidence_references"]}
    assert "dev-001" in inv_ids
    assert "dev-002" not in inv_ids
    assert "dev-002" in sk_ids
    assert "dev-001" not in sk_ids


def test_reflect_uncertainty_on_no_history():
    db = make_test_session()
    try:
        engine = ReflectEngine(db)
        result = engine.reflect({
            "deviation_id": "dev-new",
            "plant_id": "PLANT-999",
            "failure_mode": "unknown failure",
        })
    finally:
        db.close()
    assert len(result["uncertainty"]) > 0
