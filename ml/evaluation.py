"""Métricas de discriminación, calibración y elección del umbral clínico."""

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import RepeatedStratifiedKFold

from ml import config


def expected_calibration_error(y_true, proba, n_bins: int = config.CALIBRATION_BINS) -> float:
    """ECE: diferencia media ponderada entre probabilidad predicha y frecuencia observada."""
    y_true, proba = np.asarray(y_true), np.asarray(proba)
    bins = np.minimum((proba * n_bins).astype(int), n_bins - 1)
    error = 0.0
    for b in range(n_bins):
        mask = bins == b
        if mask.any():
            error += mask.mean() * abs(y_true[mask].mean() - proba[mask].mean())
    return float(error)


def reliability_curve(y_true, proba, n_bins: int = config.RELIABILITY_BINS) -> list[dict]:
    """Puntos del diagrama de fiabilidad (solo bins con casos)."""
    y_true, proba = np.asarray(y_true), np.asarray(proba)
    bins = np.minimum((proba * n_bins).astype(int), n_bins - 1)
    curve = []
    for b in range(n_bins):
        mask = bins == b
        if mask.any():
            curve.append({
                "bin_start": round(b / n_bins, 2),
                "bin_end": round((b + 1) / n_bins, 2),
                "mean_predicted": round(float(proba[mask].mean()), 4),
                "observed_frequency": round(float(y_true[mask].mean()), 4),
                "count": int(mask.sum()),
            })
    return curve


def classification_metrics(y_true, proba, threshold: float) -> dict:
    """Métricas de un punto de corte concreto."""
    y_true = np.asarray(y_true)
    pred = (np.asarray(proba) >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    return {
        "threshold": round(float(threshold), 4),
        "accuracy": float(accuracy_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred)),
        "specificity": float(tn / (tn + fp)),
        "f1": float(f1_score(y_true, pred)),
        "confusion_matrix": {
            "true_negative": int(tn), "false_positive": int(fp),
            "false_negative": int(fn), "true_positive": int(tp),
        },
    }


def probability_metrics(y_true, proba) -> dict:
    """Métricas que no dependen del umbral: discriminación y calibración."""
    proba = np.clip(np.asarray(proba), 1e-7, 1 - 1e-7)
    return {
        "roc_auc": float(roc_auc_score(y_true, proba)),
        "brier": float(brier_score_loss(y_true, proba)),
        "log_loss": float(log_loss(y_true, proba)),
        "ece": expected_calibration_error(y_true, proba),
    }


@dataclass(frozen=True)
class OutOfFold:
    """Probabilidades fuera de fold de una validación cruzada repetida."""
    y_true: np.ndarray
    proba: np.ndarray  # forma (repeticiones, muestras)

    @property
    def mean_proba(self) -> np.ndarray:
        return self.proba.mean(axis=0)

    def per_repeat(self, fn) -> list[float]:
        return [fn(self.y_true, p) for p in self.proba]


def out_of_fold_probabilities(estimator, X: pd.DataFrame, y: pd.Series) -> OutOfFold:
    cv = RepeatedStratifiedKFold(
        n_splits=config.EVAL_FOLDS, n_repeats=config.EVAL_REPEATS, random_state=config.RANDOM_STATE
    )
    proba = np.zeros((config.EVAL_REPEATS, len(y)))
    for i, (train_idx, val_idx) in enumerate(cv.split(X, y)):
        model = clone(estimator).fit(X.iloc[train_idx], y.iloc[train_idx])
        proba[i // config.EVAL_FOLDS, val_idx] = model.predict_proba(X.iloc[val_idx])[:, 1]
    return OutOfFold(np.asarray(y), proba)


def threshold_for_recall(y_true, proba, target: float = config.TARGET_RECALL) -> float:
    """Mayor umbral que mantiene una sensibilidad >= target."""
    y_true, proba = np.asarray(y_true), np.asarray(proba)
    malignant = np.sort(proba[y_true == 1])
    allowed_misses = int(np.floor((1 - target) * len(malignant) + 1e-9))  # tolerancia de coma flotante
    return float(malignant[allowed_misses])


def clinical_threshold(oof: OutOfFold) -> float:
    """Mediana entre repeticiones del umbral que alcanza la sensibilidad objetivo."""
    thresholds = oof.per_repeat(threshold_for_recall)
    return float(min(np.median(thresholds), config.MAX_THRESHOLD))


def summarize_cv(oof: OutOfFold, threshold: float) -> dict:
    """Media y desviación entre repeticiones de las métricas fuera de fold."""
    def stats(values):
        return {"mean": float(np.mean(values)), "std": float(np.std(values))}

    return {
        "roc_auc": stats(oof.per_repeat(roc_auc_score)),
        "brier": stats(oof.per_repeat(brier_score_loss)),
        "ece": stats(oof.per_repeat(expected_calibration_error)),
        "recall_at_threshold": stats(oof.per_repeat(lambda y, p: recall_score(y, p >= threshold))),
        "specificity_at_threshold": stats(oof.per_repeat(
            lambda y, p: classification_metrics(y, p, threshold)["specificity"])),
        "recall_at_0_5": stats(oof.per_repeat(lambda y, p: recall_score(y, p >= 0.5))),
    }
