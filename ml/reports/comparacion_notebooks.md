# Comparación de modelos — Breast Cancer Wisconsin (Diagnostic)

Clasificación de tumores como **benigno (B = 0)** o **maligno (M = 1, clase positiva)** a partir de 30 variables numéricas.
Dataset: 569 muestras (357 benignas / 212 malignas), sin valores faltantes tras eliminar `id` y la columna vacía `Unnamed: 32`.

## 1. Modelos y metodología

| Carpeta | Modelo | Pipeline | Mejores hiperparámetros (GridSearchCV) |
|---|---|---|---|
| `reg_bin/` | Regresión Logística Binaria | `StandardScaler` → `LogisticRegression` | `C = 0.0316`, `l1_ratio = 0` (L2) |
| `svm/` | SVM kernel RBF | `StandardScaler` → `SVC(probability=True)` | `C = 10`, `gamma = 0.0316` |
| `log_pol/` | Regresión Logística Polinomial (grado 2) | `StandardScaler` → `PolynomialFeatures(2)` → `StandardScaler` → `LogisticRegression` | `C = 3.16`, `l1_ratio = 1` (L1) |

- **Split:** 80 % train (455) / 20 % test (114), estratificado, `random_state = 42`. Idéntico en los tres modelos.
- **Ajuste de hiperparámetros:** `GridSearchCV` con validación cruzada estratificada de 5 folds **solo sobre train**. Criterio de selección: F1 de la clase maligna.
- **Sin fuga de datos:** el escalado (y el polinomial) están dentro del `Pipeline`, así que se ajustan únicamente con los datos de entrenamiento de cada fold.
- **Test (114 muestras, 42 malignas):** se usó una sola vez, con el modelo ya elegido.
- **Validación adicional (CV 5×5):** se evaluaron los tres pipelines con 5 repeticiones de CV estratificada de 5 folds sobre las 569 muestras, usando **los mismos folds para todos** (25 evaluaciones por modelo).

> **Prioridad clínica:** un falso negativo (maligno clasificado como benigno) es más grave que un falso positivo.
> Por eso el **recall de la clase maligna** pesa más que la accuracy.

## 2. Resultados en el conjunto de prueba (20 %)

| Métrica | `reg_bin` | `svm` | `log_pol` |
|---|---|---|---|
| Accuracy | **0.9825** | 0.9737 | 0.9386 |
| Precision | **1.0000** | **1.0000** | 0.9268 |
| Recall (maligno) | **0.9524** | 0.9286 | 0.9048 |
| F1 | **0.9756** | 0.9630 | 0.9157 |
| ROC-AUC | **0.9980** | 0.9927 | 0.9914 |
| Falsos negativos | **2** | 3 | 4 |
| Falsos positivos | **0** | **0** | 3 |

Matrices de confusión (filas = real, columnas = predicho; orden B, M):

| | `reg_bin` | `svm` | `log_pol` |
|---|---|---|---|
| Real B | 72 · 0 | 72 · 0 | 69 · 3 |
| Real M | 2 · 40 | 3 · 39 | 4 · 38 |

**Cuidado al leer este test.** Solo hay 42 malignos: un único caso mueve el recall unos 2.4 puntos.
La **precision de 1.000** de `reg_bin` y `svm` significa únicamente *cero falsos positivos en estas 114 muestras*; no es una propiedad del modelo
(en la CV de la sección 3 baja a 0.97–0.98).

## 3. Validación cruzada 5×5 sobre las 569 muestras

Media ± desviación estándar sobre 25 folds:

| Métrica | `reg_bin` | `svm` | `log_pol` |
|---|---|---|---|
| Accuracy | **0.9761 ± 0.016** | 0.9743 ± 0.015 | 0.9663 ± 0.021 |
| Precision | **0.9820 ± 0.025** | 0.9699 ± 0.025 | 0.9610 ± 0.043 |
| Recall (maligno) | 0.9537 ± 0.029 | **0.9612 ± 0.025** | 0.9498 ± 0.026 |
| F1 | **0.9673 ± 0.022** | 0.9653 ± 0.020 | 0.9548 ± 0.027 |
| ROC-AUC | **0.9942 ± 0.006** | 0.9941 ± 0.005 | 0.9917 ± 0.010 |

Errores acumulados en una pasada de CV estratificada de 5 folds sobre las 569 muestras (212 malignas):

