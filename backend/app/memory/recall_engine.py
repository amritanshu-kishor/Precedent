"""RECALL engine: retrieval of memory events filtered by plant_id and dimensions.

All queries are scoped by plant_id. Role-based tagging prevents cross-role leakage:
a caller with role_tag can only see events tagged with their own role or untagged events.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.memory.event_models import RoleTag
from app.models.entities import MemoryEvent as MemoryEventORM

logger = logging.getLogger(__name__)


class RecallEngine:
    """RECALL engine: retrieve memory events filtered by plant_id and dimensions."""

    def __init__(self, db: Session | None = None) -> None:
        self._db_owned = db is None
        self.db = db or SessionLocal()

    def __enter__(self) -> "RecallEngine":
        return self

    def __exit__(self, *args: object) -> None:
        if self._db_owned:
            self.db.close()

    def recall(self, deviation: dict[str, Any], role_tag: str | None = None) -> list[dict[str, Any]]:
        """Recall memory events matching the deviation's context.

        Always filtered by plant_id. If role_tag is provided, only events tagged
        with that role or untagged events are returned — no cross-role leakage.
        """
        plant_id = deviation.get("plant_id")
        if not plant_id:
            logger.warning("recall called without plant_id — returning empty result")
            return []

        return self.recall_by_dimension(
            plant_id=plant_id,
            deviation_id=deviation.get("deviation_id"),
            role_tag=role_tag,
        )

    def recall_by_dimension(
        self,
        plant_id: str,
        *,
        event_type: str | None = None,
        deviation_id: str | None = None,
        role_tag: str | None = None,
        sync_status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Recall events filtered by arbitrary dimensions.

        Role-based access: if role_tag is provided, only events tagged with that
        role or untagged events are returned.
        """
        if role_tag and role_tag not in ("INVESTIGATOR", "SKEPTIC", "AUDITOR"):
            raise ValueError(f"Invalid role_tag: {role_tag}")

        stmt = select(MemoryEventORM).where(MemoryEventORM.plant_id == plant_id)

        if event_type:
            stmt = stmt.where(MemoryEventORM.event_type == event_type)
        if deviation_id:
            stmt = stmt.where(MemoryEventORM.deviation_id == deviation_id)
        if role_tag:
            stmt = stmt.where(
                (MemoryEventORM.role_tag == role_tag) | (MemoryEventORM.role_tag.is_(None))
            )
        if sync_status:
            stmt = stmt.where(MemoryEventORM.sync_status == sync_status)

        stmt = stmt.order_by(MemoryEventORM.created_at.desc()).limit(limit).offset(offset)

        events = self.db.scalars(stmt).all()
        logger.info(
            "recall plant_id=%s role_tag=%s event_type=%s deviation_id=%s count=%d",
            plant_id,
            role_tag,
            event_type,
            deviation_id,
            len(events),
        )
        return [self._orm_to_dict(e) for e in events]

    def recall_by_source_record_id(self, source_record_id: str) -> dict[str, Any] | None:
        """Recall a single event by its source_record_id."""
        stmt = select(MemoryEventORM).where(MemoryEventORM.source_record_id == source_record_id)
        event = self.db.scalars(stmt).first()
        if event is None:
            return None
        return self._orm_to_dict(event)

    @staticmethod
    def _orm_to_dict(event: MemoryEventORM) -> dict[str, Any]:
        return {
            "id": event.id,
            "source_record_id": event.source_record_id,
            "event_type": event.event_type,
            "plant_id": event.plant_id,
            "deviation_id": event.deviation_id,
            "role_tag": event.role_tag,
            "is_synthetic": event.is_synthetic,
            "payload": event.payload,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "synced_at": event.synced_at.isoformat() if event.synced_at else None,
            "sync_status": event.sync_status,
        }
