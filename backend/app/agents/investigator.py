from app.schemas.contracts import AgentFinding

class InvestigatorAgent:
    def __init__(self, llm): self.llm = llm
    def run(self, deviation: dict, evidence: list[dict]) -> AgentFinding:
        if self.llm.available:
            data = self.llm.complete_json("You are the PRECEDENT Investigator. Use only supplied evidence. Separate hypotheses from verified facts. Return JSON with findings, supporting_record_ids, unsupported_claims, missing_evidence, proposed_actions.", {"deviation": deviation, "evidence": evidence})
            if "findings" in data:
                data["findings"] = [f if isinstance(f, str) else str(f) for f in data["findings"]]
                return AgentFinding(role="INVESTIGATOR", **data)
        actions = list(dict.fromkeys([e["action_class"] for e in evidence]))
        return AgentFinding(role="INVESTIGATOR", findings=["Assess the reported failure mode and inspect relevant process/equipment records.", "Historical evidence is available for comparison." if evidence else "No relevant historical precedent was found."], supporting_record_ids=[e["source_record_id"] for e in evidence], missing_evidence=["Confirm inspection findings and objective measurements.", "Verify equipment maintenance and calibration records."], proposed_actions=actions or ["Perform documented investigation before selecting a CAPA."])