| | `reg_bin` | `svm` | `log_pol` |
|---|---|---|---|
| Falsos negativos | 10 | **7** | 10 |
| Falsos positivos | **5** | 6 | 8 |

**Comparación pareada de F1** (mismos 25 folds):

| Par | Diferencia media de F1 | Resultado fold a fold |
|---|---|---|
| `reg_bin` − `svm` | +0.002 | gana 13, empata 2, pierde 10 |
| `reg_bin` − `log_pol` | +0.013 | gana 14, empata 4, pierde 7 |
| `svm` − `log_pol` | +0.011 | gana 17, empata 5, pierde 3 |

**Nota de rigor:** los hiperparámetros se eligieron con el 80 % de los datos, que también está dentro de esta CV; las cifras son por tanto **ligeramente optimistas**
para los tres modelos por igual. Sirven para *comparar*, no como estimación definitiva del desempeño en datos nuevos.

## 4. Análisis

1. **`reg_bin` y `svm` están técnicamente empatados.** Sus diferencias (0.002 de F1; 0.7 puntos de recall) son mucho menores que la desviación entre folds (≈ 0.02–0.03).
   `reg_bin` es mejor en test (2 vs 3 falsos negativos); `svm` lo es en CV por recall (7 vs 10 falsos negativos acumulados). Ninguna de las dos diferencias es concluyente.
2. **`log_pol` es el más débil de los tres**, en test y en CV (en recall de CV queda a la par de `reg_bin`). Pasar de 30 a 495 variables no aportó información útil
   (L1 conservó solo 53 términos) y añadió inestabilidad (mayor desviación en precision y AUC).
3. **Los datos son casi linealmente separables.** Una frontera lineal fuertemente regularizada (`C = 0.03`) basta; la no linealidad (RBF o polinomial) no mejora el resultado,
   coherente con lo observado en el EDA (variables de tamaño y concavidad separan bien las clases).
4. **Calidad general alta:** los tres superan AUC 0.99 en CV, y todos superan al modelo previo del repositorio (`backend/models/breast_cancer_model.joblib`, Random Forest:
   accuracy 0.965, recall 0.905 en el mismo split).

## 5. Recomendación

| | Criterio | Elección |
|---|---|---|
| **Modelo final sugerido** | Mejor equilibrio global, más simple, interpretable (coeficientes), probabilidades nativas | **`reg_bin`** |
| Alternativa | Mejor recall en CV (menos falsos negativos); frontera no lineal | `svm` |
| Descartado | Peor en test y CV, sin beneficio frente a su complejidad | `log_pol` |

`reg_bin` se sugiere por **parsimonia**: ante un empate estadístico se prefiere el modelo más simple y explicable, lo que además facilita la sustentación.
Si el criterio del proyecto fuese estrictamente minimizar falsos negativos, `svm` sería defendible.

**Mejora pendiente, aplicable a cualquiera de los dos:** bajar el umbral de decisión (p. ej. de 0.5 a ~0.35) para ganar recall a costa de algunos falsos positivos.
No se hizo porque requiere elegir el umbral con validación (no con test) y el equipo debe decidir qué costo de falsos positivos es aceptable.

## 6. Limitaciones

- Dataset pequeño (569 filas): el test de 114 muestras tiene alta varianza; las diferencias de 1–2 casos no son interpretables.
- Un único dataset de una institución: no se mide generalización a otras poblaciones o equipos de digitalización.
- Las variables son medidas de imágenes ya procesadas; el modelo **no** ve imágenes ni historial clínico.
- Herramienta de apoyo didáctico; **no es un dispositivo de diagnóstico**.

## 7. Artefactos

```
backend/models/
├── 00_eda_y_comparacion.ipynb       EDA, preparación y comparación final (secciones 7 y 8)
├── COMPARACION_RESULTADOS.md        este documento
├── reg_bin/ svm/ log_pol/
│   ├── <modelo>.ipynb               entrenamiento, evaluación y exportación
│   ├── metricas.json                hiperparámetros y métricas de test
│   ├── modelo/modelo.pkl            solo el estimador (espera datos ya preprocesados)
│   └── pipeline/pipeline.pkl        Pipeline completo (30 variables crudas → predicción); el que usa la app
```

Uso en la app: `pipeline = joblib.load("backend/models/reg_bin/pipeline/pipeline.pkl")` y
`pipeline.predict_proba(df_con_las_30_columnas)[:, 1]` para la probabilidad de maligno.
