"""Configuración de la API, sobreescribible con variables de entorno."""

import os
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    artifacts_dir: Path = field(
        default_factory=lambda: Path(os.getenv("ARTIFACTS_DIR", BACKEND_DIR / "artifacts")))
    # Orígenes permitidos por CORS, separados por comas. "*" permite cualquiera.
    cors_origins: list[str] = field(
        default_factory=lambda: _split_csv(os.getenv("CORS_ORIGINS", "*")))
    # Desviación (en desviaciones estándar respecto a la población benigna) a partir de
    # la cual un parámetro se considera relevante en la explicación.
    deviation_z_threshold: float = 1.2
    max_deviations: int = 6


settings = Settings()
