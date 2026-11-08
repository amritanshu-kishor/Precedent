from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.models.entities import Plant, Deviation, Recommendation, ReviewDecision, Capa, EffectivenessCheck, AuditEvent, MemorySetting
from app.schemas.contracts import (
    DeviationCreate, DeviationOut, ReviewCreate, EffectivenessCreate,
    MemoryRetainRequest, MemoryRetainResponse, MemoryRecallResponse,
    MemoryReflectRequest, MemoryReflectResponse, MemoryGovernanceRequest,
    MemoryGovernanceResponse, MemoryStatusResponse,
)
from app.memory.hindsight_adapter import HindsightAdapter
from app.memory.hindsight_client import HindsightClient, HindsightConfigurationError
from app.memory.governance import MemoryGovernance, require_memory_enabled
from app.memory.calibration import CalibrationEngine
from app.memory.sync import SyncEngine
from app.orchestration.orchestrator import AgentOrchestrator

def _hindsight_client() -> HindsightClient | None:
    """Build a HindsightClient from settings, or None when not configured."""
    try:
        return HindsightClient(
            api_key=settings.hindsight_api_key,
            endpoint=settings.hindsight_endpoint,
            timeout=settings.hindsight_timeout,
            max_retries=settings.hindsight_max_retries,
        )
    except HindsightConfigurationError:
        return None


router = APIRouter()

def deviation_dict(d):
    return {"id": d.id, "plant_id": d.plant_id, "line": d.line, "equipment_code": d.equipment_code, "failure_mode": d.failure_mode, "severity": d.severity, "description": d.description, "is_synthetic": d.is_synthetic}

@router.get("/status")
def status(): return {"status": "online", "service": "PRECEDENT backend"}

