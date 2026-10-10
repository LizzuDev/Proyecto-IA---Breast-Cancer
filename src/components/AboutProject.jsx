import React from 'react';
import { ShieldAlert, BookOpen, Cpu, Heart, CheckCircle2, ExternalLink } from 'lucide-react';

export default function AboutProject() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosepink-950 text-rosepink-300 border border-rosepink-700/40 text-xs font-semibold uppercase tracking-wider mb-3">
          <BookOpen className="w-3.5 h-3.5 text-rosepink-400" />
          <span>Ficha Técnica & Contexto</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white mb-2">
          Acerca del Estudio & Metodología
        </h1>
        <p className="text-slateclinical-300 text-sm sm:text-base">
          Información científica sobre la obtención de datos, procesamiento digital de imágenes y responsabilidades de uso.
        </p>
      </div>

      {/* Dataset origin card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slateclinical-800 space-y-4">
        <h2 className="text-xl font-bold font-display text-white flex items-center space-x-2">
          <span>El Dataset de Wisconsin (WDBC)</span>
        </h2>
        <p className="text-sm text-slateclinical-300 leading-relaxed">
          El <strong>Wisconsin Diagnostic Breast Cancer (WDBC)</strong> fue creado por los investigadores Dr. William H. Wolberg, W. Nick Street y Olvi L. Mangasarian en los Hospitales de la Universidad de Wisconsin, Madison.
        </p>
        <p className="text-sm text-slateclinical-300 leading-relaxed">
          Las muestras se obtuvieron mediante punción-aspiración con aguja fina (FNA) de bultos mamarios sospechosos. Una cámara digital montada en microscopio capturó las imágenes de las células, y un sistema interactivo denominado <em>XIMAGE</em> delimitó los bordes de los núcleos celulares para calcular automáticamente las 10 medidas morfológicas.
        </p>

        <div className="pt-2 flex items-center space-x-4">
          <a
            href="https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs text-rosepink-400 hover:text-rosepink-300 font-medium"
          >
            <span>Repositorio UCI Machine Learning</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <span className="text-slateclinical-700">|</span>
          <a
            href="https://www.kaggle.com/datasets/uciml/breast-cancer-wisconsin-data"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs text-rosepink-400 hover:text-rosepink-300 font-medium"
          >
            <span>Dataset en Kaggle</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Stack & Architecture */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slateclinical-800 space-y-4">
        <h2 className="text-xl font-bold font-display text-white flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-rosepink-400" />
          <span>Arquitectura Tecnológica del Proyecto</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slateclinical-900/60 border border-slateclinical-800">
            <h3 className="text-sm font-bold text-white mb-1">Frontend React + Tailwind CSS</h3>
            <p className="text-xs text-slateclinical-400">
              Interfaz construida con Vite, React 18, Tailwind CSS con paleta clínica de oncología y Lucide Icons para una experiencia intuitiva, fluida y responsive.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slateclinical-900/60 border border-slateclinical-800">
            <h3 className="text-sm font-bold text-white mb-1">Backend FastAPI + Scikit-Learn + Joblib</h3>
            <p className="text-xs text-slateclinical-400">
              Pipeline de preprocesamiento (StandardScaler) y clasificador Random Forest serializado con <code>joblib</code> servido a través de una API REST moderna con FastAPI.
            </p>
          </div>
        </div>
      </div>

      {/* Ethical & Medical Disclaimer */}
      <div className="p-6 rounded-2xl bg-rosepink-950/30 border border-rosepink-900/60 space-y-3">
        <div className="flex items-center space-x-2 text-rosepink-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Aviso Médico & Bioético</h3>
        </div>
        <p className="text-xs text-rosepink-200/90 leading-relaxed">
          Esta aplicación es una herramienta interactiva para propósitos educativos, demostrativos y de investigación académica en ciencias de la computación e inteligencia artificial aplicada a la salud. <strong>Bajo ninguna circunstancia sustituye la consulta médica, el diagnóstico anatomopatológico o la mamografía realizada por un profesional de la salud debidamente colegiado.</strong>
        </p>
      </div>

    </div>
  );
}
