"""Carga, limpieza y partición del dataset Wisconsin Diagnostic Breast Cancer."""

from dataclasses import dataclass

import pandas as pd
from sklearn.model_selection import train_test_split

from ml import config

TARGET = "diagnosis"
LABELS = {"B": 0, "M": 1}


@dataclass(frozen=True)
class Dataset:
    raw: pd.DataFrame
    X: pd.DataFrame
    y: pd.Series
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series

    @property
    def features(self) -> list[str]:
        return list(self.X.columns)


def load_dataset(path=config.DATA_PATH) -> Dataset:
    """Lee el CSV, elimina `id` y columnas vacías y hace el split estratificado 80/20."""
    raw = pd.read_csv(path)
    raw = raw.drop(columns=[c for c in raw.columns if c.startswith("Unnamed")])
    if raw.isna().any().any():
        raise ValueError("El dataset contiene valores faltantes inesperados.")

    X = raw.drop(columns=["id", TARGET])
    y = raw[TARGET].map(LABELS)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=config.TEST_SIZE, random_state=config.RANDOM_STATE, stratify=y
    )
    return Dataset(raw, X, y, X_train, X_test, y_train, y_test)
