"""
Suite de pruebas de la API de inferencia (FastAPI).

Ejecutar desde la raíz del repositorio:
    pip install -r backend/requirements.txt pytest httpx
    pytest backend/tests -v
"""

import os
import sys

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sklearn.metrics import (accuracy_score, confusion_matrix, precision_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BACKEND_DIR, "..", "data", "data.csv")
sys.path.insert(0, BACKEND_DIR)

import app as api  # noqa: E402

MODEL_IDS = ["reg_bin", "svm", "log_pol"]


@pytest.fixture(scope="session")
def client():
    return TestClient(api.app)


@pytest.fixture(scope="session")
def dataset():
    df = pd.read_csv(DATA_PATH)
    df = df.drop(columns=["id"] + [c for c in df.columns if c.startswith("Unnamed")])
    X = df.drop(columns="diagnosis")
    y = df["diagnosis"].map({"B": 0, "M": 1})
    return X, y


@pytest.fixture(scope="session")
def test_split(dataset):
    X, y = dataset
    # Mismo split que los notebooks de entrenamiento
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    return X_test, y_test


@pytest.fixture(scope="session")
def samples(client):
    return client.get("/api/samples").json()


def feature_mean(name):
    return api.metadata["feature_stats"][name]["mean"]


def predict(client, features, model_id="reg_bin"):
    res = client.post("/api/predict", json={"features": features, "model_id": model_id})
    assert res.status_code == 200, res.text
    return res.json()


# ---------------------------------------------------------------------------
# Dataset y artefactos
# ---------------------------------------------------------------------------

class TestDatasetAndArtifacts:
    def test_dataset_shape_and_classes(self, dataset):
        X, y = dataset
        assert X.shape == (569, 30)
        assert int((y == 0).sum()) == 357
        assert int((y == 1).sum()) == 212
        assert not X.isna().any().any()

    def test_test_split_size_matches_reported(self, test_split):
        X_test, y_test = test_split
        assert len(X_test) == 114
        assert int((y_test == 0).sum()) == 72
        assert int((y_test == 1).sum()) == 42

    def test_all_pipelines_loaded(self):
        assert sorted(api.loaded_pipelines) == sorted(MODEL_IDS)
        assert sorted(api.loaded_metrics) == sorted(MODEL_IDS)

    def test_metadata_features_match_dataset_columns(self, dataset):
        X, _ = dataset
        assert api.metadata["features"] == list(X.columns)
        assert api.metadata["n_samples"] == 569
        assert api.metadata["n_features"] == 30

    def test_feature_stats_are_consistent(self, dataset):
        X, y = dataset
        for feat, stats in api.metadata["feature_stats"].items():
            assert stats["min"] <= stats["mean"] <= stats["max"], feat
            assert stats["benign_mean"] == pytest.approx(X.loc[y == 0, feat].mean(), rel=1e-3)
            assert stats["malignant_mean"] == pytest.approx(X.loc[y == 1, feat].mean(), rel=1e-3)

    @pytest.mark.parametrize("model_id", MODEL_IDS)
    def test_pipeline_reproduces_reported_test_metrics(self, model_id, test_split):
        """Las métricas de metricas.json deben poder reproducirse con el pickle y data.csv."""
        X_test, y_test = test_split
        pipe = api.loaded_pipelines[model_id]
        reported = api.loaded_metrics[model_id]
        pred = pipe.predict(X_test)
        proba = pipe.predict_proba(X_test)[:, 1]
        tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()

        assert fn == reported["falsos_negativos"]
        assert fp == reported["falsos_positivos"]
        assert accuracy_score(y_test, pred) == pytest.approx(reported["test"]["accuracy"], abs=1e-6)
        assert precision_score(y_test, pred) == pytest.approx(reported["test"]["precision"], abs=1e-6)
        assert recall_score(y_test, pred) == pytest.approx(reported["test"]["recall"], abs=1e-6)
        assert roc_auc_score(y_test, proba) == pytest.approx(reported["test"]["roc_auc"], abs=1e-4)


# ---------------------------------------------------------------------------
# Endpoints de lectura
# ---------------------------------------------------------------------------

