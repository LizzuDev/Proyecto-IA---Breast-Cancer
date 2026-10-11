import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, CheckCircle2, Layers, AlertCircle, FileText } from 'lucide-react';
import { fetchModelsComparison } from '../services/api';

export default function ModelMetrics() {
  const [data, setData] = useState(null);
  const [activeModel, setActiveModel] = useState('reg_bin');

  useEffect(() => {
    async function load() {
      const res = await fetchModelsComparison();
      if (res) setData(res);
    }
    load();
  }, []);

  const models = data?.models || [];
  const selected = models.find(m => m.id === activeModel) || models[0] || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">
          Dataset & Validación de Modelos
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Fundamento estadístico, conjunto de datos de Wisconsin y justificación médica de los algoritmos seleccionados.
        </p>
      </div>

      {/* Dataset Overview Card */}
      <div className="bg-white p-6 rounded-md border border-gray-200/90 shadow-subtle space-y-4">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-roseclinical-600" />
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Origen y Características del Dataset
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-1">
          <div className="p-3.5 rounded bg-surface-subtle/80 border border-gray-200/60">
            <span className="text-[11px] font-medium text-gray-500 block">Total de Biopsias</span>
            <span className="text-xl font-bold text-gray-900 font-mono">569 muestras</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">357 benignas / 212 malignas</span>
          </div>

          <div className="p-3.5 rounded bg-surface-subtle/80 border border-gray-200/60">
            <span className="text-[11px] font-medium text-gray-500 block">Variables Analizadas</span>
            <span className="text-xl font-bold text-gray-900 font-mono">30 cuantitativas</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Morfometría digital por FNA</span>
          </div>

          <div className="p-3.5 rounded bg-surface-subtle/80 border border-gray-200/60">
            <span className="text-[11px] font-medium text-gray-500 block">Partición de Validación</span>
            <span className="text-xl font-bold text-gray-900 font-mono">80% / 20%</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">455 train / 114 test ciego</span>
          </div>

          <div className="p-3.5 rounded bg-surface-subtle/80 border border-gray-200/60">
            <span className="text-[11px] font-medium text-gray-500 block">Institución Fuente</span>
            <span className="text-sm font-bold text-gray-900">Univ. de Wisconsin</span>
            <span className="text-[10px] text-gray-400 block mt-0.5">Clinical Sciences Center</span>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed pt-1">
          Las muestras corresponden a aspirados celulares por aguja fina donde se calcularon 10 características morfológicas nucleares en tres modalidades: valores medios, error estándar y mediciones extremas. Sin pérdida de datos ni fuga informativa entre entrenamiento y prueba.
        </p>
      </div>

      {/* Clinical Rationale Box with Subtle Rose-Emerald balance */}
      <div className="bg-white border-l-4 border-l-emerald-600 border border-gray-200/80 p-5 rounded-md shadow-subtle flex items-start space-x-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Criterio Clínico de Selección: Minimización de Falsos Negativos
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            En oncología diagnóstica, clasificar erróneamente un tumor maligno como benigno (falso negativo) puede retrasar un tratamiento vital. Por este motivo, la <strong>Regresión Logística Binaria</strong> fue seleccionada como algoritmo principal: alcanzó el menor número de falsos negativos (solo 2 casos de 42) y una sensibilidad de 95.24%, superando a arquitecturas más complejas.
          </p>
        </div>
      </div>

      {/* Comparative Table */}
      <div className="bg-white rounded-md border border-gray-200/90 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Comparación de Modelos en Test Independiente (114 Biopsias)
          </h2>
          <span className="text-xs text-gray-400">
            Evaluación estratificada
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-subtle/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-4">Modelo Evaluado</th>
                <th className="py-2.5 px-4">Exactitud</th>
                <th className="py-2.5 px-4">Sensibilidad (Recall)</th>
                <th className="py-2.5 px-4">Precisión (Maligno)</th>
                <th className="py-2.5 px-4 text-center">Falsos Negativos</th>
                <th className="py-2.5 px-4 text-center">Falsos Positivos</th>
                <th className="py-2.5 px-4 text-right">Rol Asignado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {models.map((m) => (
                <tr 
                  key={m.id}
                  onClick={() => setActiveModel(m.id)}
                  className={`cursor-pointer transition-colors ${
                    activeModel === m.id ? 'bg-roseclinical-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {m.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-700">{m.test_accuracy}%</td>
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{m.test_recall}%</td>
                  <td className="py-3 px-4 font-mono text-gray-700">{m.test_precision}%</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                    {m.confusion_matrix.false_negative} / 42
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-gray-700">
                    {m.confusion_matrix.false_positive} / 72
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      m.is_recommended 
                        ? 'bg-roseclinical-50 text-roseclinical-800 border-roseclinical-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {m.is_recommended ? 'Modelo Principal' : 'Complementario'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Focus Breakdown Card */}
      {selected.id && (
        <div className="bg-white p-6 rounded-md border border-gray-200/90 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Detalle Técnico: {selected.name}
              </h3>
              <p className="text-xs text-gray-500">
                {selected.description}
              </p>
            </div>
            <span className="text-xs font-mono text-roseclinical-700 font-semibold bg-roseclinical-50 px-2 py-0.5 rounded border border-roseclinical-200">
              {selected.id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Confusion Matrix Numbers */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700 block">
                Matriz de Confusión en Prueba:
              </span>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded bg-surface-subtle/80 border border-gray-200/80">
                  <span className="text-[10px] text-gray-400 block">Verdadero Benigno (VN)</span>
                  <span className="text-lg font-bold text-gray-900 font-mono">
                    {selected.confusion_matrix?.true_negative}
                  </span>
                </div>
                <div className="p-3 rounded bg-surface-subtle/80 border border-gray-200/80">
                  <span className="text-[10px] text-gray-400 block">Falso Positivo (FP)</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">
                    {selected.confusion_matrix?.false_positive}
                  </span>
                </div>
                <div className="p-3 rounded bg-surface-subtle/80 border border-gray-200/80">
                  <span className="text-[10px] text-gray-400 block">Falso Negativo (FN)</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">
                    {selected.confusion_matrix?.false_negative}
                  </span>
                </div>
                <div className="p-3 rounded bg-surface-subtle/80 border border-gray-200/80">
                  <span className="text-[10px] text-gray-400 block">Verdadero Maligno (VP)</span>
                  <span className="text-lg font-bold text-gray-900 font-mono">
                    {selected.confusion_matrix?.true_positive}
                  </span>
                </div>
              </div>
            </div>

            {/* Hyperparameters */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700 block">
                Hiperparámetros Óptimos (GridSearchCV):
              </span>
              <div className="p-3.5 rounded bg-surface-subtle/80 border border-gray-200/80 space-y-1.5 font-mono text-xs">
                {Object.entries(selected.best_hyperparameters || {}).map(([p, v]) => (
                  <div key={p} className="flex justify-between text-gray-700">
                    <span className="text-gray-500">{p}:</span>
                    <span className="font-bold text-gray-900">
                      {typeof v === 'number' ? v.toFixed(4) : String(v)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200 flex justify-between text-gray-700">
                  <span className="text-gray-500">Validación Cruzada (CV F1):</span>
                  <span className="font-bold text-emerald-700">{selected.cv_f1}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
