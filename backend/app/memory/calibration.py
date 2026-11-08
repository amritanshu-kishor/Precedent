"""Self-Calibration engine: verified effectiveness rate, recurrence rate, performance by equipment/intervention class.

Computes reproducible calibration metrics from persisted EffectivenessCheck records.
All data is synthetic — predictive accuracy is not fabricated.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import SessionLocal
from app.models.entities import Capa, Deviation, EffectivenessCheck

logger = logging.getLogger(__name__)

ASSESSED_OUTCOMES = {"VERIFIED_EFFECTIVE", "RECURRENCE_OBSERVED"}


class CalibrationEngine:
    """Self-calibration engine: reproducible metrics from persisted records."""

    def __init__(self, db: Session | None = None) -> None:
        self._db_owned = db is None
        self.db = db or SessionLocal()

    def __enter__(self) -> "CalibrationEngine":
        return self

    def __exit__(self, *args: object) -> None:
        if self._db_owned:
            self.db.close()

    def compute_effectiveness_rate(self, plant_id: str | None = None) -> dict[str, Any]:
        """Compute verified effectiveness rate: VERIFIED_EFFECTIVE / total assessed."""
        stmt = select(EffectivenessCheck).where(
            EffectivenessCheck.outcome.in_(ASSESSED_OUTCOMES)
        )
        if plant_id:
            stmt = stmt.join(Capa).join(Deviation).where(Deviation.plant_id == plant_id)

        rows = self.db.scalars(stmt).all()
        total = len(rows)
        verified = sum(1 for r in rows if r.outcome == "VERIFIED_EFFECTIVE")
        recurrence = sum(1 for r in rows if r.outcome == "RECURRENCE_OBSERVED")

        rate = (verified / total * 100) if total > 0 else None

        return {
            "metric": "effectiveness_rate",
            "total_assessed": total,
            "verified_effective": verified,
            "recurrence_observed": recurrence,
            "effectiveness_percent": round(rate, 2) if rate is not None else None,
            "plant_id": plant_id,
            "is_synthetic": True,
        }

    def compute_recurrence_rate(self, plant_id: str | None = None) -> dict[str, Any]:
        """Compute recurrence rate: RECURRENCE_OBSERVED / total assessed."""
        result = self.compute_effectiveness_rate(plant_id)
        total = result["total_assessed"]
        recurrence = result["recurrence_observed"]
        rate = (recurrence / total * 100) if total > 0 else None
        return {
            "metric": "recurrence_rate",
            "total_assessed": total,
            "recurrence_observed": recurrence,
            "recurrence_percent": round(rate, 2) if rate is not None else None,
            "plant_id": plant_id,
            "is_synthetic": True,
        }

    def compute_by_equipment_class(self, plant_id: str | None = None) -> list[dict[str, Any]]:
        """Compute effectiveness metrics grouped by equipment_code."""
        stmt = (
            select(EffectivenessCheck, Deviation.equipment_code)
            .join(Capa, EffectivenessCheck.capa_id == Capa.id)
            .join(Deviation, Capa.deviation_id == Deviation.id)
            .where(EffectivenessCheck.outcome.in_(ASSESSED_OUTCOMES))
        )
        if plant_id:
            stmt = stmt.where(Deviation.plant_id == plant_id)

        rows = self.db.execute(stmt).all()
        grouped: dict[str, dict[str, Any]] = {}
        for check, equipment_code in rows:
            key = equipment_code or "unknown"
            if key not in grouped:
                grouped[key] = {"total": 0, "verified": 0, "recurrence": 0}
            grouped[key]["total"] += 1
            if check.outcome == "VERIFIED_EFFECTIVE":
                grouped[key]["verified"] += 1
            elif check.outcome == "RECURRENCE_OBSERVED":
                grouped[key]["recurrence"] += 1

        result = []
        for equipment_code, counts in sorted(grouped.items()):
            total = counts["total"]
            result.append({
                "equipment_code": equipment_code,
                "total_assessed": total,
                "verified_effective": counts["verified"],
                "recurrence_observed": counts["recurrence"],
                "effectiveness_percent": round(counts["verified"] / total * 100, 2) if total > 0 else None,
                "recurrence_percent": round(counts["recurrence"] / total * 100, 2) if total > 0 else None,
                "is_synthetic": True,
            })
        return result

    def compute_by_action_class(self, plant_id: str | None = None) -> list[dict[str, Any]]:
        """Compute effectiveness metrics grouped by CAPA action_class."""
        stmt = (
            select(EffectivenessCheck, Capa.action_class)
            .join(Capa, EffectivenessCheck.capa_id == Capa.id)
            .join(Deviation, Capa.deviation_id == Deviation.id)
            .where(EffectivenessCheck.outcome.in_(ASSESSED_OUTCOMES))
        )
        if plant_id:
            stmt = stmt.where(Deviation.plant_id == plant_id)

        rows = self.db.execute(stmt).all()
        grouped: dict[str, dict[str, Any]] = {}
        for check, action_class in rows:
            key = action_class or "unknown"
            if key not in grouped:
                grouped[key] = {"total": 0, "verified": 0, "recurrence": 0}
            grouped[key]["total"] += 1
            if check.outcome == "VERIFIED_EFFECTIVE":
                grouped[key]["verified"] += 1
            elif check.outcome == "RECURRENCE_OBSERVED":
                grouped[key]["recurrence"] += 1

        result = []
        for action_class, counts in sorted(grouped.items()):
            total = counts["total"]
            result.append({
                "action_class": action_class,
                "total_assessed": total,
                "verified_effective": counts["verified"],
                "recurrence_observed": counts["recurrence"],
                "effectiveness_percent": round(counts["verified"] / total * 100, 2) if total > 0 else None,
                "recurrence_percent": round(counts["recurrence"] / total * 100, 2) if total > 0 else None,
                "is_synthetic": True,
            })
        return result

    def compute_all(self, plant_id: str | None = None) -> dict[str, Any]:
        """Compute all calibration metrics."""
        return {
            "effectiveness_rate": self.compute_effectiveness_rate(plant_id),
            "recurrence_rate": self.compute_recurrence_rate(plant_id),
            "by_equipment_class": self.compute_by_equipment_class(plant_id),
            "by_action_class": self.compute_by_action_class(plant_id),
            "plant_id": plant_id,
            "is_synthetic": True,
            "note": "Predictive accuracy is not calculated until an explicit expected-vs-observed evaluation is recorded.",
        }