class TestReadEndpoints:
    def test_health(self, client):
        body = client.get("/api/health").json()
        assert body["status"] == "healthy"
        assert sorted(body["loaded_models"]) == sorted(MODEL_IDS)
        assert body["recommended_model"] == "reg_bin"
        assert body["features_count"] == 30

    def test_metadata(self, client):
        res = client.get("/api/metadata")
        assert res.status_code == 200
        assert len(res.json()["features"]) == 30

    def test_samples_structure(self, samples):
        assert set(samples) == {"benign", "malignant"}
        for group, expected in (("benign", "B"), ("malignant", "M")):
            assert len(samples[group]) >= 1
            for case in samples[group]:
                assert set(case["features"]) == set(api.metadata["features"])
                assert case["real_diagnosis"] in (expected, "Benigno" if expected == "B" else "Maligno")

    def test_cors_headers(self, client):
        res = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
        assert res.headers.get("access-control-allow-origin") in ("*", "http://localhost:5173")

    def test_comparison_shape(self, client):
        body = client.get("/api/models/comparison").json()
        assert body["primary_recommendation"] == "reg_bin"
        assert [m["id"] for m in body["models"]] == MODEL_IDS
        recommended = [m["id"] for m in body["models"] if m["is_recommended"]]
        assert recommended == ["reg_bin"]

    @pytest.mark.parametrize("model_id", MODEL_IDS)
    def test_comparison_matches_metric_files(self, client, model_id):
        body = client.get("/api/models/comparison").json()
        m = next(x for x in body["models"] if x["id"] == model_id)
        raw = api.loaded_metrics[model_id]
        assert m["is_loaded"] is True
        assert m["test_recall"] == round(raw["test"]["recall"] * 100, 2)
        assert m["test_accuracy"] == round(raw["test"]["accuracy"] * 100, 2)
        cm = m["confusion_matrix"]
        assert cm["true_positive"] + cm["false_negative"] == 42
        assert cm["true_negative"] + cm["false_positive"] == 72
        assert cm["false_negative"] == raw["falsos_negativos"]

    def test_recommended_model_has_fewest_false_negatives(self, client):
        models = client.get("/api/models/comparison").json()["models"]
        best = min(models, key=lambda m: m["confusion_matrix"]["false_negative"])
        assert best["id"] == "reg_bin"

    def test_unknown_route_is_404(self, client):
        assert client.get("/api/no-existe").status_code == 404


# ---------------------------------------------------------------------------
# Predicción
# ---------------------------------------------------------------------------

