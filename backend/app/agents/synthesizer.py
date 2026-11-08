from app.schemas.contracts import AgentFinding

class SynthesizerAgent:
    def __init__(self, llm): self.llm = llm
    def run(self, deviation: dict, evidence: list[dict], investigator: AgentFinding, skeptic: AgentFinding, auditor: AgentFinding) -> dict:
        failed = [e for e in evidence if e.get("outcome") == "RECURRENCE_OBSERVED"]
        held = [e for e in evidence if e.get("outcome") == "VERIFIED_EFFECTIVE"]
        actions = []
        for e in held:
            actions.append({"action_class": e["action_class"], "historical_status": "associated_with_no_recurrence_in_recorded_monitoring", "supporting_record_ids": [e["source_record_id"]], "monitoring_days": e.get("monitoring_days")})
        for e in failed:
            actions.append({"action_class": e["action_class"], "historical_status": "recurrence_observed", "supporting_record_ids": [e["source_record_id"]], "monitoring_days": e.get("monitoring_days")})
        summary = "Relevant historical records were found. Review prior outcomes and verify comparability before selecting an action." if evidence else "No relevant precedent was found. Conduct and document a fresh investigation; no historical recommendation can be made."
        return {"summary": summary, "proposed_actions": actions or [{"action_class": "documented investigation", "historical_status": "no_precedent", "supporting_record_ids": []}], "historical_evidence": evidence, "uncertainty": ["Historical similarity does not establish causation.", "A qualified reviewer must assess applicability and approve any action."], "investigator": investigator.model_dump(), "skeptic": skeptic.model_dump(), "auditor": auditor.model_dump(), "requires_human_approval": True, "advisory_only": True}
