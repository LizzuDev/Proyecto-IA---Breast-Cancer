"""Modelos candidatos y sus espacios de búsqueda.

Los tres comparten el mismo preprocesamiento dentro del Pipeline, de modo que el
escalado se ajusta solo con los datos de entrenamiento de cada fold.
"""

from dataclasses import dataclass, field
from typing import Any

import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.svm import SVC

from ml.config import RANDOM_STATE


@dataclass(frozen=True)
class Candidate:
    id: str
    name: str
    short_name: str
    description: str
    pipeline: Pipeline
    param_grid: dict[str, Any] = field(default_factory=dict)


def _logistic() -> LogisticRegression:
    return LogisticRegression(solver="liblinear", max_iter=5000, random_state=RANDOM_STATE)


CANDIDATES: list[Candidate] = [
    Candidate(
        id="reg_bin",
        name="Regresión Logística Binaria",
        short_name="Reg. Logística",
        description=(
            "Frontera lineal regularizada. Interpretable: cada coeficiente indica cuánto empuja "
            "una variable hacia maligno."
        ),
        pipeline=Pipeline([("scaler", StandardScaler()), ("clf", _logistic())]),
        param_grid={"clf__C": np.logspace(-3, 3, 25), "clf__l1_ratio": [0, 1]},
    ),
    Candidate(
        id="svm",
        name="Support Vector Machine (RBF)",
        short_name="SVM (RBF)",
        description="Frontera no lineal con kernel gaussiano y probabilidades calibradas por escalado de Platt.",
        pipeline=Pipeline([
            ("scaler", StandardScaler()),
            # Escalado de Platt con validación cruzada interna (sustituye a SVC(probability=True)).
            ("clf", CalibratedClassifierCV(SVC(kernel="rbf"), method="sigmoid", cv=5, ensemble=False)),
        ]),
        param_grid={"clf__estimator__C": np.logspace(-2, 3, 11), "clf__estimator__gamma": np.logspace(-5, 0, 11)},
    ),
    Candidate(
        id="log_pol",
        name="Regresión Logística Polinomial (Grado 2)",
        short_name="Reg. Polinomial",
        description="Añade términos cuadráticos e interacciones entre las 30 variables (495 en total).",
        pipeline=Pipeline([
            ("scaler", StandardScaler()),
            ("poly", PolynomialFeatures(degree=2, include_bias=False)),
            ("scaler_poly", StandardScaler()),
            ("clf", _logistic()),
        ]),
        param_grid={"clf__C": np.logspace(-3, 1, 9), "clf__l1_ratio": [0, 1]},
    ),
]
