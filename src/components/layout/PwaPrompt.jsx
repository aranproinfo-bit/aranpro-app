import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check, Share2, PlusSquare, Monitor, ArrowRight, ShieldCheck } from 'lucide-react';
import { AranproLogo } from '../common/MauranLogo';

/**
 * Disparador global para instalar la PWA o abrir las instrucciones
 */
export const triggerPwaInstall = () => {
  if (typeof window === 'undefined') return;
  if (window.__deferredPrompt) {
    window.__deferredPrompt.prompt();
    window.__deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        window.__deferredPrompt = null;
      }
    });
  } else {
    window.dispatchEvent(new CustomEvent('open-pwa-instructions'));
  }
};

/**
 * Botón estándar de instalación para barra superior, menú o cabeceras
 */
export const PwaInstallButton = ({
  className = '',
  variant = 'default', // 'default' | 'compact' | 'light' | 'sidebar'
  label = 'Instalar App'
}) => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsStandalone(isStandaloneMode);
    }
  }, []);

  if (isStandalone) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl" title="Aplicación PWA Instalada">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">App Instalada</span>
      </span>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={triggerPwaInstall}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#0F3D2E] bg-[#D4B895]/20 hover:bg-[#D4B895]/30 border border-[#D4B895]/60 transition-all cursor-pointer shadow-2xs active:scale-95 ${className}`}
        title="Instalar ARANPRO en tu celular o computador"
      >
        <div className="flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-[#0F3D2E]" />
          <span>{label}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-[#0F3D2E] text-[#D4B895]">
          PWA
        </span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={triggerPwaInstall}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#D4B895] hover:bg-[#c3a47e] text-[#0A291F] transition-all cursor-pointer shadow-xs active:scale-95 ${className}`}
        title="Instalar aplicación en tu pantalla de inicio"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === 'light') {
    return (
      <button
        type="button"
        onClick={triggerPwaInstall}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer shadow-xs active:scale-95 ${className}`}
        title="Instalar aplicación en tu dispositivo"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#D4B895]" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={triggerPwaInstall}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F3D2E] hover:bg-[#0A291F] text-white transition-all cursor-pointer shadow-xs border border-[#0F3D2E] active:scale-95 ${className}`}
      title="Instalar aplicación en tu dispositivo"
    >
      <Smartphone className="w-3.5 h-3.5 text-[#D4B895]" />
      <span>{label}</span>
    </button>
  );
};

/**
 * Componente principal PwaPrompt (Banner flotante e instrucciones emergentes)
 */
export const PwaPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está en modo standalone (instalada)
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      if (isStandalone) {
        setInstalled(true);
      }
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.__deferredPrompt = e;
      setDeferredPrompt(e);
      // Mostrar banner gentil si no fue descartado
      const dismissed = localStorage.getItem('condo_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setShowInstructionsModal(false);
      window.__deferredPrompt = null;
    };

    const handleOpenInstructions = () => {
      setShowInstructionsModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-pwa-instructions', handleOpenInstructions);

    // Si pasaron 5 segundos y no fue descartada ni instalada, mostrar banner gentil
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('condo_pwa_dismissed');
      if (!dismissed && !installed) {
        setShowBanner(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-instructions', handleOpenInstructions);
      clearTimeout(timer);
    };
  }, [installed]);

  const handleInstallClick = async () => {
    if (window.__deferredPrompt || deferredPrompt) {
      const promptEvent = window.__deferredPrompt || deferredPrompt;
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      window.__deferredPrompt = null;
      setDeferredPrompt(null);
    } else {
      setShowInstructionsModal(true);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('condo_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Banner flotante inferior */}
      {showBanner && !installed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#0F3D2E] text-white p-4 rounded-3xl shadow-2xl border-2 border-[#D4B895]/50 animate-slide-up flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0A291F] border border-[#D4B895]/40 flex items-center justify-center text-white shrink-0 p-1 shadow-sm">
              <Smartphone className="w-5 h-5 text-[#D4B895]" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <span>Instalar App ARANPRO</span>
                <span className="px-1.5 py-0.2 text-[9px] bg-[#D4B895] text-[#0A291F] font-black rounded-sm shrink-0">PWA</span>
              </h5>
              <p className="text-[11px] text-[#F5F4EF]/85 leading-snug line-clamp-2">
                Acceso directo instantáneo en tu pantalla de inicio, colillas y notificaciones en tiempo real.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-[#D4B895] hover:bg-[#c2a37e] text-[#0A291F] font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Descartar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de instrucciones para iPhone / Android / Computador */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Instalar Aplicación ARANPRO
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acceso directo PWA en tu pantalla de inicio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Opción 1: iPhone / iPad (Safari) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-[#0F3D2E] font-black">
                  <Share2 className="w-4 h-4 text-[#0F3D2E]" />
                  <span>En iPhone o iPad (Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed pl-1">
                  <li>Presiona el botón <strong>Compartir</strong> en la barra inferior de Safari (el ícono cuadrado con una flecha hacia arriba).</li>
                  <li>Desliza hacia abajo y selecciona <strong>«Agregar a la pantalla de inicio»</strong> (Add to Home Screen).</li>
                  <li>Presiona <strong>«Agregar»</strong> arriba a la derecha. ¡Listo!</li>
                </ol>
              </div>

              {/* Opción 2: Android (Chrome / Edge / Firefox) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-[#0F3D2E] font-black">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>En Android (Google Chrome)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed pl-1">
                  <li>Toca los <strong>3 puntos verticales</strong> arriba a la derecha del navegador.</li>
                  <li>Selecciona <strong>«Instalar aplicación»</strong> o <strong>«Agregar a la pantalla principal»</strong>.</li>
                  <li>Confirma en <strong>«Instalar»</strong>.</li>
                </ol>
              </div>

              {/* Opción 3: Computador (Chrome / Edge) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-[#0F3D2E] font-black">
                  <Monitor className="w-4 h-4 text-sky-600" />
                  <span>En Computador (Chrome / Edge / Mac / Windows)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Haz clic en el ícono de instalación <Download className="w-3 h-3 inline text-slate-700" /> ubicado al costado derecho de la barra de direcciones de tu navegador y confirma <strong>«Instalar»</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="w-full py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};