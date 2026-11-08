from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.models import *  # noqa: F401,F403 - registers SQLAlchemy models
from app.api.v1.router import router

Base.metadata.create_all(bind=engine)  # MVP convenience; use Alembic migrations for production deployments.
app = FastAPI(title=settings.app_name, description="Advisory AI quality intelligence backend for synthetic pharmaceutical manufacturing records.", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(router, prefix="/api/v1")

@app.get("/")
def home():
    return {"project": "PRECEDENT", "message": "Backend is running", "environment": settings.environment}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "precedent-backend"}
