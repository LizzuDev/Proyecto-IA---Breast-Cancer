"""
Script de entrenamiento para el Modelo de Diagnóstico de Cáncer de Mama (Wisconsin Dataset)
Utiliza Scikit-Learn y Joblib para serializar el modelo y sus metadatos.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

def train_and_export():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "..", "data", "data.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    print(f"Cargando dataset desde: {data_path}")
    df = pd.read_csv(data_path)

    # Limpiar columnas no necesarias
    cols_to_drop = [c for c in df.columns if c.lower() in ['id', 'unnamed: 32', ''] or 'unnamed' in c.lower()]
    df = df.drop(columns=cols_to_drop)

    print(f"Dimensiones del dataset tras limpieza: {df.shape}")

    # Separar variable objetivo y características
    target_col = 'diagnosis'
    y = df[target_col].map({'M': 1, 'B': 0})
    X = df.drop(columns=[target_col])
    feature_names = list(X.columns)

    # Separación Train / Test estratificada
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Muestras de entrenamiento: {len(X_train)} | Muestras de prueba: {len(X_test)}")

    # Probar modelo LogisticRegression y RandomForest
    lr_pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(random_state=42, max_iter=1000, C=1.0))
    ])
    lr_pipe.fit(X_train, y_train)
    lr_preds = lr_pipe.predict(X_test)
    lr_acc = accuracy_score(y_test, lr_preds)

    rf_pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=150, max_depth=6, random_state=42))
    ])
    rf_pipe.fit(X_train, y_train)
    rf_preds = rf_pipe.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_preds)

    print(f"Precisión Logistic Regression: {lr_acc * 100:.2f}%")
    print(f"Precisión Random Forest: {rf_acc * 100:.2f}%")

    # Seleccionar el mejor modelo o RandomForest por interpretabilidad de árboles
    best_pipe = rf_pipe if rf_acc >= lr_acc else lr_pipe
    model_name = "RandomForestClassifier" if best_pipe == rf_pipe else "LogisticRegression"
    print(f"Modelo seleccionado: {model_name}")

    y_pred = best_pipe.predict(X_test)
    y_prob = best_pipe.predict_proba(X_test)[:, 1]

    # Calcular métricas
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n--- Reporte de Clasificación ---")
    print(classification_report(y_test, y_pred, target_names=['Benigno', 'Maligno']))
    print(f"Matriz de Confusión: {cm}")
    print(f"ROC-AUC: {auc:.4f}")

    # Calcular importancia de variables
    if model_name == "RandomForestClassifier":
        importances = best_pipe.named_steps['classifier'].feature_importances_
    else:
        importances = np.abs(best_pipe.named_steps['classifier'].coef_[0])
        importances = importances / np.sum(importances)

    feature_importance_list = [
        {"feature": name, "importance": float(imp)}
        for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    ]

    # Estadísticas por clase para referencias visuales en el frontend
    benign_df = df[df['diagnosis'] == 'B'].drop(columns=['diagnosis'])
    malignant_df = df[df['diagnosis'] == 'M'].drop(columns=['diagnosis'])

    feature_stats = {}
    for col in feature_names:
        feature_stats[col] = {
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "mean": float(df[col].mean()),
            "std": float(df[col].std()),
            "benign_mean": float(benign_df[col].mean()),
            "benign_std": float(benign_df[col].std()),
            "malignant_mean": float(malignant_df[col].mean()),
            "malignant_std": float(malignant_df[col].std()),
        }

    # Casos de prueba reales para preset buttons en la interfaz
    benign_samples = []
    malignant_samples = []

    test_indices = X_test.index
    for idx in test_indices:
        real_diag = df.loc[idx, 'diagnosis']
        row_dict = {col: float(df.loc[idx, col]) for col in feature_names}
        if real_diag == 'B' and len(benign_samples) < 3:
            benign_samples.append({
                "label": f"Caso Benigno Real #{len(benign_samples)+1}",
                "real_diagnosis": "Benigno",
                "features": row_dict
            })
        elif real_diag == 'M' and len(malignant_samples) < 3:
            malignant_samples.append({
                "label": f"Caso Maligno Real #{len(malignant_samples)+1}",
                "real_diagnosis": "Maligno",
                "features": row_dict
            })
        if len(benign_samples) >= 3 and len(malignant_samples) >= 3:
            break

    # Serializar modelo con joblib
    model_file = os.path.join(models_dir, "breast_cancer_model.joblib")
    joblib.dump(best_pipe, model_file)
    print(f"Modelo guardado exitosamente con joblib en: {model_file}")

    # Guardar metadatos en JSON para consumo de la API y Frontend
    metadata = {
        "model_name": model_name,
        "features": feature_names,
        "n_samples": len(df),
        "n_features": len(feature_names),
        "metrics": {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "roc_auc": float(auc),
            "confusion_matrix": {
                "true_negative": cm[0][0],
                "false_positive": cm[0][1],
                "false_negative": cm[1][0],
                "true_positive": cm[1][1]
            }
        },
        "feature_importances": feature_importance_list,
        "feature_stats": feature_stats,
        "sample_cases": {
            "benign": benign_samples,
            "malignant": malignant_samples
        }
    }

    metadata_file = os.path.join(models_dir, "metadata.json")
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Metadatos guardados en: {metadata_file}")

if __name__ == "__main__":
    train_and_export()
