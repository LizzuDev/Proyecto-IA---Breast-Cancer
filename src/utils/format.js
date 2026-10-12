/** Formatea una proporción (0–1) como porcentaje. */
export const pct = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;

/** Devuelve el modelo principal de la comparación exportada por el entrenamiento. */
export const primaryModel = (comparison) =>
  comparison.models.find((m) => m.id === comparison.primary_model) ?? comparison.models[0];
