import React, { useState, useEffect } from 'react';
import { fetchModelsComparison } from '../services/api';

const DATASET = {
  total: 569,
  benign: 357,
  malignant: 212,
  train: 455,
  test: 114,
  testBenign: 72,
  testMalignant: 42,
};

const NUCLEAR_FEATURES = [
  { name: 'Radio', desc: 'Distancia media del centro al contorno del núcleo.' },
  { name: 'Textura', desc: 'Variación en la intensidad de gris de la cromatina.' },
  { name: 'Perímetro', desc: 'Longitud del contorno nuclear.' },
  { name: 'Área', desc: 'Superficie que ocupa el núcleo.' },
  { name: 'Suavidad', desc: 'Variación local en la longitud de los radios.' },
  { name: 'Compacidad', desc: 'Perímetro² / área − 1.' },
  { name: 'Concavidad', desc: 'Profundidad de las hendiduras del contorno.' },
  { name: 'Puntos cóncavos', desc: 'Número de hendiduras del contorno.' },
  { name: 'Simetría', desc: 'Diferencia entre los dos lados del núcleo.' },
  { name: 'Dimensión fractal', desc: 'Irregularidad fina del borde.' },
];

const pct = (n, d) => ((n / d) * 100).toFixed(1);

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
  const cm = selected.confusion_matrix || {};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-8">

      {/* Encabezado */}
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-roseclinical-600">
          Modelos & Dataset
        </p>
        <h1 className="mt-3 font-display font-light text-4xl sm:text-5xl text-gray-900 leading-[1.1] tracking-tight">
          De qué aprendieron los modelos y cómo se validaron.
        </h1>
        <p className="mt-5 text-base text-gray-600 leading-relaxed max-w-2xl">
          Los tres clasificadores se entrenaron con el mismo conjunto de biopsias y se evaluaron
          sobre un grupo de casos que nunca vieron durante el entrenamiento.
        </p>
      </header>

      {/* Dataset */}
      <section className="mt-16 pt-12 border-t border-roseclinical-200/70 grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-12">
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 tracking-tight">
            Wisconsin Diagnostic Breast Cancer
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Imágenes digitalizadas de aspirados con aguja fina (FNA) recogidas en la Universidad de
            Wisconsin. De cada imagen se midieron los núcleos celulares y se resumieron en 30 variables
            numéricas.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            El dataset no tiene valores faltantes. La partición es estratificada: el test conserva la
            misma proporción de tumores malignos que el conjunto completo.
          </p>
        </div>

        <div className="md:col-span-3 space-y-10">
          {/* Composición */}
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-display text-5xl font-light text-gray-900 tracking-tight tabular-nums">
                {DATASET.total}
              </span>
              <span className="text-sm text-gray-500">biopsias diagnosticadas</span>
            </div>
            <div className="mt-4 flex h-2 overflow-hidden" role="img"
              aria-label={`${DATASET.benign} benignas y ${DATASET.malignant} malignas`}>
              <div className="bg-emerald-500/70" style={{ width: `${pct(DATASET.benign, DATASET.total)}%` }} />
              <div className="bg-roseclinical-500" style={{ width: `${pct(DATASET.malignant, DATASET.total)}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-600 tabular-nums">
              <span><span className="font-semibold text-emerald-700">{DATASET.benign}</span> benignas · {pct(DATASET.benign, DATASET.total)}%</span>
              <span><span className="font-semibold text-roseclinical-700">{DATASET.malignant}</span> malignas · {pct(DATASET.malignant, DATASET.total)}%</span>
            </div>
          </div>

          {/* Variables y partición */}
          <dl className="grid grid-cols-2 border-t border-roseclinical-200/70">
            <div className="pt-5 pr-6 border-r border-roseclinical-200/70">
              <dt className="text-xs text-gray-500">Variables</dt>
              <dd className="mt-1 font-display text-3xl font-light text-gray-900 tabular-nums">30</dd>
              <dd className="mt-1 text-xs text-gray-500 leading-relaxed">10 rasgos × media, error estándar y peor valor</dd>
            </div>
            <div className="pt-5 pl-6">
              <dt className="text-xs text-gray-500">Entrenamiento / test</dt>
              <dd className="mt-1 font-display text-3xl font-light text-gray-900 tabular-nums">
                {DATASET.train}<span className="text-gray-300"> / </span>{DATASET.test}
              </dd>
              <dd className="mt-1 text-xs text-gray-500 leading-relaxed">
                80 / 20 · test con {DATASET.testBenign} benignas y {DATASET.testMalignant} malignas
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Rasgos nucleares */}
      <section className="mt-16 pt-12 border-t border-roseclinical-200/70">
        <h2 className="font-display text-2xl sm:text-3xl text-gray-900 tracking-tight">
          Los 10 rasgos del núcleo
        </h2>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl">
          Cada rasgo se calcula sobre todos los núcleos de la imagen y se resume de tres formas.
        </p>
        <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-12">
          {NUCLEAR_FEATURES.map((f) => (
            <div key={f.name} className="py-3 border-b border-roseclinical-100 flex gap-4">
              <dt className="w-32 sm:w-36 shrink-0 text-sm font-semibold text-gray-900">{f.name}</dt>
              <dd className="text-sm text-gray-600 min-w-0">{f.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Criterio clínico */}
      <section className="mt-16 pt-12 border-t border-roseclinical-200/70 grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
        <blockquote className="md:col-span-3 font-display text-2xl sm:text-3xl font-light text-gray-900 leading-snug tracking-tight">
          Un falso negativo es un cáncer que no se detecta. Por eso el modelo principal se eligió
          por su <em className="italic text-roseclinical-600">sensibilidad</em>, no por su exactitud.
        </blockquote>
        <p className="md:col-span-2 text-sm text-gray-600 leading-relaxed md:pt-2">
          La <strong className="font-semibold text-gray-900">Regresión Logística Binaria</strong> dejó
          escapar solo 2 de los 42 tumores malignos del test, menos que SVM (3) y que la Regresión
          Polinomial (4), y no produjo ningún falso positivo.
        </p>
      </section>

      {/* Comparación */}
      <section className="mt-16 pt-12 border-t border-roseclinical-200/70">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 tracking-tight">
            Rendimiento en el test ciego
          </h2>
          <span className="text-xs text-gray-500">{DATASET.test} biopsias · seleccione un modelo para ver el detalle</span>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-roseclinical-200 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="py-3 pr-4 pl-3 font-semibold">Modelo</th>
                <th className="py-3 px-4 font-semibold">Sensibilidad</th>
                <th className="py-3 px-4 font-semibold text-right">Exactitud</th>
                <th className="py-3 px-4 font-semibold text-right">Precisión</th>
                <th className="py-3 px-4 font-semibold text-right">ROC-AUC</th>
                <th className="py-3 pl-4 font-semibold text-right">Falsos neg.</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const isActive = activeModel === m.id;
                return (
                  <tr
                    key={m.id}
                    onClick={() => setActiveModel(m.id)}
                    className={`cursor-pointer border-b border-roseclinical-100 transition-colors ${
                      isActive ? 'bg-roseclinical-50/70' : 'hover:bg-roseclinical-50/40'
                    }`}
                  >
                    <td className={`py-4 pr-4 pl-3 border-l-2 ${isActive ? 'border-roseclinical-600' : 'border-transparent'}`}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveModel(m.id); }}
                        aria-pressed={isActive}
                        className="text-left font-semibold text-gray-900"
                      >
                        {m.name}
                      </button>
                      <span className={`block text-xs mt-0.5 ${m.is_recommended ? 'text-roseclinical-700' : 'text-gray-400'}`}>
                        {m.is_recommended ? 'Modelo principal' : 'Complementario'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1 bg-roseclinical-100">
                          <div className="h-1 bg-roseclinical-500" style={{ width: `${m.test_recall}%` }} />
                        </div>
                        <span className="font-mono text-gray-900 tabular-nums">{m.test_recall}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-gray-700 tabular-nums">{m.test_accuracy}%</td>
                    <td className="py-4 px-4 text-right font-mono text-gray-700 tabular-nums">{m.test_precision}%</td>
                    <td className="py-4 px-4 text-right font-mono text-gray-700 tabular-nums">{(m.test_roc_auc / 100).toFixed(3)}</td>
                    <td className="py-4 pl-4 text-right font-mono tabular-nums">
                      <span className="font-semibold text-gray-900">{m.confusion_matrix.false_negative}</span>
                      <span className="text-gray-400"> / {DATASET.testMalignant}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalle del modelo seleccionado */}
      {selected.id && (
        <section className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-12" aria-live="polite">
          <div className="md:col-span-2">
            <p className="text-xs font-mono text-roseclinical-600">{selected.id}</p>
            <h3 className="mt-1 font-display text-2xl text-gray-900 tracking-tight">{selected.name}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{selected.description}</p>

            <dl className="mt-6 text-sm">
              {Object.entries(selected.best_hyperparameters || {}).map(([p, v]) => (
                <div key={p} className="flex justify-between gap-4 py-2 border-b border-roseclinical-100">
                  <dt className="font-mono text-xs text-gray-500">{p.replace('clf__', '')}</dt>
                  <dd className="font-mono text-gray-900 tabular-nums">
                    {typeof v === 'number' ? Number(v.toFixed(4)) : String(v)}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 py-2 border-b border-roseclinical-100">
                <dt className="text-xs text-gray-500">F1 en validación cruzada</dt>
                <dd className="font-mono text-gray-900 tabular-nums">{selected.cv_f1}%</dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] text-gray-400">Hiperparámetros elegidos con GridSearchCV (5 folds).</p>
          </div>

          {/* Matriz de confusión */}
          <div className="md:col-span-3 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Matriz de confusión</p>
            <div className="mt-4 grid grid-cols-[auto_1fr_1fr] text-sm">
              <div />
              <div className="pb-2 text-center text-[11px] uppercase tracking-wider text-gray-500">Predicho benigno</div>
              <div className="pb-2 text-center text-[11px] uppercase tracking-wider text-gray-500">Predicho maligno</div>

              <div className="pr-4 flex items-center text-[11px] uppercase tracking-wider text-gray-500">Real benigno</div>
              <MatrixCell value={cm.true_negative} label="Verdaderos negativos" tone="ok" />
              <MatrixCell value={cm.false_positive} label="Falsos positivos" tone="warn" />

              <div className="pr-4 flex items-center text-[11px] uppercase tracking-wider text-gray-500">Real maligno</div>
              <MatrixCell value={cm.false_negative} label="Falsos negativos" tone="critical" />
              <MatrixCell value={cm.true_positive} label="Verdaderos positivos" tone="ok" />
            </div>
            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              La celda de falsos negativos es la que más pesa en la práctica clínica: son tumores
              malignos que el modelo habría clasificado como benignos.
            </p>
          </div>
        </section>
      )}

      <p className="mt-16 pt-6 border-t border-roseclinical-100 text-xs text-gray-400">
        Fuente: Wolberg, Street &amp; Mangasarian. Breast Cancer Wisconsin (Diagnostic). UCI Machine Learning Repository.
      </p>
    </div>
  );
}

function MatrixCell({ value, label, tone }) {
  const styles = {
    ok: 'bg-white/80 text-gray-900',
    warn: value > 0 ? 'bg-amber-50 text-amber-800' : 'bg-white/50 text-gray-400',
    critical: value > 0 ? 'bg-roseclinical-100/70 text-roseclinical-800' : 'bg-white/50 text-gray-400',
  };
  return (
    <div className={`m-px px-2 sm:px-4 py-5 text-center ${styles[tone]}`}>
      <span className="block font-display text-3xl font-light tabular-nums">{value ?? '–'}</span>
      <span className="block mt-1 text-[11px] opacity-80">{label}</span>
    </div>
  );
}
