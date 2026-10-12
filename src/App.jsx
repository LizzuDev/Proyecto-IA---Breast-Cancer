import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import InteractiveDiagnostic from './components/InteractiveDiagnostic';
import ModelMetrics from './components/ModelMetrics';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('tool'); // Inicia directo en herramienta o landing

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['landing', 'tool', 'metrics'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const changeTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-gray-900 selection:bg-roseclinical-100 selection:text-roseclinical-900">
      {/* Barra de Navegación Superior */}
      <Navbar activeTab={activeTab} setActiveTab={changeTab} />

      {/* Contenido Principal */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingHero 
            onStartTool={() => changeTab('tool')} 
            onGoToMetrics={() => changeTab('metrics')} 
          />
        )}
        {activeTab === 'tool' && <InteractiveDiagnostic />}
        {activeTab === 'metrics' && <ModelMetrics />}
      </main>

      {/* Pie de Página Clínico */}
      <Footer setActiveTab={changeTab} />
    </div>
  );
}
