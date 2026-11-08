import { 
  Deviation, 
  RecommendationOut, 
  Capa, 
  EffectivenessQueueItem, 
  CalibrationMetrics, 
  MemoryStatus, 
  MemoryGovernanceResponse, 
  MemorySyncStatus,
  InspectorOut,
  HistoricalEvidenceRecord
} from '../types';

export const INITIAL_DEVIATIONS: Deviation[] = [
  {
    id: "dev-seal-001",
    plant_id: "demo-plant",
    line: "Line 3",
    equipment_code: "SEAL-02",
    failure_mode: "seal integrity failure",
    severity: "critical",
    description: "Synthetic historical demonstration deviation: seal integrity test failed during routine inspection. Visual micro-crack detected along elastomer ring.",
    status: "investigating",
    is_synthetic: true,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "dev-fill-002",
    plant_id: "demo-plant",
    line: "Line 1",
    equipment_code: "FILL-04",
    failure_mode: "fill volume variance",
    severity: "high",
    description: "Sterile vial fill volume deviation +8.4% above upper specification limit during batch B24-889 vial run.",
    status: "reviewed",
    is_synthetic: true,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "dev-pump-003",
    plant_id: "demo-plant",
    line: "Line 2",
    equipment_code: "PUMP-01",
    failure_mode: "impeller cavitation",
    severity: "medium",
    description: "Abnormal acoustic emission and vibration amplitude 4.2 mm/s detected on Water For Injection (WFI) loop circulation pump.",
    status: "open",
    is_synthetic: true,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: "dev-lyo-004",
    plant_id: "demo-plant",
    line: "Line 4",
    equipment_code: "LYO-02",
    failure_mode: "shelf temperature drift",
    severity: "critical",
    description: "Primary drying cycle shelf temperature rose +3.2°C above setpoint for 24 minutes during lyophilization cycle LY-992.",
    status: "open",
    is_synthetic: true,
    created_at: new Date(Date.now() - 3600000 * 52).toISOString(),
  },
  {
    id: "dev-hvac-005",
    plant_id: "demo-plant",
    line: "Line 1",
    equipment_code: "HVAC-01",
    failure_mode: "differential pressure loss",
    severity: "low",
    description: "Cleanroom Grade B airlock differential pressure dipped to 11.2 Pa (limit >=12.5 Pa) for 4 minutes during filter maintenance.",
    status: "closed",
    is_synthetic: true,
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
  }
];

export const HISTORICAL_PRECEDENTS_DATABASE: HistoricalEvidenceRecord[] = [
  {
    source_record_id: "HIN-REC-2023-089",
    plant_id: "demo-plant",
    deviation_id: "dev-seal-001",
    action_class: "gasket replacement with EPDM fluoropolymer",
    outcome: "VERIFIED_EFFECTIVE",
    monitoring_days: 180,
    equipment_code: "SEAL-02",
    failure_mode: "seal integrity failure",
    notes: "Upgraded elastomer compound withstood SIP thermal cycling without degradation across 6 months."
  },
  {
    source_record_id: "HIN-REC-2022-041",
    plant_id: "demo-plant",
    deviation_id: "dev-seal-001",
    action_class: "operator retraining",
    outcome: "RECURRENCE_OBSERVED",
    monitoring_days: 12,
    equipment_code: "SEAL-02",
    failure_mode: "seal integrity failure",
    notes: "Retraining procedure failed to address underlying seal groove mechanical wear; leak recurred after 12 days."
  },
  {
    source_record_id: "HIN-REC-2023-112",
    plant_id: "demo-plant",
    deviation_id: "dev-fill-002",
    action_class: "peristaltic pump tubing calibration & monthly changeout",
    outcome: "VERIFIED_EFFECTIVE",
    monitoring_days: 90,
    equipment_code: "FILL-04",
    failure_mode: "fill volume variance",
    notes: "Replacing pump head silicone tubing on a rigid 30-day PM eliminated dosing drift."
  },
  {
    source_record_id: "HIN-REC-2021-019",
    plant_id: "demo-plant",
    deviation_id: "dev-fill-002",
    action_class: "in-line sensor recalibration without tubing replacement",
    outcome: "RECURRENCE_OBSERVED",
    monitoring_days: 14,
    equipment_code: "FILL-04",
    failure_mode: "fill volume variance",
    notes: "Recalibrating check scales masked mechanical hysteresis in fatigued pump tubes."
  },
  {
    source_record_id: "HIN-REC-2024-004",
    plant_id: "demo-plant",
    deviation_id: "dev-pump-003",
    action_class: "suction strainer cleaning and NPSH adjustment",
    outcome: "VERIFIED_EFFECTIVE",
    monitoring_days: 60,
    equipment_code: "PUMP-01",
    failure_mode: "impeller cavitation",
    notes: "Clearing particulate fouling on 40-mesh intake strainer restored positive suction head."
  }
];

