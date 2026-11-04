import React, { useState, useEffect } from 'react';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { PwaPrompt, PwaInstallButton } from './components/layout/PwaPrompt';
import { AranproLogo } from './components/common/MauranLogo';
import { ResidentLogin } from './components/resident/ResidentLogin';
import { ResidentPortal } from './components/resident/ResidentPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ReceiptViewerModal } from './components/common/ReceiptViewerModal';
import { CertificateModal } from './components/public/CertificateModal';
import { 
  Building2, User, ShieldCheck, Home, Key, Lock, ArrowRight, 
  ExternalLink, Sparkles, Smartphone, CheckCircle2, ChevronRight
} from 'lucide-react';
import './App.css';

// URL del sitio web comercial corporativo
const COMMERCIAL_WEB_URL = 'https://aranpro.cl';

function MainApp() {
  const { currentUser, communities, loginAdmin, loginResidentByRut, companySettings, simulateResidentView, exitSimulation } = useCommunity();
  
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
  const [residentRutInput, setResidentRutInput] = useState('');
  const [residentPasswordInput, setResidentPasswordInput] = useState('');
  const [residentLoginError, setResidentLoginError] = useState('');
  const [showDemoAccordion, setShowDemoAccordion] = useState(false);

  const handleResidentSubmit = (e) => {
    e.preventDefault();
    setResidentLoginError('');
    const res = loginResidentByRut(residentRutInput, residentPasswordInput);
    if (res.success) {
      setCurrentView('resident');
      setResidentRutInput('');
      setResidentPasswordInput('');
    } else {
      setResidentLoginError(res.message);
    }
  };

  const handleQuickDemoFill = (rut, pass) => {
    setResidentRutInput(rut);
    setResidentPasswordInput(pass);
    setResidentLoginError('');
  };

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
            <PwaInstallButton variant="compact" />
            <button
              onClick={() => setCurrentView('admin-login')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] shadow-2xs transition-all cursor-pointer"
              title="Acceso exclusivo Administrador General ARANPRO"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Acceso Admin</span>
            </button>
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
        {/* PANTALLA 1: PORTAL UNIFICADO DE COPROPIETARIOS & COMITÉ */}
        {currentView === 'portal-choice' && (
          <div className="max-w-xl mx-auto px-4 py-8 md:py-14 space-y-6">
            <div className="text-center space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#0F3D2E] text-[#D4B895]">
                <Smartphone className="w-3.5 h-3.5" />
                Suite de Gestión & Copropiedad • Ley N° 21.442
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0F3D2E] tracking-tight uppercase">
                Portal de Copropietarios & Comité
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Ingresa con tu RUT para revisar tus gastos comunes, historial de pagos, rendiciones o gestionar las funciones del Comité de Administración.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase">
                    Acceso Seguro de Comunidad
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    El sistema detecta automáticamente tu condominio y tus permisos asignados
                  </p>
                </div>
              </div>

              <form onSubmit={handleResidentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    RUT de Copropietario o Residente *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: 15.420.312-4 o N° de casa"
                      value={residentRutInput}
                      onChange={(e) => setResidentRutInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] focus:bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Contraseña *
                    </label>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Por defecto: N° de vivienda
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Tu clave (ej: 1, 2, 3... o clave propia)"
                      value={residentPasswordInput}
                      onChange={(e) => setResidentPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] focus:bg-white"
                    />
                  </div>
                </div>

                {residentLoginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <span>⚠️ {residentLoginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Ingresar a mi Comunidad</span>
                  <ArrowRight className="w-4 h-4 text-[#D4B895]" />
                </button>
              </form>

              {/* Nota sobre olvido de clave y enlace directo a Administrador */}
              <div className="pt-4 border-t border-slate-100 space-y-3 text-center">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ¿Olvidaste tu contraseña? Tu clave por defecto es el número de tu departamento o casa. Si la cambiaste y no la recuerdas, el Administrador puede restablecerla en segundos desde su panel de control.
                </p>

                <div className="pt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setCurrentView('admin-login')}
                    className="text-xs font-black text-[#0F3D2E] hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-[#D4B895]" />
                    <span>¿Eres Administrador General de ARANPRO? Inicia sesión aquí</span>
                  </button>
                </div>

                {/* Acceso rápido para pruebas / evaluación */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDemoAccordion(!showDemoAccordion)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                  >
                    {showDemoAccordion ? '▲ Ocultar datos de prueba' : '💡 ¿Deseas probar una demostración? (Ver accesos demo)'}
                  </button>
                  {showDemoAccordion && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap justify-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoFill('15.420.312-4', '1')}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#0F3D2E] font-bold rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        🛡️ Casa 1 (Presidente Comité)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoFill('16.230.984-2', '3')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        🏠 Casa 3 (Vecino con Deuda)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoFill('18.402.193-K', '6')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        🏠 Casa 6 (Vecino al Día)
                      </button>
                    </div>
                  )}
                </div>
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
            onBack={() => {
              if (currentUser?.isSimulatedByAdmin) {
                exitSimulation();
                setCurrentView('admin');
              } else {
                setCurrentView('portal-choice');
              }
            }}
            onBackToAdmin={() => {
              exitSimulation();
              setCurrentView('admin');
            }}
            onOpenCertificates={() => setShowCertModal(true)}
          />
        )}

        {/* PANTALLA 5: PANEL MAESTRO DEL ADMINISTRADOR */}
        {currentView === 'admin' && (
          <AdminDashboard
            onBackToWeb={handleGoToCommercialWeb}
            onSelectCommunityView={(slug) => {
              setSelectedCommunitySlug(slug);
              simulateResidentView(slug);
              setCurrentView('resident');
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
