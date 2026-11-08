"""Unit tests for memory event models."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.memory.event_models import (
    CAPAEvent,
    DecisionEvent,
    DeviationEvent,
    EffectivenessEvent,
    EvidenceReference,
    EventType,
    InvestigationEvent,
    MemoryEvent,
    RecommendationEvent,
    RoleTag,
    SyncStatus,
)


def test_memory_event_defaults():
    event = MemoryEvent(
        source_record_id="dev-001",
        event_type="DEVIATION_RETAINED",
        plant_id="PLANT-001",
    )
    assert event.source_record_id == "dev-001"
    assert event.event_type == "DEVIATION_RETAINED"
    assert event.plant_id == "PLANT-001"
    assert event.id is not None
    assert event.deviation_id is None
    assert event.role_tag is None
    assert event.is_synthetic is True
    assert event.payload == {}
    assert event.evidence == []
    assert event.sync_status == "PENDING"
    assert event.created_at is None
    assert event.synced_at is None


def test_deviation_event_type():
    event = DeviationEvent(
        source_record_id="dev-001",
        plant_id="PLANT-001",
        payload={"failure_mode": "seal integrity failure"},
    )
    assert event.event_type == EventType.DEVIATION_RETAINED
    assert event.payload["failure_mode"] == "seal integrity failure"


def test_investigation_event_type():
    event = InvestigationEvent(
        source_record_id="inv-001",
        plant_id="PLANT-001",
        deviation_id="dev-001",
    )
    assert event.event_type == EventType.INVESTIGATION_RETAINED
    assert event.deviation_id == "dev-001"


def test_capa_event_type():
    event = CAPAEvent(
        source_record_id="capa-001",
        plant_id="PLANT-001",
        deviation_id="dev-001",
    )
    assert event.event_type == EventType.CAPA_RETAINED


def test_recommendation_event_type():
    event = RecommendationEvent(
        source_record_id="rec-001",
        plant_id="PLANT-001",
        deviation_id="dev-001",
    )
    assert event.event_type == EventType.RECOMMENDATION_RETAINED


def test_decision_event_type():
    event = DecisionEvent(
        source_record_id="dec-001",
        plant_id="PLANT-001",
    )
    assert event.event_type == EventType.DECISION_RETAINED


def test_effectiveness_event_type():
    event = EffectivenessEvent(
        source_record_id="eff-001",
        plant_id="PLANT-001",
    )
    assert event.event_type == EventType.EFFECTIVENESS_RETAINED


def test_role_tag_values():
    assert RoleTag.INVESTIGATOR == "INVESTIGATOR"
    assert RoleTag.SKEPTIC == "SKEPTIC"
    assert RoleTag.AUDITOR == "AUDITOR"


def test_sync_status_values():
    assert SyncStatus.PENDING == "PENDING"
    assert SyncStatus.SYNCING == "SYNCING"
    assert SyncStatus.SYNCED == "SYNCED"
    assert SyncStatus.FAILED == "FAILED"


def test_evidence_reference():
    ref = EvidenceReference(
        source_record_id="dev-001",
        source_type="deviation",
        plant_id="PLANT-001",
        relevance="direct",
    )
    assert ref.source_record_id == "dev-001"
    assert ref.source_type == "deviation"
    assert ref.plant_id == "PLANT-001"
    assert ref.relevance == "direct"


def test_event_with_role_tag():
    event = MemoryEvent(
        source_record_id="dev-001",
        event_type="DEVIATION_RETAINED",
        plant_id="PLANT-001",
        role_tag=RoleTag.INVESTIGATOR,
    )
    assert event.role_tag == "INVESTIGATOR"


def test_event_with_evidence():
    event = MemoryEvent(
        source_record_id="dev-001",
        event_type="DEVIATION_RETAINED",
        plant_id="PLANT-001",
        evidence=[
            EvidenceReference(
                source_record_id="dev-002",
                source_type="deviation",
                plant_id="PLANT-001",
                relevance="related",
            )
        ],
    )
    assert len(event.evidence) == 1
    assert event.evidence[0].source_record_id == "dev-002"


def test_event_missing_required_field_raises():
    with pytest.raises(ValidationError):
        MemoryEvent(
            event_type="DEVIATION_RETAINED",
            plant_id="PLANT-001",
            # missing source_record_id
        )


def test_event_is_synthetic_explicitly_true():
    event = MemoryEvent(
        source_record_id="dev-001",
        event_type="DEVIATION_RETAINED",
        plant_id="PLANT-001",
        is_synthetic=True,
    )
    assert event.is_synthetic is True


def test_event_to_dict():
    event = MemoryEvent(
        source_record_id="dev-001",
        event_type="DEVIATION_RETAINED",
        plant_id="PLANT-001",
        role_tag=RoleTag.SKEPTIC,
    )
    data = event.model_dump()
    assert data["source_record_id"] == "dev-001"
    assert data["role_tag"] == "SKEPTIC"
    assert data["is_synthetic"] is True
