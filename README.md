# 🎗️ OncoScan AI — Detección Asistida de Cáncer de Mama

Plataforma interactiva de inteligencia artificial para el análisis, diagnóstico probabilístico y exploración de biopsias por punción-aspiración con aguja fina (FNA), basada en el **Wisconsin Diagnostic Breast Cancer Dataset (WDBC)** de Kaggle y UCI Machine Learning Repository.

---

## 🌟 Características Principales

1. **Landing Page Clínica & Divulgativa**:
   - Explicación de los parámetros citológicos nucleares (radio, perímetro, concavidad, textura, etc.).
   - Estadísticas del modelo en conjunto de prueba independiente (114 casos de validación).
   - Aviso de bioética y soporte médico.

2. **Herramienta Interactiva de Predicción**:
   - Ingreso de mediciones nucleares organizadas por grupos: **Medias (Mean)**, **Errores Estándar (SE)** y **Peores Valores (Worst)**.
   - **Presets Rápidos de Casos Clínicos**: Carga con un solo clic un caso benigno real o un caso maligno real del conjunto de prueba.
   - **Resultados con Explicabilidad**:
     - Diagnóstico: Benigno vs Maligno.
     - Nivel de riesgo (Bajo, Moderado, Alto Sospechoso, Crítico).
     - Probabilidad porcentual calculada por el modelo.
     - Detección de las variables celulares de mayor desviación frente al tejido sano.

3. **Panel de Métricas del Modelo**:
   - Matriz de confusión interactiva (72 Verdaderos Negativos, 0 Falsos Positivos, 38 Verdaderos Positivos).
   - Gráfico de importancia de características (Top 10 variables más influyentes según Random Forest).
   - Métricas: Exactitud (96.5%), Precisión (100%), Sensibilidad (90.5%), ROC-AUC (0.9947).

---

## 🏗️ Arquitectura del Sistema

```
Proyecto IA - Breast Cancer/
├── backend/
│   ├── app.py              # API REST en FastAPI (/api/predict, /api/samples, /api/metadata)
│   ├── train.py            # Entrenamiento con Scikit-Learn y serialización con Joblib
│   ├── requirements.txt    # Dependencias de Python
│   └── models/
│       ├── breast_cancer_model.joblib  # Pipeline entrenado (StandardScaler + RandomForest)
│       └── metadata.json               # Métricas, estadísticas y casos de muestra
├── data/
│   └── data.csv            # Dataset original de Wisconsin (Kaggle)
├── src/
│   ├── components/
│   │   ├── Navbar.jsx               # Navegación con indicador de conexión a la API
│   │   ├── LandingHero.jsx          # Hero section, explicación de FNA y CTA
│   │   ├── InteractiveDiagnostic.jsx# Herramienta de predicción y formulario interactivo
│   │   ├── ModelMetrics.jsx         # Matriz de confusión y feature importance
│   │   ├── AboutProject.jsx         # Contexto clínico y referencias científicas
│   │   └── Footer.jsx
│   ├── services/
│   │   └── api.js                   # Cliente fetch para consumir FastAPI
│   ├── styles/
│   ├── App.jsx                      # Enrutamiento de vistas y estado global
│   └── main.jsx
├── package.json
└── tailwind.config.js
```

---

## 🚀 Guía de Inicio Rápido

### 1. Requisitos Previos
- **Node.js** (v18+)
- **Python** (v3.10+) con `uv` o `pip`

---

### 2. Entrenar el Modelo (Scikit-Learn + Joblib)
Si deseas volver a entrenar el modelo y generar un nuevo archivo `joblib`:

```bash
# Con uv (rápido y automático):
uv run --with scikit-learn --with pandas --with joblib python backend/train.py

# O con python tradicional:
python backend/train.py
```

Esto generará automáticamente:
- `backend/models/breast_cancer_model.joblib`
- `backend/models/metadata.json`

---

### 3. Iniciar el Backend (FastAPI en Puerto 8000)

```bash
# Con uv:
uv run --with fastapi --with uvicorn --with scikit-learn --with pandas --with joblib uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload

# O con npm:
npm run server
```

La documentación Swagger interactiva de la API estará disponible en:
👉 `http://127.0.0.1:8000/docs`

---

### 4. Iniciar el Frontend (Vite en Puerto 5173)

En una segunda terminal:

```bash
npm run dev
```

Abre tu navegador en:
👉 `http://localhost:5173`

---

## ⚠️ Descargo de Responsabilidad Médico
Este software ha sido desarrollado con fines exclusivamente académicos, pedagógicos y de investigación en Inteligencia Artificial y Bioinformática. No constituye un dispositivo médico ni reemplaza la valoración clínica de un profesional de la salud colegiado.
