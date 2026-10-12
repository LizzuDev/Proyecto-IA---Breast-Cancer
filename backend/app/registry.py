"""Carga de los artefactos generados por `python -m ml.train`."""

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class LoadedModel:
    id: str
    name: str
    short_name: str
    pipeline: Any
    threshold: float


@dataclass(frozen=True)
class ModelRegistry:
    models: dict[str, LoadedModel]
    primary_id: str
    comparison: dict
    metadata: dict

    @property
    def features(self) -> list[str]:
        return self.metadata["features"]

    @property
    def feature_stats(self) -> dict:
        return self.metadata["feature_stats"]

    @property
    def primary(self) -> LoadedModel:
        return self.models[self.primary_id]


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_registry(artifacts_dir: Path) -> ModelRegistry:
    """Carga metadatos, comparación y pipelines. Falla de forma explícita si falta algo."""
    comparison = _read_json(artifacts_dir / "comparison.json")
    metadata = _read_json(artifacts_dir / "metadata.json")

    models = {}
    for entry in comparison["models"]:
        path = artifacts_dir / "models" / entry["id"] / "pipeline.joblib"
        models[entry["id"]] = LoadedModel(
            id=entry["id"],
            name=entry["name"],
            short_name=entry["short_name"],
            pipeline=joblib.load(path),
            threshold=float(entry["threshold"]),
        )
        log.info("Modelo '%s' cargado (umbral %.3f)", entry["id"], entry["threshold"])

    return ModelRegistry(models, comparison["primary_model"], comparison, metadata)
