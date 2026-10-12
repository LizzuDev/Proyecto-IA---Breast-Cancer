"""Pruebas del pipeline de entrenamiento y de los artefactos exportados."""

import json

import joblib
import numpy as np
import pytest
from sklearn.metrics import brier_score_loss, roc_auc_score

from ml import config
from ml.data import load_dataset
from ml.evaluation import classification_metrics, expected_calibration_error, reliability_curve, threshold_for_recall


@pytest.fixture(scope="module")
def data():
    return load_dataset()


@pytest.fixture(scope="module")
def comparison():
    return json.loads((config.ARTIFACTS_DIR / "comparison.json").read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------
# Datos
# ---------------------------------------------------------------------------

class TestData:
    def test_shape_and_classes(self, data):
        assert data.X.shape == (569, 30)
        assert int((data.y == 0).sum()) == 357
        assert int((data.y == 1).sum()) == 212
        assert "id" not in data.features

    def test_split_is_stratified_and_disjoint(self, data):
        assert len(data.X_train) == 455 and len(data.X_test) == 114
        assert int(data.y_test.sum()) == 42
        assert set(data.X_train.index).isdisjoint(data.X_test.index)
        assert abs(data.y_train.mean() - data.y_test.mean()) < 0.01

    def test_sample_cases_come_from_the_test_set(self, data):
        test_ids = set(data.raw.loc[data.X_test.index, "id"])
        for ids in config.SAMPLE_CASE_IDS.values():
            assert set(ids) <= test_ids


# ---------------------------------------------------------------------------
# Funciones de evaluación
# ---------------------------------------------------------------------------

class TestEvaluation:
    def test_threshold_for_recall_reaches_target(self):
        rng = np.random.default_rng(0)
        y = np.r_[np.zeros(200), np.ones(100)]
        p = np.r_[rng.uniform(0, 0.6, 200), rng.uniform(0.2, 1, 100)]
        for target in (0.9, 0.95, 0.98, 1.0):
            t = threshold_for_recall(y, p, target)
            assert ((p >= t) & (y == 1)).sum() / 100 >= target
            # Es el mayor umbral posible: subirlo un poco rompe el objetivo.
            assert ((p >= t + 1e-9) & (y == 1)).sum() / 100 < target or target == 0

    def test_ece_is_zero_for_perfect_calibration(self):
        p = np.repeat([0.1, 0.5, 0.9], 1000)
        y = np.r_[np.r_[np.ones(100), np.zeros(900)], np.r_[np.ones(500), np.zeros(500)],
                  np.r_[np.ones(900), np.zeros(100)]]
        assert expected_calibration_error(y, p) == pytest.approx(0, abs=1e-9)

    def test_ece_detects_overconfidence(self):
        y = np.r_[np.ones(500), np.zeros(500)]
        p = np.r_[np.full(500, 0.99), np.full(500, 0.99)]
        assert expected_calibration_error(y, p) == pytest.approx(0.49)

    def test_reliability_curve_counts_every_sample(self):
        p = np.linspace(0, 1, 101)
        y = (p > 0.5).astype(int)
        curve = reliability_curve(y, p)
        assert sum(b["count"] for b in curve) == 101

    def test_classification_metrics(self):
        y = np.array([0, 0, 1, 1])
        p = np.array([0.1, 0.6, 0.4, 0.9])
        m = classification_metrics(y, p, 0.5)
        assert m["confusion_matrix"] == {"true_negative": 1, "false_positive": 1,
                                         "false_negative": 1, "true_positive": 1}
        assert m["recall"] == 0.5 and m["specificity"] == 0.5


# ---------------------------------------------------------------------------
# Artefactos exportados
# ---------------------------------------------------------------------------

class TestArtifacts:
    def test_one_primary_model_with_lowest_cv_brier(self, comparison):
        models = comparison["models"]
        primary = [m for m in models if m["is_recommended"]]
        assert len(primary) == 1
        assert primary[0]["id"] == comparison["primary_model"]
        assert primary[0]["id"] == min(models, key=lambda m: m["cv"]["brier"]["mean"])["id"]

    def test_thresholds_are_clinical(self, comparison):
        for m in comparison["models"]:
            assert 0 < m["threshold"] <= config.MAX_THRESHOLD
            # El umbral clínico prioriza sensibilidad: nunca menos que con 0.5.
            assert m["test"]["recall"] >= m["test_default_threshold"]["recall"]
            assert m["cv"]["recall_at_threshold"]["mean"] >= config.TARGET_RECALL - 0.01

    def test_models_are_well_calibrated(self, comparison):
        for m in comparison["models"]:
            assert m["cv"]["ece"]["mean"] < 0.03, m["id"]
            assert m["cv"]["brier"]["mean"] < 0.03, m["id"]

    @pytest.mark.parametrize("model_id", ["reg_bin", "svm", "log_pol"])
    def test_reported_test_metrics_are_reproducible(self, comparison, data, model_id):
        entry = next(m for m in comparison["models"] if m["id"] == model_id)
        pipeline = joblib.load(config.ARTIFACTS_DIR / "models" / model_id / "pipeline.joblib")
        proba = pipeline.predict_proba(data.X_test)[:, 1]
        assert roc_auc_score(data.y_test, proba) == pytest.approx(entry["test"]["roc_auc"], abs=1e-9)
        assert brier_score_loss(data.y_test, proba) == pytest.approx(entry["test"]["brier"], abs=1e-9)
        recomputed = classification_metrics(data.y_test, proba, entry["threshold"])
        assert recomputed["confusion_matrix"] == entry["test"]["confusion_matrix"]

    def test_primary_model_beats_previous_selection(self, comparison):
        """El modelo anterior (reg_bin, C=0.0316, umbral 0.5) tenía 2 falsos negativos en test."""
        primary = next(m for m in comparison["models"] if m["is_recommended"])
        assert primary["test"]["confusion_matrix"]["false_negative"] <= 2
        assert primary["test"]["roc_auc"] >= 0.99

    def test_report_is_in_sync(self, comparison):
        report = (config.REPORTS_DIR / "model_selection.md").read_text(encoding="utf-8")
        assert f"`{comparison['primary_model']}`" in report
