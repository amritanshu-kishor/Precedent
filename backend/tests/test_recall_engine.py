"""Unit tests for RecallEngine."""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.memory.recall_engine import RecallEngine


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


def test_recall_returns_empty_when_no_plant_id():
    db = make_test_session()
    try:
        engine = RecallEngine(db=db)
        result = engine.recall({"line": "Line 3"})
    finally:
        db.close()
    assert result == []


def test_recall_filters_by_plant_id():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001")
        add_event(db, source_record_id="dev-002", plant_id="PLANT-002")
        engine = RecallEngine(db=db)
        result = engine.recall({"plant_id": "PLANT-001"})
    finally:
        db.close()
    assert len(result) == 1
    assert result[0]["source_record_id"] == "dev-001"


def test_recall_no_cross_role_leakage_investigator_cant_see_skeptic():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001", role_tag="INVESTIGATOR")
        add_event(db, source_record_id="dev-002", plant_id="PLANT-001", role_tag="SKEPTIC")
        add_event(db, source_record_id="dev-003", plant_id="PLANT-001", role_tag=None)
        engine = RecallEngine(db=db)
        result = engine.recall({"plant_id": "PLANT-001"}, role_tag="INVESTIGATOR")
    finally:
        db.close()
    ids = {e["source_record_id"] for e in result}
    assert ids == {"dev-001", "dev-003"}  # INVESTIGATOR sees own + untagged, not SKEPTIC


def test_recall_no_cross_role_leakage_skeptic_cant_see_investigator():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001", role_tag="INVESTIGATOR")
        add_event(db, source_record_id="dev-002", plant_id="PLANT-001", role_tag="SKEPTIC")
        engine = RecallEngine(db=db)
        result = engine.recall({"plant_id": "PLANT-001"}, role_tag="SKEPTIC")
    finally:
        db.close()
    ids = {e["source_record_id"] for e in result}
    assert ids == {"dev-002"}  # SKEPTIC sees only own (no untagged in this test)


def test_recall_no_cross_role_leakage_auditor_cant_see_investigator():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001", role_tag="INVESTIGATOR")
        add_event(db, source_record_id="dev-002", plant_id="PLANT-001", role_tag="AUDITOR")
        engine = RecallEngine(db=db)
        result = engine.recall({"plant_id": "PLANT-001"}, role_tag="AUDITOR")
    finally:
        db.close()
    ids = {e["source_record_id"] for e in result}
    assert ids == {"dev-002"}


def test_recall_by_event_type():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001", event_type="DEVIATION_RETAINED")
        add_event(db, source_record_id="capa-001", plant_id="PLANT-001", event_type="CAPA_RETAINED")
        engine = RecallEngine(db=db)
        result = engine.recall_by_dimension("PLANT-001", event_type="DEVIATION_RETAINED")
    finally:
        db.close()
    assert len(result) == 1
    assert result[0]["event_type"] == "DEVIATION_RETAINED"


def test_recall_by_deviation_id():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001", deviation_id="dev-parent-001")
        add_event(db, source_record_id="dev-002", plant_id="PLANT-001", deviation_id="dev-parent-002")
        engine = RecallEngine(db=db)
        result = engine.recall_by_dimension("PLANT-001", deviation_id="dev-parent-001")
    finally:
        db.close()
    assert len(result) == 1
    assert result[0]["deviation_id"] == "dev-parent-001"


def test_recall_pagination():
    db = make_test_session()
    try:
        for i in range(5):
            add_event(db, source_record_id=f"dev-{i:03d}", plant_id="PLANT-001")
        engine = RecallEngine(db=db)
        page1 = engine.recall_by_dimension("PLANT-001", limit=2, offset=0)
        page2 = engine.recall_by_dimension("PLANT-001", limit=2, offset=2)
    finally:
        db.close()
    assert len(page1) == 2
    assert len(page2) == 2
    assert page1[0]["source_record_id"] != page2[0]["source_record_id"]


def test_recall_invalid_role_tag():
    db = make_test_session()
    try:
        engine = RecallEngine(db=db)
        with pytest.raises(ValueError, match="Invalid role_tag"):
            engine.recall_by_dimension("PLANT-001", role_tag="INVALID_ROLE")
    finally:
        db.close()


def test_recall_by_source_record_id():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001")
        engine = RecallEngine(db=db)
        result = engine.recall_by_source_record_id("dev-001")
    finally:
        db.close()
    assert result is not None
    assert result["source_record_id"] == "dev-001"


def test_recall_by_source_record_id_not_found():
    db = make_test_session()
    try:
        engine = RecallEngine(db=db)
        result = engine.recall_by_source_record_id("nonexistent")
    finally:
        db.close()
    assert result is None


def test_recall_is_synthetic_labelled():
    db = make_test_session()
    try:
        add_event(db, source_record_id="dev-001", plant_id="PLANT-001", is_synthetic=True)
        engine = RecallEngine(db=db)
        result = engine.recall({"plant_id": "PLANT-001"})
    finally:
        db.close()
    assert result[0]["is_synthetic"] is True
