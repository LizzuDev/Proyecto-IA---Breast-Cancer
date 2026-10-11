import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Sliders, 
  Layers, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { predictDiagnosis, fetchSamples } from '../services/api';

const CLINICAL_FEATURE_GROUPS = [
  {
    category: 'Dimensiones Celulares',
    description: 'Magnitud geométrica y volumen nuclear',
    features: [
      { key: 'radius', name: 'Radio nuclear', unit: 'µm', defaultMean: 14.12, min: 6.0, max: 30.0, step: 0.1 },
      { key: 'perimeter', name: 'Perímetro nuclear', unit: 'µm', defaultMean: 91.96, min: 40.0, max: 190.0, step: 0.5 },
      { key: 'area', name: 'Área nuclear', unit: 'µm²', defaultMean: 654.88, min: 140.0, max: 2500.0, step: 5.0 },
    ]
  },
  {
    category: 'Contorno e Irregularidades',
    description: 'Hendiduras perimetrales y compacidad',
    features: [
      { key: 'concavity', name: 'Concavidad', unit: 'índice', defaultMean: 0.088, min: 0.0, max: 0.45, step: 0.005 },
      { key: 'concave points', name: 'Puntos cóncavos', unit: 'índice', defaultMean: 0.048, min: 0.0, max: 0.21, step: 0.002 },
      { key: 'compactness', name: 'Compacidad', unit: 'índice', defaultMean: 0.104, min: 0.01, max: 0.35, step: 0.001 },
    ]
  },
  {
    category: 'Morfología y Textura',
    description: 'Distribución cromatínica y simetría',
    features: [
      { key: 'texture', name: 'Textura cromatínica', unit: 'escala', defaultMean: 19.28, min: 9.0, max: 40.0, step: 0.1 },
      { key: 'smoothness', name: 'Suavidad superficial', unit: 'índice', defaultMean: 0.096, min: 0.05, max: 0.17, step: 0.001 },
      { key: 'symmetry', name: 'Simetría nuclear', unit: 'índice', defaultMean: 0.181, min: 0.10, max: 0.32, step: 0.005 },
      { key: 'fractal_dimension', name: 'Irregularidad de borde', unit: 'índice', defaultMean: 0.062, min: 0.04, max: 0.10, step: 0.001 },
    ]
  }
];

const ALL_KEYS = [
  'radius', 'texture', 'perimeter', 'area', 'smoothness',
  'compactness', 'concavity', 'concave points', 'symmetry', 'fractal_dimension'
];

