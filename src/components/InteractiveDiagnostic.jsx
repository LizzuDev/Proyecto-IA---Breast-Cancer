import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Sliders, 
  BarChart2, 
  Download, 
  ArrowRight,
  FlaskConical,
  Zap,
  Info
} from 'lucide-react';
import { predictDiagnosis, fetchSamples, fetchMetadata } from '../services/api';

// 10 características nucleares base con nombres legibles, descripciones y rangos del dataset WDBC
const FEATURE_DEFINITIONS = [
  { key: 'radius', name: 'Radio Nuclear', desc: 'Promedio de distancias del centro a puntos del perímetro (µm)', min: 6.0, max: 30.0, step: 0.1, unit: 'µm', defaultMean: 14.12 },
  { key: 'texture', name: 'Textura Cromatínica', desc: 'Desviación estándar de valores de escala de grises', min: 9.0, max: 40.0, step: 0.1, unit: 'escala', defaultMean: 19.28 },
  { key: 'perimeter', name: 'Perímetro Nuclear', desc: 'Longitud del contorno nuclear promedio', min: 40.0, max: 190.0, step: 0.5, unit: 'µm', defaultMean: 91.96 },
  { key: 'area', name: 'Área Nuclear', desc: 'Área superficial del corte transversal del núcleo celular', min: 140.0, max: 2500.0, step: 5.0, unit: 'µm²', defaultMean: 654.88 },
  { key: 'smoothness', name: 'Suavidad', desc: 'Variación local en las longitudes de los radios celulares', min: 0.05, max: 0.17, step: 0.001, unit: '', defaultMean: 0.096 },
  { key: 'compactness', name: 'Compacidad', desc: 'Calculada como (perímetro² / área - 1.0)', min: 0.01, max: 0.35, step: 0.001, unit: '', defaultMean: 0.104 },
  { key: 'concavity', name: 'Concavidad', desc: 'Severidad de las hendiduras en el contorno del núcleo', min: 0.0, max: 0.45, step: 0.005, unit: '', defaultMean: 0.088 },
  { key: 'concave points', name: 'Puntos Cóncavos', desc: 'Número o proporción de hendiduras del perímetro', min: 0.0, max: 0.21, step: 0.002, unit: '', defaultMean: 0.048 },
  { key: 'symmetry', name: 'Simetría', desc: 'Grado de simetría de la forma nuclear bilateral', min: 0.10, max: 0.32, step: 0.005, unit: '', defaultMean: 0.181 },
  { key: 'fractal_dimension', name: 'Dimensión Fractal', desc: 'Aproximación de Mandelbrot de la frontera nuclear', min: 0.04, max: 0.10, step: 0.001, unit: '', defaultMean: 0.062 },
];

