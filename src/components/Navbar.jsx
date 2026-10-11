import React, { useState, useEffect } from 'react';
import { Activity, LayoutDashboard, Database, Menu, X } from 'lucide-react';
import { checkApiHealth } from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      const res = await checkApiHealth();
      if (isMounted) {
        setApiStatus(res.status === 'healthy' ? 'online' : 'offline');
      }
    }
    verify();
    const interval = setInterval(verify, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'landing', label: 'Inicio', icon: Activity },
    { id: 'tool', label: 'Diagnóstico', icon: LayoutDashboard },
    { id: 'metrics', label: 'Modelos & Dataset', icon: Database },
  ];

  return (
    <header className="bg-surface-bg/85 backdrop-blur-md border-b border-roseclinical-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Clinical Brand */}
          <button 
            onClick={() => setActiveTab('landing')}
            className="flex items-center space-x-3 text-left focus:outline-none group"
          >
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display text-xl text-gray-900 tracking-tight">
                  OncoPath
                </span>
                <span className="text-xs font-semibold text-roseclinical-600">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block leading-none">
                Asistencia Citopatológica
              </p>
            </div>
          </button>

          {/* Desktop Navigation - Seamless flat tabs */}
          <nav className="hidden md:flex items-center space-x-8 h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`h-full flex items-center space-x-2 text-xs font-semibold transition-colors border-b-2 pt-0.5 ${
                    isActive
                      ? 'border-roseclinical-600 text-roseclinical-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-roseclinical-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System Status Indicator - Seamless without rounded capsule */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-gray-600 font-medium">
              <span className={`w-2 h-2 rounded-full ${
                apiStatus === 'online' 
                  ? 'bg-emerald-500 ring-2 ring-emerald-100' 
                  : apiStatus === 'checking' 
                  ? 'bg-amber-500 animate-pulse' 
                  : 'bg-gray-400'
              }`}></span>
              <span className="text-gray-700">
                {apiStatus === 'online' ? 'Servicio activo' : apiStatus === 'checking' ? 'Conectando...' : 'Modo local'}
              </span>
            </div>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-roseclinical-100 bg-surface-bg px-4 py-3 space-y-1">
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
                className={`w-full flex items-center space-x-3 px-3 py-2.5 border-l-2 text-xs font-semibold ${
                  isActive
                    ? 'border-roseclinical-600 text-roseclinical-700'
                    : 'border-transparent text-gray-700 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-roseclinical-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