@router.post("/deviations", response_model=DeviationOut, status_code=201)
def create_deviation(payload: DeviationCreate, db: Session = Depends(get_db)):
    plant = db.get(Plant, payload.plant_id)
    if not plant:
        plant = Plant(id=payload.plant_id, name="Demo Pharmaceutical Plant")
        db.add(plant)
    item = Deviation(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    db.add(AuditEvent(event_type="DEVIATION_CREATED", entity_id=item.id, details={"synthetic": item.is_synthetic}))
    db.commit()
    return item

@router.get("/deviations", response_model=list[DeviationOut])
def list_deviations(plant_id: str | None = None, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    stmt = select(Deviation).order_by(Deviation.created_at.desc()).limit(limit)
    if plant_id: stmt = stmt.where(Deviation.plant_id == plant_id)
    return list(db.scalars(stmt))

@router.get("/deviations/{deviation_id}", response_model=DeviationOut)
def get_deviation(deviation_id: str, db: Session = Depends(get_db)):
    item = db.get(Deviation, deviation_id)
    if not item: raise HTTPException(404, "Deviation not found")
    return item

@router.post("/deviations/{deviation_id}/investigate", status_code=201)
def investigate(deviation_id: str, memory_enabled: bool = True, db: Session = Depends(get_db)):
    item = db.get(Deviation, deviation_id)
    if not item: raise HTTPException(404, "Deviation not found")
    require_memory_enabled(item.plant_id, db)
    result = AgentOrchestrator(HindsightAdapter(db=db)).investigate(deviation_dict(item), memory_enabled)
    recommendation = Recommendation(deviation_id=item.id, payload=result, model_name=result["model_name"], memory_enabled=memory_enabled)
    db.add(recommendation); db.commit(); db.refresh(recommendation)
    return {"recommendation_id": recommendation.id, "deviation_id": item.id, **result}

@router.get("/deviations/{deviation_id}/precedents")
def precedents(deviation_id: str, db: Session = Depends(get_db)):
    item = db.get(Deviation, deviation_id)
    if not item: raise HTTPException(404, "Deviation not found")
    records = HindsightAdapter(db=db).recall(deviation_dict(item))
    return {"deviation_id": item.id, "records": records, "adapter": "hindsight"}

@router.get("/recommendations/{recommendation_id}")
def get_recommendation(recommendation_id: str, db: Session = Depends(get_db)):
    item = db.get(Recommendation, recommendation_id)
    if not item: raise HTTPException(404, "Recommendation not found")
    return {"id": item.id, "deviation_id": item.deviation_id, "review_status": item.review_status, **item.payload}

@router.post("/recommendations/{recommendation_id}/review")
def review(recommendation_id: str, payload: ReviewCreate, db: Session = Depends(get_db)):
    item = db.get(Recommendation, recommendation_id)
    if not item: raise HTTPException(404, "Recommendation not found")
    decision = ReviewDecision(recommendation_id=item.id, decision=payload.decision, rationale=payload.rationale, reviewer=payload.reviewer)
    item.review_status = payload.decision
    db.add(decision); db.add(AuditEvent(event_type="RECOMMENDATION_REVIEWED", entity_id=item.id, details=payload.model_dump()))
    db.commit()
    return {"status": "recorded", "recommendation_id": item.id, "decision": payload.decision, "ai_recommendation_preserved": True}

@router.post("/capas")
def create_capa(deviation_id: str, action_class: str, description: str, db: Session = Depends(get_db)):
    if not db.get(Deviation, deviation_id): raise HTTPException(404, "Deviation not found")
    item = Capa(deviation_id=deviation_id, action_class=action_class, description=description)
    db.add(item); db.commit(); db.refresh(item)
    return {"id": item.id, "deviation_id": item.deviation_id, "status": item.status}

@router.post("/capas/{capa_id}/effectiveness")
def effectiveness(capa_id: str, payload: EffectivenessCreate, db: Session = Depends(get_db)):
    capa = db.get(Capa, capa_id)
    if not capa: raise HTTPException(404, "CAPA not found")
    if payload.capa_id != capa_id: raise HTTPException(400, "capa_id does not match URL")
    check = EffectivenessCheck(**payload.model_dump())
    db.add(check); db.add(AuditEvent(event_type="EFFECTIVENESS_ASSESSED", entity_id=capa_id, details={"outcome": payload.outcome, "monitoring_days": payload.monitoring_days}))
    db.commit(); db.refresh(check)
    return {"id": check.id, "capa_id": capa_id, "outcome": check.outcome, "message": "Assessment recorded; synthetic demo backend does not write to real Hindsight."}

@router.get("/effectiveness/queue")
def effectiveness_queue(db: Session = Depends(get_db)):
    rows = db.scalars(select(EffectivenessCheck).order_by(EffectivenessCheck.assessed_at.desc())).all()
    return [{"id": r.id, "capa_id": r.capa_id, "outcome": r.outcome, "monitoring_days": r.monitoring_days} for r in rows]


@router.get("/inspector/{deviation_id}")
def inspector(deviation_id: str, db: Session = Depends(get_db)):
    item = db.get(Deviation, deviation_id)
    if not item: raise HTTPException(404, "Deviation not found")
    evidence = HindsightAdapter(db=db).recall(deviation_dict(item))
    return {"deviation_id": item.id, "questions": ["Is the root cause supported by objective evidence?", "Was product or batch impact assessed?", "Are CAPA effectiveness criteria and monitoring duration defined?"], "documentation_gaps": ["Attach inspection measurements and relevant equipment records.", "Document the rationale for the selected action."], "evidence_record_ids": [e["source_record_id"] for e in evidence], "advisory_only": True, "synthetic_data": True}

@router.get("/memory/{deviation_id}")
def memory_status(deviation_id: str, db: Session = Depends(get_db)):
    item = db.get(Deviation, deviation_id)
    if not item: raise HTTPException(404, "Deviation not found")
    with MemoryGovernance(db) as gov:
        enabled = gov.is_enabled(item.plant_id)
    return {"deviation_id": deviation_id, "adapter": "hindsight", "status": "online" if enabled else "disabled", "memory_enabled": enabled, "note": "Hindsight adapter connected. Memory ON/OFF enforced at backend."}


@router.post("/memory/retain", response_model=MemoryRetainResponse, status_code=201)
def memory_retain(request: MemoryRetainRequest, db: Session = Depends(get_db)):
    with MemoryGovernance(db) as gov:
        gov.enforce(request.plant_id)
    result = HindsightAdapter(db=db, hindsight_client=_hindsight_client()).retain({
        "source_record_id": request.source_record_id,
        "event_type": request.event_type,
        "plant_id": request.plant_id,
        "deviation_id": request.deviation_id,
        "role_tag": request.role_tag,
        "payload": request.payload,
        "is_synthetic": request.is_synthetic,
    })
    return result


@router.get("/memory/recall", response_model=MemoryRecallResponse)
def memory_recall(plant_id: str, deviation_id: str | None = None, role_tag: str | None = None, db: Session = Depends(get_db)):
    with MemoryGovernance(db) as gov:
        gov.enforce(plant_id)
    records = HindsightAdapter(db=db).recall({
        "plant_id": plant_id,
        "deviation_id": deviation_id,
    })
    return {"deviation_id": deviation_id, "records": records, "adapter": "hindsight"}


@router.post("/memory/reflect", response_model=MemoryReflectResponse)
def memory_reflect(request: MemoryReflectRequest, db: Session = Depends(get_db)):
    with MemoryGovernance(db) as gov:
        gov.enforce(request.plant_id)
    deviation = {
        "plant_id": request.plant_id,
        "deviation_id": request.deviation_id,
        "failure_mode": request.failure_mode,
    }
    result = HindsightAdapter(db=db).reflect(deviation)
    return result


@router.post("/memory/governance", response_model=MemoryGovernanceResponse, status_code=201)
def memory_governance_set(request: MemoryGovernanceRequest, db: Session = Depends(get_db)):
    with MemoryGovernance(db) as gov:
        result = gov.set_enabled(plant_id=request.plant_id, enabled=request.enabled, actor=request.actor)
    return result


@router.get("/memory/governance/{plant_id}", response_model=MemoryGovernanceResponse)
def memory_governance_get(plant_id: str, db: Session = Depends(get_db)):
    with MemoryGovernance(db) as gov:
        enabled = gov.is_enabled(plant_id)
    return {"id": "", "plant_id": plant_id, "enabled": enabled, "updated_at": None, "updated_by": None}


@router.get("/analytics/calibration")
def calibration(db: Session = Depends(get_db)):
    with CalibrationEngine(db) as engine:
        return engine.compute_all()


@router.post("/memory/sync")
def memory_sync(db: Session = Depends(get_db)):
    with SyncEngine(db=db, hindsight_client=_hindsight_client()) as engine:
        return engine.reconcile_outbox()


@router.get("/memory/sync/status")
def memory_sync_status(db: Session = Depends(get_db)):
    with SyncEngine(db=db) as engine:
        return engine.get_outbox_status()
