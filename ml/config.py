"""Configuración central del pipeline de entrenamiento."""

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT_DIR / "data" / "data.csv"
ARTIFACTS_DIR = ROOT_DIR / "backend" / "artifacts"
REPORTS_DIR = ROOT_DIR / "ml" / "reports"

RANDOM_STATE = 42
TEST_SIZE = 0.2

# Validación cruzada para ajustar hiperparámetros (solo sobre entrenamiento).
TUNING_FOLDS = 5
# Validación cruzada repetida para estimar calibración y fijar el umbral clínico.
EVAL_FOLDS = 5
EVAL_REPEATS = 5

# Sensibilidad mínima que debe alcanzar el umbral clínico en validación cruzada.
# En cribado oncológico un falso negativo es mucho más costoso que un falso positivo.
TARGET_RECALL = 0.98
# El umbral nunca supera el punto de corte por defecto.
MAX_THRESHOLD = 0.5

# Bins para el error de calibración esperado (ECE).
CALIBRATION_BINS = 10
# Bins del diagrama de fiabilidad que se exporta para la interfaz (menos bins, menos ruido).
RELIABILITY_BINS = 5

# Casos reales del dataset que la interfaz ofrece como ejemplos.
# El primero de cada grupo es inequívoco; los demás muestran casos más difíciles.
SAMPLE_CASE_IDS = {
    "benign": [865137, 901303, 9112085],
    "malignant": [884948, 862548, 855138],
}
