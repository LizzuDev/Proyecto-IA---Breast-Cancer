import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import InteractiveDiagnostic from './components/InteractiveDiagnostic';
import ModelMetrics from './components/ModelMetrics';
import AboutProject from './components/AboutProject';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');

  // Sincronizar tab con el hash de la URL
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['landing', 'tool', 'metrics', 'about'].includes(hash)) {
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
    <div className="min-h-screen flex flex-col bg-slateclinical-950 text-slateclinical-100 selection:bg-rosepink-500 selection:text-white">
      {/* Navbar Superior */}
      <Navbar activeTab={activeTab} setActiveTab={changeTab} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingHero 
            onStartTool={() => changeTab('tool')} 
            onGoToMetrics={() => changeTab('metrics')} 
          />
        )}
        {activeTab === 'tool' && <InteractiveDiagnostic />}
        {activeTab === 'metrics' && <ModelMetrics />}
        {activeTab === 'about' && <AboutProject />}
      </main>

      {/* Pie de Página */}
      <Footer setActiveTab={changeTab} />
    </div>
  );
}
