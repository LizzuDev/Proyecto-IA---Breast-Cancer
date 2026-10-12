"""
Pruebas de la API de inferencia.

Ejecutar desde la raíz del repositorio:
    pip install -r backend/requirements-dev.txt
    pytest
"""

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from ml.data import load_dataset

MODEL_IDS = ["reg_bin", "svm", "log_pol"]


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def registry(client):
    return client.app.state.registry


@pytest.fixture(scope="session")
def data():
    return load_dataset()


@pytest.fixture(scope="session")
def samples(client):
    return client.get("/api/samples").json()


def predict(client, features, model_id="all"):
    res = client.post("/api/predict", json={"features": features, "model_id": model_id})
    assert res.status_code == 200, res.text
    return res.json()


# ---------------------------------------------------------------------------
# Endpoints de lectura
# ---------------------------------------------------------------------------

class TestReadEndpoints:
    def test_health(self, client, registry):
        body = client.get("/api/health").json()
        assert body["status"] == "healthy"
        assert sorted(body["loaded_models"]) == sorted(MODEL_IDS)
        assert body["recommended_model"] == registry.primary_id
        assert body["features_count"] == 30

    def test_metadata(self, client, data):
        body = client.get("/api/metadata").json()
        assert body["features"] == data.features
        assert set(body["feature_stats"]) == set(data.features)

    def test_samples_are_real_rows_of_the_dataset(self, samples, data):
        assert set(samples) == {"benign", "malignant"}
        by_id = data.raw.set_index("id")
        for group, label in (("benign", "B"), ("malignant", "M")):
            assert len(samples[group]) == 3
            for case in samples[group]:
                assert by_id.loc[case["id"], "diagnosis"] == label
                assert case["features"]["radius_mean"] == by_id.loc[case["id"], "radius_mean"]

    def test_comparison_is_the_exported_artifact(self, client, registry):
        body = client.get("/api/models/comparison").json()
        assert body == registry.comparison
        assert [m["id"] for m in body["models"]] == MODEL_IDS
        assert [m["id"] for m in body["models"] if m["is_recommended"]] == [body["primary_model"]]

    def test_comparison_confusion_matrices_add_up(self, client):
        body = client.get("/api/models/comparison").json()
        ds = body["dataset"]
        for m in body["models"]:
            cm = m["test"]["confusion_matrix"]
            assert cm["true_positive"] + cm["false_negative"] == ds["test_malignant"]
            assert cm["true_negative"] + cm["false_positive"] == ds["test_benign"]

    def test_cors_headers(self, client):
        res = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
        assert res.headers.get("access-control-allow-origin") in ("*", "http://localhost:5173")

    def test_unknown_route_is_404(self, client):
        assert client.get("/api/no-existe").status_code == 404


# ---------------------------------------------------------------------------
# Predicción
# ---------------------------------------------------------------------------

