# Benchmark de familias de modelos

> Archivo generado por `python -m ml.benchmark`. No editar a mano.

Validación cruzada anidada sobre el entrenamiento (455 biopsias): 5 folds externos × 3 repeticiones, hiperparámetros ajustados por log-loss con 5 folds internos (rejilla del SVM reducida a 20 combinaciones). El test no se usa.

| Modelo | Brier (↓) | ECE (↓) | ROC-AUC | Sensibilidad @ 0.5 |
|---|---|---|---|---|
| `reg_bin` | 0.0200 | 0.0176 | 0.9946 | 95.7% |
| `svm` | 0.0216 | 0.0187 | 0.9941 | 94.9% |
| `log_pol` | 0.0219 | 0.0168 | 0.9942 | 95.5% |
| `gradient_boosting` | 0.0284 | 0.0191 | 0.9891 | 93.5% |
| `knn` | 0.0326 | 0.0276 | 0.9890 | 90.0% |
| `random_forest` | 0.0344 | 0.0283 | 0.9876 | 93.1% |
