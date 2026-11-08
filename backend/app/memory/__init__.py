"""Memory package: MemoryAdapter Protocol and Hindsight adapter implementation."""

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
from app.memory.hindsight_adapter import HindsightAdapter
from app.memory.hindsight_client import (
    HindsightAuthError,
    HindsightClient,
    HindsightConfigurationError,
    HindsightJSONParseError,
    HindsightNetworkError,
    HindsightRateLimitError,
    HindsightServerError,
    HindsightTimeoutError,
)
from app.memory.memory_interface import MemoryAdapter
from app.memory.sync import SyncEngine

__all__ = [
    "MemoryAdapter",
    "HindsightClient",
    "HindsightAdapter",
    "HindsightConfigurationError",
    "HindsightTimeoutError",
    "HindsightRateLimitError",
    "HindsightAuthError",
    "HindsightServerError",
    "HindsightNetworkError",
    "HindsightJSONParseError",
    "EventType",
    "RoleTag",
    "SyncStatus",
    "EvidenceReference",
    "MemoryEvent",
    "DeviationEvent",
    "InvestigationEvent",
    "CAPAEvent",
    "RecommendationEvent",
    "DecisionEvent",
    "EffectivenessEvent",
    "SyncEngine",
]