export const INITIAL_RECOMMENDATIONS: Record<string, RecommendationOut> = {
  "rec-seal-001": {
    recommendation_id: "rec-seal-001",
    deviation_id: "dev-seal-001",
    summary: "Relevant historical records were found. Review prior outcomes and verify comparability before selecting an action. Evidence strongly disfavors simple retraining due to documented 12-day recurrence.",
    proposed_actions: [
      {
        action_class: "gasket replacement with EPDM fluoropolymer",
        historical_status: "associated_with_no_recurrence_in_recorded_monitoring",
        supporting_record_ids: ["HIN-REC-2023-089"],
        monitoring_days: 180
      },
      {
        action_class: "operator retraining",
        historical_status: "recurrence_observed",
        supporting_record_ids: ["HIN-REC-2022-041"],
        monitoring_days: 12
      }
    ],
    historical_evidence: [
      HISTORICAL_PRECEDENTS_DATABASE[0],
      HISTORICAL_PRECEDENTS_DATABASE[1]
    ],
    uncertainty: [
      "Historical similarity does not establish causation in the current batch cycle.",
      "Operating temperatures during Steam-In-Place (SIP) cycle must be independently verified against batch log B24-889.",
      "A qualified QA Lead must assess physical comparability before approving any intervention."
    ],
    investigator: {
      role: "INVESTIGATOR",
      findings: [
        "Assess the reported failure mode: seal integrity failure on SEAL-02 Line 3.",
        "Elastomer seal micro-crack indicates thermo-mechanical degradation rather than torque operator error.",
        "Historical precedents confirm verified resilience when upgraded to EPDM fluoropolymer specification."
      ],
      supporting_record_ids: ["HIN-REC-2023-089", "HIN-REC-2022-041"],
      unsupported_claims: [],
      missing_evidence: [
        "Confirm seal torque log from installation on 2026-10-14.",
        "Verify autoclave and Steam-In-Place (SIP) thermal profile records.",
        "Obtain metallurgical or elastomer microscopy inspection report."
      ],
      proposed_actions: [
        "gasket replacement with EPDM fluoropolymer",
        "operator retraining"
      ]
    },
    skeptic: {
      role: "SKEPTIC",
      findings: [
        "Historical recurrence exists after: operator retraining (HIN-REC-2022-041: recurrence observed within 12 days).",
        "Do not infer mechanical root cause from visual inspection alone without verifying housing surface roughness.",
        "A no-recurrence observation across 180 days does not prove the elastomer grade was the sole causal determinant."
      ],
      supporting_record_ids: ["HIN-REC-2022-041"],
      unsupported_claims: [
        "Do not infer root cause from similarity alone.",
        "A no-recurrence observation does not prove the intervention caused the outcome."
      ],
      missing_evidence: [
        "Confirm comparable operating fluid chemical compatibility and SIP peak temperatures.",
        "Verify batch product contact time prior to leak detection."
      ],
      proposed_actions: [
        "Require objective evidence and groove inspection before accepting an operator-error conclusion.",
        "Reject standalone operator retraining as an adequate corrective action."
      ]
    },
    auditor: {
      role: "AUDITOR",
      findings: [
        "Review the investigation for traceability, 21 CFR Part 211.192 containment compliance, and product batch isolation.",
        "Immediate batch containment of contiguous lots on Line 3 must be documented prior to CAPA signoff."
      ],
      supporting_record_ids: ["HIN-REC-2023-089"],
      unsupported_claims: [],
      missing_evidence: [
        "Document immediate containment and product/batch impact assessment.",
        "Attach objective inspection or pressure decay test results.",
        "Define an effectiveness monitoring period (minimum 90 days recommended) and measurable acceptance criteria."
      ],
      proposed_actions: [
        "Verify each conclusion is linked to an original QA batch record.",
        "Ensure formal QA deviation gate approval before equipment re-commissioning."
      ]
    },
    requires_human_approval: true,
    advisory_only: true,
    model_name: "llama-3.3-70b-versatile (Groq)",
    memory_enabled: true,
    memory_adapter: "hindsight (mock adapter)",
    review_status: "pending"
  }
};

export const INITIAL_CAPAS: Capa[] = [
  {
    id: "capa-101",
    deviation_id: "dev-seal-001",
    action_class: "gasket replacement with EPDM fluoropolymer",
    description: "Replace mechanical seal face assembly with high-temperature USP Class VI EPDM compound and inspect mating groove with profilometer.",
    status: "implemented",
    owner: "Dr. Marcus Vance (Reliability Engineering)",
    created_at: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: "capa-102",
    deviation_id: "dev-fill-002",
    action_class: "peristaltic pump tubing calibration & monthly changeout",
    description: "Implement automated 30-day tubing swap cycle and revise SOP-FILL-204 for pre-run tare verification.",
    status: "assessed",
    owner: "Elena Rostova (Sterile Operations)",
    created_at: new Date(Date.now() - 3600000 * 80).toISOString()
  },
  {
    id: "capa-103",
    deviation_id: "dev-pump-003",
    action_class: "suction strainer cleaning and NPSH adjustment",
    description: "Clean suction strainer mesh, flush header line, and adjust WFI recirculation valve trim.",
    status: "proposed",
    owner: "Raj Patel (Facilities)",
    created_at: new Date(Date.now() - 3600000 * 10).toISOString()
  }
];

