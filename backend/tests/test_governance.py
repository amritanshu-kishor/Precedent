"""Unit tests for MemoryGovernance."""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.memory.governance import MemoryGovernance, require_memory_enabled


def make_test_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def test_is_enabled_defaults_true():
    db = make_test_session()
    try:
        gov = MemoryGovernance(db)
        assert gov.is_enabled("PLANT-001") is True
        assert gov.is_enabled(None) is True
    finally:
        db.close()


def test_set_enabled_disable_then_check():
    db = make_test_session()
    try:
        gov = MemoryGovernance(db)
        gov.set_enabled(plant_id="PLANT-001", enabled=False, actor="admin")
        assert gov.is_enabled("PLANT-001") is False
        # Other plants still enabled (default)
        assert gov.is_enabled("PLANT-002") is True
    finally:
        db.close()


def test_set_enabled_global():
    db = make_test_session()
    try:
        gov = MemoryGovernance(db)
        gov.set_enabled(plant_id=None, enabled=False, actor="admin")
        assert gov.is_enabled("PLANT-001") is False
        assert gov.is_enabled("PLANT-002") is False
        assert gov.is_enabled(None) is False
    finally:
        db.close()


def test_plant_setting_overrides_global():
    db = make_test_session()
    try:
        gov = MemoryGovernance(db)
        gov.set_enabled(plant_id=None, enabled=False, actor="admin")  # global off
        gov.set_enabled(plant_id="PLANT-001", enabled=True, actor="admin")  # plant on
        assert gov.is_enabled("PLANT-001") is True
        assert gov.is_enabled("PLANT-002") is False  # global still off
    finally:
        db.close()


def test_enforce_raises_when_disabled():
    db = make_test_session()
    try:
        gov = MemoryGovernance(db)
        gov.set_enabled(plant_id="PLANT-001", enabled=False, actor="admin")
        with pytest.raises(PermissionError, match="Memory is disabled"):
            gov.enforce("PLANT-001")
        # Enforce should pass when enabled
        gov.enforce("PLANT-002")  # Should not raise
    finally:
        db.close()


def test_require_memory_enabled_helper():
    db = make_test_session()
    try:
        # Should not raise when enabled
        require_memory_enabled("PLANT-001", db)

        # Should raise when disabled
        gov = MemoryGovernance(db)
        gov.set_enabled(plant_id="PLANT-001", enabled=False, actor="admin")
        with pytest.raises(PermissionError):
            require_memory_enabled("PLANT-001", db)
    finally:
        db.close()


def test_audit_log_written_on_toggle():
    db = make_test_session()
    try:
        from app.models.entities import AuditEvent
        gov = MemoryGovernance(db)
        gov.set_enabled(plant_id="PLANT-001", enabled=False, actor="admin")
        gov.set_enabled(plant_id="PLANT-001", enabled=True, actor="admin")

        audit_events = db.scalars(
            __import__("sqlalchemy").select(AuditEvent).where(AuditEvent.event_type == "MEMORY_TOGGLED")
        ).all()
        assert len(audit_events) == 2
        assert audit_events[0].details["enabled"] is False
        assert audit_events[0].details["actor"] == "admin"
        assert audit_events[1].details["enabled"] is True
    finally:
        db.close()


def test_set_enabled_returns_setting_dict():
    db = make_test_session()
    try:
        gov = MemoryGovernance(db)
        result = gov.set_enabled(plant_id="PLANT-001", enabled=True, actor="admin")
        assert result["plant_id"] == "PLANT-001"
        assert result["enabled"] is True
        assert result["updated_by"] == "admin"
        assert "id" in result
        assert "updated_at" in result
    finally:
        db.close()