class TestPredict:
    @pytest.mark.parametrize("model_id", [*MODEL_IDS, "all"])
    def test_response_contract(self, client, samples, model_id):
        body = predict(client, samples["benign"][0]["features"], model_id)
        assert body["selected_model"] == model_id
        assert sorted(body["multi_model_summary"]) == sorted(MODEL_IDS)
        assert len(body["comparison"]) == 30
        assert 0 < body["threshold"] <= 50

    def test_default_model_is_consensus(self, client, samples, registry):
        res = client.post("/api/predict", json={"features": samples["benign"][0]["features"]})
        assert res.status_code == 200
        assert res.json()["selected_model"] == "all"
        assert res.json()["primary_model"] == registry.primary_id

    @pytest.mark.parametrize("group,expected", [("benign", "Benigno"), ("malignant", "Maligno")])
    def test_primary_model_classifies_every_sample_case(self, client, samples, group, expected):
        for case in samples[group]:
            assert predict(client, case["features"])["diagnosis"] == expected

    @pytest.mark.parametrize("model_id", MODEL_IDS)
    @pytest.mark.parametrize("group,expected", [("benign", "Benigno"), ("malignant", "Maligno")])
    def test_first_sample_cases_are_clear_cut(self, client, samples, model_id, group, expected):
        """La interfaz carga samples[group][0]; deben ser inequívocos para los tres modelos."""
        body = predict(client, samples[group][0]["features"], model_id)
        assert body["diagnosis"] == expected
        assert body["confidence"] > 90

    def test_diagnosis_follows_the_model_threshold(self, client, samples):
        for case in samples["benign"] + samples["malignant"]:
            for res in predict(client, case["features"])["multi_model_summary"].values():
                expected = "Maligno" if res["probability_malignant"] >= res["threshold"] else "Benigno"
                assert res["diagnosis"] == expected
                assert res["prediction_code"] == (1 if expected == "Maligno" else 0)

    def test_probabilities_are_coherent(self, client, samples):
        for case in samples["benign"] + samples["malignant"]:
            body = predict(client, case["features"])
            for res in [body, *body["multi_model_summary"].values()]:
                assert res["probability_benign"] + res["probability_malignant"] == pytest.approx(100, abs=0.02)
                assert res["confidence"] == max(res["probability_benign"], res["probability_malignant"])

    @pytest.mark.parametrize("model_id", MODEL_IDS)
    def test_api_matches_direct_pipeline_on_test_set(self, client, registry, data, model_id):
        pipeline = registry.models[model_id].pipeline
        for _, row in data.X_test.head(25).iterrows():
            body = predict(client, row.to_dict(), model_id)
            direct = pipeline.predict_proba(pd.DataFrame([row]))[0, 1]
            assert body["probability_malignant"] == pytest.approx(round(direct * 100, 2), abs=0.01)

    def test_risk_bands(self, client, samples):
        for case in samples["benign"] + samples["malignant"]:
            body = predict(client, case["features"])
            p, t = body["probability_malignant"], body["threshold"]
            expected = "emerald" if p < t / 2 else "amber" if p < t else "rose" if p < 80 else "red"
            assert body["risk_color"] == expected

    def test_consensus_math(self, client, samples):
        for case in samples["benign"] + samples["malignant"]:
            body = predict(client, case["features"])
            c = body["consensus"]
            votes = [r["diagnosis"] for r in body["multi_model_summary"].values()]
            assert c["malignant_votes"] == votes.count("Maligno")
            assert c["benign_votes"] == votes.count("Benigno")
            assert c["unanimous"] == (len(set(votes)) == 1)
            assert c["consensus_diagnosis"] == ("Maligno" if votes.count("Maligno") >= 2 else "Benigno")

    def test_consensus_mode_reports_primary_model(self, client, samples, registry):
        body = predict(client, samples["malignant"][0]["features"])
        assert body["active_model_name"] == "Consenso Multi-Modelo"
        primary = body["multi_model_summary"][registry.primary_id]
        assert body["probability_malignant"] == primary["probability_malignant"]

    def test_missing_features_are_filled_with_dataset_mean(self, client, registry):
        body = predict(client, {"radius_mean": 12.0})
        assert body["comparison"]["radius_mean"]["value"] == 12.0
        assert body["comparison"]["area_mean"]["value"] == pytest.approx(
            registry.feature_stats["area_mean"]["mean"])

    def test_unknown_feature_keys_are_ignored(self, client, samples):
        base = samples["benign"][0]["features"]
        assert (predict(client, {**base, "foo": 999.0})["probability_malignant"]
                == predict(client, base)["probability_malignant"])

    def test_top_deviations_sorted_and_capped(self, client, samples):
        devs = predict(client, samples["malignant"][0]["features"])["top_deviations"]
        z = [abs(d["deviation_z"]) for d in devs]
        assert 0 < len(devs) <= 6
        assert z == sorted(z, reverse=True)
        assert all(v > 1.2 for v in z)

    def test_larger_nuclei_increase_malignancy(self, client, registry):
        stats = registry.feature_stats
        base = {f: s["mean"] for f, s in stats.items()}
        big = {**base, **{f: stats[f]["max"] for f in
                          ("radius_worst", "perimeter_worst", "area_worst", "concave points_worst")}}
        assert predict(client, big)["probability_malignant"] >= predict(client, base)["probability_malignant"]
        assert predict(client, big)["diagnosis"] == "Maligno"

    def test_extreme_values_do_not_crash(self, client, registry):
        for v in (0.0, -1.0, 1e6):
            body = predict(client, dict.fromkeys(registry.features, v))
            assert np.isfinite(body["probability_malignant"])

    @pytest.mark.parametrize("payload", [
        {},
        {"features": "no-es-un-dict"},
        {"features": {"radius_mean": "abc"}},
        {"features": {"radius_mean": None}},
        {"features": [1, 2, 3]},
        {"features": {}, "model_id": "modelo_inexistente"},
    ])
    def test_invalid_payload_returns_422(self, client, payload):
        assert client.post("/api/predict", json=payload).status_code == 422

    def test_non_finite_values_return_422(self, client):
        body = '{"features": {"radius_mean": NaN}}'
        res = client.post("/api/predict", content=body, headers={"Content-Type": "application/json"})
        assert res.status_code == 422

    def test_numeric_strings_are_coerced(self, client):
        res = client.post("/api/predict", json={"features": {"radius_mean": "14.5"}})
        assert res.status_code == 200
        assert res.json()["comparison"]["radius_mean"]["value"] == 14.5


def test_returns_503_without_models(monkeypatch):
    """Sin registro cargado (p. ej. artefactos ausentes) la API responde 503, no 500."""
    bare = TestClient(app)  # sin `with`: no se ejecuta el lifespan
    monkeypatch.setattr(app.state, "registry", None, raising=False)
    assert bare.get("/api/health").status_code == 503
    assert bare.post("/api/predict", json={"features": {}}).status_code == 503