class TestPredict:
    @pytest.mark.parametrize("model_id", MODEL_IDS + ["all"])
    def test_response_contract(self, client, samples, model_id):
        body = predict(client, samples["benign"][0]["features"], model_id)
        for key in ("diagnosis", "prediction_code", "probability_benign", "probability_malignant",
                    "confidence", "risk_level", "risk_color", "selected_model", "active_model_name",
                    "multi_model_summary", "consensus", "top_deviations", "comparison"):
            assert key in body, key
        assert body["selected_model"] == model_id
        assert sorted(body["multi_model_summary"]) == sorted(MODEL_IDS)
        assert len(body["comparison"]) == 30

    @pytest.mark.parametrize("group,expected", [("benign", "Benigno"), ("malignant", "Maligno")])
    def test_primary_model_classifies_every_sample_case(self, client, samples, group, expected):
        for case in samples[group]:
            assert predict(client, case["features"], "reg_bin")["diagnosis"] == expected

    @pytest.mark.parametrize("model_id", MODEL_IDS)
    @pytest.mark.parametrize("group,expected", [("benign", "Benigno"), ("malignant", "Maligno")])
    def test_first_sample_cases_are_clear_cut(self, client, samples, model_id, group, expected):
        """La UI carga samples[group][0]; esos casos deben ser inequívocos para los 3 modelos."""
        assert predict(client, samples[group][0]["features"], model_id)["diagnosis"] == expected

    def test_borderline_malignant_case_only_caught_by_primary_model(self, client, samples):
        """'Caso Maligno Real #2' es un tumor maligno límite: solo reg_bin lo detecta.
        Documenta por qué se prioriza la sensibilidad del modelo principal."""
        body = predict(client, samples["malignant"][1]["features"], "all")
        assert body["diagnosis"] == "Maligno"
        assert body["multi_model_summary"]["svm"]["diagnosis"] == "Benigno"
        assert body["multi_model_summary"]["log_pol"]["diagnosis"] == "Benigno"
        assert body["consensus"]["consensus_diagnosis"] == "Benigno"

    def test_probabilities_are_coherent(self, client, samples):
        for case in samples["benign"] + samples["malignant"]:
            body = predict(client, case["features"], "all")
            for res in [body] + list(body["multi_model_summary"].values()):
                assert res["probability_benign"] + res["probability_malignant"] == pytest.approx(100, abs=0.02)
                assert 0 <= res["probability_malignant"] <= 100
                assert res["confidence"] >= 50
                assert res["prediction_code"] == (1 if res["diagnosis"] == "Maligno" else 0)

    @pytest.mark.parametrize("model_id", MODEL_IDS)
    def test_api_matches_direct_pipeline_on_test_set(self, client, test_split, model_id):
        """La API debe dar exactamente lo mismo que el pipeline sobre filas reales."""
        X_test, _ = test_split
        pipe = api.loaded_pipelines[model_id]
        for _, row in X_test.head(25).iterrows():
            body = predict(client, row.to_dict(), model_id)
            direct = pipe.predict_proba(pd.DataFrame([row]))[0][1]
            assert body["probability_malignant"] == pytest.approx(round(direct * 100, 2), abs=0.01)

    def test_risk_level_thresholds(self, client, samples):
        def expected_color(p):
            if p < 20:
                return "emerald"
            if p < 50:
                return "amber"
            if p < 80:
                return "rose"
            return "red"

        for case in samples["benign"] + samples["malignant"]:
            body = predict(client, case["features"])
            assert body["risk_color"] == expected_color(body["probability_malignant"])

    def test_consensus_math(self, client, samples):
        for case in samples["benign"] + samples["malignant"]:
            body = predict(client, case["features"], "all")
            c = body["consensus"]
            votes = [r["diagnosis"] for r in body["multi_model_summary"].values()]
            assert c["malignant_votes"] == votes.count("Maligno")
            assert c["benign_votes"] == votes.count("Benigno")
            assert c["total_models"] == 3
            assert c["unanimous"] == (len(set(votes)) == 1)
            assert c["consensus_diagnosis"] == ("Maligno" if votes.count("Maligno") >= 2 else "Benigno")
            assert c["agreement_percentage"] == round(max(votes.count("Maligno"), votes.count("Benigno")) / 3 * 100, 1)

    def test_all_mode_uses_reg_bin_as_primary(self, client, samples):
        body = predict(client, samples["malignant"][0]["features"], "all")
        assert body["active_model_name"] == "Consenso Multi-Modelo"
        assert body["probability_malignant"] == body["multi_model_summary"]["reg_bin"]["probability_malignant"]

    def test_unknown_model_falls_back(self, client, samples):
        body = predict(client, samples["benign"][0]["features"], "modelo_inexistente")
        assert body["selected_model"] in MODEL_IDS

    def test_default_model_is_reg_bin(self, client, samples):
        res = client.post("/api/predict", json={"features": samples["benign"][0]["features"]})
        assert res.status_code == 200
        assert res.json()["selected_model"] == "reg_bin"

    def test_missing_features_are_filled_with_dataset_mean(self, client):
        body = predict(client, {"radius_mean": 12.0})
        assert body["comparison"]["radius_mean"]["value"] == 12.0
        assert body["comparison"]["area_mean"]["value"] == pytest.approx(feature_mean("area_mean"))

    def test_empty_features_returns_valid_prediction(self, client):
        body = predict(client, {})
        assert body["diagnosis"] in ("Benigno", "Maligno")

    def test_unknown_feature_keys_are_ignored(self, client, samples):
        feats = dict(samples["benign"][0]["features"], foo=999.0)
        base = predict(client, samples["benign"][0]["features"])
        assert predict(client, feats)["probability_malignant"] == base["probability_malignant"]

    def test_top_deviations_sorted_and_capped(self, client, samples):
        body = predict(client, samples["malignant"][0]["features"])
        devs = body["top_deviations"]
        assert len(devs) <= 6
        z = [abs(d["deviation_z"]) for d in devs]
        assert z == sorted(z, reverse=True)
        assert all(v > 1.2 for v in z)
        for d in devs:
            assert d["direction"] == ("Mayor a lo benigno" if d["deviation_z"] > 0 else "Menor a lo benigno")

    def test_malignant_case_deviates_more_than_benign(self, client, samples):
        mal = predict(client, samples["malignant"][0]["features"])["top_deviations"]
        ben = predict(client, samples["benign"][0]["features"])["top_deviations"]
        assert len(mal) >= len(ben)

    def test_monotonic_risk_with_size(self, client):
        """Aumentar radio/perímetro/área 'worst' no debería reducir la probabilidad de malignidad."""
        base = {f: feature_mean(f) for f in api.metadata["features"]}
        big = dict(base)
        for f in ("radius_worst", "perimeter_worst", "area_worst", "concave points_worst"):
            big[f] = api.metadata["feature_stats"][f]["max"]
        p_base = predict(client, base)["probability_malignant"]
        p_big = predict(client, big)["probability_malignant"]
        assert p_big >= p_base
        assert predict(client, big)["diagnosis"] == "Maligno"

    @pytest.mark.parametrize("payload", [
        {},
        {"features": "no-es-un-dict"},
        {"features": {"radius_mean": "abc"}},
        {"features": {"radius_mean": None}},
        {"features": [1, 2, 3]},
    ])
    def test_invalid_payload_returns_422(self, client, payload):
        assert client.post("/api/predict", json=payload).status_code == 422

    def test_numeric_strings_are_coerced(self, client):
        res = client.post("/api/predict", json={"features": {"radius_mean": "14.5"}})
        assert res.status_code == 200
        assert res.json()["comparison"]["radius_mean"]["value"] == 14.5

    def test_extreme_values_do_not_crash(self, client):
        for v in (0.0, -1.0, 1e6):
            body = predict(client, {f: v for f in api.metadata["features"]}, "all")
            assert np.isfinite(body["probability_malignant"])

    def test_no_models_returns_503(self, client, monkeypatch):
        monkeypatch.setattr(api, "loaded_pipelines", {})
        res = client.post("/api/predict", json={"features": {}})
        assert res.status_code == 503
