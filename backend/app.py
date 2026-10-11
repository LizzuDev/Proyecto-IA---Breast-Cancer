"""
API REST con FastAPI para Inferencia y Comparación de Modelos de Cáncer de Mama
Soporta 3 modelos serializados:
1. reg_bin: Regresión Logística Binaria (Modelo Clínico Principal)
2. svm: Support Vector Machine con kernel RBF
3. log_pol: Regresión Logística Polinomial (Grado 2)
"""

import os
import json
from typing import Dict, Any, Optional, List
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Breast Cancer AI Diagnostic API - Multi-Model",
    description="API de predicción y consenso diagnóstico basada en Wisconsin Diagnostic Breast Cancer (WDBC)",
    version="2.0.0"
)

# CORS habilitado para frontend local y entornos cloud
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
METADATA_PATH = os.path.join(MODELS_DIR, "metadata.json")

MODEL_CONFIGS = {
    "reg_bin": {
        "id": "reg_bin",
        "name": "Regresión Logística Binaria",
        "short_name": "Reg. Logística",
        "pipeline_path": os.path.join(MODELS_DIR, "reg_bin", "pipeline", "pipeline.pkl"),
        "metrics_path": os.path.join(MODELS_DIR, "reg_bin", "metricas.json"),
        "description": "Modelo clínico preferido: Máximo recall y mínimos falsos negativos (solo 2 en test).",
        "is_recommended": True
    },
    "svm": {
        "id": "svm",
        "name": "Support Vector Machine (RBF)",
        "short_name": "SVM (RBF)",
        "pipeline_path": os.path.join(MODELS_DIR, "svm", "pipeline", "pipeline.pkl"),
        "metrics_path": os.path.join(MODELS_DIR, "svm", "metricas.json"),
        "description": "Excelente precisión en frontera no lineal compleja con calibración de probabilidad.",
        "is_recommended": False
    },
    "log_pol": {
        "id": "log_pol",
        "name": "Regresión Logística Polinomial (Grado 2)",
        "short_name": "Reg. Polinomial",
        "pipeline_path": os.path.join(MODELS_DIR, "log_pol", "pipeline", "pipeline.pkl"),
        "metrics_path": os.path.join(MODELS_DIR, "log_pol", "metricas.json"),
        "description": "Captura relaciones cuadráticas e interacciones entre características nucleares.",
        "is_recommended": False
    }
}

loaded_pipelines: Dict[str, Any] = {}
loaded_metrics: Dict[str, Any] = {}
metadata: Dict[str, Any] = {}

def load_all_artifacts():
    global loaded_pipelines, loaded_metrics, metadata

    # 1. Cargar metadatos globales (estadísticas de características, casos de muestra)
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            print("Metadatos cargados correctamente.")
        except Exception as e:
            print(f"Error cargando metadata.json: {e}")

    # 2. Cargar pipelines y métricas de cada modelo
    for model_id, cfg in MODEL_CONFIGS.items():
        if os.path.exists(cfg["pipeline_path"]):
            try:
                pipeline = joblib.load(cfg["pipeline_path"])
                loaded_pipelines[model_id] = pipeline
                print(f"Pipeline '{model_id}' cargado exitosamente.")
            except Exception as e:
                print(f"Error cargando pipeline '{model_id}': {e}")
        else:
            print(f"Archivo de pipeline no encontrado para '{model_id}' en {cfg['pipeline_path']}")

        if os.path.exists(cfg["metrics_path"]):
            try:
                with open(cfg["metrics_path"], "r", encoding="utf-8") as f:
                    metrics_data = json.load(f)
                loaded_metrics[model_id] = metrics_data
            except Exception as e:
                print(f"Error cargando métricas '{model_id}': {e}")

load_all_artifacts()

class PredictionRequest(BaseModel):
    features: Dict[str, float]
    model_id: Optional[str] = "reg_bin"  # "reg_bin", "svm", "log_pol", o "all"

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "loaded_models": list(loaded_pipelines.keys()),
        "recommended_model": "reg_bin",
        "features_count": len(metadata.get("features", []))
    }

@app.get("/api/metadata")
def get_metadata():
    if not metadata:
        raise HTTPException(status_code=500, detail="Metadatos no disponibles")
    return metadata

@app.get("/api/samples")
def get_samples():
    if not metadata or "sample_cases" not in metadata:
        raise HTTPException(status_code=500, detail="Casos de muestra no disponibles")
    return metadata["sample_cases"]

@app.get("/api/models/comparison")
def get_models_comparison():
    """Devuelve las métricas comparadas de los 3 modelos para análisis y visualización."""
    comparison_data = []
    for model_id, cfg in MODEL_CONFIGS.items():
        metrics = loaded_metrics.get(model_id, {})
        test_m = metrics.get("test", {})
        
        # Matriz de confusión en test (114 muestras: 72 benignas, 42 malignas)
        fn = metrics.get("falsos_negativos", 0)
        fp = metrics.get("falsos_positivos", 0)
        tp = 42 - fn
        tn = 72 - fp

        comparison_data.append({
            "id": model_id,
            "name": cfg["name"],
            "short_name": cfg["short_name"],
            "description": cfg["description"],
            "is_recommended": cfg["is_recommended"],
            "is_loaded": model_id in loaded_pipelines,
            "best_hyperparameters": metrics.get("mejores_hiperparametros", {}),
            "cv_f1": round(metrics.get("cv_f1", 0) * 100, 2),
            "cv_recall": round(metrics.get("cv_recall", 0) * 100, 2),
            "test_accuracy": round(test_m.get("accuracy", 0) * 100, 2),
            "test_precision": round(test_m.get("precision", 0) * 100, 2),
            "test_recall": round(test_m.get("recall", 0) * 100, 2),
            "test_f1": round(test_m.get("f1", 0) * 100, 2),
            "test_roc_auc": round(test_m.get("roc_auc", 0) * 100, 2),
            "confusion_matrix": {
                "true_negative": tn,
                "false_positive": fp,
                "false_negative": fn,
                "true_positive": tp
            }
        })
    return {
        "models": comparison_data,
        "primary_recommendation": "reg_bin",
        "clinical_rationale": "En diagnóstico oncológico, un falso negativo (cáncer no detectado) es crítico. 'reg_bin' logró el mayor Recall (95.24%) y el menor número de Falsos Negativos (solo 2), superando a SVM (3) y Polinomial (4) con 100% de precisión en test."
    }

