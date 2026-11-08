"""HindsightAdapter: implements MemoryAdapter Protocol using Hindsight engines.

Delegates retain/recall/reflect to RetainEngine, RecallEngine, ReflectEngine.
Falls back to local-only mode when Hindsight is not configured.
Member 2 and Member 3 integrate through this adapter — no Hindsight SDK internals exposed.
"""

from __future__ import annotations

from typing import Any

from app.memory.memory_interface import MemoryAdapter
from app.memory.recall_engine import RecallEngine
from app.memory.reflect_engine import ReflectEngine
from app.memory.retain_engine import RetainEngine


class HindsightAdapter(MemoryAdapter):
    """Hindsight adapter implementing the MemoryAdapter Protocol.

    Wraps RetainEngine, RecallEngine, and ReflectEngine. When a HindsightClient
    is provided, retain operations sync to Hindsight; otherwise events are
    retained locally only.
    """

    def __init__(self, db=None, hindsight_client=None) -> None:
        self._retain = RetainEngine(db=db, hindsight_client=hindsight_client)
        self._recall = RecallEngine(db=db)
        self._reflect = ReflectEngine(db=db)

    def recall(self, deviation: dict[str, Any]) -> list[dict[str, Any]]:
        """Recall memory events matching the deviation's context (filtered by plant_id)."""
        return self._recall.recall(deviation)

    def retain(self, event: dict[str, Any]) -> dict[str, Any]:
        """Retain a memory event, syncing to Hindsight if configured."""
        return self._retain.retain(event)

    def reflect(
        self,
        deviation: dict[str, Any],
        evidence: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Produce a structured reflection on a deviation.

        The evidence parameter is accepted per the MemoryAdapter Protocol but
        the ReflectEngine gathers evidence from recall internally.
        """
        return self._reflect.reflect(deviation)
