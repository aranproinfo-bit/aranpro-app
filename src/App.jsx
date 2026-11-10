import React, { useState, useEffect } from 'react';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { PwaPrompt, PwaInstallButton } from './components/layout/PwaPrompt';
import { AranproLogo } from './components/common/MauranLogo';
import { ResidentLogin } from './components/resident/ResidentLogin';
import { ResidentPortal } from './components/resident/ResidentPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CompanyEnterpriseHub } from './components/admin/CompanyEnterpriseHub';
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
  const { currentUser, communities, loginAdmin, logout, loginResidentByRut, companySettings, simulateResidentView, exitSimulation } = useCommunity();
  
  // Navigation states: 'portal-choice' | 'admin-select-community' | 'resident-login' | 'resident' | 'admin-login' | 'admin'
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('demo')) {
        return currentUser?.role === 'resident' ? 'resident' : 'resident-login';
      }
    }
    if (currentUser?.role === 'admin') return 'admin-select-community';
    if (currentUser?.role === 'resident') return 'resident';
    return 'portal-choice';
  });
  
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [adminRutInput, setAdminRutInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [selectedAdminCommunityId, setSelectedAdminCommunityId] = useState(null);
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
    const res = loginResidentByRut(rut, pass);
    if (res?.success) {
      setCurrentView('resident');
      setResidentRutInput('');
      setResidentPasswordInput('');
    } else if (res?.message) {
      setResidentLoginError(res.message);
    }
  };

  // Leer parámetro ?c=slug o ?demo=... de la URL (para accesos directos desde QR o WhatsApp)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const commSlug = urlParams.get('c');
    const roleParam = urlParams.get('role');
    const demoParam = urlParams.get('demo');

    if (demoParam !== null && demoParam !== undefined) {
      setShowDemoAccordion(true);
      setSelectedCommunitySlug(commSlug || communities[0]?.slug);
      if (currentUser?.role === 'resident') {
        setCurrentView('resident');
      } else {
        setCurrentView('resident-login');
      }
      return;
    }

    if (roleParam === 'admin') {
      if (currentUser?.role === 'admin') {
        // Ya autenticado: limpiar el parámetro ?role=admin de la URL para evitar parpadeos
        try {
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) { console.error(e); }
        return;
      }
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
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminLoginError('');
    try {
      const res = await loginAdmin(adminRutInput, adminPasswordInput);
      if (res.success) {
        try {
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) { console.error(e); }
        setAdminRutInput('');
        setAdminPasswordInput('');
        // Siempre ingresar primero al Panel Central de Empresa Administradora & Comunidades
        setCurrentView('admin-select-community');
      } else {
        setAdminLoginError(res.message || 'RUT o contraseña de Administrador incorrectos.');
      }
    } catch (err) {
      setAdminLoginError('Error de autenticación. Intenta nuevamente.');
    }
  };

  // Redirigir a sitio web corporativo
  const handleGoToCommercialWeb = () => {
    window.location.href = COMMERCIAL_WEB_URL;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EF] text-[#0F3D2E]">
      {/* Barra superior de la App (solo visible cuando no se está en un portal autenticado) */}
      {currentView !== 'admin' && currentView !== 'admin-select-community' && currentView !== 'resident' && (
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
              {/* Banner destacado para demostración interactiva en 1 clic */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50 via-white to-amber-50 rounded-2xl border-2 border-[#D4B895] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#0F3D2E] uppercase tracking-wide">
                      ¿Deseas evaluar la Suite ARANPRO?
                    </span>
                    <span className="block text-[11px] text-slate-600">
                      Prueba en vivo con 1 solo clic como Comité o Copropietario
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('resident-login')}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-black text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>Probar Demo en 1 Clic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

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

        {/* PANTALLA 2: LOGIN ADMINISTRADOR SAAS CON RUT Y CONTRASEÑA */}
        {currentView === 'admin-login' && (
          <div className="max-w-md mx-auto px-4 py-12 md:py-16 space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-7 sm:p-9 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center mx-auto shadow-md">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase">
                  Acceso de Administrador
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Ingresa tu RUT y contraseña de Administrador para gestionar tus comunidades
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    RUT del Administrador *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: 16.012.871-2"
                      value={adminRutInput}
                      onChange={(e) => setAdminRutInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] focus:bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] focus:bg-white"
                    />
                  </div>
                </div>

                {adminLoginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <span>⚠️ {adminLoginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Entrar al Panel de Control</span>
                  <ArrowRight className="w-4 h-4 text-[#D4B895]" />
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <button
                    type="button"
                    onClick={() => setCurrentView('portal-choice')}
                    className="hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    ← Volver al portal de vecinos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminRutInput(companySettings?.adminRut || '16.012.871-2');
                      setAdminPasswordInput(companySettings?.adminPin || 'admin123');
                    }}
                    className="text-[#0F3D2E] font-bold hover:underline cursor-pointer"
                  >
                    Demo 1-Click
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center text-[10px] text-slate-500 font-mono">
                  RUT: {companySettings?.adminRut || '16.012.871-2'} • Clave: {companySettings?.adminPin || 'admin123'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA CENTRAL DEL ADMINISTRADOR: PANEL DE EMPRESA ADMINISTRADORA, COMUNIDADES, METAS, POSTULACIONES, RR.HH. OFICINA & ALIANZAS */}
        {currentView === 'admin-select-community' && (
          <CompanyEnterpriseHub
            onBackToWeb={handleGoToCommercialWeb}
            onSelectCommunityToManage={(communityId) => {
              setSelectedAdminCommunityId(communityId);
              setCurrentView('admin');
            }}
            onSelectResidentPreview={(slug) => {
              setSelectedCommunitySlug(slug);
              simulateResidentView(slug);
              setCurrentView('resident');
            }}
            onLogout={() => {
              if (logout) logout();
              setCurrentView('portal-choice');
            }}
          />
        )}

        {/* PANTALLA 3: LOGIN RESIDENTE */}
        {currentView === 'resident-login' && (
          <div className="py-8">
            <ResidentLogin
              communitySlug={selectedCommunitySlug || communities[0]?.slug}
              onBack={() => {
                try {
                  const cleanUrl = window.location.pathname + (window.location.hash || '');
                  window.history.replaceState({}, document.title, cleanUrl);
                } catch (e) {}
                setCurrentView('portal-choice');
              }}
              onSuccess={handleResidentLoginSuccess}
              isDemo={true}
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
            initialCommunityId={selectedAdminCommunityId}
            onSwitchCommunityWorkspace={() => setCurrentView('admin-select-community')}
            onSelectCommunityView={(slug) => {
              setSelectedCommunitySlug(slug);
              simulateResidentView(slug);
              setCurrentView('resident');
            }}
          />
        )}
      </main>

      {/* Footer Público con Firma Oficial Red-Enlace */}
      {currentView !== 'admin' && currentView !== 'admin-select-community' && currentView !== 'resident' && (
        <footer className="py-4 border-t border-slate-200/80 bg-white/60 text-xs text-slate-500">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span>© {new Date().getFullYear()} ARANPRO • Suite de Gestión & Copropiedad</span>
            <a
              href="https://redenlace.cl/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-600 hover:text-[#0F3D2E] transition-colors text-xs font-semibold group cursor-pointer"
              title="Visitar Red-Enlace Soluciones Digitales"
            >
              <img
                src="/red-enlace-logo.png"
                alt="Logo Red-Enlace"
                width={18}
                height={18}
                className="h-4 w-auto opacity-70 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0"
              />
              <span>Desarrollado por Red-Enlace Soluciones Digitales</span>
            </a>
          </div>
        </footer>
      )}

      {/* Modales Compartidos en la App */}
      <CertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        defaultCommunity={currentUser?.role === 'resident' ? communities.find(c => c.id === currentUser.communityId || c.slug === currentUser.communitySlug) : null}
        defaultUnit={currentUser?.role === 'resident' ? { number: currentUser.unitNumber } : null}
        defaultApplicant={currentUser?.role === 'resident' ? { name: currentUser.loggedUserName || currentUser.name, rut: currentUser.rut, email: currentUser.email, phone: currentUser.phone } : null}
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
