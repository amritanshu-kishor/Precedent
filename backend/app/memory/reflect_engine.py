"""REFLECT engine: structured analytical responses with historical context.

Produces evidence-grounded reflections: similar past deviations, verified and
failed interventions, evidence references, and uncertainty. No invented precedents
— every claim is backed by an existing source record.
"""

from __future__ import annotations

import logging
from typing import Any

from app.memory.evidence_resolution import EvidenceResolution
from app.memory.recall_engine import RecallEngine

logger = logging.getLogger(__name__)


class ReflectEngine:
    """REFLECT engine: structured analytical reflection on a deviation."""

    def __init__(self, db=None) -> None:
        self.recall = RecallEngine(db)
        self.evidence = EvidenceResolution(db)

    def reflect(
        self,
        deviation: dict[str, Any],
        role_tag: str | None = None,
    ) -> dict[str, Any]:
        """Produce a structured reflection for a deviation.

        Returns:
          - deviation_id: the deviation being reflected on
          - plant_id: plant context
          - similar_deviations: list of past similar events with source_record_id
          - verified_interventions: actions with VERIFIED_EFFECTIVE outcome
          - failed_interventions: actions with RECURRENCE_OBSERVED outcome
          - evidence_references: list of source citations
          - uncertainty: list of unsupported claims or gaps
          - no_invented_precedents: True (all claims backed by source records)
        """
        plant_id = deviation.get("plant_id")
        if not plant_id:
            return {
                "deviation_id": deviation.get("deviation_id"),
                "plant_id": None,
                "error": "plant_id required for reflection",
                "no_invented_precedents": True,
            }

        deviation_id = deviation.get("deviation_id")
        failure_mode = deviation.get("failure_mode", "")

        # Recall all historical events for this plant (not filtered by deviation_id)
        history = self.recall.recall(
            {"plant_id": plant_id},
            role_tag=role_tag,
        )

        # Find similar deviations (same failure mode, same plant)
        similar = []
        for e in history:
            payload = e.get("payload", {})
            if not isinstance(payload, dict):
                continue
            fm = payload.get("failure_mode", "")
            if e.get("event_type") == "DEVIATION_RETAINED" and e.get("source_record_id") != deviation_id and failure_mode.lower() in fm.lower():
                similar.append(e)

        # Separate verified and failed interventions
        verified = []
        failed = []
        for e in history:
            payload = e.get("payload", {})
            outcome = payload.get("outcome")
            action = payload.get("action_class")
            if outcome == "VERIFIED_EFFECTIVE" and action:
                verified.append({
                    "action_class": action,
                    "source_record_id": e["source_record_id"],
                    "monitoring_days": payload.get("monitoring_days", 0),
                })
            elif outcome == "RECURRENCE_OBSERVED" and action:
                failed.append({
                    "action_class": action,
                    "source_record_id": e["source_record_id"],
                    "monitoring_days": payload.get("monitoring_days", 0),
                })

        # Build evidence references
        evidence_refs = []
        for e in history:
            evidence_refs.append({
                "source_record_id": e["source_record_id"],
                "event_type": e["event_type"],
                "plant_id": e["plant_id"],
                "relevance": "historical",
            })

        # Resolve evidence citations for validation
        citation_result = self.evidence.map_claims_to_sources(
            claims=[failure_mode] if failure_mode else [],
            evidence=history,
            plant_id=plant_id,
        )

        # Uncertainty: unresolved claims and contradictions
        uncertainty = list(citation_result["unresolved"])
        for c in citation_result["contradictions"]:
            uncertainty.append(
                f"Contradiction on '{c['claim']}': sources report {c['outcomes']}"
            )

        if not history:
            uncertainty.append("No historical memory found for this plant")

        logger.info(
            "reflect deviation_id=%s plant_id=%s similar=%d verified=%d failed=%d uncertainty=%d",
            deviation_id,
            plant_id,
            len(similar),
            len(verified),
            len(failed),
            len(uncertainty),
        )

        return {
            "deviation_id": deviation_id,
            "plant_id": plant_id,
            "similar_deviations": similar,
            "verified_interventions": verified,
            "failed_interventions": failed,
            "evidence_references": evidence_refs,
            "uncertainty": uncertainty,
            "no_invented_precedents": True,
            "role_tag": role_tag,
        }
