import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function LandingHero({ onStartTool, onGoToMetrics }) {
  const metrics = [
    { value: '95.2%', label: 'Sensibilidad ante tumores malignos' },
    { value: '0.998', label: 'ROC-AUC en test independiente' },
    { value: '569', label: 'Biopsias FNA del dataset Wisconsin' },
  ];

  const steps = [
    {
      title: 'Mide',
      desc: 'Ingrese las 10 características nucleares observadas en la citología: radio, textura, concavidad, simetría…',
    },
    {
      title: 'Compara',
      desc: 'Regresión Logística, SVM y Regresión Polinomial evalúan la muestra en paralelo para verificar su concordancia.',
    },
    {
      title: 'Interpreta',
      desc: 'Vea la probabilidad de malignidad y qué parámetros se alejan de la población benigna de referencia.',
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Halo rosa muy tenue detrás del hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-roseclinical-100/60 via-roseclinical-50/40 to-transparent"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 max-w-3xl">
          <h1 className="font-display font-light text-4xl sm:text-6xl text-gray-900 leading-[1.08] tracking-tight">
            Una segunda lectura para cada{' '}
            <em className="italic text-roseclinical-600">biopsia mamaria</em>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
            OncoPath AI analiza la morfometría de citologías por aspiración con aguja fina (FNA)
            y estima la probabilidad de malignidad, priorizando no pasar por alto ningún caso maligno.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <button
              onClick={onStartTool}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-roseclinical-600 hover:bg-roseclinical-700 active:bg-roseclinical-800 text-white text-sm font-semibold transition-colors"
            >
              Iniciar evaluación
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToMetrics}
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-roseclinical-700 transition-colors"
            >
              Cómo se validaron los modelos
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Cifras clave: una sola línea, sin contenedores */}
        <section className="grid grid-cols-1 sm:grid-cols-3 border-t border-roseclinical-200/70">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="py-8 sm:pr-8 border-b sm:border-b-0 sm:border-r last:border-0 border-roseclinical-200/70 sm:[&:not(:first-child)]:pl-8"
            >
              <div className="font-display text-4xl sm:text-5xl font-light text-gray-900 tracking-tight">
                {m.value}
              </div>
              <div className="mt-2 text-sm text-gray-500">{m.label}</div>
            </div>
          ))}
        </section>

        {/* Cómo funciona */}
        <section className="py-16 sm:py-24 border-t border-roseclinical-200/70">
          <h2 className="font-display font-normal text-2xl sm:text-3xl text-gray-900 tracking-tight">
            Cómo funciona
          </h2>

          <ol className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {steps.map((step, i) => (
              <li key={i}>
                <span className="font-mono text-xs text-roseclinical-600">0{i + 1}</span>
                <h3 className="mt-2 font-display text-xl text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Por qué la sensibilidad + aviso */}
        <section className="pb-8 grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 border-t border-roseclinical-200/70 pt-16 sm:pt-20">
          <h2 className="md:col-span-2 font-display font-normal text-2xl sm:text-3xl text-gray-900 tracking-tight leading-snug">
            Diseñado para no dejar pasar un caso maligno.
          </h2>
          <div className="md:col-span-3 space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>
              En oncología, un falso negativo puede retrasar un tratamiento vital. Por eso el modelo
              principal se eligió por su sensibilidad: en el test ciego de 114 biopsias identificó
              40 de los 42 tumores malignos.
            </p>
            <p className="text-gray-500">
              Herramienta de apoyo con fines académicos e investigativos. No sustituye el criterio
              de un patólogo ni constituye un diagnóstico clínico.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