export const INITIAL_EFFECTIVENESS_QUEUE: EffectivenessQueueItem[] = [
  {
    id: "eff-001",
    capa_id: "capa-102",
    outcome: "VERIFIED_EFFECTIVE",
    monitoring_days: 90
  },
  {
    id: "eff-002",
    capa_id: "capa-101",
    outcome: "NOT_ASSESSED",
    monitoring_days: 14
  }
];

export const INITIAL_CALIBRATION_METRICS: CalibrationMetrics = {
  effectiveness_rate: {
    metric: "effectiveness_rate",
    total_assessed: 18,
    verified_effective: 14,
    recurrence_observed: 4,
    effectiveness_percent: 77.78,
    plant_id: "demo-plant",
    is_synthetic: true
  },
  recurrence_rate: {
    metric: "recurrence_rate",
    total_assessed: 18,
    recurrence_observed: 4,
    recurrence_percent: 22.22,
    plant_id: "demo-plant",
    is_synthetic: true
  },
  by_equipment_class: [
    {
      equipment_code: "SEAL-02",
      total_assessed: 6,
      verified_effective: 4,
      recurrence_observed: 2,
      effectiveness_percent: 66.67,
      recurrence_percent: 33.33,
      is_synthetic: true
    },
    {
      equipment_code: "FILL-04",
      total_assessed: 5,
      verified_effective: 4,
      recurrence_observed: 1,
      effectiveness_percent: 80.00,
      recurrence_percent: 20.00,
      is_synthetic: true
    },
    {
      equipment_code: "PUMP-01",
      total_assessed: 4,
      verified_effective: 4,
      recurrence_observed: 0,
      effectiveness_percent: 100.00,
      recurrence_percent: 0.00,
      is_synthetic: true
    },
    {
      equipment_code: "LYO-02",
      total_assessed: 3,
      verified_effective: 2,
      recurrence_observed: 1,
      effectiveness_percent: 66.67,
      recurrence_percent: 33.33,
      is_synthetic: true
    }
  ],
  by_action_class: [
    {
      action_class: "component upgrade / material change",
      total_assessed: 7,
      verified_effective: 6,
      recurrence_observed: 1,
      effectiveness_percent: 85.71,
      recurrence_percent: 14.29,
      is_synthetic: true
    },
    {
      action_class: "preventive maintenance frequency increase",
      total_assessed: 5,
      verified_effective: 4,
      recurrence_observed: 1,
      effectiveness_percent: 80.00,
      recurrence_percent: 20.00,
      is_synthetic: true
    },
    {
      action_class: "operator retraining only",
      total_assessed: 4,
      verified_effective: 1,
      recurrence_observed: 3,
      effectiveness_percent: 25.00,
      recurrence_percent: 75.00,
      is_synthetic: true
    },
    {
      action_class: "sensor recalibration & loop tuning",
      total_assessed: 2,
      verified_effective: 2,
      recurrence_observed: 0,
      effectiveness_percent: 100.00,
      recurrence_percent: 0.00,
      is_synthetic: true
    }
  ],
  plant_id: "demo-plant",
  is_synthetic: true,
  note: "Reproducible calibration metrics from persisted checks. Predictive accuracy is not calculated until an explicit expected-vs-observed evaluation is recorded."
};

export const INITIAL_MEMORY_STATUS: MemoryStatus = {
  deviation_id: "dev-seal-001",
  adapter: "hindsight",
  status: "online",
  memory_enabled: true,
  note: "Hindsight adapter connected (mock mode). Memory ON/OFF enforced at backend."
};

export const INITIAL_GOVERNANCE: MemoryGovernanceResponse = {
  id: "gov-demo-01",
  plant_id: "demo-plant",
  enabled: true,
  updated_at: new Date().toISOString(),
  updated_by: "QA-Governance-Admin"
};

export const INITIAL_SYNC_STATUS: MemorySyncStatus = {
  total: 12,
  pending: 0,
  syncing: 0,
  synced: 12,
  failed: 0
};

export const INITIAL_INSPECTOR_FINDINGS: Record<string, InspectorOut> = {
  "dev-seal-001": {
    deviation_id: "dev-seal-001",
    questions: [
      "Is the root cause supported by objective evidence and physical testing rather than procedural assumption?",
      "Was product or batch impact assessed across all lots produced between last successful seal check and detection?",
      "Are CAPA effectiveness criteria and monitoring duration defined with specific statistical thresholds?"
    ],
    documentation_gaps: [
      "Attach inspection measurements and relevant equipment calibration records (SEAL-02 logbook).",
      "Document the engineering rationale for the selected action (EPDM fluoropolymer vs standard fluoroelastomer).",
      "Include swab test / micro-leak pressure hold decay charts."
    ],
    evidence_record_ids: ["HIN-REC-2023-089", "HIN-REC-2022-041"],
    advisory_only: true,
    synthetic_data: true
  }
};
