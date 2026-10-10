import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="border-t border-slateclinical-900 bg-slateclinical-950/80 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slateclinical-500">
          
          <div className="flex items-center space-x-2">
            <span className="text-base" role="img" aria-label="Ribbon">🎗️</span>
            <span className="font-semibold text-slateclinical-300">OncoScan AI</span>
            <span>—</span>
            <span>Inteligencia Artificial para Detección de Cáncer de Mama</span>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('landing')} 
              className="hover:text-rosepink-400 transition-colors"
            >
              Inicio
            </button>
            <button 
              onClick={() => setActiveTab('tool')} 
              className="hover:text-rosepink-400 transition-colors"
            >
              Herramienta
            </button>
            <button 
              onClick={() => setActiveTab('metrics')} 
              className="hover:text-rosepink-400 transition-colors"
            >
              Métricas
            </button>
            <button 
              onClick={() => setActiveTab('about')} 
              className="hover:text-rosepink-400 transition-colors"
            >
              Acerca de
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <span>Desarrollado con</span>
            <Heart className="w-3.5 h-3.5 text-rosepink-500 fill-rosepink-500 inline" />
            <span>para investigación médica</span>
          </div>

        </div>
      </div>
    </footer>
  );
}
