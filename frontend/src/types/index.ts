// Data types corresponding to backend FastAPI schemas

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type DeviationStatus = 'open' | 'investigating' | 'reviewed' | 'closed';

export interface Deviation {
  id: string;
  plant_id: string;
  line: string;
  equipment_code: string;
  failure_mode: string;
  severity: Severity;
  description: string;
  status: string;
  is_synthetic: boolean;
  created_at: string;
}

export interface DeviationCreate {
  plant_id: string;
  line: string;
  equipment_code: string;
  failure_mode: string;
  severity: Severity;
  description: string;
  is_synthetic: boolean;
}

export interface AgentFinding {
  role: 'INVESTIGATOR' | 'SKEPTIC' | 'AUDITOR';
  findings: string[];
  supporting_record_ids: string[];
  unsupported_claims: string[];
  missing_evidence: string[];
  proposed_actions: string[];
}

export interface ProposedActionItem {
  action_class: string;
  historical_status?: string;
  supporting_record_ids?: string[];
  monitoring_days?: number;
}

export interface HistoricalEvidenceRecord {
  source_record_id: string;
  plant_id?: string;
  deviation_id?: string;
  action_class: string;
  outcome: 'VERIFIED_EFFECTIVE' | 'RECURRENCE_OBSERVED' | 'INCONCLUSIVE' | 'NOT_ASSESSED';
  monitoring_days?: number;
  equipment_code?: string;
  failure_mode?: string;
  notes?: string;
}

export interface RecommendationOut {
  recommendation_id: string;
  deviation_id: string;
  summary: string;
  proposed_actions: (ProposedActionItem | string)[];
  historical_evidence: HistoricalEvidenceRecord[];
  uncertainty: string[];
  investigator: AgentFinding;
  skeptic: AgentFinding;
  auditor: AgentFinding;
  requires_human_approval: boolean;
  advisory_only: boolean;
  model_name?: string;
  memory_enabled?: boolean;
  memory_adapter?: string;
  review_status?: 'pending' | 'approved' | 'rejected' | 'overridden';
}

export interface ReviewCreate {
  decision: 'approved' | 'rejected' | 'overridden';
  rationale: string;
  reviewer: string;
}

export interface ReviewDecisionResponse {
  status: string;
  recommendation_id: string;
  decision: string;
  ai_recommendation_preserved: boolean;
}

export interface Capa {
  id: string;
  deviation_id: string;
  action_class: string;
  description: string;
  status: 'proposed' | 'implemented' | 'assessed';
  owner?: string;
  created_at?: string;
}

export interface EffectivenessCreate {
  capa_id: string;
  outcome: 'VERIFIED_EFFECTIVE' | 'RECURRENCE_OBSERVED' | 'INCONCLUSIVE' | 'NOT_ASSESSED';
  monitoring_days: number;
  evidence?: string;
  reviewer: string;
  recommendation_id?: string;
}

export interface EffectivenessQueueItem {
  id: string;
  capa_id: string;
  outcome: 'VERIFIED_EFFECTIVE' | 'RECURRENCE_OBSERVED' | 'INCONCLUSIVE' | 'NOT_ASSESSED';
  monitoring_days: number;
}

export interface InspectorOut {
  deviation_id: string;
  questions: string[];
  documentation_gaps: string[];
  evidence_record_ids: string[];
  advisory_only: boolean;
  synthetic_data: boolean;
}

export interface MemoryStatus {
  deviation_id: string;
  adapter: string;
  status: string;
  memory_enabled: boolean;
  note: string;
}

export interface MemoryGovernanceResponse {
  id: string;
  plant_id: string | null;
  enabled: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

export interface MemorySyncStatus {
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
}

export interface CalibrationEquipmentClass {
  equipment_code: string;
  total_assessed: number;
  verified_effective: number;
  recurrence_observed: number;
  effectiveness_percent: number | null;
  recurrence_percent: number | null;
  is_synthetic: boolean;
}

export interface CalibrationActionClass {
  action_class: string;
  total_assessed: number;
  verified_effective: number;
  recurrence_observed: number;
  effectiveness_percent: number | null;
  recurrence_percent: number | null;
  is_synthetic: boolean;
}

export interface CalibrationMetrics {
  effectiveness_rate: {
    metric: string;
    total_assessed: number;
    verified_effective: number;
    recurrence_observed: number;
    effectiveness_percent: number | null;
    plant_id: string | null;
    is_synthetic: boolean;
  };
  recurrence_rate: {
    metric: string;
    total_assessed: number;
    recurrence_observed: number;
    recurrence_percent: number | null;
    plant_id: string | null;
    is_synthetic: boolean;
  };
  by_equipment_class: CalibrationEquipmentClass[];
  by_action_class: CalibrationActionClass[];
  plant_id: string | null;
  is_synthetic: boolean;
  note: string;
}

