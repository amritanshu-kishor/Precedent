"""Unit tests for CalibrationEngine."""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.memory.calibration import CalibrationEngine


def make_test_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return SessionLocal()


def add_full_chain(db: Session, plant_id: str, equipment_code: str, action_class: str, outcome: str, deviation_id: str | None = None) -> None:
    from app.models.entities import Capa, Deviation, EffectivenessCheck
    dev_id = deviation_id or f"dev-{equipment_code}-{action_class}"
    db.add(Deviation(id=dev_id, plant_id=plant_id, line="Line 3", equipment_code=equipment_code, failure_mode="seal failure", description="test", is_synthetic=True))
    db.add(Capa(id=f"capa-{dev_id}", deviation_id=dev_id, action_class=action_class, description="test"))
    db.add(EffectivenessCheck(id=f"eff-{dev_id}", capa_id=f"capa-{dev_id}", outcome=outcome, monitoring_days=30))
    db.commit()


def test_effectiveness_rate_no_data():
    db = make_test_session()
    try:
        engine = CalibrationEngine(db)
        result = engine.compute_effectiveness_rate()
    finally:
        db.close()
    assert result["total_assessed"] == 0
    assert result["effectiveness_percent"] is None
    assert result["is_synthetic"] is True


def test_effectiveness_rate_with_data():
    db = make_test_session()
    try:
        add_full_chain(db, "PLANT-001", "SEAL-02", "heater-band recalibration", "VERIFIED_EFFECTIVE")
        add_full_chain(db, "PLANT-001", "SEAL-02", "operator retraining", "RECURRENCE_OBSERVED")
        add_full_chain(db, "PLANT-001", "SEAL-02", "procedure update", "VERIFIED_EFFECTIVE")
        engine = CalibrationEngine(db)
        result = engine.compute_effectiveness_rate("PLANT-001")
    finally:
        db.close()
    assert result["total_assessed"] == 3
    assert result["verified_effective"] == 2
    assert result["recurrence_observed"] == 1
    assert result["effectiveness_percent"] == 66.67


def test_recurrence_rate_with_data():
    db = make_test_session()
    try:
        add_full_chain(db, "PLANT-001", "SEAL-02", "heater-band recalibration", "VERIFIED_EFFECTIVE")
        add_full_chain(db, "PLANT-001", "SEAL-02", "operator retraining", "RECURRENCE_OBSERVED")
        engine = CalibrationEngine(db)
        result = engine.compute_recurrence_rate("PLANT-001")
    finally:
        db.close()
    assert result["total_assessed"] == 2
    assert result["recurrence_observed"] == 1
    assert result["recurrence_percent"] == 50.0


def test_by_equipment_class():
    db = make_test_session()
    try:
        add_full_chain(db, "PLANT-001", "SEAL-02", "heater-band recalibration", "VERIFIED_EFFECTIVE", deviation_id="dev-1")
        add_full_chain(db, "PLANT-001", "SEAL-02", "operator retraining", "RECURRENCE_OBSERVED", deviation_id="dev-2")
        add_full_chain(db, "PLANT-001", "PUMP-01", "seal replacement", "VERIFIED_EFFECTIVE", deviation_id="dev-3")
        engine = CalibrationEngine(db)
        result = engine.compute_by_equipment_class("PLANT-001")
    finally:
        db.close()
    seal = next(r for r in result if r["equipment_code"] == "SEAL-02")
    pump = next(r for r in result if r["equipment_code"] == "PUMP-01")
    assert seal["total_assessed"] == 2
    assert seal["verified_effective"] == 1
    assert seal["effectiveness_percent"] == 50.0
    assert pump["total_assessed"] == 1
    assert pump["verified_effective"] == 1
    assert pump["effectiveness_percent"] == 100.0


def test_by_action_class():
    db = make_test_session()
    try:
        add_full_chain(db, "PLANT-001", "SEAL-02", "heater-band recalibration", "VERIFIED_EFFECTIVE", deviation_id="dev-1")
        add_full_chain(db, "PLANT-001", "SEAL-02", "heater-band recalibration", "RECURRENCE_OBSERVED", deviation_id="dev-2")
        engine = CalibrationEngine(db)
        result = engine.compute_by_action_class("PLANT-001")
    finally:
        db.close()
    recalibration = next(r for r in result if r["action_class"] == "heater-band recalibration")
    assert recalibration["total_assessed"] == 2
    assert recalibration["verified_effective"] == 1
    assert recalibration["recurrence_observed"] == 1


def test_compute_all():
    db = make_test_session()
    try:
        add_full_chain(db, "PLANT-001", "SEAL-02", "heater-band recalibration", "VERIFIED_EFFECTIVE", deviation_id="dev-1")
        engine = CalibrationEngine(db)
        result = engine.compute_all("PLANT-001")
    finally:
        db.close()
    assert "effectiveness_rate" in result
    assert "recurrence_rate" in result
    assert "by_equipment_class" in result
    assert "by_action_class" in result
    assert result["is_synthetic"] is True
    assert "note" in result


def test_plant_filtering():
    db = make_test_session()
    try:
        add_full_chain(db, "PLANT-001", "SEAL-02", "heater-band recalibration", "VERIFIED_EFFECTIVE", deviation_id="dev-1")
        add_full_chain(db, "PLANT-002", "SEAL-02", "operator retraining", "RECURRENCE_OBSERVED", deviation_id="dev-2")
        engine = CalibrationEngine(db)
        result_p1 = engine.compute_effectiveness_rate("PLANT-001")
        result_p2 = engine.compute_effectiveness_rate("PLANT-002")
    finally:
        db.close()
    assert result_p1["total_assessed"] == 1
    assert result_p1["verified_effective"] == 1
    assert result_p2["total_assessed"] == 1
    assert result_p2["recurrence_observed"] == 1


def test_is_synthetic_labelled():
    db = make_test_session()
    try:
        engine = CalibrationEngine(db)
        result = engine.compute_effectiveness_rate()
    finally:
        db.close()
    assert result["is_synthetic"] is True
