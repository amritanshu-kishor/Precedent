from app.schemas.contracts import AgentFinding

class AuditorAgent:
    def __init__(self, llm): self.llm = llm
    def run(self, deviation: dict, evidence: list[dict]) -> AgentFinding:
        gaps = ["Document immediate containment and product/batch impact assessment.", "Attach objective inspection or test results.", "Define an effectiveness monitoring period and acceptance criteria."]
        if not evidence: gaps.append("No historical precedent was available; document the investigation basis independently.")
        return AgentFinding(role="AUDITOR", findings=["Review the investigation for traceability and completeness before QA approval."], supporting_record_ids=[e["source_record_id"] for e in evidence], missing_evidence=gaps, proposed_actions=["Verify each conclusion is linked to an original record."])
