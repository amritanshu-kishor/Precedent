from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    assert client.get("/health").json()["status"] == "healthy"

def test_status():
    assert client.get("/api/v1/status").json()["status"] == "online"

def test_create_and_investigate():
    payload = {"plant_id":"demo-plant", "line":"Line 3", "equipment_code":"SEAL-02", "failure_mode":"seal integrity failure", "severity":"high", "description":"Synthetic demonstration seal integrity deviation for testing.", "is_synthetic":True}
    created = client.post("/api/v1/deviations", json=payload)
    assert created.status_code == 201
    deviation_id = created.json()["id"]
    result = client.post(f"/api/v1/deviations/{deviation_id}/investigate")
    assert result.status_code == 201
    assert result.json()["requires_human_approval"] is True
    assert "investigator" in result.json() and "skeptic" in result.json() and "auditor" in result.json()
