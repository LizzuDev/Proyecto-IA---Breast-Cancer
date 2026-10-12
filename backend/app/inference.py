"""Lógica de predicción, consenso y explicación de una muestra."""

import pandas as pd

from app.config import settings
from app.registry import LoadedModel, ModelRegistry
from app.schemas import (
    Consensus,
    Deviation,
    FeatureComparison,
    ModelPrediction,
    PredictionRequest,
    PredictionResponse,
)


def build_feature_vector(registry: ModelRegistry, features: dict[str, float]) -> dict[str, float]:
    """Ordena las variables esperadas y rellena las ausentes con la media del dataset."""
    return {
        name: float(features[name]) if name in features else registry.feature_stats[name]["mean"]
        for name in registry.features
    }


def risk_band(probability_malignant: float, threshold: float) -> tuple[str, str]:
    """Banda de riesgo a partir de la probabilidad calibrada y el umbral clínico del modelo."""
    if probability_malignant < threshold / 2:
        return "Bajo riesgo / Benigno típico", "emerald"
    if probability_malignant < threshold:
        return "Riesgo bajo-moderado / Hallazgo a observar", "amber"
    if probability_malignant < 0.8:
        return "Sospecha maligna", "rose"
    return "Alta sospecha maligna", "red"


def predict_one(model: LoadedModel, frame: pd.DataFrame) -> ModelPrediction:
    p_malignant = float(model.pipeline.predict_proba(frame)[0, 1])
    is_malignant = p_malignant >= model.threshold
    risk_level, risk_color = risk_band(p_malignant, model.threshold)
    return ModelPrediction(
        diagnosis="Maligno" if is_malignant else "Benigno",
        prediction_code=int(is_malignant),
        probability_benign=round((1 - p_malignant) * 100, 2),
        probability_malignant=round(p_malignant * 100, 2),
        confidence=round(max(p_malignant, 1 - p_malignant) * 100, 2),
        threshold=round(model.threshold * 100, 2),
        risk_level=risk_level,
        risk_color=risk_color,
        name=model.name,
        short_name=model.short_name,
    )


def consensus(results: dict[str, ModelPrediction]) -> Consensus:
    malignant = sum(r.diagnosis == "Maligno" for r in results.values())
    total = len(results)
    benign = total - malignant
    return Consensus(
        unanimous=malignant in (0, total),
        consensus_diagnosis="Maligno" if malignant > total / 2 else "Benigno",
        malignant_votes=malignant,
        benign_votes=benign,
        total_models=total,
        agreement_percentage=round(max(malignant, benign) / total * 100, 1),
    )


def deviations(registry: ModelRegistry, vector: dict[str, float]) -> list[Deviation]:
    """Variables que más se alejan de la población benigna (z-score)."""
    found = []
    for name, value in vector.items():
        stats = registry.feature_stats[name]
        z = (value - stats["benign_mean"]) / (stats["benign_std"] or 1.0)
        if abs(z) > settings.deviation_z_threshold:
            found.append(Deviation(
                feature=name,
                value=value,
                benign_mean=stats["benign_mean"],
                deviation_z=round(z, 2),
                direction="Mayor a lo benigno" if z > 0 else "Menor a lo benigno",
            ))
    found.sort(key=lambda d: abs(d.deviation_z), reverse=True)
    return found[: settings.max_deviations]


def comparison(registry: ModelRegistry, vector: dict[str, float]) -> dict[str, FeatureComparison]:
    result = {}
    for name, value in vector.items():
        stats = registry.feature_stats[name]
        result[name] = FeatureComparison(
            value=value,
            benign_mean=stats["benign_mean"],
            malignant_mean=stats["malignant_mean"],
            is_above_benign=value > stats["benign_mean"],
        )
    return result


def predict(registry: ModelRegistry, request: PredictionRequest) -> PredictionResponse:
    vector = build_feature_vector(registry, request.features)
    frame = pd.DataFrame([vector], columns=registry.features)
    results = {mid: predict_one(model, frame) for mid, model in registry.models.items()}

    if request.model_id == "all":
        primary = results[registry.primary_id]
        active_name = "Consenso Multi-Modelo"
    else:
        primary = results[request.model_id]
        active_name = primary.name

    return PredictionResponse(
        **primary.model_dump(),
        selected_model=request.model_id,
        primary_model=registry.primary_id,
        active_model_name=active_name,
        multi_model_summary=results,
        consensus=consensus(results),
        top_deviations=deviations(registry, vector),
        comparison=comparison(registry, vector),
    )
