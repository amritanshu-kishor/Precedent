"""Evidence Resolution: citation resolution, source validation, claim-to-source mapping, contradiction detection.

Every evidence-backed statement must map to an existing source record. Contradictions
between sources are detected and flagged — never silently resolved.
"""

from __future__ import annotations

import logging
from typing import Any

from app.memory.recall_engine import RecallEngine

logger = logging.getLogger(__name__)


class SourceNotFoundError(RuntimeError):
    """Raised when a referenced source record cannot be found."""


class ContradictionError(RuntimeError):
    """Raised when two evidence records contradict each other on the same claim."""


class EvidenceResolution:
    """Resolves evidence references to source records and detects contradictions."""

    def __init__(self, db=None) -> None:
        self.recall = RecallEngine(db)

    def resolve_citation(
        self,
        source_record_id: str,
        plant_id: str,
    ) -> dict[str, Any] | None:
        """Validate that a source record exists and return it.

        Returns None if the source record does not exist (caller decides how to handle).
        """
        event = self.recall.recall_by_source_record_id(source_record_id)
        if event is None:
            logger.warning(
                "source record not found source_record_id=%s plant_id=%s",
                source_record_id,
                plant_id,
            )
            return None
        if event["plant_id"] != plant_id:
            logger.warning(
                "source record plant mismatch source_record_id=%s event_plant=%s request_plant=%s",
                source_record_id,
                event["plant_id"],
                plant_id,
            )
            return None
        return event

    def map_claims_to_sources(
        self,
        claims: list[str],
        evidence: list[dict[str, Any]],
        plant_id: str,
    ) -> dict[str, Any]:
        """Map each claim to its supporting source records.

        Returns a dict with:
          - resolved: list of {claim, sources: [source_record_id, ...]}
          - unresolved: list of claims with no supporting source
          - contradictions: list of {claim, sources: [...]} where sources disagree
        """
        resolved: list[dict[str, Any]] = []
        unresolved: list[str] = []
        contradictions: list[dict[str, Any]] = []

        for claim in claims:
            supporting = [
                e for e in evidence
                if claim.lower() in str(e.get("payload", {})).lower()
                or claim.lower() in str(e.get("source_record_id", "")).lower()
            ]

            if not supporting:
                unresolved.append(claim)
                continue

            source_ids = [e["source_record_id"] for e in supporting]

            # Check for contradictions: same claim, different outcomes
            outcomes = {e["payload"].get("outcome") for e in supporting if e.get("payload", {}).get("outcome")}
            if len(outcomes) > 1:
                contradictions.append({
                    "claim": claim,
                    "sources": source_ids,
                    "outcomes": sorted(outcomes),
                })

            # Validate each source exists
            valid_sources = []
            for sid in source_ids:
                source = self.resolve_citation(sid, plant_id)
                if source is not None:
                    valid_sources.append(sid)

            resolved.append({
                "claim": claim,
                "sources": valid_sources,
            })

        return {
            "resolved": resolved,
            "unresolved": unresolved,
            "contradictions": contradictions,
        }

    def detect_contradictions(
        self,
        evidence: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Detect contradictions among evidence records.

        A contradiction exists when two records reference the same deviation/action
        but report different outcomes.
        """
        contradictions: list[dict[str, Any]] = {}
        for record in evidence:
            deviation_id = record.get("deviation_id") or record.get("payload", {}).get("deviation_id")
            action_class = record.get("payload", {}).get("action_class")
            outcome = record.get("payload", {}).get("outcome")
            if not deviation_id or not action_class or not outcome:
                continue
            key = (deviation_id, action_class)
            if key not in contradictions:
                contradictions[key] = {"outcomes": set(), "sources": []}
            contradictions[key]["outcomes"].add(outcome)
            contradictions[key]["sources"].append(record["source_record_id"])

        result = []
        for (deviation_id, action_class), data in contradictions.items():
            if len(data["outcomes"]) > 1:
                result.append({
                    "deviation_id": deviation_id,
                    "action_class": action_class,
                    "outcomes": sorted(data["outcomes"]),
                    "sources": data["sources"],
                })
        return result
