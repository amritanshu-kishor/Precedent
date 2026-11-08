"""Unit tests for EvidenceResolution."""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.memory.evidence_resolution import ContradictionError, EvidenceResolution, SourceNotFoundError


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


def test_resolve_citation_found():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001", event_type="DEVIATION_RETAINED")
        er = EvidenceResolution(db)
        result = er.resolve_citation("dev-001", "PLANT-001")
    finally:
        db.close()
    assert result is not None
    assert result["source_record_id"] == "dev-001"


def test_resolve_citation_not_found():
    db = make_test_session()
    try:
        er = EvidenceResolution(db)
        result = er.resolve_citation("nonexistent", "PLANT-001")
    finally:
        db.close()
    assert result is None


def test_resolve_citation_wrong_plant():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001")
        er = EvidenceResolution(db)
        result = er.resolve_citation("dev-001", "PLANT-002")
    finally:
        db.close()
    assert result is None


def test_map_claims_to_sources_all_resolved():
    db = make_test_session()
    try:
        add_event(
            db,
            source_record_id="dev-001",
            plant_id="PLANT-001",
            payload={"failure_mode": "seal integrity failure", "outcome": "VERIFIED_EFFECTIVE"},
        )
        er = EvidenceResolution(db)
        result = er.map_claims_to_sources(
            claims=["seal integrity failure"],
            evidence=[{"source_record_id": "dev-001", "plant_id": "PLANT-001", "payload": {"failure_mode": "seal integrity failure", "outcome": "VERIFIED_EFFECTIVE"}}],
            plant_id="PLANT-001",
        )
    finally:
        db.close()
    assert len(result["resolved"]) == 1
    assert result["resolved"][0]["claim"] == "seal integrity failure"
    assert "dev-001" in result["resolved"][0]["sources"]
    assert result["unresolved"] == []
    assert result["contradictions"] == []


def test_map_claims_to_sources_unresolved():
    db = make_test_session()
    try:
        er = EvidenceResolution(db)
        result = er.map_claims_to_sources(
            claims=["nonexistent claim"],
            evidence=[],
            plant_id="PLANT-001",
        )
    finally:
        db.close()
    assert result["resolved"] == []
    assert result["unresolved"] == ["nonexistent claim"]
    assert result["contradictions"] == []


def test_detect_contradictions_same_action_different_outcome():
    db = make_test_session()
    try:
        add_event(
            db,
            source_record_id="dev-001",
            plant_id="PLANT-001",
            deviation_id="dev-parent",
            payload={"action_class": "operator retraining", "outcome": "VERIFIED_EFFECTIVE"},
        )
        add_event(
            db,
            source_record_id="dev-002",
            plant_id="PLANT-001",
            deviation_id="dev-parent",
            payload={"action_class": "operator retraining", "outcome": "RECURRENCE_OBSERVED"},
        )
        er = EvidenceResolution(db)
        result = er.detect_contradictions([
            {"source_record_id": "dev-001", "deviation_id": "dev-parent", "payload": {"action_class": "operator retraining", "outcome": "VERIFIED_EFFECTIVE"}},
            {"source_record_id": "dev-002", "deviation_id": "dev-parent", "payload": {"action_class": "operator retraining", "outcome": "RECURRENCE_OBSERVED"}},
        ])
    finally:
        db.close()
    assert len(result) == 1
    assert result[0]["deviation_id"] == "dev-parent"
    assert result[0]["action_class"] == "operator retraining"
    assert set(result[0]["outcomes"]) == {"VERIFIED_EFFECTIVE", "RECURRENCE_OBSERVED"}


def test_detect_contradictions_no_contradiction():
    db = make_test_session()
    try:
        er = EvidenceResolution(db)
        result = er.detect_contradictions([
            {"source_record_id": "dev-001", "deviation_id": "dev-parent", "payload": {"action_class": "operator retraining", "outcome": "VERIFIED_EFFECTIVE"}},
            {"source_record_id": "dev-002", "deviation_id": "dev-parent", "payload": {"action_class": "operator retraining", "outcome": "VERIFIED_EFFECTIVE"}},
        ])
    finally:
        db.close()
    assert result == []


def test_detect_contradictions_missing_fields():
    db = make_test_session()
    try:
        er = EvidenceResolution(db)
        result = er.detect_contradictions([
            {"source_record_id": "dev-001", "payload": {}},  # missing deviation_id, action_class, outcome
        ])
    finally:
        db.close()
    assert result == []
