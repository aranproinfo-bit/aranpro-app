import React from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { AranproLogo } from '../common/MauranLogo';
import { Phone, Mail, MapPin, ShieldCheck, FileCheck, ArrowRight } from 'lucide-react';

export const Footer = ({ setCurrentView, setSelectedCommunitySlug, onOpenCertificates }) => {
  const { companySettings, communities } = useCommunity();

  return (
    <footer className="bg-[#0F3D2E] text-[#F5F4EF] border-t border-[#D4B895]/30 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#D4B895]/20">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <AranproLogo variant="negative" size="lg" />
            
            <p className="text-xs sm:text-sm text-[#D4B895] italic font-medium">
              "{companySettings.slogan || 'Comunidades bien gestionadas, mayor tranquilidad'}"
            </p>

            <p className="text-xs sm:text-sm text-[#F5F4EF]/85 max-w-sm leading-relaxed">
              Gestión integral de comunidades y condominios dirigida por <strong>John Andrés Arancibia Maureira</strong>, acreditado por CGAI Chile (Socio N° 13-563) y AGACECH. Cumplimiento riguroso de la Ley N° 21.442 y plataforma web propia para cada comunidad.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#D4B895] bg-[#0A291F] border border-[#D4B895]/30 rounded-xl px-3.5 py-2 w-fit">
              <ShieldCheck className="w-4 h-4 text-[#D4B895] shrink-0" />
              <span>Transparencia total • Presencia continua en terreno</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[#D4B895] uppercase tracking-wider mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => { setCurrentView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-[#F5F4EF]/80 hover:text-[#D4B895] transition-colors"
                >
                  Inicio
                </button>
              </li>
              <li>
                <a href="#sobre-mi" className="text-[#F5F4EF]/80 hover:text-[#D4B895] transition-colors">
                  Sobre Mí & Credenciales
                </a>
              </li>
              <li>
                <a href="#certificaciones" className="text-[#F5F4EF]/80 hover:text-[#D4B895] transition-colors">
                  Certificaciones Oficiales
                </a>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentView('faq'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-[#F5F4EF]/80 hover:text-[#D4B895] transition-colors"
                >
                  Preguntas Frecuentes
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentView('communities-selector'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-[#F5F4EF]/80 hover:text-[#D4B895] transition-colors"
                >
                  Portal Vecinos
                </button>
              </li>
              <li>
                <button
                  onClick={() => { if (onOpenCertificates) onOpenCertificates(); }}
                  className="text-[#F5F4EF]/80 hover:text-[#D4B895] transition-colors"
                >
                  Certificados de Residencia
                </button>
              </li>
              <li>
                <a href="#contacto" className="text-[#D4B895] hover:underline font-semibold transition-colors">
                  Cotizar Administración
                </a>
              </li>
            </ul>
          </div>

          {/* Communities List */}
          <div>
            <h4 className="text-xs font-bold text-[#D4B895] uppercase tracking-wider mb-4">
              Comunidades ARANPRO
            </h4>
            <ul className="space-y-2 text-sm">
              {communities.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setSelectedCommunitySlug(c.slug);
                      setCurrentView('resident-login');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#F5F4EF]/80 hover:text-[#D4B895] transition-colors flex items-center text-xs group"
                  >
                    <ArrowRight className="w-3 h-3 mr-1 text-[#D4B895] group-hover:translate-x-0.5 transition-transform" />
                    {c.name}
                  </button>
                </li>
              ))}
              <li className="pt-2">
                <button
                  onClick={() => setCurrentView('communities-selector')}
                  className="text-xs text-[#D4B895] hover:underline"
                >
                  Ver todas las comunidades →
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-[#D4B895] uppercase tracking-wider mb-4">
              Contacto Directo
            </h4>
            <div className="space-y-3 text-sm text-[#F5F4EF]/85">
              <div className="flex items-start space-x-2.5">
                <Phone className="w-4 h-4 text-[#D4B895] mt-0.5 shrink-0" />
                <span>{companySettings.phone}</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <Mail className="w-4 h-4 text-[#D4B895] mt-0.5 shrink-0" />
                <span className="break-all">{companySettings.email}</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#D4B895] mt-0.5 shrink-0" />
                <span>{companySettings.region}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#F5F4EF]/75 gap-4">
          <p>
            © {new Date().getFullYear()} ARANPRO • Gestión Integral. Todos los derechos reservados.
          </p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-[#F5F4EF]/85">
              <FileCheck className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
              Conforme a Ley 21.442 de Copropiedad Inmobiliaria
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
