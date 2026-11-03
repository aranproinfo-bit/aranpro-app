import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { AranproLogo } from '../common/MauranLogo';
import {
  Shield, User, LogOut, KeyRound, Menu, X, Award,
  HelpCircle, Phone, FileText, Building2, Mail, CheckCircle2
} from 'lucide-react';

export const Navbar = ({
  currentView,
  setCurrentView,
  selectedCommunitySlug,
  setSelectedCommunitySlug,
  onOpenCertificates
}) => {
  const { currentUser, logout, companySettings, loginAdmin } = useCommunity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    const res = loginAdmin(adminPinInput);
    if (res.success) {
      setAdminModalOpen(false);
      setAdminPinInput('');
      setAdminError('');
      setCurrentView('admin');
    } else {
      setAdminError(res.message);
    }
  };

  // Navegación fluida garantizada hacia cualquier sección
  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setSelectedCommunitySlug(null);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 120);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 shadow-xs">
        {/* Barra Superior Institucional (Verde Bosque #0F3D2E + Champán #D4B895) - Visible en web pública */}
        {currentView !== 'admin' && currentView !== 'resident' && (
          <div className="hidden md:block bg-[#0F3D2E] text-[#F5F4EF] border-b border-[#D4B895]/25 text-[11px]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-[#D4B895] flex items-center">
                  <Award className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                  Administrador Profesional desde 2019
                </span>
                <span className="text-[#D4B895]/40">•</span>
                <span className="text-[#F5F4EF]/90 font-medium">
                  CGAI Chile Socio N° 13-563
                </span>
                <span className="text-[#D4B895]/40">•</span>
                <span className="text-[#F5F4EF]/90 font-medium">
                  AGACECH Acreditado
                </span>
              </div>

              <div className="flex items-center space-x-4 text-[#F5F4EF]/90">
                <a
                  href={`tel:${companySettings.phone}`}
                  className="hover:text-[#D4B895] transition-colors flex items-center"
                >
                  <Phone className="w-3 h-3 mr-1 text-[#D4B895]" />
                  {companySettings.phone}
                </a>
                <span className="text-[#D4B895]/40">•</span>
                <a
                  href={`mailto:${companySettings.email}`}
                  className="hover:text-[#D4B895] transition-colors flex items-center"
                >
                  <Mail className="w-3 h-3 mr-1 text-[#D4B895]" />
                  {companySettings.email}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Barra Principal de Navegación */}
        <div className="bg-white/95 backdrop-blur-md border-b border-[#E9EBE8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18 gap-4">
              
              {/* Logo Oficial ARANPRO */}
              <div
                onClick={() => handleNavClick('inicio')}
                className="flex items-center cursor-pointer group shrink-0"
                title="ARANPRO • Gestión Integral"
              >
                <AranproLogo variant="horizontal" size="md" />
              </div>

              {/* Navegación Central en 1 sola línea (sin saltos de texto) */}
              <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5">
                <button
                  onClick={() => handleNavClick('inicio')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    currentView === 'landing'
                      ? 'text-[#0F3D2E] bg-[#F5F4EF] font-bold shadow-2xs border border-[#D4B895]/50'
                      : 'text-[#4A4F4F] hover:text-[#0F3D2E] hover:bg-[#F5F4EF]'
                  }`}
                >
                  Inicio
                </button>

                <button
                  onClick={() => handleNavClick('sobre-mi')}
                  className="px-3 py-2 text-xs font-medium text-[#4A4F4F] hover:text-[#0F3D2E] hover:bg-[#F5F4EF] rounded-lg whitespace-nowrap transition-colors"
                >
                  Sobre Mí
                </button>

                <button
                  onClick={() => handleNavClick('certificaciones')}
                  className="px-3 py-2 text-xs font-medium text-[#4A4F4F] hover:text-[#0F3D2E] hover:bg-[#F5F4EF] rounded-lg whitespace-nowrap transition-colors flex items-center"
                >
                  <Award className="w-3.5 h-3.5 mr-1 text-[#D4B895] shrink-0" />
                  Certificaciones
                </button>

                <button
                  onClick={() => handleNavClick('habilidades')}
                  className="px-3 py-2 text-xs font-medium text-[#4A4F4F] hover:text-[#0F3D2E] hover:bg-[#F5F4EF] rounded-lg whitespace-nowrap transition-colors"
                >
                  Habilidades
                </button>

                <button
                  onClick={() => {
                    setCurrentView('faq');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center ${
                    currentView === 'faq'
                      ? 'text-[#0F3D2E] bg-[#F5F4EF] font-bold shadow-2xs border border-[#D4B895]/50'
                      : 'text-[#4A4F4F] hover:text-[#0F3D2E] hover:bg-[#F5F4EF]'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-[#0F3D2E]/70 shrink-0" />
                  Preguntas Frecuentes
                </button>

                <button
                  onClick={() => {
                    if (onOpenCertificates) onOpenCertificates();
                  }}
                  className="px-3 py-2 text-xs font-medium text-[#4A4F4F] hover:text-[#0F3D2E] hover:bg-[#F5F4EF] rounded-lg whitespace-nowrap transition-colors flex items-center"
                  title="Solicitar Certificado de Residencia o Copropietario al Día"
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-[#D4B895] shrink-0" />
                  Certificados
                </button>

                <button
                  onClick={() => handleNavClick('contacto')}
                  className="px-3 py-2 text-xs font-medium text-[#4A4F4F] hover:text-[#0F3D2E] hover:bg-[#F5F4EF] rounded-lg whitespace-nowrap transition-colors flex items-center"
                >
                  <Phone className="w-3.5 h-3.5 mr-1 text-[#0F3D2E]/70 shrink-0" />
                  Contacto
                </button>
              </nav>

              {/* Acciones Derecha (Sin duplicar botones de vecinos) */}
              <div className="hidden md:flex items-center space-x-2.5 shrink-0">
                {currentUser?.role === 'admin' ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl border whitespace-nowrap transition-colors ${
                        currentView === 'admin'
                          ? 'bg-[#0F3D2E] text-[#F5F4EF] border-[#0F3D2E]'
                          : 'bg-[#F5F4EF] text-[#0F3D2E] border-[#D4B895] hover:bg-[#E9EBE8]'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                      Panel Administrador
                    </button>
                    <button
                      onClick={() => { logout(); setCurrentView('landing'); }}
                      className="p-2 text-[#4A4F4F] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Cerrar sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : currentUser?.role === 'resident' ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentView('resident')}
                      className="flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] hover:bg-[#E9EBE8] whitespace-nowrap transition-colors"
                    >
                      <User className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
                      Casa {currentUser.unitNumber} ({currentUser.communityName})
                    </button>
                    <button
                      onClick={() => { logout(); setCurrentView('landing'); }}
                      className="p-2 text-[#4A4F4F] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Salir del portal"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => setCurrentView('communities-selector')}
                      className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl border whitespace-nowrap transition-all ${
                        currentView === 'communities-selector' || currentView === 'resident-login'
                          ? 'bg-[#D4B895]/30 text-[#0F3D2E] border-[#0F3D2E]'
                          : 'bg-[#F5F4EF] text-[#0F3D2E] border-[#D4B895] hover:bg-[#D4B895]/25'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
                      Portal Vecinos
                    </button>

                    <button
                      onClick={() => setAdminModalOpen(true)}
                      className="flex items-center px-4 py-2 text-xs font-bold text-[#F5F4EF] bg-[#0F3D2E] hover:bg-[#0A291F] rounded-xl shadow-xs whitespace-nowrap transition-all border border-[#0F3D2E]"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                      Admin
                    </button>
                  </div>
                )}
              </div>

              {/* Botón Menú Móvil */}
              <div className="flex lg:hidden items-center space-x-2">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-[#0F3D2E] hover:bg-[#F5F4EF] border border-[#E9EBE8]"
                  aria-label="Abrir menú"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#D4B895]/40 bg-white px-4 pt-3 pb-6 space-y-1.5 shadow-lg">
            <div className="pb-2 mb-2 border-b border-[#E9EBE8] flex items-center justify-between text-[11px] text-[#4A4F4F]">
              <span className="font-semibold text-[#0F3D2E]">Administrador desde 2019</span>
              <span className="px-2 py-0.5 bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] rounded-md font-bold">
                CGAI #13-563
              </span>
            </div>

            <button
              onClick={() => handleNavClick('inicio')}
              className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#F5F4EF] rounded-xl"
            >
              Inicio
            </button>
            <button
              onClick={() => handleNavClick('sobre-mi')}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#4A4F4F] hover:bg-[#F5F4EF] rounded-xl"
            >
              Sobre Mí & Trayectoria
            </button>
            <button
              onClick={() => handleNavClick('certificaciones')}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#4A4F4F] hover:bg-[#F5F4EF] rounded-xl flex items-center"
            >
              <Award className="w-4 h-4 mr-2 text-[#D4B895]" />
              Certificaciones & Chips
            </button>
            <button
              onClick={() => handleNavClick('habilidades')}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#4A4F4F] hover:bg-[#F5F4EF] rounded-xl"
            >
              Habilidades & Áreas de Gestión
            </button>
            <button
              onClick={() => {
                setCurrentView('faq');
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#4A4F4F] hover:bg-[#F5F4EF] rounded-xl flex items-center"
            >
              <HelpCircle className="w-4 h-4 mr-2 text-[#0F3D2E]" />
              Preguntas Frecuentes (FAQ)
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenCertificates) onOpenCertificates();
              }}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#4A4F4F] hover:bg-[#F5F4EF] rounded-xl flex items-center"
            >
              <FileText className="w-4 h-4 mr-2 text-[#D4B895]" />
              Solicitar Certificado de Residencia
            </button>
            <button
              onClick={() => handleNavClick('contacto')}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#4A4F4F] hover:bg-[#F5F4EF] rounded-xl flex items-center"
            >
              <Phone className="w-4 h-4 mr-2 text-[#0F3D2E]" />
              Contacto & Cotizar
            </button>

            <div className="pt-3 mt-2 border-t border-[#E9EBE8] grid grid-cols-2 gap-2.5">
              <button
                onClick={() => { setCurrentView('communities-selector'); setMobileMenuOpen(false); }}
                className="w-full text-center px-3 py-2.5 text-xs font-bold text-[#0F3D2E] bg-[#F5F4EF] border border-[#D4B895] rounded-xl"
              >
                Portal Vecinos
              </button>
              <button
                onClick={() => { setAdminModalOpen(true); setMobileMenuOpen(false); }}
                className="w-full text-center px-3 py-2.5 text-xs font-bold bg-[#0F3D2E] text-[#F5F4EF] rounded-xl"
              >
                Acceso Admin
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modal Acceso Administrador */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#D4B895] p-6 relative">
            <button
              onClick={() => { setAdminModalOpen(false); setAdminError(''); }}
              className="absolute top-4 right-4 p-1 text-[#4A4F4F] hover:text-[#0F3D2E]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-[#0F3D2E]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F3D2E]">Acceso de Administrador</h3>
              <p className="text-xs text-[#4A4F4F] mt-1">
                Ingresa tu clave PIN para gestionar las comunidades ARANPRO
              </p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                  Clave PIN de Administrador
                </label>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="admin123"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0F3D2E] focus:border-[#0F3D2E]"
                  autoFocus
                />
                <span className="text-[11px] text-[#4A4F4F] block mt-1">
                  Clave inicial por defecto: <code className="text-[#0F3D2E] font-bold">admin123</code>
                </span>
              </div>

              {adminError && (
                <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#F5F4EF] font-semibold rounded-xl text-sm transition-colors shadow-sm"
              >
                Ingresar al Panel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
