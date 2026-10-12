"""Contratos de entrada y salida de la API."""

import math
from typing import Literal

from pydantic import BaseModel, Field, field_validator

ModelId = Literal["reg_bin", "svm", "log_pol", "all"]
Diagnosis = Literal["Benigno", "Maligno"]


class PredictionRequest(BaseModel):
    features: dict[str, float] = Field(
        ..., description="Variables morfométricas. Las que falten se rellenan con la media del dataset.")
    model_id: ModelId = Field("all", description="Modelo a usar, o 'all' para el consenso.")

    @field_validator("features")
    @classmethod
    def values_must_be_finite(cls, features: dict[str, float]) -> dict[str, float]:
        bad = [name for name, value in features.items() if not math.isfinite(value)]
        if bad:
            raise ValueError(f"Valores no finitos en: {', '.join(bad)}")
        return features


class ModelPrediction(BaseModel):
    diagnosis: Diagnosis
    prediction_code: int
    probability_benign: float
    probability_malignant: float
    confidence: float
    threshold: float
    risk_level: str
    risk_color: str
    name: str
    short_name: str


class Consensus(BaseModel):
    unanimous: bool
    consensus_diagnosis: Diagnosis
    malignant_votes: int
    benign_votes: int
    total_models: int
    agreement_percentage: float


class Deviation(BaseModel):
    feature: str
    value: float
    benign_mean: float
    deviation_z: float
    direction: str


class FeatureComparison(BaseModel):
    value: float
    benign_mean: float
    malignant_mean: float
    is_above_benign: bool


class PredictionResponse(ModelPrediction):
    selected_model: ModelId
    primary_model: str
    active_model_name: str
    multi_model_summary: dict[str, ModelPrediction]
    consensus: Consensus
    top_deviations: list[Deviation]
    comparison: dict[str, FeatureComparison]
