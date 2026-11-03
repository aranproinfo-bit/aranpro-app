import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check } from 'lucide-react';
import { MauranLogo } from '../common/MauranLogo';

export const PwaPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
    });

    // Check if dismissed before
    const dismissed = localStorage.getItem('condo_pwa_dismissed');
    if (!dismissed) {
      // Show gentle prompt after 4 seconds
      const timer = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Instrucción para navegadores sin prompt automático (ej. iOS Safari)
      alert('Para instalar en tu celular: presiona el botón "Compartir" de tu navegador y selecciona "Agregar a pantalla de inicio" 📲');
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('condo_pwa_dismissed', 'true');
  };

  if (!showBanner || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#0F3D2E] text-white p-4 rounded-3xl shadow-2xl border border-[#0F3D2E] animate-slide-up flex items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-[#0A291F] border border-[#0F3D2E] flex items-center justify-center text-white shrink-0 p-1">
          <MauranLogo variant="isotipo" size="sm" />
        </div>
        <div>
          <h5 className="text-xs font-bold text-white flex items-center">
            Instalar App ARANPRO (PWA)
            <span className="ml-1.5 px-1.5 py-0.2 text-[9px] bg-[#0F3D2E]/40 text-[#D4B895] border border-[#D4B895]/30 rounded-sm">Rápido</span>
          </h5>
          <p className="text-[11px] text-[#F5F4EF]/80 leading-snug">
            Accede a tus gastos comunes y respaldos directo desde tu pantalla de inicio sin descargas pesadas.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center border border-[#0F3D2E]"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-[#4A4F4F] hover:text-white rounded-lg transition-colors"
          title="Descartar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
