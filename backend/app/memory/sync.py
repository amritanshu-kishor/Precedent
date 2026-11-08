"""Synchronization and recovery: outbox pattern, retry-safe processing, reconciliation, duplicate detection.

Hindsight outage does not destroy events — failed sync recovers safely via the outbox.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.memory.hindsight_client import (
    HindsightAuthError,
    HindsightClient,
    HindsightConfigurationError,
    HindsightNetworkError,
    HindsightTimeoutError,
)
from app.models.entities import MemoryEvent as MemoryEventORM, Outbox as OutboxORM

logger = logging.getLogger(__name__)

RETRYABLE_SYNC_ERRORS = (HindsightTimeoutError, HindsightNetworkError)
MAX_RETRY_COUNT = 5


class SyncEngine:
    """Sync engine: processes outbox, reconciles with Hindsight, prevents duplicate syncs."""

    def __init__(self, db: Session | None = None, hindsight_client: HindsightClient | None = None) -> None:
        self._db_owned = db is None
        self.db = db or SessionLocal()
        self.hindsight = hindsight_client

    def __enter__(self) -> "SyncEngine":
        return self

    def __exit__(self, *args: object) -> None:
        if self._db_owned:
            self.db.close()

    def reconcile_outbox(self) -> dict[str, Any]:
        """Process all pending/failed outbox entries, retrying sync to Hindsight.

        Duplicate detection: events already marked SYNCED are skipped.
        Auth errors are not retried. Transient errors increment retry count.
        """
        if self.hindsight is None:
            logger.warning("sync skipped: no Hindsight client configured")
            return {"processed": 0, "synced": 0, "failed": 0, "remaining": 0, "error": "No Hindsight client configured"}

        stmt = (
            select(OutboxORM)
            .where(OutboxORM.status.in_(("PENDING", "FAILED")))
            .order_by(OutboxORM.created_at.asc())
        )
        entries = self.db.scalars(stmt).all()

        processed = 0
        synced = 0
        failed = 0

        for entry in entries:
            processed += 1

            # Fetch the associated event
            event_stmt = select(MemoryEventORM).where(MemoryEventORM.id == entry.event_id)
            event = self.db.scalars(event_stmt).first()
            if event is None:
                entry.status = "FAILED"
                entry.last_error = "Event not found"
                self.db.commit()
                failed += 1
                continue

            # Duplicate detection: skip if already synced
            if event.sync_status == "SYNCED":
                entry.status = "SYNCED"
                self.db.commit()
                continue

            # Max retry check
            if entry.retry_count >= MAX_RETRY_COUNT:
                entry.status = "FAILED"
                entry.last_error = f"Max retries ({MAX_RETRY_COUNT}) exceeded"
                self.db.commit()
                failed += 1
                continue

            # Build event dict for Hindsight
            event_dict = {
                "source_record_id": event.source_record_id,
                "event_type": event.event_type,
                "plant_id": event.plant_id,
                "deviation_id": event.deviation_id,
                "role_tag": event.role_tag,
                "payload": event.payload,
                "is_synthetic": event.is_synthetic,
            }

            try:
                self.hindsight.write_event(event_dict)
                event.sync_status = "SYNCED"
                event.synced_at = datetime.now(timezone.utc)
                entry.status = "SYNCED"
                entry.retry_count = 0
                entry.last_error = None
                self.db.commit()
                synced += 1
                logger.info("outbox synced event_id=%s source_record_id=%s", event.id, event.source_record_id)
            except HindsightAuthError:
                entry.status = "FAILED"
                entry.retry_count += 1
                entry.last_error = "Auth error — will not retry"
                self.db.commit()
                failed += 1
                logger.warning("outbox auth error event_id=%s", event.id)
            except RETRYABLE_SYNC_ERRORS as exc:
                entry.status = "FAILED"
                entry.retry_count += 1
                entry.last_error = str(exc)
                self.db.commit()
                failed += 1
                logger.warning("outbox sync failed (retryable) event_id=%s error=%s", event.id, exc)
            except HindsightConfigurationError as exc:
                entry.status = "FAILED"
                entry.retry_count += 1
                entry.last_error = str(exc)
                self.db.commit()
                failed += 1
                logger.warning("outbox config error event_id=%s error=%s", event.id, exc)
            except Exception as exc:  # noqa: BLE001 — log and continue
                entry.status = "FAILED"
                entry.retry_count += 1
                entry.last_error = str(exc)
                self.db.commit()
                failed += 1
                logger.warning("outbox sync failed event_id=%s error=%s", event.id, exc)

        remaining = len(entries) - processed
        return {
            "processed": processed,
            "synced": synced,
            "failed": failed,
            "remaining": remaining,
        }

    def get_outbox_status(self) -> dict[str, Any]:
        """Get current outbox status summary."""
        stmt = select(OutboxORM)
        entries = self.db.scalars(stmt).all()
        return {
            "total": len(entries),
            "pending": sum(1 for e in entries if e.status == "PENDING"),
            "syncing": sum(1 for e in entries if e.status == "SYNCING"),
            "synced": sum(1 for e in entries if e.status == "SYNCED"),
            "failed": sum(1 for e in entries if e.status == "FAILED"),
        }
