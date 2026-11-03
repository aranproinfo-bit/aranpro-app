import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { AranproLogo } from '../common/MauranLogo';
import { AboutAndCertifications } from './AboutAndCertifications';
import {
  Building2, ShieldCheck, CheckCircle2, FileText, ArrowRight,
  Users, Sparkles, ChevronRight, Send, Phone, Mail, Award, Check, Settings, HelpCircle
} from 'lucide-react';

export const LandingPage = ({ onSelectCommunity, onOpenCertificates, setCurrentView }) => {
  const { companySettings, communities } = useCommunity();
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    phone: '',
    email: '',
    condoName: '',
    unitsCount: '',
    city: 'La Serena / Coquimbo',
    message: ''
  });
  const [quoteSent, setQuoteSent] = useState(false);

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    setQuoteSent(true);
  };

  // Íconos para los 4 pilares de ARANPRO
  const pillarIcons = {
    personas: Users,
    gestion: Settings,
    transparencia: ShieldCheck,
    valorizacion: Building2
  };

  return (
    <div className="space-y-12 pb-16 bg-[#F5F4EF]">
      
      {/* 1. HERO SECTION: ARANPRO — GESTIÓN INTEGRAL */}
      <section
        id="inicio"
        className="relative overflow-hidden pt-8 pb-12 lg:pt-12 lg:pb-16 bg-gradient-to-b from-white via-[#F5F4EF] to-[#E9EBE8]/40 border-b border-[#D4B895]/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Copy & Brand */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Badges de acreditación superior */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0F3D2E] text-[#F5F4EF] text-xs font-bold shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Trayectoria desde 2019</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#D4B895]/25 border border-[#D4B895] text-[#0F3D2E] text-xs font-bold">
                  <span>CGAI Chile Socio N° 13-563</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-white border border-[#E9EBE8] text-[#0F3D2E] text-xs font-bold shadow-2xs">
                  <span>AGACECH Acreditado</span>
                </span>
              </div>

              {/* Título Principal & Eslogan Oficial */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#4A4F4F] block">
                  ARANPRO • Gestión Integral de Condominios y Comunidades
                </span>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F3D2E] tracking-tight leading-[1.15]">
                  Comunidades bien gestionadas,{' '}
                  <span className="text-[#0F3D2E] underline decoration-[#D4B895] decoration-4 underline-offset-8">
                    mayor tranquilidad
                  </span>
                </h1>

                <p className="text-base sm:text-lg font-semibold text-[#4A4F4F] pt-1">
                  Administración profesional en terreno, finanzas claras y 100% de transparencia digital
                </p>
              </div>

              <p className="text-base text-[#4A4F4F] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Dirigido por <strong className="text-[#0F3D2E]">John Andrés Arancibia Maureira</strong>, administrador colegiado y acreditado desde 2019. Entregamos una gestión rigurosa conforme a la <strong className="text-[#0F3D2E]">Ley de Copropiedad Inmobiliaria N° 21.442</strong>, con respaldos y boletas reales visibles y una plataforma PWA propia incluida para tu comunidad.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#contacto"
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#F5F4EF] font-semibold text-sm rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center border border-[#0F3D2E]"
                >
                  <Phone className="w-4 h-4 mr-2 text-[#D4B895]" />
                  <span>Coordinar Visita Gratuita a Terreno</span>
                </a>

                <button
                  onClick={() => setCurrentView('communities-selector')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-[#E9EBE8]/60 text-[#0F3D2E] font-bold text-sm rounded-2xl border border-[#D4B895] shadow-xs transition-all flex items-center justify-center"
                >
                  <span>Portal Vecinos & Comunidades</span>
                  <ArrowRight className="w-4 h-4 ml-2 text-[#0F3D2E]" />
                </button>
              </div>

              {/* Métricas Clave */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#D4B895]/50 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#0F3D2E]">2019</div>
                  <div className="text-xs text-[#4A4F4F] font-medium">Titulación Oficial</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#0F3D2E]">CGAI & AGACECH</div>
                  <div className="text-xs text-[#4A4F4F] font-medium">Respaldo Gremial</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#0F3D2E]">Ley 21.442</div>
                  <div className="text-xs text-[#4A4F4F] font-medium">Marco Jurídico</div>
                </div>
              </div>

            </div>

            {/* Right Column: Tarjeta Principal ARANPRO & Chips Oficiales */}
            <div className="lg:col-span-5 relative space-y-4">
              
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#D4B895] space-y-5">
                
                {/* Logo Principal ARANPRO centrado arriba */}
                <div className="flex flex-col items-center justify-center pb-4 border-b border-[#E9EBE8] text-center">
                  <AranproLogo variant="principal" size="md" />
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#0F3D2E]">
                      John Andrés Arancibia Maureira
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F3D2E] text-[#D4B895]">
                      Verificado
                    </span>
                  </div>
                </div>

                {/* Chips Oficiales CGAI & AGACECH */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F5F4EF] rounded-2xl border border-[#E9EBE8]">
                  <div className="bg-white p-2.5 rounded-xl shadow-2xs border border-[#E9EBE8] flex items-center justify-center">
                    <img
                      src="/certificaciones/chip_cgai_clean.png"
                      alt="CGAI Chile - Socio Activo 13-563"
                      className="max-h-20 sm:max-h-24 w-auto object-contain"
                    />
                  </div>
                  <div className="bg-white p-2.5 rounded-xl shadow-2xs border border-[#E9EBE8] flex items-center justify-center">
                    <img
                      src="/certificaciones/chip_agacech_clean.png"
                      alt="AGACECH - Administrador Acreditado"
                      className="max-h-20 sm:max-h-24 w-auto object-contain"
                    />
                  </div>
                </div>

                {/* Explicación de la plataforma que se entrega */}
                <div className="bg-[#0F3D2E] p-4 rounded-2xl border border-[#D4B895]/40 text-xs text-[#F5F4EF] space-y-1.5">
                  <div className="flex items-center font-bold text-[#D4B895]">
                    <Sparkles className="w-4 h-4 mr-1.5 text-[#D4B895] shrink-0" />
                    Plataforma PWA Incluida para tu Comunidad
                  </div>
                  <p className="text-[11px] text-[#F5F4EF]/90 leading-relaxed">
                    Al contratar ARANPRO, tu condominio recibe sin costo adicional una plataforma web y aplicación móvil: cada vecino consulta su cuenta en números verdes/rojos y audita las boletas reales de cada gasto.
                  </p>
                </div>

                {/* Enlace rápido a certificados */}
                <button
                  onClick={onOpenCertificates}
                  className="w-full py-2.5 px-3 bg-[#F5F4EF] hover:bg-[#E9EBE8] text-[#0F3D2E] font-semibold text-xs rounded-xl border border-[#D4B895] flex items-center justify-center transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
                  Solicitar Certificado de Residencia Online
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. LOS 4 PILARES DE GESTIÓN ARANPRO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white border border-[#D4B895] rounded-full text-xs font-bold text-[#0F3D2E]">
            <Award className="w-3.5 h-3.5 text-[#D4B895]" />
            <span>Nuestros Valores Fundamentales</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F3D2E] tracking-tight">
            Los 4 Pilares de Gestión Integral ARANPRO
          </h2>
          <p className="text-sm sm:text-base text-[#4A4F4F] max-w-2xl mx-auto">
            Un modelo de administración diseñado para proteger la calidad de vida de los residentes y maximizar el valor patrimonial de cada comunidad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(companySettings.pillars || []).map((pillar, idx) => {
            const IconComponent = pillarIcons[pillar.id] || Building2;
            return (
              <div
                key={pillar.id}
                className="bg-white p-6 rounded-3xl border border-[#E9EBE8] hover:border-[#D4B895] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895]/60 flex items-center justify-center group-hover:bg-[#0F3D2E] group-hover:text-[#D4B895] transition-colors">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#4A4F4F] block mb-1">
                      Pilar 0{idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-[#0F3D2E]">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#4A4F4F] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E9EBE8] flex items-center text-[11px] font-semibold text-[#0F3D2E]">
                  <Check className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                  Compromiso ARANPRO
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SECCIÓN SOBRE MÍ, TRAYECTORIA Y CERTIFICACIONES */}
      <AboutAndCertifications />

      {/* 4. NUESTRO VALOR DIFERENCIAL (La Plataforma vs Sistemas sobrecargados) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#4A4F4F]">
            Tecnología al Servicio de la Comunidad
          </h2>
          <p className="text-3xl font-extrabold text-[#0F3D2E] tracking-tight sm:text-4xl">
            ¿Por qué dejamos atrás los sistemas sobrecargados?
          </p>
          <p className="text-base text-[#4A4F4F] max-w-2xl mx-auto">
            Muchas administraciones traspasan licencias de software complejas que los vecinos no entienden. En ARANPRO entregamos una herramienta simple, directa y transparente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Card sistemas tradicionales */}
          <div className="p-8 bg-white rounded-3xl border border-[#E9EBE8] shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ✕
            </div>
            <h3 className="text-xl font-bold text-[#0F3D2E]">
              Sistemas Tradicionales Sobrecargados
            </h3>
            <ul className="space-y-3 text-sm text-[#4A4F4F]">
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                Docenas de módulos complejos donde los residentes no encuentran su cobro ni su detalle.
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                Costos mensuales elevados que terminan pagando los propios vecinos en el gasto común.
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2 font-bold">•</span>
                Poca visibilidad de las boletas y facturas reales que sustentan los cobros del mes.
              </li>
            </ul>
          </div>

          {/* Card Propuesta ARANPRO */}
          <div className="p-8 bg-[#0F3D2E] text-[#F5F4EF] rounded-3xl shadow-xl space-y-4 border border-[#D4B895]/40">
            <div className="w-10 h-10 rounded-xl bg-[#D4B895]/20 text-[#D4B895] border border-[#D4B895]/50 flex items-center justify-center font-bold">
              ✓
            </div>
            <h3 className="text-xl font-bold text-[#F5F4EF]">
              Propuesta ARANPRO: Claridad Total & PWA Propia
            </h3>
            <ul className="space-y-3 text-sm text-[#F5F4EF]/90">
              <li className="flex items-start">
                <CheckCircle2 className="w-4 h-4 text-[#D4B895] mr-2 mt-0.5 shrink-0" />
                <span><strong>Incluida en el servicio:</strong> Cero costo de licencias de software adicionales para la comunidad.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-4 h-4 text-[#D4B895] mr-2 mt-0.5 shrink-0" />
                <span><strong>Respaldos 100% adjuntos:</strong> Cada gasto de luz, agua, portón o jardinero tiene su boleta o factura visible con 1 clic.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-4 h-4 text-[#D4B895] mr-2 mt-0.5 shrink-0" />
                <span><strong>Indicadores en verde o rojo:</strong> Cada vecino conoce el estado financiero real de su hogar y de su comunidad.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 5. ACCESO DIRECTO A COMUNIDADES */}
      <section id="comunidades" className="bg-[#E9EBE8]/60 py-12 border-y border-[#D4B895]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#4A4F4F]">
                Portal de Vecinos
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0F3D2E]">
                Comunidades Administradas por ARANPRO
              </p>
              <p className="text-xs text-[#4A4F4F] mt-1">
                Selecciona tu comunidad para ingresar con tu RUT y número de unidad.
              </p>
            </div>
            <button
              onClick={() => setCurrentView('communities-selector')}
              className="text-sm text-[#0F3D2E] hover:text-[#0A291F] flex items-center font-bold"
            >
              Ver directorio de comunidades <ChevronRight className="w-4 h-4 ml-1 text-[#D4B895]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCommunity(c.slug)}
                className="bg-white p-6 rounded-3xl border border-[#E9EBE8] shadow-xs hover:shadow-md hover:border-[#D4B895] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#F5F4EF] text-[#0F3D2E] rounded-md border border-[#D4B895]/40">
                      {c.type} • {c.totalUnits} Casas
                    </span>
                    <span className="text-xs text-[#0F3D2E] font-semibold flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
                      Portal Activo
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#0F3D2E] group-hover:underline decoration-[#D4B895] transition-colors">
                    {c.name}
                  </h4>
                  <p className="text-xs text-[#4A4F4F]">
                    {c.address}, {c.city}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E9EBE8] flex items-center justify-between text-xs font-semibold text-[#0F3D2E]">
                  <span>Ingreso de Propietarios</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#D4B895]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BANNER TRÁMITES Y PREGUNTAS FRECUENTES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Tarjeta Certificados */}
          <div className="bg-[#0F3D2E] rounded-3xl p-6 sm:p-8 text-[#F5F4EF] flex flex-col justify-between gap-5 shadow-lg border border-[#D4B895]/40">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-[#D4B895]/20 text-[#D4B895] text-xs font-bold rounded-full border border-[#D4B895]/40 inline-block">
                Trámites en Línea
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#F5F4EF]">
                ¿Requieres un Certificado de Residencia o No Deuda?
              </h3>
              <p className="text-xs sm:text-sm text-[#F5F4EF]/85 leading-relaxed">
                Revisamos el estado de tu unidad y emitimos tu certificado digital timbrado por ARANPRO.
              </p>
            </div>
            <button
              onClick={onOpenCertificates}
              className="w-fit px-6 py-3 bg-[#D4B895] hover:bg-[#E8D7C1] text-[#0F3D2E] font-bold text-xs sm:text-sm rounded-xl shadow-md transition-transform hover:scale-[1.02] flex items-center"
            >
              <FileText className="w-4 h-4 mr-2 text-[#0F3D2E]" />
              Solicitar Certificado en Línea
            </button>
          </div>

          {/* Tarjeta Preguntas Frecuentes (Abre página dedicada) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-[#0F3D2E] flex flex-col justify-between gap-5 shadow-sm border border-[#D4B895]">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-[#F5F4EF] text-[#0F3D2E] text-xs font-bold rounded-full border border-[#D4B895] inline-block">
                Guía Legal Ley N° 21.442
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F3D2E]">
                ¿Dudas sobre Gastos Comunes, Asambleas o Copropiedad?
              </h3>
              <p className="text-xs sm:text-sm text-[#4A4F4F] leading-relaxed">
                Consulta nuestra página exclusiva de Preguntas Frecuentes con respuestas claras basadas en la Ley de Copropiedad Inmobiliaria.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentView('faq');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-fit px-6 py-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#F5F4EF] font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-transform hover:scale-[1.02] flex items-center"
            >
              <HelpCircle className="w-4 h-4 mr-2 text-[#D4B895]" />
              Ir a Preguntas Frecuentes
              <ArrowRight className="w-4 h-4 ml-1.5 text-[#D4B895]" />
            </button>
          </div>

        </div>
      </section>

      {/* 8. CONTACTO & VISITA A TERRENO GRATUITA */}
      <section id="contacto" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4A4F4F]">
              Conversemos
            </span>
            <h3 className="text-3xl font-black text-[#0F3D2E] tracking-tight">
              Coordina una visita a terreno gratuita para tu comunidad
            </h3>
            <p className="text-sm text-[#4A4F4F] leading-relaxed">
              Nos reunimos con el Comité de Administración para revisar el estado actual de los gastos comunes, el funcionamiento del equipamiento y proponer un plan de gestión integral a la medida.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-3 text-sm text-[#0F3D2E]">
                <div className="w-10 h-10 rounded-xl bg-white text-[#0F3D2E] border border-[#D4B895] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold">Llámanos o escríbenos directamente:</div>
                  <a href={`tel:${companySettings.phone}`} className="text-[#0F3D2E] font-semibold hover:underline">
                    {companySettings.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm text-[#0F3D2E]">
                <div className="w-10 h-10 rounded-xl bg-white text-[#0F3D2E] border border-[#D4B895] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold">Correo de atención:</div>
                  <div className="text-[#4A4F4F]">{companySettings.email}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-[#D4B895] shadow-md">
            {quoteSent ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-[#0F3D2E]">¡Mensaje Recibido!</h4>
                <p className="text-sm text-[#4A4F4F] max-w-sm mx-auto">
                  John Arancibia se pondrá en contacto contigo a la brevedad para coordinar la visita a terreno sin costo.
                </p>
                <button
                  onClick={() => setQuoteSent(false)}
                  className="mt-4 px-5 py-2 bg-[#0F3D2E] text-[#F5F4EF] rounded-xl text-xs font-semibold"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                <h4 className="text-base font-bold text-[#0F3D2E]">Solicitar Propuesta de Administración ARANPRO</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F3D2E] mb-1">Tu Nombre *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Marcelo Rodríguez"
                      value={quoteForm.name}
                      onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F3D2E] mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+56 9 1234 5678"
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#0F3D2E] mb-1">Nombre del Condominio / Edificio *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Condominio Los Cerezos"
                      value={quoteForm.condoName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, condoName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F3D2E] mb-1">N° Casas / Deptos</label>
                    <input
                      type="number"
                      placeholder="16"
                      value={quoteForm.unitsCount}
                      onChange={(e) => setQuoteForm({ ...quoteForm, unitsCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F3D2E] mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="contacto@micondominio.cl"
                    value={quoteForm.email}
                    onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F3D2E] mb-1">Mensaje o situación actual</label>
                  <textarea
                    rows={3}
                    placeholder="Cuéntanos brevemente sobre la comunidad: número de casas o departamentos, situación actual de gastos comunes o mantenciones..."
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#F5F4EF] font-semibold rounded-xl text-sm transition-colors flex items-center justify-center shadow-md"
                >
                  <Send className="w-4 h-4 mr-2 text-[#D4B895]" />
                  Enviar Solicitud de Visita
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};
