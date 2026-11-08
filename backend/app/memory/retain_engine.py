"""RETAIN engine: persistence, deduplication, idempotency, synchronization.

Retains memory events locally and syncs to Hindsight. On Hindsight failure,
events are preserved in the local store and queued in the outbox — never lost.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.memory.event_models import RoleTag
from app.memory.hindsight_client import (
    HindsightClient,
    HindsightAuthError,
    HindsightConfigurationError,
    HindsightNetworkError,
    HindsightTimeoutError,
)
from app.models.entities import MemoryEvent as MemoryEventORM, Outbox as OutboxORM

logger = logging.getLogger(__name__)


class DuplicateEventError(RuntimeError):
    """Raised when an event with the same source_record_id already exists."""


class RetainEngine:
    """RETAIN engine: persist memory events locally, sync to Hindsight.

    Idempotent: retaining the same source_record_id twice returns the existing record.
    On Hindsight failure, the event is written to the outbox for later recovery.
    If Hindsight is not configured, events are retained locally only (synced=False).
    """

    def __init__(self, db: Session | None = None, hindsight_client: HindsightClient | None = None) -> None:
        self._db_owned = db is None
        self.db = db or SessionLocal()
        self.hindsight = hindsight_client

    def __enter__(self) -> "RetainEngine":
        return self

    def __exit__(self, *args: object) -> None:
        if self._db_owned:
            self.db.close()

    def retain(self, event: dict[str, Any]) -> dict[str, Any]:
        """Retain a memory event.

        Steps:
        1. Validate required fields (source_record_id, event_type, plant_id)
        2. Idempotency check — return existing if source_record_id already retained
        3. Persist to local MemoryEvent table (sync_status=PENDING)
        4. Write to Hindsight (if client configured)
        5. On success: mark SYNCED
        6. On failure: mark FAILED, write to outbox
        """
        # Step 1: Validate required fields
        source_record_id = event.get("source_record_id")
        event_type = event.get("event_type")
        plant_id = event.get("plant_id")

        missing = [
            name for name, value in (
                ("source_record_id", source_record_id),
                ("event_type", event_type),
                ("plant_id", plant_id),
            ) if not value
        ]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        # Step 2: Idempotency check
        stmt = select(MemoryEventORM).where(MemoryEventORM.source_record_id == source_record_id)
        existing = self.db.scalars(stmt).first()
        if existing:
            logger.info("duplicate event source_record_id=%s already retained", source_record_id)
            return {
                "status": "already_retained",
                "source_record_id": source_record_id,
                "event_id": existing.id,
                "synced": existing.sync_status == "SYNCED",
            }

        # Step 3: Validate role_tag if present
        role_tag = event.get("role_tag")
        if role_tag and role_tag not in ("INVESTIGATOR", "SKEPTIC", "AUDITOR"):
            raise ValueError(f"Invalid role_tag: {role_tag}")

        # Step 4: Persist locally
        orm_event = MemoryEventORM(
            source_record_id=source_record_id,
            event_type=event_type,
            plant_id=plant_id,
            deviation_id=event.get("deviation_id"),
            role_tag=role_tag,
            is_synthetic=bool(event.get("is_synthetic", True)),
            payload=dict(event.get("payload", {})),
            sync_status="PENDING",
        )
        self.db.add(orm_event)
        self.db.commit()
        self.db.refresh(orm_event)

        # Step 5: Write to Hindsight
        hindsight_error: str | None = None
        synced = False
        hindsight_response: dict[str, Any] | None = None

        if self.hindsight is not None:
            try:
                hindsight_response = self.hindsight.write_event(event)
                synced = True
                orm_event.synced_at = datetime.now(timezone.utc)
                orm_event.sync_status = "SYNCED"
                self.db.commit()
                logger.info(
                    "event retained source_record_id=%s event_type=%s plant_id=%s synced=True",
                    source_record_id,
                    event_type,
                    plant_id,
                )
            except HindsightConfigurationError as exc:
                hindsight_error = str(exc)
                logger.warning("hindsight not configured: %s", exc)
            except (HindsightTimeoutError, HindsightNetworkError) as exc:
                hindsight_error = str(exc)
                logger.warning("hindsight write failed (transient): %s", exc)
            except Exception as exc:  # noqa: BLE001 — log and preserve locally
                hindsight_error = str(exc)
                logger.warning("hindsight write failed: %s", exc)

        if not synced:
            orm_event.sync_status = "FAILED"
            self.db.commit()

            outbox = OutboxORM(
                event_id=orm_event.id,
                status="FAILED",
                retry_count=0,
                last_error=hindsight_error or "Hindsight client not configured",
            )
            self.db.add(outbox)
            self.db.commit()

        return {
            "status": "retained" if synced else "retained_locally",
            "source_record_id": source_record_id,
            "event_id": orm_event.id,
            "synced": synced,
            "error": hindsight_error or ("Hindsight client not configured" if self.hindsight is None else None),
            "hindsight_response": hindsight_response,
        }
