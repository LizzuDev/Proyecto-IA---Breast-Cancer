/**
 * Servicio de conexión con la API de FastAPI para OncoScan AI.
 * Soporta configuración por variable de entorno VITE_API_URL y fallbacks robustos.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
    if (!res.ok) throw new Error('API no disponible');
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function fetchMetadata() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/metadata`);
    if (!res.ok) throw new Error('Error al cargar metadatos');
    return await res.json();
  } catch (err) {
    console.warn('API de metadatos offline. Usando fallback local.', err);
    return null;
  }
}

export async function fetchSamples() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/samples`);
    if (!res.ok) throw new Error('Error al cargar muestras');
    return await res.json();
  } catch (err) {
    console.warn('API de muestras offline.', err);
    return null;
  }
}

export async function fetchModelsComparison() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/models/comparison`);
    if (!res.ok) throw new Error('Error al obtener comparación de modelos');
    return await res.json();
  } catch (err) {
    console.warn('API de comparación offline. Usando fallback precomputado.', err);
    // Fallback estático con los datos exactos del reporte COMPARACION_RESULTADOS.md
    return {
      models: [
        {
          id: 'reg_bin',
          name: 'Regresión Logística Binaria',
          short_name: 'Reg. Logística',
          description: 'Modelo clínico preferido: Máximo recall y mínimos falsos negativos (solo 2 en test).',
          is_recommended: true,
          is_loaded: true,
          best_hyperparameters: { 'clf__C': 0.0316, 'clf__l1_ratio': 0 },
          cv_f1: 96.71,
          cv_recall: 95.29,
          test_accuracy: 98.25,
          test_precision: 100.0,
          test_recall: 95.24,
          test_f1: 97.56,
          test_roc_auc: 99.80,
          confusion_matrix: { true_negative: 72, false_positive: 0, false_negative: 2, true_positive: 40 }
        },
        {
          id: 'svm',
          name: 'Support Vector Machine (RBF)',
          short_name: 'SVM (RBF)',
          description: 'Excelente separabilidad no lineal con calibración de probabilidad.',
          is_recommended: false,
          is_loaded: true,
          best_hyperparameters: { 'clf__C': 10.0, 'clf__gamma': 0.0316 },
          cv_f1: 96.74,
          cv_recall: 96.47,
          test_accuracy: 97.37,
          test_precision: 100.0,
          test_recall: 92.86,
          test_f1: 96.30,
          test_roc_auc: 99.27,
          confusion_matrix: { true_negative: 72, false_positive: 0, false_negative: 3, true_positive: 39 }
        },
        {
          id: 'log_pol',
          name: 'Regresión Logística Polinomial (Grado 2)',
          short_name: 'Reg. Polinomial',
          description: 'Captura relaciones cuadráticas e interacciones entre características nucleares.',
          is_recommended: false,
          is_loaded: true,
          best_hyperparameters: { 'clf__C': 3.16, 'clf__l1_ratio': 1 },
          cv_f1: 96.78,
          cv_recall: 97.06,
          test_accuracy: 93.86,
          test_precision: 92.68,
          test_recall: 90.48,
          test_f1: 91.57,
          test_roc_auc: 99.14,
          confusion_matrix: { true_negative: 69, false_positive: 3, false_negative: 4, true_positive: 38 }
        }
      ],
      primary_recommendation: 'reg_bin',
      clinical_rationale: "En diagnóstico oncológico, un falso negativo (cáncer no detectado) es crítico. 'reg_bin' logró el mayor Recall (95.24%) y el menor número de Falsos Negativos (solo 2), superando a SVM (3) y Polinomial (4) con 100% de precisión en test."
    };
  }
}

export async function predictDiagnosis(features, modelId = 'reg_bin') {
  try {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features, model_id: modelId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error en el servidor de inferencia');
    }

    return await res.json();
  } catch (err) {
    throw err;
  }
}
