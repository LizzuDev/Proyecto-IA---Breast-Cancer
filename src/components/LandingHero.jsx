import React from 'react';
import { ArrowRight, ShieldCheck, Activity, Layers, CheckCircle2 } from 'lucide-react';

export default function LandingHero({ onStartTool, onGoToMetrics }) {
  const keyBenefits = [
    {
      title: 'Prioridad en Seguridad Clínica',
      desc: 'El modelo prioritario está calibrado para minimizar falsos negativos (95.2% de sensibilidad en tumores malignos), evitando diagnósticos tardíos.',
      icon: ShieldCheck,
      stat: '95.2% Sensibilidad'
    },
    {
      title: 'Consenso Multi-Algoritmo',
      desc: 'Compara de forma simultánea las predicciones de Regresión Logística, SVM con kernel RBF y Regresión Polinomial para confirmar concordancia.',
      icon: Layers,
      stat: '3 Modelos en Paralelo'
    },
    {
      title: 'Explicabilidad Morfológica',
      desc: 'Identifica cuáles parámetros celulares (radio, concavidad, textura) difieren significativamente de la población benigna de referencia.',
      icon: Activity,
      stat: '30 Variables Analizadas'
    }
  ];

  const metrics = [
    { label: 'Exactitud en Validación', value: '98.2%' },
    { label: 'Sensibilidad Maligna (Recall)', value: '95.2%' },
    { label: 'Capacidad Discriminatoria (ROC-AUC)', value: '0.998' },
    { label: 'Muestras de Biopsia (WDBC)', value: '569' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-roseclinical-50 border border-roseclinical-100 text-roseclinical-700 text-xs font-semibold">
          <span>Soporte a la Decisión Médica</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
          Clasificación Automatizada de Biopsias Mamarias
        </h1>

        <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal max-w-2xl mx-auto">
          Sistema analítico asistido por aprendizaje automático para el análisis morfométrico de citología por aspiración con aguja fina (FNA).
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStartTool}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-md bg-roseclinical-600 hover:bg-roseclinical-700 active:bg-roseclinical-800 text-white font-semibold text-xs tracking-wide shadow-sm transition-colors"
          >
            <span>Iniciar Evaluación Diagnóstica</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onGoToMetrics}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-md bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-xs transition-colors"
          >
            Ver Validación y Modelos
          </button>
        </div>
      </div>

      {/* KPI Bar - Seamless flat container */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white rounded-md border border-gray-200/90 shadow-subtle">
        {metrics.map((m, i) => (
          <div key={i} className="text-center md:text-left md:border-r md:last:border-r-0 border-gray-100 md:pr-4">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono">
              {m.value}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* 3 Core Benefits Cards */}
      <div className="space-y-4">
        <div className="text-center md:text-left">
          <h2 className="text-lg font-bold text-gray-900">
            Ventajas Operativas del Sistema
          </h2>
          <p className="text-xs text-gray-500">
            Diseñado para integrarse en el flujo de trabajo patológico con rigor analítico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {keyBenefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index} 
                className="bg-white p-6 rounded-md border border-gray-200/90 shadow-subtle space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded bg-roseclinical-50 flex items-center justify-center text-roseclinical-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-roseclinical-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-roseclinical-600" />
                  <span>{item.stat}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
