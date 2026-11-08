from app.schemas.contracts import AgentFinding

class SkepticAgent:
    def __init__(self, llm): self.llm = llm
    def run(self, deviation: dict, evidence: list[dict], investigator: AgentFinding) -> AgentFinding:
        failed = [e for e in evidence if e.get("outcome") == "RECURRENCE_OBSERVED"]
        return AgentFinding(role="SKEPTIC", findings=[f"Historical recurrence exists after: {', '.join(sorted(set(e['action_class'] for e in failed)))}." ] if failed else ["No documented failed intervention was found in the supplied evidence."], supporting_record_ids=[e["source_record_id"] for e in failed], unsupported_claims=["Do not infer root cause from similarity alone.", "A no-recurrence observation does not prove the intervention caused the outcome."], missing_evidence=["Confirm comparable operating conditions and monitoring duration."], proposed_actions=["Require objective evidence before accepting a causal conclusion."])
