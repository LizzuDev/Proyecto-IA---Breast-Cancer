/**
 * Cliente de la API de inferencia (FastAPI).
 * La URL se configura con VITE_API_URL (ver .env.example).
 */
import comparisonArtifact from '../../backend/artifacts/comparison.json';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

/**
 * Métricas de validación exportadas por `python -m ml.train`.
 * Se incluyen en el build para que la interfaz muestre cifras reales aunque la API no responda.
 */
export const MODEL_COMPARISON = comparisonArtifact;

async function getJson(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json();
}

export async function checkApiHealth() {
  try {
    return await getJson('/api/health');
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function fetchSamples() {
  try {
    return await getJson('/api/samples');
  } catch (err) {
    console.warn('API de muestras no disponible.', err);
    return null;
  }
}

export async function fetchModelsComparison() {
  try {
    return await getJson('/api/models/comparison');
  } catch (err) {
    console.warn('API de comparación no disponible. Se usan las métricas incluidas en el build.', err);
    return MODEL_COMPARISON;
  }
}

/**
 * @param {Record<string, number>} features  Las 30 variables morfométricas.
 * @param {'all'|'reg_bin'|'svm'|'log_pol'} modelId  'all' devuelve el consenso con el modelo principal.
 */
export async function predictDiagnosis(features, modelId = 'all') {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features, model_id: modelId }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servicio de inferencia. Verifique que la API esté en ejecución.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detail = Array.isArray(errorData.detail) ? errorData.detail[0]?.msg : errorData.detail;
    throw new Error(detail || 'Error en el servidor de inferencia.');
  }
  return res.json();
}
