"""
API REST con FastAPI para Inferencia del Modelo de Cáncer de Mama
Carga el modelo serializado con joblib y provee endpoints para el Frontend.
"""

import os
import json
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Breast Cancer AI Diagnostic API",
    description="API de predicción de biopsias de mama basada en Wisconsin Diagnostic Dataset",
    version="1.0.0"
)

# Habilitar CORS para permitir llamadas desde Vite (localhost:5173, localhost:3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "breast_cancer_model.joblib")
METADATA_PATH = os.path.join(BASE_DIR, "models", "metadata.json")

# Variables globales para cachear modelo y metadatos
model = None
metadata = {}

def load_artifacts():
    global model, metadata
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("Modelo joblib cargado exitosamente.")
    else:
        print(f"ADVERTENCIA: Modelo no encontrado en {MODEL_PATH}")

    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        print("Metadatos cargados exitosamente.")

load_artifacts()

class PredictionRequest(BaseModel):
    features: Dict[str, float]

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_name": metadata.get("model_name", "N/A"),
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

@app.post("/api/predict")
def predict_diagnosis(payload: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="El modelo no está disponible.")

    features_dict = payload.features
    expected_features = metadata.get("features", [])
    feature_stats = metadata.get("feature_stats", {})

    # Completar características faltantes con la media benigna por defecto si el usuario envió solo las clave
    input_values = []
    comparison = {}

    for feat in expected_features:
        if feat in features_dict and features_dict[feat] is not None:
            val = float(features_dict[feat])
        else:
            # Relleno con la media general
            val = float(feature_stats.get(feat, {}).get("mean", 0.0))
        input_values.append(val)

        # Generar comparativa con medias benigna y maligna
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

    # Inferencia
    prediction_idx = int(model.predict(input_df)[0])
    probabilities = model.predict_proba(input_df)[0]
    benign_prob = float(probabilities[0])
    malignant_prob = float(probabilities[1])

    diagnosis = "Maligno" if prediction_idx == 1 else "Benigno"
    confidence = malignant_prob if prediction_idx == 1 else benign_prob

    # Nivel de riesgo
    if malignant_prob < 0.20:
        risk_level = "Bajo"
        risk_color = "emerald"
    elif malignant_prob < 0.50:
        risk_level = "Moderado / En Observación"
        risk_color = "amber"
    elif malignant_prob < 0.80:
        risk_level = "Alto Sospechoso"
        risk_color = "rose"
    else:
        risk_level = "Crítico / Alta Sospecha"
        risk_color = "red"

    # Identificar factores de mayor desviación respecto a lo benigno
    driving_factors = []
    for feat in expected_features:
        stats = feature_stats.get(feat, {})
        std = stats.get("benign_std", 1.0) or 1.0
        b_mean = stats.get("benign_mean", 0.0)
        val = features_dict.get(feat, b_mean)
        # Z-score respecto a la población benigna
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

    return {
        "diagnosis": diagnosis,
        "prediction_code": prediction_idx,
        "probability_benign": round(benign_prob * 100, 2),
        "probability_malignant": round(malignant_prob * 100, 2),
        "confidence": round(confidence * 100, 2),
        "risk_level": risk_level,
        "risk_color": risk_color,
        "top_deviations": driving_factors[:6],
        "comparison": comparison
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
