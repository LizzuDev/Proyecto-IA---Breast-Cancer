import React, { useState, useEffect } from 'react';
import { Database, BarChart3, CheckSquare, Layers, Award, FileSpreadsheet } from 'lucide-react';
import { fetchMetadata } from '../services/api';

export default function ModelMetrics() {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchMetadata();
      if (data) setMetadata(data);
    }
    load();
  }, []);

  const metrics = metadata?.metrics || {
    accuracy: 0.9649,
    precision: 1.0,
    recall: 0.9048,
    f1_score: 0.95,
    roc_auc: 0.9947,
    confusion_matrix: {
      true_negative: 72,
      false_positive: 0,
      false_negative: 4,
      true_positive: 38
    }
  };

  const featureImportances = metadata?.feature_importances?.slice(0, 10) || [
    { feature: 'concave points_worst', importance: 0.142 },
    { feature: 'perimeter_worst', importance: 0.128 },
    { feature: 'concave points_mean', importance: 0.115 },
    { feature: 'radius_worst', importance: 0.098 },
    { feature: 'area_worst', importance: 0.089 },
    { feature: 'concavity_mean', importance: 0.065 },
    { feature: 'concavity_worst', importance: 0.058 },
    { feature: 'perimeter_mean', importance: 0.052 },
    { feature: 'area_mean', importance: 0.046 },
    { feature: 'radius_mean', importance: 0.041 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Page Title */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosepink-950 text-rosepink-300 border border-rosepink-700/40 text-xs font-semibold uppercase tracking-wider mb-3">
          <Database className="w-3.5 h-3.5 text-rosepink-400" />
          <span>Evaluación & Algoritmo</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white mb-2">
          Rendimiento del Modelo {metadata?.model_name || 'Random Forest'}
        </h1>
        <p className="text-sm sm:text-base text-slateclinical-300 max-w-2xl">
          Resultados de validación sobre el 20% de muestras independientes (conjunto de test) del dataset Wisconsin Diagnostic Breast Cancer (WDBC).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slateclinical-800">
          <span className="text-xs uppercase text-slateclinical-400 font-semibold block mb-1">
            Exactitud (Accuracy)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {(metrics.accuracy * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">110 / 114 correctos</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slateclinical-800">
          <span className="text-xs uppercase text-slateclinical-400 font-semibold block mb-1">
            Precisión (Maligno)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {(metrics.precision * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">0 falsos positivos</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slateclinical-800">
          <span className="text-xs uppercase text-slateclinical-400 font-semibold block mb-1">
            Sensibilidad (Recall)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {(metrics.recall * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slateclinical-400 font-medium">38 / 42 malignos</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slateclinical-800">
          <span className="text-xs uppercase text-slateclinical-400 font-semibold block mb-1">
            F1-Score
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {(metrics.f1_score * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slateclinical-400 font-medium">Balance armónico</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rosepink-900/50 bg-rosepink-950/20 col-span-2 md:col-span-1">
          <span className="text-xs uppercase text-rosepink-300 font-semibold block mb-1">
            Área ROC (AUC)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rosepink-400 font-display">
            {metrics.roc_auc.toFixed(4)}
          </div>
          <span className="text-[11px] text-rosepink-300/80 font-medium">Casi perfecto</span>
        </div>

      </div>

      {/* Two Column Layout: Confusion Matrix & Top Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Confusion Matrix (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-slateclinical-800 space-y-6">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-rosepink-400" />
            <h2 className="text-lg font-bold font-display text-white">Matriz de Confusión</h2>
          </div>
          <p className="text-xs text-slateclinical-400">
            Muestra el rendimiento en 114 biopsias reales nunca vistas por el modelo durante el entrenamiento.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* True Negative */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block mb-1">
                Verdadero Benigno (TN)
              </span>
              <div className="text-3xl font-extrabold text-white font-display">
                {metrics.confusion_matrix.true_negative}
              </div>
              <span className="text-[10px] text-emerald-400">Benigno clasificado como Benigno</span>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-xl bg-slateclinical-900/60 border border-slateclinical-800 text-center">
              <span className="text-[11px] uppercase tracking-wider text-slateclinical-400 font-semibold block mb-1">
                Falso Positivo (FP)
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 font-display">
                {metrics.confusion_matrix.false_positive}
              </div>
              <span className="text-[10px] text-slateclinical-400">Benigno clasificado como Maligno</span>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-xl bg-slateclinical-900/60 border border-slateclinical-800 text-center">
              <span className="text-[11px] uppercase tracking-wider text-slateclinical-400 font-semibold block mb-1">
                Falso Negativo (FN)
              </span>
              <div className="text-3xl font-extrabold text-amber-400 font-display">
                {metrics.confusion_matrix.false_negative}
              </div>
              <span className="text-[10px] text-slateclinical-400">Maligno clasificado como Benigno</span>
            </div>

            {/* True Positive */}
            <div className="p-4 rounded-xl bg-rosepink-950/40 border border-rosepink-500/40 text-center">
              <span className="text-[11px] uppercase tracking-wider text-rosepink-300 font-semibold block mb-1">
                Verdadero Maligno (TP)
              </span>
              <div className="text-3xl font-extrabold text-white font-display">
                {metrics.confusion_matrix.true_positive}
              </div>
              <span className="text-[10px] text-rosepink-400">Maligno clasificado como Maligno</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slateclinical-900/80 border border-slateclinical-800 text-xs text-slateclinical-400 leading-relaxed">
            💡 <strong>Destacable:</strong> El modelo logró un 100% de precisión positiva (cero falsos positivos), lo cual previene alarmas innecesarias en pacientes sanos.
          </div>
        </div>

        {/* Feature Importances (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-slateclinical-800 space-y-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-rosepink-400" />
            <h2 className="text-lg font-bold font-display text-white">
              Importancia de Características (Top 10)
            </h2>
          </div>
          <p className="text-xs text-slateclinical-400">
            Pesos relativos asignados por los árboles de decisión en la predicción de malignidad.
          </p>

          <div className="space-y-3 pt-2">
            {featureImportances.map((item, idx) => {
              const pct = (item.importance * 100).toFixed(1);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slateclinical-300">{item.feature}</span>
                    <span className="text-rosepink-400 font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slateclinical-900 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rosepink-600 to-rosepink-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.importance * 350)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
