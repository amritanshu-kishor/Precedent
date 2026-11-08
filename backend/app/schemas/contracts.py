from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, Field, ConfigDict

class DeviationCreate(BaseModel):
    plant_id: str
    line: str = Field(min_length=1, max_length=100)
    equipment_code: str = Field(min_length=1, max_length=100)
    failure_mode: str = Field(min_length=2, max_length=160)
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    description: str = Field(min_length=10)
    is_synthetic: bool = True

class DeviationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    plant_id: str
    line: str
    equipment_code: str
    failure_mode: str
    severity: str
    description: str
    status: str
    is_synthetic: bool
    created_at: datetime

class AgentFinding(BaseModel):
    role: Literal["INVESTIGATOR", "SKEPTIC", "AUDITOR"]
    findings: list[str] = []
    supporting_record_ids: list[str] = []
    unsupported_claims: list[str] = []
    missing_evidence: list[str] = []
    proposed_actions: list[str] = []

class RecommendationOut(BaseModel):
    recommendation_id: str
    deviation_id: str
    summary: str
    proposed_actions: list[str]
    historical_evidence: list[dict[str, Any]]
    uncertainty: list[str]
    investigator: dict
    skeptic: dict
    auditor: dict
    requires_human_approval: bool = True
    advisory_only: bool = True

class ReviewCreate(BaseModel):
    decision: Literal["approved", "rejected", "overridden"]
    rationale: str = Field(min_length=3)
    reviewer: str = "demo-reviewer"

class EffectivenessCreate(BaseModel):
    capa_id: str
    outcome: Literal["VERIFIED_EFFECTIVE", "RECURRENCE_OBSERVED", "INCONCLUSIVE", "NOT_ASSESSED"]
    monitoring_days: int = Field(ge=0)
    evidence: str | None = None
    reviewer: str = "demo-reviewer"
    recommendation_id: str | None = None

class InspectorOut(BaseModel):
    deviation_id: str
    questions: list[str]
    documentation_gaps: list[str]
    evidence_record_ids: list[str]
    advisory_only: bool = True


# --- Memory API schemas (Member 1 Hindsight layer) ---

class MemoryRetainRequest(BaseModel):
    source_record_id: str
    event_type: str
    plant_id: str
    deviation_id: str | None = None
    role_tag: str | None = None
    payload: dict[str, Any] = {}
    is_synthetic: bool = True


class MemoryRetainResponse(BaseModel):
    status: str
    source_record_id: str
    event_id: str
    synced: bool
    error: str | None = None
    hindsight_response: dict[str, Any] | None = None


class MemoryRecallResponse(BaseModel):
    deviation_id: str
    records: list[dict[str, Any]]
    adapter: str


class MemoryReflectRequest(BaseModel):
    plant_id: str
    deviation_id: str | None = None
    failure_mode: str | None = None
    role_tag: str | None = None


class MemoryReflectResponse(BaseModel):
    deviation_id: str | None
    plant_id: str
    similar_deviations: list[dict[str, Any]]
    verified_interventions: list[dict[str, Any]]
    failed_interventions: list[dict[str, Any]]
    evidence_references: list[dict[str, Any]]
    uncertainty: list[str]
    no_invented_precedents: bool
    role_tag: str | None = None


class MemoryGovernanceRequest(BaseModel):
    plant_id: str | None = None
    enabled: bool
    actor: str | None = None


class MemoryGovernanceResponse(BaseModel):
    id: str
    plant_id: str | None
    enabled: bool
    updated_at: str | None = None
    updated_by: str | None = None


class MemoryStatusResponse(BaseModel):
    deviation_id: str
    adapter: str
    status: str
    memory_enabled: bool
    note: str
