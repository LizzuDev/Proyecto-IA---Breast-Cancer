"""Entrena, calibra, selecciona y exporta los modelos que sirve la API.

Uso (desde la raíz del repositorio):
    python -m ml.train

Metodología:
1. Split estratificado 80/20. El test se usa una sola vez, al final.
2. Hiperparámetros con GridSearchCV (5 folds) optimizando log-loss, una regla de
   puntuación propia que premia probabilidades bien calibradas, no solo acertar la clase.
3. Validación cruzada repetida (5x5) sobre entrenamiento para medir calibración y
   fijar un umbral clínico que alcance la sensibilidad objetivo.
4. El modelo principal es el de menor Brier score en esa validación cruzada.
5. Se exportan los pipelines, las métricas y un informe en Markdown.
"""

import json
import logging
import platform
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.model_selection import GridSearchCV, StratifiedKFold

from ml import config
from ml.candidates import CANDIDATES, Candidate
from ml.data import Dataset, load_dataset
from ml.evaluation import (
    classification_metrics,
    clinical_threshold,
    out_of_fold_probabilities,
    probability_metrics,
    reliability_curve,
    summarize_cv,
)
from ml.report import write_report

log = logging.getLogger("ml.train")


def _to_builtin(value):
    return value.item() if hasattr(value, "item") else value


def train_candidate(candidate: Candidate, data: Dataset) -> dict:
    log.info("Ajustando %s", candidate.id)
    search = GridSearchCV(
        candidate.pipeline,
        candidate.param_grid,
        scoring="neg_log_loss",
        cv=StratifiedKFold(config.TUNING_FOLDS, shuffle=True, random_state=config.RANDOM_STATE),
        n_jobs=-1,
    ).fit(data.X_train, data.y_train)
    model = search.best_estimator_

    oof = out_of_fold_probabilities(model, data.X_train, data.y_train)
    threshold = clinical_threshold(oof)
    test_proba = model.predict_proba(data.X_test)[:, 1]

    return {
        "candidate": candidate,
        "pipeline": model,
        "best_hyperparameters": {k: _to_builtin(v) for k, v in search.best_params_.items()},
        "threshold": threshold,
        "cv": summarize_cv(oof, threshold),
        "calibration_curve": reliability_curve(oof.y_true, oof.mean_proba),
        "test": {**probability_metrics(data.y_test, test_proba),
                 **classification_metrics(data.y_test, test_proba, threshold)},
        "test_default_threshold": classification_metrics(data.y_test, test_proba, 0.5),
    }


def feature_stats(data: Dataset) -> dict:
    stats = {}
    benign, malignant = data.X[data.y == 0], data.X[data.y == 1]
    for feat in data.features:
        stats[feat] = {
            "min": float(data.X[feat].min()), "max": float(data.X[feat].max()),
            "mean": float(data.X[feat].mean()), "std": float(data.X[feat].std()),
            "benign_mean": float(benign[feat].mean()), "benign_std": float(benign[feat].std()),
            "malignant_mean": float(malignant[feat].mean()), "malignant_std": float(malignant[feat].std()),
        }
    return stats


def sample_cases(data: Dataset) -> dict:
    by_id = data.raw.set_index("id")
    cases = {}
    for group, ids in config.SAMPLE_CASE_IDS.items():
        label = "Benigno" if group == "benign" else "Maligno"
        cases[group] = [
            {
                "id": int(case_id),
                "label": f"Caso {label} Real #{i}",
                "real_diagnosis": label,
                "features": {f: float(by_id.loc[case_id, f]) for f in data.features},
            }
            for i, case_id in enumerate(ids, start=1)
        ]
    return cases


def dataset_summary(data: Dataset) -> dict:
    return {
        "total": int(len(data.y)),
        "benign": int((data.y == 0).sum()),
        "malignant": int((data.y == 1).sum()),
        "train": int(len(data.y_train)),
        "test": int(len(data.y_test)),
        "test_benign": int((data.y_test == 0).sum()),
        "test_malignant": int((data.y_test == 1).sum()),
        "n_features": len(data.features),
    }


def model_summary(result: dict, is_primary: bool) -> dict:
    c: Candidate = result["candidate"]
    return {
        "id": c.id,
        "name": c.name,
        "short_name": c.short_name,
        "description": c.description,
        "is_recommended": is_primary,
        "best_hyperparameters": result["best_hyperparameters"],
        "threshold": result["threshold"],
        "test": result["test"],
        "test_default_threshold": result["test_default_threshold"],
        "cv": result["cv"],
        "calibration_curve": result["calibration_curve"],
    }


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    np.random.seed(config.RANDOM_STATE)
    data = load_dataset()

    results = [train_candidate(c, data) for c in CANDIDATES]
    primary = min(results, key=lambda r: r["cv"]["brier"]["mean"])
    primary_id = primary["candidate"].id
    log.info("Modelo principal: %s", primary_id)

    models_dir = config.ARTIFACTS_DIR / "models"
    for r in results:
        model_dir = models_dir / r["candidate"].id
        model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(r["pipeline"], model_dir / "pipeline.joblib")

    comparison = {
        "dataset": dataset_summary(data),
        "primary_model": primary_id,
        "target_recall": config.TARGET_RECALL,
        "selection_criterion": "Menor Brier score en validación cruzada repetida 5x5 sobre entrenamiento.",
        "models": [model_summary(r, r is primary) for r in results],
    }
    write_json(config.ARTIFACTS_DIR / "comparison.json", comparison)
    write_json(config.ARTIFACTS_DIR / "metadata.json", {
        "features": data.features,
        "feature_stats": feature_stats(data),
        "sample_cases": sample_cases(data),
        "training": {
            "python": platform.python_version(),
            "scikit_learn": sklearn.__version__,
            "random_state": config.RANDOM_STATE,
        },
    })
    write_report(comparison, config.REPORTS_DIR / "model_selection.md")
    log.info("Artefactos escritos en %s", config.ARTIFACTS_DIR)


if __name__ == "__main__":
    main()
