# Selección y calibración de modelos

> Archivo generado por `python -m ml.train`. No editar a mano.

Dataset: 569 biopsias (357 benignas / 212 malignas), 30 variables. Split estratificado 455 / 114 (test: 72 benignas, 42 malignas).

## Metodología

1. Hiperparámetros con `GridSearchCV` (5 folds, solo entrenamiento) optimizando **log-loss**, que premia probabilidades bien calibradas.
2. Validación cruzada repetida 5×5 sobre entrenamiento para medir calibración (Brier, ECE) y fijar un **umbral clínico**: el mayor punto de corte con sensibilidad ≥ 98.0%.
3. **Modelo principal:** Menor Brier score en validación cruzada repetida 5x5 sobre entrenamiento.
4. El conjunto de test se evalúa una sola vez con los modelos y umbrales ya fijados.

**Modelo principal elegido: `svm` (Support Vector Machine (RBF))**, umbral clínico 0.243.

## Validación cruzada 5×5 (entrenamiento)

| Métrica | `reg_bin` | `svm` | `log_pol` |
|---|---|---|---|
| Brier (↓) | 0.0201 ± 0.0022 | 0.0191 ± 0.0011 | 0.0207 ± 0.0017 |
| ECE (↓) | 0.0149 ± 0.0034 | 0.0200 ± 0.0015 | 0.0180 ± 0.0026 |
| ROC-AUC | 0.9941 ± 0.0017 | 0.9946 ± 0.0011 | 0.9938 ± 0.0026 |
| Umbral clínico | 0.154 | 0.243 | 0.164 |
| Sensibilidad @ umbral | 98.1% ± 0.7 | 97.8% ± 0.7 | 98.0% ± 0.3 |
| Especificidad @ umbral | 93.8% ± 0.6 | 96.1% ± 0.5 | 93.7% ± 0.6 |
| Sensibilidad @ 0.5 | 95.4% ± 0.4 | 95.4% ± 0.6 | 95.6% ± 0.9 |

## Test independiente (una sola evaluación)

| Métrica | `reg_bin` | `svm` | `log_pol` |
|---|---|---|---|
| ROC-AUC | 0.9960 | 0.9960 | 0.9940 |
| Brier | 0.0211 | 0.0179 | 0.0313 |
| Sensibilidad @ umbral | 97.6% | 97.6% | 95.2% |
| Especificidad @ umbral | 94.4% | 98.6% | 95.8% |
| Falsos negativos @ umbral | 1 | 1 | 2 |
| Falsos positivos @ umbral | 4 | 1 | 3 |
| Falsos negativos @ 0.5 | 2 | 2 | 2 |
| Falsos positivos @ 0.5 | 1 | 0 | 2 |

## Hiperparámetros

- `reg_bin`: `clf__C=1`, `clf__l1_ratio=0`
- `svm`: `clf__estimator__C=10`, `clf__estimator__gamma=0.01`
- `log_pol`: `clf__C=1`, `clf__l1_ratio=1`

## Limitaciones

- El test tiene 42 malignos: un solo caso mueve la sensibilidad unos 2.4 puntos. Las diferencias de 1–2 casos no son concluyentes.
- Un único dataset de una institución: no mide la generalización a otros centros.
- Herramienta académica de apoyo; no es un dispositivo de diagnóstico.
