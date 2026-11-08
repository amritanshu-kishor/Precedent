import axios, { AxiosError } from 'axios';
import {
  Deviation,
  DeviationCreate,
  RecommendationOut,
  ReviewCreate,
  ReviewDecisionResponse,
  Capa,
  EffectivenessCreate,
  EffectivenessQueueItem,
  CalibrationMetrics,
  InspectorOut,
  MemoryStatus,
  MemoryGovernanceResponse,
  MemorySyncStatus,
  HistoricalEvidenceRecord,
} from '../types';
import {
  INITIAL_DEVIATIONS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_CAPAS,
  INITIAL_EFFECTIVENESS_QUEUE,
  INITIAL_CALIBRATION_METRICS,
  INITIAL_MEMORY_STATUS,
  INITIAL_GOVERNANCE,
  INITIAL_SYNC_STATUS,
  INITIAL_INSPECTOR_FINDINGS,
  HISTORICAL_PRECEDENTS_DATABASE,
} from './demoData';

// Configurable base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8004';
const API_PREFIX = '/api/v1';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory demo state cache (retained during session so actions like creating a deviation or reviewing persist in demo mode)
let localDeviations: Deviation[] = [...INITIAL_DEVIATIONS];
let localRecommendations: Record<string, RecommendationOut> = { ...INITIAL_RECOMMENDATIONS };
let localCapas: Capa[] = [...INITIAL_CAPAS];
let localEffectivenessQueue: EffectivenessQueueItem[] = [...INITIAL_EFFECTIVENESS_QUEUE];
let localCalibrationMetrics: CalibrationMetrics = { ...INITIAL_CALIBRATION_METRICS };
let localGovernance: MemoryGovernanceResponse = { ...INITIAL_GOVERNANCE };
let localSyncStatus: MemorySyncStatus = { ...INITIAL_SYNC_STATUS };

// Connection state listeners
type ConnectionListener = (isLive: boolean) => void;
const listeners: ConnectionListener[] = [];
let isLiveBackend = false;

