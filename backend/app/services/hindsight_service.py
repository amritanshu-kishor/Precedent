"""High-level Hindsight service orchestrating retain/recall/reflect/calibration operations.

Provides a unified service layer over the memory engines (HindsightAdapter, CalibrationEngine,
SyncEngine) so callers don't need to wire them directly.
"""

from __future__ import annotations

from typing import Any

from app.core.database import SessionLocal
from app.memory.calibration import CalibrationEngine
from app.memory.hindsight_adapter import HindsightAdapter
from app.memory.sync import SyncEngine


class HindsightService:
    """High-level service orchestrating retain, recall, reflect, calibration, and sync."""

    def __init__(self, db=None) -> None:
        self._db_owned = db is None
        self.db = db or SessionLocal()
        self.adapter = HindsightAdapter(db=self.db)
        self.calibration = CalibrationEngine(db=self.db)
        self.sync = SyncEngine(db=self.db)

    def __enter__(self) -> "HindsightService":
        return self

    def __exit__(self, *args: object) -> None:
        if self._db_owned:
            self.db.close()

    # --- RETAIN ---

    def retain_event(self, event: dict[str, Any]) -> dict[str, Any]:
        """Retain a memory event, syncing to Hindsight if configured."""
        return self.adapter.retain(event)

    # --- RECALL ---

    def recall_events(self, deviation: dict[str, Any]) -> list[dict[str, Any]]:
        """Recall memory events matching the deviation context (filtered by plant_id)."""
        return self.adapter.recall(deviation)

    # --- REFLECT ---

    def reflect_deviation(
        self,
        deviation: dict[str, Any],
        evidence: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Produce a structured reflection on a deviation."""
        return self.adapter.reflect(deviation, evidence=evidence)

    # --- CALIBRATION ---

    def calibration_metrics(self, plant_id: str | None = None) -> dict[str, Any]:
        """Compute all calibration metrics (effectiveness, recurrence, by equipment/action class)."""
        return self.calibration.compute_all(plant_id=plant_id)

    # --- SYNC ---

    def reconcile_outbox(self) -> dict[str, Any]:
        """Process all pending/failed outbox entries, retrying sync to Hindsight."""
        return self.sync.reconcile_outbox()

    def outbox_status(self) -> dict[str, Any]:
        """Get current outbox status summary."""
        return self.sync.get_outbox_status()
