"""Aplicación FastAPI: rutas HTTP de OncoPath AI.

Ejecutar desde `backend/`:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import inference
from app.config import settings
from app.registry import ModelRegistry, load_registry
from app.schemas import PredictionRequest, PredictionResponse

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.registry = load_registry(settings.artifacts_dir)
    log.info("Modelo principal: %s", app.state.registry.primary_id)
    yield


app = FastAPI(
    title="OncoPath AI — API de inferencia",
    description="Clasificación de biopsias FNA (Wisconsin Diagnostic Breast Cancer) con tres modelos calibrados.",
    version="3.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # No se devuelve el valor recibido: puede no ser serializable a JSON (p. ej. NaN).
    errors = [{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})


def get_registry(request: Request) -> ModelRegistry:
    registry = getattr(request.app.state, "registry", None)
    if registry is None or not registry.models:
        raise HTTPException(status_code=503, detail="No hay modelos disponibles en el servidor.")
    return registry


@app.get("/api/health")
def health(request: Request) -> dict:
    registry = get_registry(request)
    return {
        "status": "healthy",
        "loaded_models": list(registry.models),
        "recommended_model": registry.primary_id,
        "features_count": len(registry.features),
    }


@app.get("/api/metadata")
def metadata(request: Request) -> dict:
    return get_registry(request).metadata


@app.get("/api/samples")
def samples(request: Request) -> dict:
    return get_registry(request).metadata["sample_cases"]


@app.get("/api/models/comparison")
def models_comparison(request: Request) -> dict:
    """Métricas de validación de los tres modelos, tal como las exportó el entrenamiento."""
    return get_registry(request).comparison


@app.post("/api/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest, request: Request) -> PredictionResponse:
    return inference.predict(get_registry(request), payload)
