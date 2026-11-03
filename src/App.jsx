import React, { useState, useEffect } from 'react';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { PwaPrompt } from './components/layout/PwaPrompt';
import { AranproLogo } from './components/common/MauranLogo';
import { ResidentLogin } from './components/resident/ResidentLogin';
import { ResidentPortal } from './components/resident/ResidentPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ReceiptViewerModal } from './components/common/ReceiptViewerModal';
import { CertificateModal } from './components/public/CertificateModal';
import { 
  Building2, ShieldCheck, Home, Key, Lock, ArrowRight, 
  ExternalLink, Sparkles, Smartphone, CheckCircle2, ChevronRight
} from 'lucide-react';
import './App.css';

// URL del sitio web comercial corporativo
const COMMERCIAL_WEB_URL = 'https://aranpro.cl';

function MainApp() {
  const { currentUser, communities, loginAdmin, companySettings } = useCommunity();
  
  // Navigation states: 'portal-choice' | 'communities-selector' | 'resident-login' | 'resident' | 'admin-login' | 'admin'
  const [currentView, setCurrentView] = useState(() => {
    if (currentUser?.role === 'admin') return 'admin';
    if (currentUser?.role === 'resident') return 'resident';
    return 'portal-choice';
  });
  
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  // Leer parámetro ?c=slug de la URL (para accesos directos desde QR o WhatsApp)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const commSlug = urlParams.get('c');
    const roleParam = urlParams.get('role');

    if (roleParam === 'admin') {
      setCurrentView('admin-login');
      return;
    }

    if (commSlug) {
      setSelectedCommunitySlug(commSlug);
      if (currentUser?.role === 'resident' && currentUser.communitySlug === commSlug) {
        setCurrentView('resident');
      } else {
        setCurrentView('resident-login');
      }
    }
  }, [currentUser]);

  // Manejar login de residente
  const handleResidentLoginSuccess = () => {
    setCurrentView('resident');
  };

  // Manejar login de administrador
  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setAdminPinError('');
    const success = loginAdmin(adminPinInput);
    if (success) {
      setCurrentView('admin');
      setAdminPinInput('');
    } else {
      setAdminPinError('PIN de Administrador incorrecto. Inténtalo de nuevo.');
    }
  };

  // Redirigir a sitio web corporativo
  const handleGoToCommercialWeb = () => {
    window.location.href = COMMERCIAL_WEB_URL;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EF] text-[#0F3D2E]">
      {/* Barra superior de la App (solo visible cuando no se está en un portal autenticado) */}
      {currentView !== 'admin' && currentView !== 'resident' && (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AranproLogo variant="horizontal" size="sm" className="h-8 w-auto" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] border border-[#0F3D2E]/20">
              App PWA • Ley N° 21.442
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToCommercialWeb}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#0F3D2E] hover:bg-slate-100 transition-all cursor-pointer"
              title="Volver a la página web comercial de ARANPRO"
            >
              <span>Sitio Web aranpro.cl</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* Área Principal de la Aplicación */}
      <main className="flex-1">
        {/* PANTALLA 1: PORTAL DE SELECCIÓN DE ACCESO A LA APLICACIÓN */}
        {currentView === 'portal-choice' && (
          <div className="max-w-4xl mx-auto px-4 py-10 md:py-16 space-y-10">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#0F3D2E] text-[#D4B895]">
                <Smartphone className="w-3.5 h-3.5" />
                Suite de Gestión & Copropiedad
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-[#0F3D2E] tracking-tight uppercase">
                Portal de Administración ARANPRO
              </h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Selecciona tu perfil de usuario para ingresar a la plataforma o instalar la aplicación en tu dispositivo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Opción 1: Copropietario / Residente */}
              <div 
                onClick={() => {
                  setSelectedCommunitySlug(communities[0]?.slug);
                  setCurrentView('resident-login');
                }}
                className="group relative bg-white p-7 rounded-3xl border-2 border-slate-200 hover:border-[#0F3D2E] shadow-sm hover:shadow-xl transition-all cursor-pointer space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0F3D2E]/10 group-hover:bg-[#0F3D2E] text-[#0F3D2E] group-hover:text-[#D4B895] flex items-center justify-center transition-all">
                    <Home className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0F3D2E] transition-colors">
                      Soy Copropietario o Residente
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Consulta tu colilla de gasto común, historial de pagos, boletas de auditoría, libro de reclamos y certificados oficiales.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#0F3D2E]">
                  <span>Ingresar como Vecino</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Opción 2: Administrador & Comité */}
              <div 
                onClick={() => setCurrentView('admin-login')}
                className="group relative bg-gradient-to-b from-[#0F3D2E] to-[#0A291F] text-white p-7 rounded-3xl border-2 border-[#0F3D2E] shadow-md hover:shadow-xl transition-all cursor-pointer space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#D4B895] flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Soy Administrador o Comité
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Accede a la conciliación bancaria, emisión de colillas, cobranzas, libro de actas, asambleas Ley 21.442 y módulo empresa.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-black text-[#D4B895]">
                  <span>Acceso de Gestión con PIN</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Listado de comunidades disponibles */}
            <div className="max-w-2xl mx-auto pt-6 border-t border-slate-200 text-center space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Comunidades Administradas
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {communities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCommunitySlug(c.slug);
                      setCurrentView('resident-login');
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-[#0F3D2E] hover:text-[#0F3D2E] shadow-2xs transition-all cursor-pointer"
                  >
                    🏢 {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA 2: LOGIN ADMINISTRADOR / COMITÉ */}
        {currentView === 'admin-login' && (
          <div className="max-w-md mx-auto px-4 py-16 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase">
                  Acceso de Administración
                </h2>
                <p className="text-xs text-slate-500">
                  Ingresa tu PIN maestro para gestionar las comunidades de ARANPRO
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    PIN Maestro de Seguridad
                  </label>
                  <input
                    type="password"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-xl font-mono tracking-widest font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] focus:bg-white"
                  />
                  {adminPinError && (
                    <p className="text-xs font-semibold text-rose-600 mt-1.5 text-center">
                      {adminPinError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Entrar al Panel de Control
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentView('portal-choice')}
                  className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  ← Volver a opciones
                </button>
                <span className="text-[10px] text-slate-400 font-mono">
                  PIN Demo: {companySettings.adminPin || 'admin123'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA 3: LOGIN RESIDENTE */}
        {currentView === 'resident-login' && (
          <div className="py-8">
            <ResidentLogin
              communitySlug={selectedCommunitySlug || communities[0]?.slug}
              onBack={() => setCurrentView('portal-choice')}
              onSuccess={handleResidentLoginSuccess}
            />
          </div>
        )}

        {/* PANTALLA 4: PORTAL DE RESIDENTE / COPROPIETARIO */}
        {currentView === 'resident' && (
          <ResidentPortal
            onBack={() => setCurrentView('portal-choice')}
            onOpenCertificates={() => setShowCertModal(true)}
          />
        )}

        {/* PANTALLA 5: PANEL MAESTRO DEL ADMINISTRADOR */}
        {currentView === 'admin' && (
          <AdminDashboard
            onBackToWeb={handleGoToCommercialWeb}
            onSelectCommunityView={(slug) => {
              setSelectedCommunitySlug(slug);
              setCurrentView('resident-login');
            }}
          />
        )}
      </main>

      {/* Modales Compartidos en la App */}
      <CertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
      />

      <ReceiptViewerModal />

      {/* PWA Prompt para instalar la aplicación en el dispositivo móvil */}
      <PwaPrompt />
    </div>
  );
}

export default function App() {
  return (
    <CommunityProvider>
      <MainApp />
    </CommunityProvider>
  );
}
