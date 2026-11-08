"""Clearly labelled local demo memory. Replace with the teammate's real Hindsight adapter."""
from app.memory.memory_interface import MemoryAdapter

SAMPLE_CASES = [
    {"source_record_id":"SYN-DEV-003", "plant_id":"PLANT-001", "line":"Line 3", "equipment_code":"SEAL-02", "failure_mode":"seal integrity failure", "action_class":"operator retraining", "outcome":"RECURRENCE_OBSERVED", "monitoring_days":12, "summary":"Synthetic historical case: retraining was followed by recurrence after 12 days."},
    {"source_record_id":"SYN-DEV-007", "plant_id":"PLANT-001", "line":"Line 3", "equipment_code":"SEAL-02", "failure_mode":"seal integrity failure", "action_class":"operator retraining", "outcome":"RECURRENCE_OBSERVED", "monitoring_days":18, "summary":"Synthetic historical case: recurrence was observed after retraining."},
    {"source_record_id":"SYN-DEV-011", "plant_id":"PLANT-001", "line":"Line 3", "equipment_code":"SEAL-02", "failure_mode":"seal integrity failure", "action_class":"heater-band recalibration", "outcome":"VERIFIED_EFFECTIVE", "monitoring_days":420, "summary":"Synthetic historical case: no recurrence was observed during a 420-day monitoring window after recalibration."},
]

class MockMemoryAdapter:
    def recall(self, deviation: dict) -> list[dict]:
        # Normalize separators so values such as "seal_integrity_failure"
        # match human-readable historical descriptions such as "seal integrity failure".
        def normalize(value: str) -> set[str]:
            import re
            return set(re.sub(r"[_-]+", " ", str(value).lower()).split())

        terms = normalize(deviation.get("failure_mode", ""))
        matches = []
        for case in SAMPLE_CASES:
            if case["plant_id"] != deviation.get("plant_id"):
                continue
            overlap = len(terms.intersection(normalize(case["failure_mode"])))
            same_line = case["line"].lower() == deviation.get("line", "").lower()
            if overlap >= 1 and (same_line or overlap >= 2):
                matches.append(case.copy())
        return matches

    def retain(self, event: dict) -> dict:
        return {"status": "mock_retained", "source_record_id": event.get("source_record_id"), "notice": "Demo adapter only; not Hindsight."}

    def reflect(self, deviation: dict, evidence: list[dict]) -> dict:
        return {"evidence_count": len(evidence), "recurring_actions": [e["action_class"] for e in evidence if e["outcome"] == "RECURRENCE_OBSERVED"], "sustained_actions": [e["action_class"] for e in evidence if e["outcome"] == "VERIFIED_EFFECTIVE"]}
