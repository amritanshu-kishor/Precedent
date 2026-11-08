from app.core.database import SessionLocal, Base, engine
from app.models.entities import Plant, Deviation, Capa, EffectivenessCheck

Base.metadata.create_all(bind=engine)
db = SessionLocal()
try:
    if not db.get(Plant, "demo-plant"):
        db.add(Plant(id="demo-plant", name="Synthetic Demo Pharmaceutical Plant"))
    db.commit()
    if not db.query(Deviation).filter_by(plant_id="demo-plant").first():
        d = Deviation(plant_id="demo-plant", line="Line 3", equipment_code="SEAL-02", failure_mode="seal integrity failure", severity="high", description="Synthetic historical demonstration deviation: seal integrity test failed during routine inspection.", is_synthetic=True)
        db.add(d); db.commit(); db.refresh(d)
        c = Capa(deviation_id=d.id, action_class="operator retraining", description="Synthetic example CAPA for demonstration only", status="implemented")
        db.add(c); db.commit(); db.refresh(c)
        db.add(EffectivenessCheck(capa_id=c.id, outcome="RECURRENCE_OBSERVED", monitoring_days=12, evidence="Synthetic demo record: recurrence observed after 12 days."))
        db.commit()
    print("Synthetic demo plant seeded. Use plant_id=demo-plant for the demo memory adapter.")
finally:
    db.close()
