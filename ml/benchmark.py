"""Comparación amplia de familias de modelos con validación cruzada anidada.

Justifica por qué la API usa SVM y regresión logística: se evalúan también modelos de
árboles y KNN, ajustando hiperparámetros dentro de cada fold externo (sin fuga de datos).

Uso (desde la raíz del repositorio, tarda varios minutos):
    python -m ml.benchmark
"""

import logging

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import brier_score_loss, recall_score, roc_auc_score
from sklearn.model_selection import GridSearchCV, RepeatedStratifiedKFold, StratifiedKFold
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from ml import config
from ml.candidates import CANDIDATES
from ml.data import load_dataset
from ml.evaluation import expected_calibration_error

log = logging.getLogger("ml.benchmark")

OUTER_REPEATS = 3

# La rejilla completa del SVM calibrado (121 combinaciones) hace la validación anidada muy lenta;
# aquí se usa una rejilla más gruesa que cubre la región donde está el óptimo.
GRID_OVERRIDES = {
    "svm": {"clf__estimator__C": np.logspace(-1, 3, 5), "clf__estimator__gamma": np.logspace(-4, -1, 4)},
}

EXTRA_FAMILIES = {
    "random_forest": (
        RandomForestClassifier(n_estimators=400, random_state=config.RANDOM_STATE),
        {"max_features": ["sqrt", 0.3], "min_samples_leaf": [1, 3]},
    ),
    "gradient_boosting": (
        HistGradientBoostingClassifier(random_state=config.RANDOM_STATE),
        {"learning_rate": [0.05, 0.1], "max_depth": [None, 3]},
    ),
    "knn": (
        Pipeline([("scaler", StandardScaler()), ("clf", KNeighborsClassifier())]),
        {"clf__n_neighbors": [5, 9, 15], "clf__weights": ["uniform", "distance"]},
    ),
}


def nested_cv(estimator, grid, X, y) -> dict:
    outer = RepeatedStratifiedKFold(n_splits=5, n_repeats=OUTER_REPEATS, random_state=config.RANDOM_STATE)
    inner = StratifiedKFold(5, shuffle=True, random_state=config.RANDOM_STATE)
    proba = np.zeros((OUTER_REPEATS, len(y)))
    for i, (train_idx, val_idx) in enumerate(outer.split(X, y)):
        search = GridSearchCV(estimator, grid, scoring="neg_log_loss", cv=inner, n_jobs=-1)
        search.fit(X.iloc[train_idx], y.iloc[train_idx])
        proba[i // 5, val_idx] = search.predict_proba(X.iloc[val_idx])[:, 1]
    y = np.asarray(y)
    return {
        "roc_auc": np.mean([roc_auc_score(y, p) for p in proba]),
        "brier": np.mean([brier_score_loss(y, p) for p in proba]),
        "ece": np.mean([expected_calibration_error(y, p) for p in proba]),
        "recall_0_5": np.mean([recall_score(y, p >= 0.5) for p in proba]),
    }


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    data = load_dataset()
    families = {c.id: (c.pipeline, GRID_OVERRIDES.get(c.id, c.param_grid)) for c in CANDIDATES} | EXTRA_FAMILIES

    rows = []
    for name, (estimator, grid) in families.items():
        log.info("Evaluando %s", name)
        rows.append((name, nested_cv(estimator, grid, data.X_train, data.y_train)))
    rows.sort(key=lambda r: r[1]["brier"])

    lines = [
        "# Benchmark de familias de modelos",
        "",
        "> Archivo generado por `python -m ml.benchmark`. No editar a mano.",
        "",
        f"Validación cruzada anidada sobre el entrenamiento ({len(data.y_train)} biopsias): "
        f"5 folds externos × {OUTER_REPEATS} repeticiones, hiperparámetros ajustados por log-loss "
        "con 5 folds internos (rejilla del SVM reducida a 20 combinaciones). El test no se usa.",
        "",
        "| Modelo | Brier (↓) | ECE (↓) | ROC-AUC | Sensibilidad @ 0.5 |",
        "|---|---|---|---|---|",
        *[f"| `{n}` | {m['brier']:.4f} | {m['ece']:.4f} | {m['roc_auc']:.4f} | {m['recall_0_5'] * 100:.1f}% |"
          for n, m in rows],
        "",
    ]
    path = config.REPORTS_DIR / "benchmark.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    log.info("Informe escrito en %s", path)


if __name__ == "__main__":
    main()
