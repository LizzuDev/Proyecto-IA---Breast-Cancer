import React from 'react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="border-t border-gray-200/80 bg-white py-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-800">
              OncoPath <span className="text-roseclinical-600 font-bold">AI</span>
            </span>
            <span>·</span>
            <span>Sistema Asistido para Citopatología Mamaria (FNA)</span>
          </div>

          <div className="flex items-center space-x-5">
            <button 
              onClick={() => setActiveTab('landing')} 
              className="hover:text-roseclinical-700 transition-colors"
            >
              Inicio
            </button>
            <button 
              onClick={() => setActiveTab('tool')} 
              className="hover:text-roseclinical-700 transition-colors"
            >
              Diagnóstico
            </button>
            <button 
              onClick={() => setActiveTab('metrics')} 
              className="hover:text-roseclinical-700 transition-colors"
            >
              Modelos & Dataset
            </button>
          </div>

          <div className="text-[11px] text-gray-400">
            Uso investigativo y académico · Dataset Wisconsin WDBC
          </div>

        </div>
      </div>
    </footer>
  );
}
