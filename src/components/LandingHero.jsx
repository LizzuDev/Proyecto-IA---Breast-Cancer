import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Dna, 
  Microscope, 
  TrendingUp, 
  FileCheck2, 
  Info,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function LandingHero({ onStartTool, onGoToMetrics }) {
  const stats = [
    { label: 'Precisión de Validación', value: '96.5%', sub: 'Evaluado en test set estratificado', icon: TrendingUp },
    { label: 'Discriminación ROC-AUC', value: '0.995', sub: 'Capacidad de separación M/B', icon: ShieldCheck },
    { label: 'Variables Nucleares', value: '30', sub: 'Calculadas por análisis de imagen FNA', icon: Dna },
    { label: 'Muestras Clínicas', value: '569', sub: 'Hospitales Univ. de Wisconsin', icon: Microscope },
  ];

  const fnaFeatures = [
    {
      title: 'Radio & Perímetro Nuclear',
      desc: 'Mide la distancia promedio desde el centro del núcleo hasta sus bordes. Los núcleos malignos suelen ser significativamente más grandes.',
      tag: 'Tamaño'
    },
    {
      title: 'Concavidad & Puntos Cóncavos',
      desc: 'Cuantifica la severidad y número de hendiduras en el contorno nuclear. Es uno de los predictores más potentes de malignidad.',
      tag: 'Morfología'
    },
    {
      title: 'Textura Nuclear',
      desc: 'Desviación estándar de los valores de escala de grises cromatínicos, reflejando la heterogeneidad del ADN nuclear.',
      tag: 'Densidad'
    },
    {
      title: 'Simetría & Dimensión Fractal',
      desc: 'Aproximación de ' + '"costa fractal"' + ' que evalúa irregularidades microscópicas en la membrana nuclear celular.',
      tag: 'Complejidad'
    }
  ];

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rosepink-600/15 rounded-full blur-[140px] pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-tealclinical-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto text-center px-4">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-panel border border-rosepink-500/30 text-rosepink-300 text-xs sm:text-sm font-medium mb-8 animate-fade-in shadow-lg shadow-rosepink-950/40">
            <Sparkles className="w-4 h-4 text-rosepink-400" />
            <span>Inteligencia Artificial Aplicada a la Citopatología Mamaria</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white leading-[1.15] mb-6">
            Detección temprana y precisa de{' '}
            <span className="bg-gradient-to-r from-rosepink-400 via-rosepink-500 to-rosepink-300 bg-clip-text text-transparent">
              Cáncer de Mama
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slateclinical-300 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            Explora e interactúa con un modelo de Machine Learning entrenado sobre el dataset histórico de Wisconsin (WDBC). Clasifica biopsias citológicas por punción con aguja fina (FNA) con explicabilidad instantánea.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={onStartTool}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-xl bg-gradient-to-r from-rosepink-600 to-rosepink-500 hover:from-rosepink-500 hover:to-rosepink-600 text-white font-semibold text-base shadow-xl shadow-rosepink-600/30 hover:shadow-rosepink-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Abrir Herramienta Interactiva</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onGoToMetrics}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-4 rounded-xl glass-panel-subtle hover:bg-slateclinical-800 text-slateclinical-200 hover:text-white font-medium text-base border border-slateclinical-700/60 transition-all duration-200"
            >
              <FileCheck2 className="w-5 h-5 text-rosepink-400" />
              <span>Ver Validación del Modelo</span>
            </button>
          </div>

          {/* Disclaimer pill */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-slateclinical-400">
            <Info className="w-3.5 h-3.5 text-rosepink-400" />
            <span>Proyecto académico y de soporte investigativo. No reemplaza el dictamen de un médico especialista.</span>
          </div>

        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div 
                key={idx}
                className="glass-panel p-6 rounded-2xl border border-slateclinical-800 hover:border-rosepink-800/40 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slateclinical-400">
                    {s.label}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-rosepink-950/60 border border-rosepink-800/40 flex items-center justify-center text-rosepink-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white font-display mb-1 group-hover:text-rosepink-300 transition-colors">
                  {s.value}
                </div>
                <div className="text-xs text-slateclinical-400 leading-relaxed">
                  {s.sub}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Understanding FNA Cytology Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slateclinical-800 relative overflow-hidden">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-rosepink-400 mb-2 block">
              Fundamento Médico & Citológico
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-white mb-4">
              ¿Cómo analiza la IA las células extraídas por biopsia FNA?
            </h2>
            <p className="text-slateclinical-300 text-sm sm:text-base leading-relaxed">
              En la citología por punción y aspiración con aguja fina (FNA), se digitalizan las preparaciones celulares bajo microscopio. Cada célula cancerígena presenta pleomorfismo nuclear: variaciones marcadas en forma, tamaño, textura y concavidad respecto al tejido mamario sano.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fnaFeatures.map((feat, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl bg-slateclinical-900/60 border border-slateclinical-800 hover:border-rosepink-600/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-white font-display">
                    {feat.title}
                  </h3>
                  <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-rosepink-950 text-rosepink-300 border border-rosepink-800/50">
                    {feat.tag}
                  </span>
                </div>
                <p className="text-sm text-slateclinical-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* How it works workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-3">
            Flujo de Evaluación en 3 Pasos
          </h2>
          <p className="text-slateclinical-400 text-sm">
            Diseñado para médicos, investigadores y estudiantes para probar casos clínicos al instante.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="glass-panel p-6 rounded-2xl border border-slateclinical-800 text-center relative">
            <div className="w-12 h-12 rounded-xl bg-rosepink-600/20 text-rosepink-400 flex items-center justify-center font-bold text-lg mx-auto mb-4 border border-rosepink-500/30">
              1
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Ingreso de Parámetros</h3>
            <p className="text-sm text-slateclinical-400">
              Usa los sliders intuitivos o carga casos reales preconfigurados (benignos o malignos) con 1 solo clic.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slateclinical-800 text-center relative">
            <div className="w-12 h-12 rounded-xl bg-tealclinical-500/20 text-tealclinical-300 flex items-center justify-center font-bold text-lg mx-auto mb-4 border border-tealclinical-500/30">
              2
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Inferencia Scikit-Learn</h3>
            <p className="text-sm text-slateclinical-400">
              El modelo serializado con Joblib procesa la estandarización y realiza el cálculo de probabilidades en milisegundos.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slateclinical-800 text-center relative">
            <div className="w-12 h-12 rounded-xl bg-rosepink-600/20 text-rosepink-400 flex items-center justify-center font-bold text-lg mx-auto mb-4 border border-rosepink-500/30">
              3
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-display">Reporte con Explicabilidad</h3>
            <p className="text-sm text-slateclinical-400">
              Obtén el diagnóstico estimado, nivel de riesgo y los factores celulares que más peso tuvieron en la decisión.
            </p>
          </div>

        </div>

        <div className="text-center mt-12">
          <button
            onClick={onStartTool}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-rosepink-600 hover:bg-rosepink-500 text-white font-semibold text-sm shadow-lg shadow-rosepink-600/30 transition-all duration-200"
          >
            <span>Iniciar Simulador de Diagnóstico</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </div>
  );
}
