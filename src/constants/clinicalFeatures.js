/**
 * Variables morfométricas del núcleo que el formulario permite editar.
 * Cada rasgo existe en tres modalidades: media (_mean), error estándar (_se) y peor valor (_worst).
 */
export const CLINICAL_FEATURE_GROUPS = [
  {
    category: 'Dimensiones Celulares',
    description: 'Magnitud geométrica y volumen nuclear',
    features: [
      { key: 'radius', name: 'Radio nuclear', unit: 'µm', defaultMean: 14.12, min: 6.0, max: 30.0, step: 0.1 },
      { key: 'perimeter', name: 'Perímetro nuclear', unit: 'µm', defaultMean: 91.96, min: 40.0, max: 190.0, step: 0.5 },
      { key: 'area', name: 'Área nuclear', unit: 'µm²', defaultMean: 654.88, min: 140.0, max: 2500.0, step: 5.0 },
    ],
  },
  {
    category: 'Contorno e Irregularidades',
    description: 'Hendiduras perimetrales y compacidad',
    features: [
      { key: 'concavity', name: 'Concavidad', unit: 'índice', defaultMean: 0.088, min: 0.0, max: 0.45, step: 0.005 },
      { key: 'concave points', name: 'Puntos cóncavos', unit: 'índice', defaultMean: 0.048, min: 0.0, max: 0.21, step: 0.002 },
      { key: 'compactness', name: 'Compacidad', unit: 'índice', defaultMean: 0.104, min: 0.01, max: 0.35, step: 0.001 },
    ],
  },
  {
    category: 'Morfología y Textura',
    description: 'Distribución cromatínica y simetría',
    features: [
      { key: 'texture', name: 'Textura cromatínica', unit: 'escala', defaultMean: 19.28, min: 9.0, max: 40.0, step: 0.1 },
      { key: 'smoothness', name: 'Suavidad superficial', unit: 'índice', defaultMean: 0.096, min: 0.05, max: 0.17, step: 0.001 },
      { key: 'symmetry', name: 'Simetría nuclear', unit: 'índice', defaultMean: 0.181, min: 0.10, max: 0.32, step: 0.005 },
      { key: 'fractal_dimension', name: 'Irregularidad de borde', unit: 'índice', defaultMean: 0.062, min: 0.04, max: 0.10, step: 0.001 },
    ],
  },
];

const ALL_FEATURES = CLINICAL_FEATURE_GROUPS.flatMap((group) => group.features);

/** Construye las 30 variables a partir de un valor medio por rasgo. */
function buildFeatureSet(scale, seRatio) {
  const values = {};
  ALL_FEATURES.forEach(({ key, defaultMean }) => {
    const mean = Number((defaultMean * scale).toFixed(3));
    values[`${key}_mean`] = mean;
    values[`${key}_se`] = Number((mean * seRatio).toFixed(3));
    values[`${key}_worst`] = Number((mean * 1.25).toFixed(2));
  });
  return values;
}

/** Valores medios de la población del dataset. */
export const baselineFeatures = () => buildFeatureSet(1, 0.05);

/** Caso sintético intermedio, un 18 % por encima de la media en todos los rasgos. */
export const borderlineFeatures = () => buildFeatureSet(1.18, 0.06);
