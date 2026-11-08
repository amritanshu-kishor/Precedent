"""Typed memory event models for the Hindsight Memory Intelligence Layer.

All events are explicitly labelled is_synthetic=True — not 21 CFR Part 11 compliant.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


class EventType(str, Enum):
    DEVIATION_RETAINED = "DEVIATION_RETAINED"
    INVESTIGATION_RETAINED = "INVESTIGATION_RETAINED"
    CAPA_RETAINED = "CAPA_RETAINED"
    RECOMMENDATION_RETAINED = "RECOMMENDATION_RETAINED"
    DECISION_RETAINED = "DECISION_RETAINED"
    EFFECTIVENESS_RETAINED = "EFFECTIVENESS_RETAINED"


class RoleTag(str, Enum):
    INVESTIGATOR = "INVESTIGATOR"
    SKEPTIC = "SKEPTIC"
    AUDITOR = "AUDITOR"


class SyncStatus(str, Enum):
    PENDING = "PENDING"
    SYNCING = "SYNCING"
    SYNCED = "SYNCED"
    FAILED = "FAILED"


class EvidenceReference(BaseModel):
    """A reference to a source record that backs a claim in memory."""

    model_config = ConfigDict(from_attributes=True)

    source_record_id: str = Field(..., description="Unique id of the source record (e.g. deviation id, capa id)")
    source_type: str = Field(..., description="Type of source: deviation | investigation | capa | recommendation | decision | effectiveness")
    plant_id: str = Field(..., description="Plant id the source belongs to")
    relevance: str = Field(default="direct", description="How this source supports the claim")


class MemoryEvent(BaseModel):
    """A persisted memory event with original identity and provenance."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(default_factory=lambda: str(uuid4()))
    source_record_id: str = Field(..., description="Original identity of the retained record")
    event_type: str = Field(..., description="One of EventType values")
    plant_id: str = Field(..., description="Plant id the event belongs to")
    deviation_id: str | None = Field(default=None, description="Related deviation id, if any")
    role_tag: str | None = Field(default=None, description="INVESTIGATOR / SKEPTIC / AUDITOR tag, if role-scoped")
    is_synthetic: bool = Field(default=True, description="Explicitly labelled synthetic data")
    payload: dict[str, Any] = Field(default_factory=dict, description="Event data in original form")
    evidence: list[EvidenceReference] = Field(default_factory=list, description="Source citations backing this event")
    created_at: datetime | None = Field(default=None)
    synced_at: datetime | None = Field(default=None, description="When the event was synced to Hindsight")
    sync_status: str = Field(default=SyncStatus.PENDING, description="PENDING / SYNCING / SYNCED / FAILED")


class DeviationEvent(MemoryEvent):
    """Event retained from a deviation record."""

    event_type: str = EventType.DEVIATION_RETAINED


class InvestigationEvent(MemoryEvent):
    """Event retained from an investigation record."""

    event_type: str = EventType.INVESTIGATION_RETAINED


class CAPAEvent(MemoryEvent):
    """Event retained from a CAPA record."""

    event_type: str = EventType.CAPA_RETAINED


class RecommendationEvent(MemoryEvent):
    """Event retained from a recommendation record."""

    event_type: str = EventType.RECOMMENDATION_RETAINED


class DecisionEvent(MemoryEvent):
    """Event retained from a review decision record."""

    event_type: str = EventType.DECISION_RETAINED


class EffectivenessEvent(MemoryEvent):
    """Event retained from an effectiveness check record."""

    event_type: str = EventType.EFFECTIVENESS_RETAINED
