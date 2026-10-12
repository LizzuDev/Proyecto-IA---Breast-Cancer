"""Genera el informe de selección de modelos en Markdown."""

from pathlib import Path


def _pct(x: float) -> str:
    return f"{x * 100:.1f}%"


def _pm(stat: dict, pct: bool = False, digits: int = 4) -> str:
    if pct:
        return f"{stat['mean'] * 100:.1f}% ± {stat['std'] * 100:.1f}"
    return f"{stat['mean']:.{digits}f} ± {stat['std']:.{digits}f}"


def write_report(comparison: dict, path: Path) -> None:
    models = comparison["models"]
    ds = comparison["dataset"]
    primary = next(m for m in models if m["is_recommended"])
    target = comparison["target_recall"]
    ids = " | ".join(f"`{m['id']}`" for m in models)
    sep = "|".join(["---"] * (len(models) + 1))

    def row(label, fn):
        return f"| {label} | " + " | ".join(fn(m) for m in models) + " |"

    lines = [
        "# Selección y calibración de modelos",
        "",
        "> Archivo generado por `python -m ml.train`. No editar a mano.",
        "",
        f"Dataset: {ds['total']} biopsias ({ds['benign']} benignas / {ds['malignant']} malignas), "
        f"{ds['n_features']} variables. Split estratificado {ds['train']} / {ds['test']} "
        f"(test: {ds['test_benign']} benignas, {ds['test_malignant']} malignas).",
        "",
        "## Metodología",
        "",
        "1. Hiperparámetros con `GridSearchCV` (5 folds, solo entrenamiento) optimizando **log-loss**, "
        "que premia probabilidades bien calibradas.",
        "2. Validación cruzada repetida 5×5 sobre entrenamiento para medir calibración (Brier, ECE) "
        f"y fijar un **umbral clínico**: el mayor punto de corte con sensibilidad ≥ {_pct(target)}.",
        f"3. **Modelo principal:** {comparison['selection_criterion']}",
        "4. El conjunto de test se evalúa una sola vez con los modelos y umbrales ya fijados.",
        "",
        f"**Modelo principal elegido: `{primary['id']}` ({primary['name']})**, "
        f"umbral clínico {primary['threshold']:.3f}.",
        "",
        "## Validación cruzada 5×5 (entrenamiento)",
        "",
        f"| Métrica | {ids} |",
        f"|{sep}|",
        row("Brier (↓)", lambda m: _pm(m["cv"]["brier"])),
        row("ECE (↓)", lambda m: _pm(m["cv"]["ece"])),
        row("ROC-AUC", lambda m: _pm(m["cv"]["roc_auc"])),
        row("Umbral clínico", lambda m: f"{m['threshold']:.3f}"),
        row("Sensibilidad @ umbral", lambda m: _pm(m["cv"]["recall_at_threshold"], pct=True)),
        row("Especificidad @ umbral", lambda m: _pm(m["cv"]["specificity_at_threshold"], pct=True)),
        row("Sensibilidad @ 0.5", lambda m: _pm(m["cv"]["recall_at_0_5"], pct=True)),
        "",
        "## Test independiente (una sola evaluación)",
        "",
        f"| Métrica | {ids} |",
        f"|{sep}|",
        row("ROC-AUC", lambda m: f"{m['test']['roc_auc']:.4f}"),
        row("Brier", lambda m: f"{m['test']['brier']:.4f}"),
        row("Sensibilidad @ umbral", lambda m: _pct(m["test"]["recall"])),
        row("Especificidad @ umbral", lambda m: _pct(m["test"]["specificity"])),
        row("Falsos negativos @ umbral", lambda m: str(m["test"]["confusion_matrix"]["false_negative"])),
        row("Falsos positivos @ umbral", lambda m: str(m["test"]["confusion_matrix"]["false_positive"])),
        row("Falsos negativos @ 0.5", lambda m: str(m["test_default_threshold"]["confusion_matrix"]["false_negative"])),
        row("Falsos positivos @ 0.5", lambda m: str(m["test_default_threshold"]["confusion_matrix"]["false_positive"])),
        "",
        "## Hiperparámetros",
        "",
        *[f"- `{m['id']}`: " + ", ".join(f"`{k}={v:.4g}`" if isinstance(v, float) else f"`{k}={v}`"
                                         for k, v in m["best_hyperparameters"].items()) for m in models],
        "",
        "## Limitaciones",
        "",
        f"- El test tiene {ds['test_malignant']} malignos: un solo caso mueve la sensibilidad unos "
        f"{100 / ds['test_malignant']:.1f} puntos. Las diferencias de 1–2 casos no son concluyentes.",
        "- Un único dataset de una institución: no mide la generalización a otros centros.",
        "- Herramienta académica de apoyo; no es un dispositivo de diagnóstico.",
        "",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")