export default function InteractiveDiagnostic() {
  const [measurementMode, setMeasurementMode] = useState('mean'); // 'mean' o 'worst'
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('all');
  const [samples, setSamples] = useState(null);
  const [features, setFeatures] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSampleLabel, setActiveSampleLabel] = useState('Valores basales');

  useEffect(() => {
    const initial = {};
    ALL_KEYS.forEach(k => {
      let defVal = 14.12;
      CLINICAL_FEATURE_GROUPS.forEach(g => {
        const found = g.features.find(f => f.key === k);
        if (found) defVal = found.defaultMean;
      });
      initial[`${k}_mean`] = defVal;
      initial[`${k}_se`] = Number((defVal * 0.05).toFixed(3));
      initial[`${k}_worst`] = Number((defVal * 1.25).toFixed(2));
    });
    setFeatures(initial);

    async function loadData() {
      const sData = await fetchSamples();
      if (sData) setSamples(sData);
    }
    loadData();
  }, []);

  const handleInputChange = (key, value) => {
    const num = parseFloat(value) || 0;
    setActiveSampleLabel('Personalizado');
    setFeatures(prev => ({
      ...prev,
      [`${key}_${measurementMode}`]: num
    }));
  };

  const handleLoadSample = (sampleObj, label) => {
    if (!sampleObj || !sampleObj.features) return;
    setFeatures(sampleObj.features);
    setActiveSampleLabel(label);
    setPrediction(null);
    setError(null);
  };

  const handleLoadBorderline = () => {
    const synthetic = {};
    ALL_KEYS.forEach(k => {
      let defVal = 14.12;
      CLINICAL_FEATURE_GROUPS.forEach(g => {
        const found = g.features.find(f => f.key === k);
        if (found) defVal = found.defaultMean;
      });
      const mid = Number((defVal * 1.18).toFixed(3));
      synthetic[`${k}_mean`] = mid;
      synthetic[`${k}_se`] = Number((mid * 0.06).toFixed(3));
      synthetic[`${k}_worst`] = Number((mid * 1.25).toFixed(2));
    });
    setFeatures(synthetic);
    setActiveSampleLabel('Muestra Indeterminada');
    setPrediction(null);
    setError(null);
  };

  const handleReset = () => {
    const initial = {};
    ALL_KEYS.forEach(k => {
      let defVal = 14.12;
      CLINICAL_FEATURE_GROUPS.forEach(g => {
        const found = g.features.find(f => f.key === k);
        if (found) defVal = found.defaultMean;
      });
      initial[`${k}_mean`] = defVal;
      initial[`${k}_se`] = Number((defVal * 0.05).toFixed(3));
      initial[`${k}_worst`] = Number((defVal * 1.25).toFixed(2));
    });
    setFeatures(initial);
    setActiveSampleLabel('Valores basales');
    setPrediction(null);
    setError(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictDiagnosis(features, selectedAlgorithm);
      setPrediction(res);
    } catch (err) {
      setError(err.message || 'Error de comunicación con el servicio de inferencia.');
    } finally {
      setLoading(false);
    }
  };

  const maligScore = prediction ? prediction.probability_malignant : 0;
  const arcLength = 220;
  const strokeOffset = arcLength - (arcLength * (maligScore / 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header bar - Seamless horizontal layout without pill capsules */}
      <div className="bg-white p-5 rounded-md border border-gray-200/90 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Evaluación Citopatológica
            </h1>
            <span className="text-xs text-roseclinical-700 font-semibold px-2 py-0.5 bg-roseclinical-50 border border-roseclinical-200 rounded">
              {activeSampleLabel}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Ingreso y valoración cuantitativa de biopsias por aspiración con aguja fina (FNA).
          </p>
        </div>

        {/* Quick Sample Selector - Clean flat segmented buttons */}
        <div className="flex items-center space-x-1.5">
          <div className="inline-flex rounded-md border border-gray-200 bg-gray-50/60 p-0.5 text-xs font-medium">
            <button
              onClick={() => {
                if (samples?.benign?.[0]) handleLoadSample(samples.benign[0], 'Muestra Benigna');
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSampleLabel === 'Muestra Benigna'
                  ? 'bg-white text-gray-900 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Caso Benigno
            </button>

            <button
              onClick={() => {
                if (samples?.malignant?.[0]) handleLoadSample(samples.malignant[0], 'Muestra Maligna');
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSampleLabel === 'Muestra Maligna'
                  ? 'bg-white text-roseclinical-700 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Caso Sospechoso
            </button>

            <button
              onClick={handleLoadBorderline}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSampleLabel === 'Muestra Indeterminada'
                  ? 'bg-white text-gray-900 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Caso Límite
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
            title="Restablecer mediciones"
            aria-label="Restablecer mediciones"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Layout: Inputs on the left, Results on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Section (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-md border border-gray-200/90 shadow-subtle p-6 space-y-6">
          
          {/* Subheader with View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Parámetros Celulares
              </h2>
              <p className="text-xs text-gray-500">
                Ajuste los valores observados en el microscopio digital
              </p>
            </div>

            {/* Seamless Mode Switcher */}
            <div className="inline-flex rounded-md border border-gray-200 bg-gray-50/70 p-0.5 text-xs font-medium">
              <button
                onClick={() => setMeasurementMode('mean')}
                className={`px-3 py-1 rounded transition-colors ${
                  measurementMode === 'mean'
                    ? 'bg-white text-gray-900 font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Valores Medios
              </button>
              <button
                onClick={() => setMeasurementMode('worst')}
                className={`px-3 py-1 rounded transition-colors ${
                  measurementMode === 'worst'
                    ? 'bg-white text-gray-900 font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mediciones Extremas
              </button>
            </div>
          </div>

          {/* Grouped Feature Sections without heavy bubble cards */}
          <div className="space-y-6 divide-y divide-gray-100">
            {CLINICAL_FEATURE_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className={gIdx > 0 ? 'pt-6 space-y-3' : 'space-y-3'}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {group.category}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-normal">
                    {group.description}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {group.features.map((feat) => {
                    const fullKey = `${feat.key}_${measurementMode}`;
                    const val = features[fullKey] !== undefined ? features[fullKey] : feat.defaultMean;
                    const minVal = measurementMode === 'worst' ? feat.min : feat.min;
                    const maxVal = measurementMode === 'worst' ? (feat.max * 1.4) : feat.max;

                    return (
                      <div 
                        key={feat.key} 
                        className="p-3 bg-surface-subtle/80 rounded border border-gray-200/60 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label 
                            htmlFor={fullKey} 
                            className="text-xs font-semibold text-gray-800 truncate"
                            title={feat.name}
                          >
                            {feat.name}
                          </label>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {feat.unit}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min={minVal}
                            max={maxVal}
                            step={feat.step}
                            value={val}
                            onChange={(e) => handleInputChange(feat.key, e.target.value)}
                            className="w-full h-1 bg-gray-300 rounded accent-roseclinical-600 cursor-pointer"
                          />
                          <input
                            id={fullKey}
                            type="number"
                            min={minVal}
                            max={maxVal}
                            step={feat.step}
                            value={val}
                            onChange={(e) => handleInputChange(feat.key, e.target.value)}
                            className="w-16 px-1.5 py-1 text-xs text-right font-mono bg-white border border-gray-200 rounded text-gray-900 focus:border-roseclinical-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Model selection & Prominent Execute Button */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">Algoritmo:</span>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="text-xs font-semibold bg-white border border-gray-200 rounded px-2.5 py-2 text-gray-800 focus:outline-none focus:border-roseclinical-500"
              >
                <option value="all">Consenso (3 Modelos)</option>
                <option value="reg_bin">Regresión Logística (Principal)</option>
                <option value="svm">SVM Kernel RBF</option>
                <option value="log_pol">Regresión Polinomial</option>
              </select>
            </div>

            {/* High Impact Primary Button with Subtle Rose Accent */}
            <button
              onClick={handleExecute}
              disabled={loading}
              className="inline-flex items-center justify-center space-x-2 px-7 py-2.5 rounded-md bg-roseclinical-600 hover:bg-roseclinical-700 active:bg-roseclinical-800 text-white font-semibold text-xs tracking-wide shadow-sm transition-all disabled:opacity-50"
            >
              <Activity className="w-4 h-4" />
              <span>{loading ? 'Calculando diagnóstico...' : 'Ejecutar Diagnóstico'}</span>
            </button>
          </div>

        </div>

        {/* Right Column: Clean Medical Diagnostic Dashboard (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Main Result Card */}
          <div className="bg-white rounded-md border border-gray-200/90 shadow-subtle p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900">
                Resultado del Análisis
              </h2>
              {prediction && (
                <span className={`text-xs px-2.5 py-0.5 rounded font-semibold border ${
                  prediction.diagnosis === 'Benigno'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-roseclinical-50 text-roseclinical-800 border-roseclinical-200'
                }`}>
                  {prediction.diagnosis}
                </span>
              )}
            </div>

            {error && (
              <div className="p-3.5 rounded bg-roseclinical-50 border border-roseclinical-200 text-roseclinical-800 text-xs">
                {error}
              </div>
            )}

            {!prediction && !error && (
              <div className="text-center py-14 px-4 space-y-3">
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Esperando Ejecución
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Presione <strong>"Ejecutar Diagnóstico"</strong> para iniciar la inferencia matemática de los modelos.
                </p>
              </div>
            )}

            {prediction && (
              <div className="space-y-6">
                
                {/* Visual Radial Gauge Score */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative w-44 h-28 flex items-end justify-center">
                    <svg className="w-44 h-28 overflow-visible" viewBox="0 0 160 90">
                      <path
                        d="M 15 85 A 65 65 0 0 1 145 85"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="11"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 15 85 A 65 65 0 0 1 145 85"
                        fill="none"
                        stroke={prediction.diagnosis === 'Benigno' ? '#10B981' : '#D62754'}
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeDasharray={arcLength}
                        strokeDashoffset={strokeOffset}
                        className="transition-all duration-700"
                      />
                    </svg>

                    <div className="absolute bottom-0 text-center">
                      <span className="text-3xl font-bold font-mono text-gray-900 block leading-tight">
                        {prediction.diagnosis === 'Benigno' ? prediction.probability_benign : prediction.probability_malignant}%
                      </span>
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Probabilidad {prediction.diagnosis}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <div className="text-xs font-medium text-gray-700">
                      Evaluación: <span className={prediction.diagnosis === 'Benigno' ? 'text-emerald-700 font-bold' : 'text-roseclinical-700 font-bold'}>{prediction.risk_level}</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Model Consensus (Clean Flat Grid) */}
                {prediction.multi_model_summary && (
                  <div className="p-3.5 rounded bg-surface-subtle/80 border border-gray-200/60 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">Consenso de Modelos</span>
                      <span className="text-gray-500 font-medium font-mono text-[11px]">
                        {prediction.consensus?.agreement_percentage}% concordancia
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {Object.entries(prediction.multi_model_summary).map(([key, data]) => {
                        const isMal = data.diagnosis === 'Maligno';
                        return (
                          <div 
                            key={key} 
                            className="bg-white p-2 rounded border border-gray-200"
                          >
                            <span className="text-[10px] text-gray-400 block truncate">
                              {data.short_name}
                            </span>
                            <span className={`text-xs font-bold block ${isMal ? 'text-roseclinical-700' : 'text-emerald-700'}`}>
                              {data.diagnosis}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {isMal ? `${data.probability_malignant}%` : `${data.probability_benign}%`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Key Cellular Alterations (Clean Integrated List) */}
                {prediction.top_deviations && prediction.top_deviations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-800 block">
                      Parámetros con mayor desviación respecto a lo benigno:
                    </span>
                    <div className="space-y-1.5">
                      {prediction.top_deviations.slice(0, 4).map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-surface-subtle/70">
                          <span className="font-mono text-gray-700 text-[11px]">{d.feature}</span>
                          <span className={`font-semibold font-mono text-[11px] ${
                            d.deviation_z > 0 ? 'text-roseclinical-700' : 'text-emerald-700'
                          }`}>
                            {d.deviation_z > 0 ? `+${d.deviation_z} σ` : `${d.deviation_z} σ`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Minimalist Medical Disclaimer */}
                <div className="text-[11px] text-gray-400 leading-relaxed pt-2 border-t border-gray-100">
                  Herramienta analítica de apoyo a la decisión diagnóstica. Requiere correlación histopatológica formal.
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
