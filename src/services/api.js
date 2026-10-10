/**
 * Servicio de conexión con la API de FastAPI para OncoScan AI.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

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

export async function predictDiagnosis(features) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features }),
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