export default function InteractiveDiagnostic() {
  const [activeGroup, setActiveGroup] = useState('mean'); // 'mean', 'se', 'worst'
  const [samples, setSamples] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [features, setFeatures] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Inicializar características por defecto
  useEffect(() => {
    const initFeats = {};
    FEATURE_DEFINITIONS.forEach(f => {
      initFeats[`${f.key}_mean`] = f.defaultMean;
      initFeats[`${f.key}_se`] = Number((f.defaultMean * 0.05).toFixed(3));
      initFeats[`${f.key}_worst`] = Number((f.defaultMean * 1.25).toFixed(2));
    });
    setFeatures(initFeats);

    // Cargar muestras y metadatos de la API
    async function loadData() {
      const [sData, mData] = await Promise.all([fetchSamples(), fetchMetadata()]);
      if (sData) setSamples(sData);
      if (mData) setMetadata(mData);
    }
    loadData();
  }, []);

  const handleInputChange = (fullKey, value) => {
    setSelectedPreset(null);
    setFeatures(prev => ({
      ...prev,
      [fullKey]: parseFloat(value) || 0
    }));
  };

  const handleLoadSample = (sampleObj, label) => {
    if (!sampleObj || !sampleObj.features) return;
    setFeatures(sampleObj.features);
    setSelectedPreset(label);
    setPrediction(null);
    setError(null);
  };

  const handleReset = () => {
    const initFeats = {};
    FEATURE_DEFINITIONS.forEach(f => {
      initFeats[`${f.key}_mean`] = f.defaultMean;
      initFeats[`${f.key}_se`] = Number((f.defaultMean * 0.05).toFixed(3));
      initFeats[`${f.key}_worst`] = Number((f.defaultMean * 1.25).toFixed(2));
    });
    setFeatures(initFeats);
    setSelectedPreset(null);
    setPrediction(null);
    setError(null);
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictDiagnosis(features);
      setPrediction(res);
    } catch (err) {
      setError(err.message || 'No fue posible conectar con el servidor de IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header of Tool */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-rosepink-900/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosepink-950 text-rosepink-300 border border-rosepink-700/40 text-xs font-semibold uppercase tracking-wider mb-3">
              <FlaskConical className="w-3.5 h-3.5 text-rosepink-400" />
              <span>Simulador Interactivo con Scikit-Learn</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-white mb-2">
              Análisis Citológico Asistido por IA
            </h1>
            <p className="text-sm sm:text-base text-slateclinical-300 max-w-2xl">
              Ingresa los parámetros morfológicos de la biopsia FNA o utiliza un caso clínico precargado para estimar la probabilidad de malignidad con el modelo Random Forest / Joblib.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (samples?.benign?.[0]) {
                  handleLoadSample(samples.benign[0], 'Benigno #1');
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition-all ${
                selectedPreset === 'Benigno #1'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'glass-panel-subtle hover:bg-slateclinical-800 text-emerald-300 border-emerald-900/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cargar Caso Benigno</span>
            </button>

            <button
              onClick={() => {
                if (samples?.malignant?.[0]) {
                  handleLoadSample(samples.malignant[0], 'Maligno #1');
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition-all ${
                selectedPreset === 'Maligno #1'
                  ? 'bg-rosepink-600 text-white border-rosepink-500 shadow-md shadow-rosepink-600/30'
                  : 'glass-panel-subtle hover:bg-slateclinical-800 text-rosepink-300 border-rosepink-900/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rosepink-400" />
              <span>Cargar Caso Maligno</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-xs font-medium glass-panel-subtle hover:bg-slateclinical-800 text-slateclinical-300 border border-slateclinical-700/60 flex items-center space-x-1.5 transition-all"
              title="Restablecer a valores promedios"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Inputs + Results Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Input Form (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-slateclinical-800 space-y-6">
          
          {/* Subtabs for Mean, SE, Worst */}
          <div className="flex items-center justify-between border-b border-slateclinical-800 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slateclinical-400">
              Categoría de Variables
            </span>
            <div className="flex space-x-1 bg-slateclinical-900/90 p-1 rounded-xl border border-slateclinical-800">
              <button
                onClick={() => setActiveGroup('mean')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeGroup === 'mean'
                    ? 'bg-rosepink-600 text-white shadow-sm'
                    : 'text-slateclinical-400 hover:text-white'
                }`}
              >
                Medias (Mean)
              </button>
              <button
                onClick={() => setActiveGroup('se')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeGroup === 'se'
                    ? 'bg-rosepink-600 text-white shadow-sm'
                    : 'text-slateclinical-400 hover:text-white'
                }`}
              >
                Error Estándar (SE)
              </button>
              <button
                onClick={() => setActiveGroup('worst')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeGroup === 'worst'
                    ? 'bg-rosepink-600 text-white shadow-sm'
                    : 'text-slateclinical-400 hover:text-white'
                }`}
              >
                Peores Valores (Worst)
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURE_DEFINITIONS.map((feat) => {
              const fullKey = `${feat.key}_${activeGroup}`;
              const value = features[fullKey] !== undefined ? features[fullKey] : feat.defaultMean;
              
              // Multiplicadores dinámicos de rango para SE y Worst
              const minVal = activeGroup === 'se' ? (feat.min * 0.01) : feat.min;
              const maxVal = activeGroup === 'worst' ? (feat.max * 1.5) : activeGroup === 'se' ? (feat.max * 0.2) : feat.max;
              const stepVal = activeGroup === 'se' ? (feat.step * 0.1) : feat.step;

              return (
                <div 
                  key={fullKey}
                  className="p-3.5 rounded-xl bg-slateclinical-900/60 border border-slateclinical-800 hover:border-slateclinical-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor={fullKey} 
                      className="text-xs font-semibold text-slateclinical-200 truncate pr-2"
                      title={feat.desc}
                    >
                      {feat.name}
                    </label>
                    <span className="text-[10px] text-slateclinical-400 font-mono">
                      {feat.unit}
                    </span>
                  </div>

                  <p className="text-[10px] text-slateclinical-500 mb-2 truncate" title={feat.desc}>
                    {feat.desc}
                  </p>

                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min={minVal}
                      max={maxVal}
                      step={stepVal}
                      value={value}
                      onChange={(e) => handleInputChange(fullKey, e.target.value)}
                      className="w-full accent-rosepink-500 h-1.5 bg-slateclinical-800 rounded-lg cursor-pointer"
                    />
                    <input
                      id={fullKey}
                      type="number"
                      min={minVal}
                      max={maxVal}
                      step={stepVal}
                      value={value}
                      onChange={(e) => handleInputChange(fullKey, e.target.value)}
                      className="w-20 px-2 py-1 text-xs text-right font-mono rounded-lg bg-slateclinical-950 border border-slateclinical-700 text-white focus:border-rosepink-500 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-slateclinical-800 flex items-center justify-between">
            <span className="text-xs text-slateclinical-400 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-rosepink-400" />
              <span>30 características listas para inferencia</span>
            </span>

            <button
              onClick={handlePredict}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rosepink-600 to-rosepink-500 hover:from-rosepink-500 hover:to-rosepink-600 text-white text-sm font-semibold shadow-lg shadow-rosepink-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? 'Procesando con Scikit-Learn...' : 'Calcular Diagnóstico'}</span>
            </button>
          </div>

        </div>

        {/* Right column: Results Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slateclinical-800 relative">
            <h2 className="text-lg font-bold font-display text-white mb-4 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-rosepink-400" />
              <span>Resultado de la Inferencia</span>
            </h2>

            {error && (
              <div className="p-4 rounded-xl bg-rosepink-950/60 border border-rosepink-800 text-rosepink-200 text-xs mb-4">
                <strong>Error:</strong> {error}
                <div className="mt-2 text-[11px] text-rosepink-300">
                  Asegúrate de que el servidor FastAPI esté iniciado en <code>http://127.0.0.1:8000</code>.
                </div>
              </div>
            )}

            {!prediction && !error && (
              <div className="text-center py-14 px-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slateclinical-900 border border-slateclinical-800 flex items-center justify-center mx-auto text-slateclinical-500">
                  <Sliders className="w-8 h-8 text-rosepink-400/60 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Esperando datos de la biopsia
                  </h3>
                  <p className="text-xs text-slateclinical-400 max-w-sm mx-auto">
                    Haz clic en <strong>"Calcular Diagnóstico"</strong> o carga un caso benigno o maligno de prueba con los botones superiores.
                  </p>
                </div>
              </div>
            )}

            {prediction && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Result Card Badge */}
                <div className={`p-6 rounded-2xl border text-center ${
                  prediction.diagnosis === 'Benigno'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rosepink-950/40 border-rosepink-500/40 text-rosepink-200'
                }`}>
                  <span className="text-xs uppercase font-bold tracking-wider opacity-80 block mb-1">
                    Diagnóstico Predictivo
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold font-display mb-2">
                    {prediction.diagnosis.toUpperCase()}
                  </div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slateclinical-950/80 border border-current">
                    <span>Nivel de Riesgo: <strong>{prediction.risk_level}</strong></span>
                  </div>
                </div>

                {/* Probability Bars */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-400">
                      Benigno: {prediction.probability_benign}%
                    </span>
                    <span className="text-rosepink-400">
                      Maligno: {prediction.probability_malignant}%
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slateclinical-900 overflow-hidden flex border border-slateclinical-800">
                    <div 
                      className="bg-emerald-500 transition-all duration-700" 
                      style={{ width: `${prediction.probability_benign}%` }}
                    ></div>
                    <div 
                      className="bg-rosepink-500 transition-all duration-700" 
                      style={{ width: `${prediction.probability_malignant}%` }}
                    ></div>
                  </div>
                </div>

                {/* Factors of highest deviation (Explainability) */}
                {prediction.top_deviations && prediction.top_deviations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slateclinical-800">
                    <span className="text-xs font-semibold text-slateclinical-300 block mb-2">
                      Factores celulares de mayor impacto:
                    </span>
                    <div className="space-y-1.5">
                      {prediction.top_deviations.slice(0, 4).map((dev, i) => (
                        <div 
                          key={i}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slateclinical-900/60 border border-slateclinical-800"
                        >
                          <span className="text-slateclinical-300 font-mono truncate mr-2">
                            {dev.feature}
                          </span>
                          <span className={`text-[11px] font-bold ${
                            dev.deviation_z > 0 ? 'text-rosepink-400' : 'text-emerald-400'
                          }`}>
                            {dev.deviation_z > 0 ? `+${dev.deviation_z}σ` : `${dev.deviation_z}σ`} vs media
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-3.5 rounded-xl bg-slateclinical-900/80 border border-slateclinical-800 text-[11px] text-slateclinical-400 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-rosepink-400 shrink-0 mt-0.5" />
                  <span>
                    Este diagnóstico es un cálculo probabilístico computacional asistido por IA para propósitos científicos. Debe ser validado con histopatología clínica y mamografía.
                  </span>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