export const subscribeToBackendStatus = (listener: ConnectionListener) => {
  listeners.push(listener);
  listener(isLiveBackend);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyStatus = (status: boolean) => {
  if (isLiveBackend !== status) {
    isLiveBackend = status;
    listeners.forEach((l) => l(isLiveBackend));
  }
};

export const getBackendLiveStatus = () => isLiveBackend;

export const api = {
  // Check backend health
  async checkHealth(): Promise<{ status: string; isLive: boolean; mode?: string }> {
    try {
      const res = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
      if (res.data?.status === 'healthy') {
        notifyStatus(true);
        return { status: 'healthy', isLive: true };
      }
      notifyStatus(false);
      return { status: 'offline', isLive: false };
    } catch {
      notifyStatus(false);
      return { status: 'offline', isLive: false };
    }
  },

  // Deviations
  async getDeviations(plantId: string = 'demo-plant'): Promise<{ data: Deviation[]; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<Deviation[]>('/deviations', { params: { plant_id: plantId } });
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      return { data: localDeviations.filter((d) => !plantId || d.plant_id === plantId), isSynthetic: true };
    }
  },

  async getDeviation(deviationId: string): Promise<{ data: Deviation; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<Deviation>(`/deviations/${deviationId}`);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      const match = localDeviations.find((d) => d.id === deviationId);
      if (!match) throw new Error('Deviation not found');
      return { data: match, isSynthetic: true };
    }
  },

  async createDeviation(payload: DeviationCreate): Promise<{ data: Deviation; isSynthetic: boolean }> {
    try {
      const res = await apiClient.post<Deviation>('/deviations', payload);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      const newDev: Deviation = {
        id: `dev-${Date.now().toString(36)}`,
        ...payload,
        status: 'open',
        created_at: new Date().toISOString(),
      };
      localDeviations.unshift(newDev);
      return { data: newDev, isSynthetic: true };
    }
  },

  // AI Investigation Workflow
  async investigate(
    deviationId: string,
    memoryEnabled: boolean = true
  ): Promise<{ data: RecommendationOut; isSynthetic: boolean }> {
    try {
      const res = await apiClient.post<any>(`/deviations/${deviationId}/investigate`, null, {
        params: { memory_enabled: memoryEnabled },
      });
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      const existing = localRecommendations[`rec-${deviationId}`] || localRecommendations['rec-seal-001'];
      const syntheticRec: RecommendationOut = {
        ...existing,
        recommendation_id: `rec-${deviationId}`,
        deviation_id: deviationId,
        memory_enabled: memoryEnabled,
        review_status: 'pending',
      };
      localRecommendations[syntheticRec.recommendation_id] = syntheticRec;

      // Update local deviation status to 'investigating'
      const dev = localDeviations.find((d) => d.id === deviationId);
      if (dev && dev.status === 'open') {
        dev.status = 'investigating';
      }

      return { data: syntheticRec, isSynthetic: true };
    }
  },

  // Historical Precedents
  async getPrecedents(
    deviationId: string
  ): Promise<{ deviation_id: string; records: HistoricalEvidenceRecord[]; adapter: string; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<any>(`/deviations/${deviationId}/precedents`);
      notifyStatus(true);
      return { ...res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      const filtered = HISTORICAL_PRECEDENTS_DATABASE.filter(
        (r) => r.deviation_id === deviationId || !r.deviation_id
      );
      return {
        deviation_id: deviationId,
        records: filtered.length > 0 ? filtered : HISTORICAL_PRECEDENTS_DATABASE,
        adapter: 'hindsight (demo mock)',
        isSynthetic: true,
      };
    }
  },

  // Recommendations & Review
  async getRecommendation(recommendationId: string): Promise<{ data: RecommendationOut; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<any>(`/recommendations/${recommendationId}`);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      const rec = localRecommendations[recommendationId] || localRecommendations['rec-seal-001'];
      return { data: rec, isSynthetic: true };
    }
  },

  async reviewRecommendation(
    recommendationId: string,
    payload: ReviewCreate
  ): Promise<{ data: ReviewDecisionResponse; isSynthetic: boolean }> {
    try {
      const res = await apiClient.post<ReviewDecisionResponse>(`/recommendations/${recommendationId}/review`, payload);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      if (localRecommendations[recommendationId]) {
        localRecommendations[recommendationId].review_status = payload.decision;
      }
      return {
        data: {
          status: 'recorded',
          recommendation_id: recommendationId,
          decision: payload.decision,
          ai_recommendation_preserved: true,
        },
        isSynthetic: true,
      };
    }
  },

  // CAPA
  async createCapa(
    deviationId: string,
    actionClass: string,
    description: string
  ): Promise<{ data: Capa; isSynthetic: boolean }> {
    try {
      const res = await apiClient.post<any>('/capas', null, {
        params: { deviation_id: deviationId, action_class: actionClass, description },
      });
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      const newCapa: Capa = {
        id: `capa-${Date.now().toString(36)}`,
        deviation_id: deviationId,
        action_class: actionClass,
        description,
        status: 'proposed',
        created_at: new Date().toISOString(),
      };
      localCapas.unshift(newCapa);
      return { data: newCapa, isSynthetic: true };
    }
  },

  async getCapas(deviationId?: string): Promise<{ data: Capa[]; isSynthetic: boolean }> {
    // Note: backend doesn't have list capas endpoint, so we manage from effectiveness or local
    return {
      data: deviationId ? localCapas.filter((c) => c.deviation_id === deviationId) : localCapas,
      isSynthetic: true,
    };
  },

  // Effectiveness
  async assessEffectiveness(
    capaId: string,
    payload: EffectivenessCreate
  ): Promise<{ data: any; isSynthetic: boolean }> {
    try {
      const res = await apiClient.post<any>(`/capas/${capaId}/effectiveness`, payload);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      localEffectivenessQueue.unshift({
        id: `eff-${Date.now().toString(36)}`,
        capa_id: capaId,
        outcome: payload.outcome,
        monitoring_days: payload.monitoring_days,
      });

      // Update CAPA status
      const capa = localCapas.find((c) => c.id === capaId);
      if (capa) {
        capa.status = 'assessed';
      }

      return {
        data: {
          id: `eff-${Date.now().toString(36)}`,
          capa_id: capaId,
          outcome: payload.outcome,
          message: 'Assessment recorded; synthetic demo mode active.',
        },
        isSynthetic: true,
      };
    }
  },

  async getEffectivenessQueue(): Promise<{ data: EffectivenessQueueItem[]; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<EffectivenessQueueItem[]>('/effectiveness/queue');
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      return { data: localEffectivenessQueue, isSynthetic: true };
    }
  },

  // Quality Analytics & Self-Calibration
  async getCalibrationAnalytics(): Promise<{ data: CalibrationMetrics; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<CalibrationMetrics>('/analytics/calibration');
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      return { data: localCalibrationMetrics, isSynthetic: true };
    }
  },

  // Inspector / Compliance Review
  async getInspectorReview(deviationId: string): Promise<{ data: InspectorOut; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<InspectorOut>(`/inspector/${deviationId}`);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      const match = INITIAL_INSPECTOR_FINDINGS[deviationId] || {
        deviation_id: deviationId,
        questions: [
          'Is the root cause supported by objective evidence?',
          'Was product or batch impact assessed across all affected lots?',
          'Are CAPA effectiveness criteria and monitoring duration defined?',
        ],
        documentation_gaps: [
          'Attach inspection measurements and relevant equipment records.',
          'Document the rationale for the selected action.',
        ],
        evidence_record_ids: ['HIN-REC-2023-089'],
        advisory_only: true,
        synthetic_data: true,
      };
      return { data: match, isSynthetic: true };
    }
  },

  // AI Memory & Governance
  async getMemoryStatus(deviationId: string): Promise<{ data: MemoryStatus; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<MemoryStatus>(`/memory/${deviationId}`);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      return { data: { ...INITIAL_MEMORY_STATUS, deviation_id: deviationId }, isSynthetic: true };
    }
  },

  async getMemoryGovernance(plantId: string = 'demo-plant'): Promise<{ data: MemoryGovernanceResponse; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<MemoryGovernanceResponse>(`/memory/governance/${plantId}`);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      return { data: { ...localGovernance, plant_id: plantId }, isSynthetic: true };
    }
  },

  async setMemoryGovernance(
    plantId: string,
    enabled: boolean,
    actor: string = 'QA Director'
  ): Promise<{ data: MemoryGovernanceResponse; isSynthetic: boolean }> {
    try {
      const res = await apiClient.post<MemoryGovernanceResponse>('/memory/governance', {
        plant_id: plantId,
        enabled,
        actor,
      });
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      localGovernance = {
        id: `gov-${Date.now().toString(36)}`,
        plant_id: plantId,
        enabled,
        updated_at: new Date().toISOString(),
        updated_by: actor,
      };
      return { data: localGovernance, isSynthetic: true };
    }
  },

  async getMemorySyncStatus(): Promise<{ data: MemorySyncStatus; isSynthetic: boolean }> {
    try {
      const res = await apiClient.get<MemorySyncStatus>('/memory/sync/status');
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      return { data: localSyncStatus, isSynthetic: true };
    }
  },

  async triggerMemorySync(): Promise<{ data: any; isSynthetic: boolean }> {
    try {
      const res = await apiClient.post<any>('/memory/sync');
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      localSyncStatus = {
        total: localSyncStatus.total + 1,
        pending: 0,
        syncing: 0,
        synced: localSyncStatus.total + 1,
        failed: 0,
      };
      return {
        data: {
          processed: 1,
          synced: 1,
          failed: 0,
          remaining: 0,
          synthetic_note: 'Demo mode simulated outbox sync reconciliation.',
        },
        isSynthetic: true,
      };
    }
  },

  async memoryReflect(payload: { plant_id: string; deviation_id?: string; failure_mode?: string }) {
    try {
      const res = await apiClient.post<any>('/memory/reflect', payload);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      return {
        data: {
          deviation_id: payload.deviation_id,
          plant_id: payload.plant_id,
          similar_deviations: [
            {
              id: 'dev-seal-001',
              failure_mode: 'seal integrity failure',
              equipment_code: 'SEAL-02',
              outcome: 'VERIFIED_EFFECTIVE',
            },
          ],
          verified_interventions: [
            {
              action_class: 'gasket replacement with EPDM fluoropolymer',
              monitoring_days: 180,
              supporting_record_id: 'HIN-REC-2023-089',
            },
          ],
          failed_interventions: [
            {
              action_class: 'operator retraining',
              monitoring_days: 12,
              supporting_record_id: 'HIN-REC-2022-041',
              outcome: 'RECURRENCE_OBSERVED',
            },
          ],
          evidence_references: [
            { source_record_id: 'HIN-REC-2023-089', type: 'MAINTENANCE_LOG' },
            { source_record_id: 'HIN-REC-2022-041', type: 'TRAINING_LOG' },
          ],
          uncertainty: [
            'Historical similarity does not establish causation.',
            'A qualified reviewer must assess applicability and approve any action.',
          ],
          no_invented_precedents: true,
        },
        isSynthetic: true,
      };
    }
  },

  async memoryRetain(payload: {
    source_record_id: string;
    event_type: string;
    plant_id: string;
    deviation_id?: string;
    role_tag?: string;
    payload?: any;
    is_synthetic?: boolean;
  }) {
    try {
      const res = await apiClient.post<any>('/memory/retain', payload);
      notifyStatus(true);
      return { data: res.data, isSynthetic: false };
    } catch {
      notifyStatus(false);
      return {
        data: {
          status: 'retained_locally',
          source_record_id: payload.source_record_id,
          event_id: `mem-${Date.now().toString(36)}`,
          synced: true,
          error: null,
          hindsight_response: { mode: 'mock_demo_adapter' },
        },
        isSynthetic: true,
      };
    }
  },
};
