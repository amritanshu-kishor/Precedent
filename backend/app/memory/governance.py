"""Memory Governance: ON/OFF controller, enforcement at backend, audit history.

Memory ON/OFF must be enforced at the backend — memory-disabled requests
cannot access historical context. All toggle decisions are audit logged.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.entities import AuditEvent, MemorySetting

logger = logging.getLogger(__name__)


class MemoryGovernance:
    """Controls memory ON/OFF state and enforces it at the backend."""

    def __init__(self, db: Session | None = None) -> None:
        self._db_owned = db is None
        self.db = db or SessionLocal()

    def __enter__(self) -> "MemoryGovernance":
        return self

    def __exit__(self, *args: object) -> None:
        if self._db_owned:
            self.db.close()

    def is_enabled(self, plant_id: str | None = None) -> bool:
        """Check if memory is enabled for a plant.

        Checks plant-specific setting first, then global setting.
        Defaults to enabled if no setting exists.
        """
        if plant_id:
            stmt = select(MemorySetting).where(MemorySetting.plant_id == plant_id)
            setting = self.db.scalars(stmt).first()
            if setting is not None:
                return setting.enabled

        stmt = select(MemorySetting).where(MemorySetting.plant_id.is_(None))
        setting = self.db.scalars(stmt).first()
        if setting is not None:
            return setting.enabled

        return True  # Default: memory enabled

    def set_enabled(
        self,
        plant_id: str | None,
        enabled: bool,
        actor: str | None = None,
    ) -> dict[str, Any]:
        """Set memory ON/OFF for a plant (or globally if plant_id is None).

        Audit logs the change. Returns the setting record.
        """
        stmt = select(MemorySetting).where(MemorySetting.plant_id == plant_id)
        setting = self.db.scalars(stmt).first()
        if setting is None:
            setting = MemorySetting(plant_id=plant_id, enabled=enabled, updated_by=actor)
            self.db.add(setting)
        else:
            setting.enabled = enabled
            setting.updated_by = actor
        self.db.commit()
        self.db.refresh(setting)

        # Audit log
        self.db.add(AuditEvent(
            event_type="MEMORY_TOGGLED",
            entity_id=setting.id,
            details={
                "plant_id": plant_id,
                "enabled": enabled,
                "actor": actor or "system",
            },
        ))
        self.db.commit()

        logger.info(
            "memory governance plant_id=%s enabled=%s actor=%s",
            plant_id,
            enabled,
            actor,
        )
        return {
            "id": setting.id,
            "plant_id": setting.plant_id,
            "enabled": setting.enabled,
            "updated_at": setting.updated_at.isoformat() if setting.updated_at else None,
            "updated_by": setting.updated_by,
        }

    def enforce(self, plant_id: str | None) -> None:
        """Raise if memory is disabled for the given plant.

        Call this at the start of any recall/reflect operation to enforce
        that memory-disabled requests cannot access historical context.
        """
        if not self.is_enabled(plant_id):
            logger.warning("memory access blocked: plant_id=%s memory disabled", plant_id)
            raise PermissionError(f"Memory is disabled for plant_id={plant_id}")


def require_memory_enabled(plant_id: str | None, db: Session | None = None) -> None:
    """Convenience: enforce memory enabled for a plant. Raises PermissionError if disabled."""
    with MemoryGovernance(db) as gov:
        gov.enforce(plant_id)
