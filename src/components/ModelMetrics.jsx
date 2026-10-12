import { useState, useEffect } from 'react';
import { fetchModelsComparison, MODEL_COMPARISON } from '../services/api';
import { pct, primaryModel } from '../utils/format';

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

const formatParam = (value) => (typeof value === 'number' ? Number(value.toFixed(4)) : String(value));
const paramName = (key) => key.replace(/^clf__(estimator__)?/, '');

export default function ModelMetrics() {
  const [data, setData] = useState(MODEL_COMPARISON);
  const [activeModel, setActiveModel] = useState(MODEL_COMPARISON.primary_model);

  useEffect(() => {
    let mounted = true;
    fetchModelsComparison().then((res) => {
      if (mounted && res) setData(res);
    });
    return () => { mounted = false; };
  }, []);

  const { dataset, models } = data;
  const primary = primaryModel(data);
  const selected = models.find((m) => m.id === activeModel) || primary;
  const cm = selected.test.confusion_matrix;
  const sortedByFn = [...models].sort(
    (a, b) => a.test.confusion_matrix.false_negative - b.test.confusion_matrix.false_negative);

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
            Wisconsin. De cada imagen se midieron los núcleos celulares y se resumieron en {dataset.n_features} variables
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
                {dataset.total}
              </span>
              <span className="text-sm text-gray-500">biopsias diagnosticadas</span>
            </div>
            <div className="mt-4 flex h-2 overflow-hidden" role="img"
              aria-label={`${dataset.benign} benignas y ${dataset.malignant} malignas`}>
              <div className="bg-emerald-500/70" style={{ width: pct(dataset.benign / dataset.total) }} />
              <div className="bg-roseclinical-500" style={{ width: pct(dataset.malignant / dataset.total) }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-600 tabular-nums">
              <span><span className="font-semibold text-emerald-700">{dataset.benign}</span> benignas · {pct(dataset.benign / dataset.total)}</span>
              <span><span className="font-semibold text-roseclinical-700">{dataset.malignant}</span> malignas · {pct(dataset.malignant / dataset.total)}</span>
            </div>
          </div>

          {/* Variables y partición */}
          <dl className="grid grid-cols-2 border-t border-roseclinical-200/70">
            <div className="pt-5 pr-6 border-r border-roseclinical-200/70">
              <dt className="text-xs text-gray-500">Variables</dt>
              <dd className="mt-1 font-display text-3xl font-light text-gray-900 tabular-nums">{dataset.n_features}</dd>
              <dd className="mt-1 text-xs text-gray-500 leading-relaxed">10 rasgos × media, error estándar y peor valor</dd>
            </div>
            <div className="pt-5 pl-6">
              <dt className="text-xs text-gray-500">Entrenamiento / test</dt>
              <dd className="mt-1 font-display text-3xl font-light text-gray-900 tabular-nums">
                {dataset.train}<span className="text-gray-300"> / </span>{dataset.test}
              </dd>
              <dd className="mt-1 text-xs text-gray-500 leading-relaxed">
                80 / 20 · test con {dataset.test_benign} benignas y {dataset.test_malignant} malignas
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
          Un falso negativo es un cáncer que no se detecta. Por eso cada modelo decide con un
          <em className="italic text-roseclinical-600"> umbral clínico</em>, no con el 50 % por defecto.
        </blockquote>
        <div className="md:col-span-2 space-y-3 text-sm text-gray-600 leading-relaxed md:pt-2">
          <p>
            El umbral de cada modelo es el más alto que alcanza una sensibilidad del {pct(data.target_recall, 0)} en
            validación cruzada sobre el entrenamiento. Las probabilidades están calibradas: un 30 % significa
            que, de cada 10 casos parecidos, unos 3 son malignos.
          </p>
          <p>
            El modelo principal, <strong className="font-semibold text-gray-900">{primary.name}</strong>, es el de
            mejor puntuación de Brier, que mide a la vez acierto y calibración. En el test dejó escapar{' '}
            {primary.test.confusion_matrix.false_negative} de {dataset.test_malignant} tumores malignos
            {sortedByFn.length > 1 && ` (${sortedByFn.map((m) => `${m.short_name}: ${m.test.confusion_matrix.false_negative}`).join(', ')})`}.
          </p>
        </div>
      </section>

      {/* Comparación */}
      <section className="mt-16 pt-12 border-t border-roseclinical-200/70">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 tracking-tight">
            Rendimiento en el test ciego
          </h2>
          <span className="text-xs text-gray-500">{dataset.test} biopsias · con el umbral clínico de cada modelo</span>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-roseclinical-200 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="py-3 pr-4 pl-3 font-semibold">Modelo</th>
                <th className="py-3 px-4 font-semibold">Sensibilidad</th>
                <th className="py-3 px-4 font-semibold text-right">Especificidad</th>
                <th className="py-3 px-4 font-semibold text-right">ROC-AUC</th>
                <th className="py-3 px-4 font-semibold text-right">Brier</th>
                <th className="py-3 px-4 font-semibold text-right">Umbral</th>
                <th className="py-3 pl-4 font-semibold text-right">Falsos neg.</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const isActive = selected.id === m.id;
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
                        <div className="w-16 h-1 bg-roseclinical-100">
                          <div className="h-1 bg-roseclinical-500" style={{ width: pct(m.test.recall) }} />
                        </div>
                        <span className="font-mono text-gray-900 tabular-nums">{pct(m.test.recall)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-gray-700 tabular-nums">{pct(m.test.specificity)}</td>
                    <td className="py-4 px-4 text-right font-mono text-gray-700 tabular-nums">{m.test.roc_auc.toFixed(3)}</td>
                    <td className="py-4 px-4 text-right font-mono text-gray-700 tabular-nums">{m.test.brier.toFixed(3)}</td>
                    <td className="py-4 px-4 text-right font-mono text-gray-700 tabular-nums">{m.threshold.toFixed(2)}</td>
                    <td className="py-4 pl-4 text-right font-mono tabular-nums">
                      <span className="font-semibold text-gray-900">{m.test.confusion_matrix.false_negative}</span>
                      <span className="text-gray-400"> / {dataset.test_malignant}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalle del modelo seleccionado */}
      <section className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-12" aria-live="polite">
        <div className="md:col-span-2">
          <p className="text-xs font-mono text-roseclinical-600">{selected.id}</p>
          <h3 className="mt-1 font-display text-2xl text-gray-900 tracking-tight">{selected.name}</h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{selected.description}</p>

          <dl className="mt-6 text-sm">
            {Object.entries(selected.best_hyperparameters).map(([p, v]) => (
              <DetailRow key={p} label={<span className="font-mono">{paramName(p)}</span>} value={formatParam(v)} />
            ))}
            <DetailRow label="Umbral clínico" value={selected.threshold.toFixed(3)} />
            <DetailRow label="Sensibilidad en validación cruzada" value={pct(selected.cv.recall_at_threshold.mean)} />
            <DetailRow label="Especificidad en validación cruzada" value={pct(selected.cv.specificity_at_threshold.mean)} />
            <DetailRow label="Error de calibración (ECE)" value={selected.cv.ece.mean.toFixed(3)} />
          </dl>
          <p className="mt-2 text-[11px] text-gray-400">
            Hiperparámetros elegidos con GridSearchCV (5 folds) minimizando log-loss.
          </p>
        </div>

        <div className="md:col-span-3 min-w-0 space-y-10">
          {/* Matriz de confusión */}
          <div>
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
          </div>

          {/* Calibración */}
          <div>
            <p className="text-sm font-semibold text-gray-900">Calibración</p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Probabilidad predicha frente a la proporción real de malignos (validación cruzada). Cuanto más
              cerca de la diagonal, más fiable es el porcentaje que muestra la herramienta.
            </p>
            <ReliabilityDiagram curve={selected.calibration_curve} />
          </div>
        </div>
      </section>

      <p className="mt-16 pt-6 border-t border-roseclinical-100 text-xs text-gray-400">
        Fuente: Wolberg, Street &amp; Mangasarian. Breast Cancer Wisconsin (Diagnostic). UCI Machine Learning Repository.
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-roseclinical-100">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-mono text-gray-900 tabular-nums">{value}</dd>
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
      <span className="block font-display text-3xl font-light tabular-nums">{value}</span>
      <span className="block mt-1 text-[11px] opacity-80">{label}</span>
    </div>
  );
}

