# Notebooks

Exploración original del equipo: EDA (`00_eda_y_comparacion.ipynb`) y un notebook por modelo
(`reg_bin/`, `svm/`, `log_pol/`). Los `metricas.json` de cada carpeta son los resultados de esa
exploración, resumidos en [`../reports/comparacion_notebooks.md`](../reports/comparacion_notebooks.md).

**Los modelos que sirve la API no salen de aquí**, sino de `python -m ml.train`, que reproduce el mismo
split y además:

- elige hiperparámetros por log-loss en lugar de F1, para obtener probabilidades calibradas;
- fija un umbral clínico por modelo con validación cruzada;
- escribe los artefactos en `backend/artifacts/`.

Al ejecutar un notebook, sus pickles se guardan en `<modelo>/modelo/` y `<modelo>/pipeline/`,
carpetas ignoradas por git.
