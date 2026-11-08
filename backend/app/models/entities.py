import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

def new_id() -> str:
    return str(uuid.uuid4())

def now_utc():
    return datetime.now(timezone.utc)

class Plant(Base):
    __tablename__ = "plants"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class Equipment(Base):
    __tablename__ = "equipment"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    plant_id: Mapped[str] = mapped_column(ForeignKey("plants.id"), index=True)
    line: Mapped[str] = mapped_column(String(100), nullable=False)
    equipment_code: Mapped[str] = mapped_column(String(100), index=True)
    equipment_type: Mapped[str | None] = mapped_column(String(120), nullable=True)

class Deviation(Base):
    __tablename__ = "deviations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    plant_id: Mapped[str] = mapped_column(ForeignKey("plants.id"), index=True)
    equipment_id: Mapped[str | None] = mapped_column(ForeignKey("equipment.id"), nullable=True)
    line: Mapped[str] = mapped_column(String(100), nullable=False)
    equipment_code: Mapped[str] = mapped_column(String(100), nullable=False)
    failure_mode: Mapped[str] = mapped_column(String(160), index=True)
    severity: Mapped[str] = mapped_column(String(40), default="medium")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="open")
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class Investigation(Base):
    __tablename__ = "investigations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    deviation_id: Mapped[str] = mapped_column(ForeignKey("deviations.id"), index=True)
    findings: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class Capa(Base):
    __tablename__ = "capas"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    deviation_id: Mapped[str] = mapped_column(ForeignKey("deviations.id"), index=True)
    action_class: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="proposed")
    owner: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class EffectivenessCheck(Base):
    __tablename__ = "effectiveness_checks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    capa_id: Mapped[str] = mapped_column(ForeignKey("capas.id"), index=True)
    recommendation_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    outcome: Mapped[str] = mapped_column(String(40), default="NOT_ASSESSED")
    monitoring_days: Mapped[int] = mapped_column(default=0)
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewer: Mapped[str | None] = mapped_column(String(160), nullable=True)
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    deviation_id: Mapped[str] = mapped_column(ForeignKey("deviations.id"), index=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    model_name: Mapped[str] = mapped_column(String(120), default="rule-based-fallback")
    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    review_status: Mapped[str] = mapped_column(String(40), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class ReviewDecision(Base):
    __tablename__ = "review_decisions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    recommendation_id: Mapped[str] = mapped_column(ForeignKey("recommendations.id"), index=True)
    decision: Mapped[str] = mapped_column(String(40))
    rationale: Mapped[str] = mapped_column(Text, default="")
    reviewer: Mapped[str] = mapped_column(String(160), default="demo-reviewer")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    event_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class MemoryEvent(Base):
    """Persisted memory event with original identity and provenance."""

    __tablename__ = "memory_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    source_record_id: Mapped[str] = mapped_column(String(255), index=True)
    event_type: Mapped[str] = mapped_column(String(100), index=True)
    plant_id: Mapped[str] = mapped_column(String(36), index=True)
    deviation_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    role_tag: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sync_status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)


class Outbox(Base):
    """Outbox table for sync/recovery — events not yet synced to Hindsight."""

    __tablename__ = "outbox"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    event_id: Mapped[str] = mapped_column(String(36), ForeignKey("memory_events.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    retry_count: Mapped[int] = mapped_column(default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class MemorySetting(Base):
    """Memory ON/OFF governance setting — per-plant or global (plant_id=None)."""

    __tablename__ = "memory_settings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    plant_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    updated_by: Mapped[str | None] = mapped_column(String(160), nullable=True)
