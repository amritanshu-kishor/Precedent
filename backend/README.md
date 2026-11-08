# PRECEDENT — Member 2 Backend & AI Agent Module

A hackathon MVP backend for PRECEDENT, an advisory pharmaceutical manufacturing quality intelligence prototype. All included records are synthetic. This is not a GMP-validated or 21 CFR Part 11 compliant system.

## What's included

- FastAPI REST API and Swagger documentation.
- SQLAlchemy 2.x transactional models (SQLite default for easy local setup; PostgreSQL supported through `DATABASE_URL`).
- Groq service with a deterministic fallback when no API key is configured.
- Investigator, Skeptic, Auditor and Synthesizer roles.
- Custom Python orchestration.
- Mock memory adapter with explicitly synthetic precedent examples.
- Deviation, recommendation review, CAPA, effectiveness, calibration and inspector endpoints.
- Basic API tests.

## Important integration boundary

The `MockMemoryAdapter` is NOT Hindsight. It exists so the backend can be demonstrated while the Hindsight teammate implements the real adapter. Replace it with the team's verified Hindsight adapter through `MemoryAdapter` in `app/memory/memory_interface.py`. The current API intentionally reports `mock`/`demo_only` status.

The current LLM fallback is deterministic. To enable Groq, configure `GROQ_API_KEY`. The Investigator uses Groq when available; Skeptic and Auditor currently use deterministic checks to keep the demo stable and auditable. Extend those agents to LLM-backed structured analysis only after testing.

## Windows / VS Code setup

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs

SQLite is the default so the backend starts without installing PostgreSQL. To use PostgreSQL, set for example:

`DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/precedent`

Never commit `.env` or share secrets in screenshots.

## Seed synthetic demo data

In a second terminal, activate the same virtual environment and run:

```powershell
python -m scripts.seed_demo
```

Use `plant_id` equal to `demo-plant` to match the mock memory examples.

## Main endpoints

- `GET /health`
- `GET /api/v1/status`
- `POST /api/v1/deviations`
- `GET /api/v1/deviations`
- `GET /api/v1/deviations/{deviation_id}`
- `POST /api/v1/deviations/{deviation_id}/investigate?memory_enabled=true`
- `GET /api/v1/deviations/{deviation_id}/precedents`
- `GET /api/v1/recommendations/{recommendation_id}`
- `POST /api/v1/recommendations/{recommendation_id}/review`
- `POST /api/v1/capas?deviation_id=...&action_class=...&description=...`
- `POST /api/v1/capas/{capa_id}/effectiveness`
- `GET /api/v1/effectiveness/queue`
- `GET /api/v1/analytics/calibration`
- `GET /api/v1/inspector/{deviation_id}`
- `GET /api/v1/memory/{deviation_id}`

## Example deviation request

```json
{
  "plant_id": "demo-plant",
  "line": "Line 3",
  "equipment_code": "SEAL-02",
  "failure_mode": "seal integrity failure",
  "severity": "high",
  "description": "Synthetic demo deviation: seal integrity test failed during inspection.",
  "is_synthetic": true
}
```

Then call the returned deviation's `/investigate` endpoint. The response includes the four role outputs, historical evidence and uncertainty. All outputs are advisory and require human approval.

## Tests

```powershell
pytest -q
```

## Frontend CORS

Set `CORS_ORIGINS` in `.env` to the frontend origin(s), e.g. `http://localhost:3000`.

## Limitations before submission

1. Mock memory is not persistent Hindsight and must be replaced by the Hindsight teammate's real adapter.
2. The current mock precedent data is intentionally small and synthetic.
3. Plant authorization is not a complete authentication system; production auth and authorization remain out of scope.
4. Calibration accuracy is deliberately not fabricated. It returns no accuracy percentage until explicit expected-vs-observed prediction evaluation is implemented.
5. The default SQLite setup is for local development; PostgreSQL should be used for the team's integrated deployment.