def run_single_inference(pipeline: Any, input_df: pd.DataFrame) -> Dict[str, Any]:
    pred_idx = int(pipeline.predict(input_df)[0])
    probabilities = pipeline.predict_proba(input_df)[0]
    benign_prob = float(probabilities[0])
    malignant_prob = float(probabilities[1])

    diagnosis = "Maligno" if pred_idx == 1 else "Benigno"
    confidence = malignant_prob if pred_idx == 1 else benign_prob

    if malignant_prob < 0.20:
        risk_level = "Bajo Riesgo / Benigno Típico"
        risk_color = "emerald"
    elif malignant_prob < 0.50:
        risk_level = "Moderado / Hallazgo a Observar"
        risk_color = "amber"
    elif malignant_prob < 0.80:
        risk_level = "Alto / Sospecha Maligna"
        risk_color = "rose"
    else:
        risk_level = "Crítico / Alta Sospecha Maligna"
        risk_color = "red"

    return {
        "diagnosis": diagnosis,
        "prediction_code": pred_idx,
        "probability_benign": round(benign_prob * 100, 2),
        "probability_malignant": round(malignant_prob * 100, 2),
        "confidence": round(confidence * 100, 2),
        "risk_level": risk_level,
        "risk_color": risk_color
    }

@app.post("/api/predict")
def predict_diagnosis(payload: PredictionRequest):
    if not loaded_pipelines:
        raise HTTPException(status_code=503, detail="No hay modelos disponibles en el servidor.")

    selected_model_id = payload.model_id or "reg_bin"
    if selected_model_id != "all" and selected_model_id not in loaded_pipelines:
        # Fallback al primer modelo disponible
        selected_model_id = next(iter(loaded_pipelines.keys()))

    features_dict = payload.features
    expected_features = metadata.get("features", [])
    feature_stats = metadata.get("feature_stats", {})

    # Preparar vector de características
    input_values = []
    comparison = {}

    for feat in expected_features:
        if feat in features_dict and features_dict[feat] is not None:
            val = float(features_dict[feat])
        else:
            val = float(feature_stats.get(feat, {}).get("mean", 0.0))
        input_values.append(val)

        stats = feature_stats.get(feat, {})
        b_mean = stats.get("benign_mean", 0)
        m_mean = stats.get("malignant_mean", 0)
        comparison[feat] = {
            "value": val,
            "benign_mean": b_mean,
            "malignant_mean": m_mean,
            "is_above_benign": val > b_mean if b_mean else False
        }

    input_df = pd.DataFrame([input_values], columns=expected_features)

    # Inferencia en los 3 modelos para consenso comparativo
    all_results = {}
    for mid, pipe in loaded_pipelines.items():
        all_results[mid] = {
            **run_single_inference(pipe, input_df),
            "name": MODEL_CONFIGS[mid]["name"],
            "short_name": MODEL_CONFIGS[mid]["short_name"]
        }

    # Evaluar consenso
    malignant_votes = sum(1 for res in all_results.values() if res["diagnosis"] == "Maligno")
    total_votes = len(all_results)
    benign_votes = total_votes - malignant_votes

    consensus_diagnosis = "Maligno" if malignant_votes > (total_votes / 2) else "Benigno"
    is_unanimous = (malignant_votes == total_votes) or (benign_votes == total_votes)

    # Desviaciones clave de la muestra (Z-score sobre benignos)
    driving_factors = []
    for feat in expected_features:
        stats = feature_stats.get(feat, {})
        std = stats.get("benign_std", 1.0) or 1.0
        b_mean = stats.get("benign_mean", 0.0)
        val = features_dict.get(feat, b_mean)
        z_score = (val - b_mean) / std
        if abs(z_score) > 1.2:
            driving_factors.append({
                "feature": feat,
                "value": val,
                "benign_mean": b_mean,
                "deviation_z": round(float(z_score), 2),
                "direction": "Mayor a lo benigno" if z_score > 0 else "Menor a lo benigno"
            })

    driving_factors.sort(key=lambda x: abs(x["deviation_z"]), reverse=True)

    # Resultado principal
    if selected_model_id == "all":
        primary_result = all_results.get("reg_bin") or next(iter(all_results.values()))
        active_model_name = "Consenso Multi-Modelo"
    else:
        primary_result = all_results.get(selected_model_id, next(iter(all_results.values())))
        active_model_name = MODEL_CONFIGS.get(selected_model_id, {}).get("name", selected_model_id)

    return {
        **primary_result,
        "selected_model": selected_model_id,
        "active_model_name": active_model_name,
        "multi_model_summary": all_results,
        "consensus": {
            "unanimous": is_unanimous,
            "consensus_diagnosis": consensus_diagnosis,
            "malignant_votes": malignant_votes,
            "benign_votes": benign_votes,
            "total_models": total_votes,
            "agreement_percentage": round((max(malignant_votes, benign_votes) / total_votes) * 100, 1)
        },
        "top_deviations": driving_factors[:6],
        "comparison": comparison
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
