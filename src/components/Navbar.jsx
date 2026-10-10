import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, Database, Menu, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { checkApiHealth } from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      const res = await checkApiHealth();
      if (isMounted) {
        if (res.status === 'healthy') {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      }
    }
    verify();
    const interval = setInterval(verify, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'landing', label: 'Inicio', icon: Activity },
    { id: 'tool', label: 'Herramienta de Diagnóstico', icon: Cpu },
    { id: 'metrics', label: 'Métricas & Modelo', icon: Database },
    { id: 'about', label: 'Acerca del Estudio', icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-rosepink-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <button 
            onClick={() => setActiveTab('landing')}
            className="flex items-center space-x-3 group text-left focus:outline-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rosepink-600 to-rosepink-400 flex items-center justify-center shadow-lg shadow-rosepink-600/30 group-hover:scale-105 transition-transform duration-300">
              <span className="text-2xl" role="img" aria-label="Ribbon">🎗️</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold font-display tracking-tight text-white">
                  OncoScan<span className="text-rosepink-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rosepink-950/80 text-rosepink-300 border border-rosepink-700/50">
                  Wisconsin WDBC
                </span>
              </div>
              <p className="text-xs text-slateclinical-400 font-medium hidden sm:block">
                Detección Asistida por Inteligencia Artificial
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-rosepink-600 text-white shadow-md shadow-rosepink-600/25'
                      : 'text-slateclinical-300 hover:text-white hover:bg-slateclinical-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-rosepink-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Backend Status Indicator */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              apiStatus === 'online'
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50'
                : apiStatus === 'checking'
                ? 'bg-amber-950/50 text-amber-300 border-amber-700/50'
                : 'bg-rosepink-950/50 text-rosepink-300 border-rosepink-700/50'
            }`}>
              {apiStatus === 'online' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>API Python (Joblib) Conectada</span>
                </>
              ) : apiStatus === 'checking' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1"></span>
                  <span>Verificando API...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rosepink-400" />
                  <span>API Local Offline (Puerto 8000)</span>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slateclinical-400 hover:text-white hover:bg-slateclinical-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-rosepink-900/30 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-rosepink-600 text-white'
                    : 'text-slateclinical-300 hover:bg-slateclinical-800'
                }`}
              >
                <Icon className="w-5 h-5 text-rosepink-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium border ${
              apiStatus === 'online'
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50'
                : 'bg-rosepink-950/50 text-rosepink-300 border-rosepink-700/50'
            }`}>
              {apiStatus === 'online' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>API Python activa en puerto 8000</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rosepink-400" />
                  <span>Inicie backend FastAPI (uvicorn) en puerto 8000</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