function ReliabilityDiagram({ curve }) {
  const size = 220;
  const pad = 40;
  const scale = (v) => pad + v * (size - 2 * pad);
  const y = (v) => size - scale(v);
  const maxCount = Math.max(...curve.map((b) => b.count));
  const points = curve.map((b) => `${scale(b.mean_predicted)},${y(b.observed_frequency)}`).join(' ');
  const ticks = [0, 0.5, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mt-4 w-full max-w-[280px]" role="img"
      aria-label="Diagrama de fiabilidad de las probabilidades del modelo">
      <rect x={pad} y={pad} width={size - 2 * pad} height={size - 2 * pad} fill="none" stroke="#F1E4E8" />
      <line x1={scale(0)} y1={y(0)} x2={scale(1)} y2={y(1)} stroke="#D1D5DB" strokeDasharray="4 4" />
      {ticks.map((t) => (
        <g key={t} fontSize="9" fill="#6B7280">
          <text x={scale(t)} y={size - pad + 14} textAnchor="middle">{t * 100}%</text>
          <text x={pad - 6} y={y(t) + 3} textAnchor="end">{t * 100}%</text>
        </g>
      ))}
      <polyline points={points} fill="none" stroke="#D62754" strokeWidth="1.5" />
      {curve.map((b) => (
        <circle key={b.bin_start} cx={scale(b.mean_predicted)} cy={y(b.observed_frequency)}
          r={2.5 + 4 * Math.sqrt(b.count / maxCount)} fill="#D62754" fillOpacity="0.85">
          <title>{`Predicho ${pct(b.mean_predicted)} · real ${pct(b.observed_frequency)} · ${b.count} casos`}</title>
        </circle>
      ))}
      <text x={size / 2} y={size - 4} textAnchor="middle" fontSize="9" fill="#6B7280">Probabilidad predicha</text>
      <text x={9} y={size / 2} textAnchor="middle" fontSize="9" fill="#6B7280"
        transform={`rotate(-90 9 ${size / 2})`}>Proporción real</text>
    </svg>
  );
}
