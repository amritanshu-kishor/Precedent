from app.agents.investigator import InvestigatorAgent
from app.agents.skeptic import SkepticAgent
from app.agents.auditor import AuditorAgent
from app.agents.synthesizer import SynthesizerAgent
from app.services.llm_service import LLMService

class AgentOrchestrator:
    def __init__(self, memory):
        self.memory = memory
        self.llm = LLMService()

    def investigate(self, deviation: dict, memory_enabled: bool = True) -> dict:
        evidence = self.memory.recall(deviation) if memory_enabled else []
        # Validate plant scope even when the adapter is replaced by real Hindsight.
        evidence = [e for e in evidence if e.get("plant_id") == deviation.get("plant_id")]
        investigator = InvestigatorAgent(self.llm).run(deviation, evidence)
        skeptic = SkepticAgent(self.llm).run(deviation, evidence, investigator)
        auditor = AuditorAgent(self.llm).run(deviation, evidence)
        result = SynthesizerAgent(self.llm).run(deviation, evidence, investigator, skeptic, auditor)
        result["model_name"] = self.llm.client and "groq:" or "deterministic-fallback"
        result["memory_enabled"] = memory_enabled
        result["memory_adapter"] = "mock" if self.memory.__class__.__name__ == "MockMemoryAdapter" else "external"
        return result
