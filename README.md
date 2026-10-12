# OncoPath AI

Herramienta académica de apoyo para clasificar biopsias mamarias por aspiración con aguja fina (FNA)
a partir de 30 medidas morfométricas del núcleo celular. Usa el dataset
**Wisconsin Diagnostic Breast Cancer (WDBC)**: 569 biopsias, 357 benignas y 212 malignas.

> No es un dispositivo de diagnóstico. No sustituye el criterio de un patólogo.

## Modelos

Se comparan tres clasificadores con el mismo split estratificado 80/20:

| Id | Modelo |
|---|---|
| `svm` | Support Vector Machine, kernel RBF, calibrado por escalado de Platt |
| `reg_bin` | Regresión Logística regularizada |
| `log_pol` | Regresión Logística sobre términos polinomiales de grado 2 |

Cómo se entrenan y eligen (detalle en [`ml/reports/model_selection.md`](ml/reports/model_selection.md)):

1. **Hiperparámetros por log-loss** (GridSearchCV, 5 folds, solo entrenamiento). Log-loss penaliza las
   probabilidades mal calibradas, así que el porcentaje que ve el usuario es fiable.
2. **Umbral clínico por modelo**: el mayor punto de corte con una sensibilidad ≥ 98 % en validación cruzada
   repetida 5×5. En cribado oncológico un falso negativo cuesta más que un falso positivo.
3. **Modelo principal**: el de menor Brier score en esa validación cruzada.
4. El conjunto de test se evalúa **una sola vez**, con modelos y umbrales ya fijados.

En validación cruzada anidada ([`ml/reports/benchmark.md`](ml/reports/benchmark.md)), Random Forest,
Gradient Boosting y KNN quedan claramente por debajo en AUC, Brier y calibración. Los tres modelos de la API
están empatados entre sí: sus diferencias de Brier (< 0.002) caen dentro de la variación entre folds. SVM se
usa como principal porque, a la misma sensibilidad, comete menos falsos positivos (especificidad 96 % frente
a 94 % en validación cruzada).

## Estructura

```
.
├── src/                    Frontend (React + Vite + Tailwind)
│   ├── components/         Vistas: landing, diagnóstico, modelos & dataset
│   ├── constants/          Variables clínicas del formulario
│   ├── services/api.js     Cliente HTTP de la API
│   └── utils/
├── backend/                API de inferencia (FastAPI)
│   ├── app/                main.py (rutas), inference.py, registry.py, schemas.py, config.py
│   ├── artifacts/          Modelos y métricas generados por ml/train.py (versionados)
│   └── tests/
├── ml/                     Entrenamiento reproducible
│   ├── train.py            Punto de entrada: python -m ml.train
│   ├── candidates.py       Modelos y espacios de búsqueda
│   ├── evaluation.py       Métricas, calibración y umbral clínico
│   ├── notebooks/          EDA y exploración original de cada modelo
│   ├── reports/            Informe generado y comparación histórica
│   └── tests/
├── data/data.csv           Dataset WDBC
└── e2e/                    Pruebas end-to-end (Playwright)
```

`backend/artifacts/comparison.json` es la única fuente de las métricas: la API la sirve y el frontend la
incluye en el build como respaldo cuando la API no responde.

## Puesta en marcha

Requisitos: Node 20+ y Python 3.11+.

```bash
# Dependencias
npm install
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements-dev.txt

# API (http://127.0.0.1:8000, documentación en /docs)
npm run server

# Frontend (http://localhost:5173), en otra terminal
npm run dev
```

La URL de la API se configura con `VITE_API_URL` (ver `.env.example`).

### Reentrenar

```bash
npm run train        # python -m ml.train  (unos minutos)
```

Regenera `backend/artifacts/` y `ml/reports/model_selection.md`. scikit-learn está fijado en
`backend/requirements.txt` porque los pipelines serializados no son portables entre versiones.

## Calidad

```bash
npm run lint         # ESLint + Ruff
npm run test:python  # pytest: API, pipeline de ML y artefactos
npm run test:e2e     # Playwright: levanta API y frontend y prueba la app completa
```

El workflow `.github/workflows/ci.yml` ejecuta todo lo anterior en cada push y pull request.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado y modelos cargados |
| GET | `/api/models/comparison` | Métricas de validación de los tres modelos |
| GET | `/api/samples` | Casos reales del test para probar la herramienta |
| GET | `/api/metadata` | Variables y estadísticas del dataset |
| POST | `/api/predict` | `{"features": {...}, "model_id": "all" \| "svm" \| "reg_bin" \| "log_pol"}` |

## Despliegue

- **Frontend:** Vercel (`vercel.json`). Definir `VITE_API_URL`.
- **Backend:** cualquier plataforma con Procfile (Render, Railway…), con `backend/` como raíz.
  Definir `CORS_ORIGINS` con el dominio del frontend.

## Referencia

Wolberg, W., Mangasarian, O., Street, N. y Street, W. (1995). *Breast Cancer Wisconsin (Diagnostic)*.
UCI Machine Learning Repository. https://doi.org/10.24432/C5DW2B
