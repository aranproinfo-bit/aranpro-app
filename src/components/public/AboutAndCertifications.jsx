import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { MauranLogo } from '../common/MauranLogo';
import { CgaiBadge, AgacechBadge } from '../common/CredentialChip';
import { 
  Award, ShieldCheck, CheckCircle2, FileText, Download, 
  ExternalLink, Calendar, MapPin, Check, Briefcase, Wrench, 
  Users, BarChart3, Scale, Flame, ShieldAlert, Sparkles, Building, Eye, X
} from 'lucide-react';

export const AboutAndCertifications = () => {
  const { companySettings } = useCommunity();
  const [selectedCert, setSelectedCert] = useState(null);

  // Lista detallada de todas las certificaciones oficiales
  const certificationsList = [
    {
      id: 'cert-diploma-2019',
      title: 'Administración de Edificios y Condominios',
      institution: 'Learning Group • Fundación Emprenden',
      year: 'Septiembre 2019',
      badge: 'Titulación Profesional Base',
      type: 'Diploma Oficial',
      description: 'Aprobación de exigencias y competencias para la administración integral de edificios y condominios con registro holográfico.',
      pdfUrl: '/certificaciones/diploma_administrador_2019.pdf',
      color: 'forest'
    },
    {
      id: 'cert-armis-ley',
      title: 'Nueva Ley de Copropiedad Inmobiliaria (Ley 21.442)',
      institution: 'ARMIS Abogados • Juan Pablo Vargas (CEO)',
      year: 'Marzo 2021',
      badge: 'Conocimientos Legales Avanzados',
      type: 'Certificado de Aprobación & Diploma',
      description: 'Curso intensivo y examen final sobre la Nueva Ley de Copropiedad Inmobiliaria, asambleas, quórums y responsabilidades del administrador.',
      pdfUrl: '/certificaciones/certificado_armis_ley_copropiedad.pdf',
      color: 'olive'
    },
    {
      id: 'cert-uc-finanzas',
      title: 'Herramientas de Contabilidad Financiera Básica',
      institution: 'Pontificia Universidad Católica de Chile (PUC / Teleduc)',
      year: 'Septiembre 2020',
      badge: 'Formación Universitaria UC',
      type: 'Certificado de Aprobación (30 hrs • Nota 5.5)',
      description: 'Capacitación en control contable, balances, conciliación bancaria y gestión presupuestaria para comunidades inmobiliarias.',
      pdfUrl: '/certificaciones/certificado_uc_contabilidad_financiera.pdf',
      color: 'champagne'
    },
    {
      id: 'cert-google-pm',
      title: 'Foundations of Project Management',
      institution: 'Google Career Certificates • Coursera',
      year: 'Julio 2026',
      badge: 'Certificación Internacional Google',
      type: 'Course Certificate (ID: SKERS2TWPLS5)',
      description: 'Gestión profesional de proyectos, planificación, gestión de riesgos, presupuestos y control de ejecución de obras.',
      pdfUrl: '/certificaciones/certificado_google_project_management.pdf',
      color: 'sage'
    },
    {
      id: 'cert-vgroup-negociacion',
      title: 'Técnicas de Negociación Efectivas',
      institution: 'VGroup Educación Online',
      year: 'Capacitación Especializada',
      badge: 'Mediación & Resolución de Conflictos',
      type: 'Certificado de Participación',
      description: 'Habilidades clave para la mediación pacífica de controversias entre copropietarios, comités de administración y proveedores.',
      pdfUrl: '/certificaciones/certificado_vgroup_tecnicas_negociacion.pdf',
      color: 'forest'
    }
  ];

  return (
    <div className="space-y-10">
      
      {/* 1. SECCIÓN SOBRE MÍ & TRAYECTORIA */}
      <section id="sobre-mi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="bg-gradient-to-br from-[#0A291F] via-[#0F3D2E] to-[#0F3D2E] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-[#0F3D2E]">
          
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#0F3D2E]/20 blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Avatar / Columna de Identidad */}
            <div className="lg:col-span-4 text-center lg:text-left space-y-4">
              <div className="relative inline-block mx-auto lg:mx-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-[#0F3D2E] via-[#0F3D2E] to-[#D4B895] p-1 shadow-xl">
                  <div className="w-full h-full bg-[#0F3D2E] rounded-[22px] flex flex-col items-center justify-center p-3 text-white border border-[#0F3D2E]/40">
                    <MauranLogo variant="isotipo" size="md" />
                    <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider mt-1">
                      ARANPRO
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-[#0F3D2E] rounded-xl text-white shadow-md border border-[#D4B895]">
                  <ShieldCheck className="w-5 h-5 text-[#D4B895]" />
                </div>
              </div>

              <div>
                <span className="px-3 py-1 bg-[#0F3D2E]/30 text-[#D4B895] text-xs font-bold rounded-full border border-[#D4B895]/30 inline-block mb-1">
                  Administrador desde 2019
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  John Andrés Arancibia M.
                </h3>
                <p className="text-xs text-[#D4B895] font-semibold mt-0.5">
                  Líder de Operaciones en ARANPRO
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start pt-1">
                <span className="px-2.5 py-1 bg-[#0F3D2E]/90 rounded-lg text-[11px] text-[#F5F4EF] border border-[#0F3D2E] flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                  Región de Coquimbo & Chile
                </span>
                <span className="px-2.5 py-1 bg-[#0F3D2E]/90 rounded-lg text-[11px] text-[#F5F4EF] border border-[#0F3D2E] flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                  7+ Años de Trayectoria
                </span>
              </div>
            </div>

            {/* Texto descriptivo */}
            <div className="lg:col-span-8 space-y-4 text-[#F5F4EF]/90 text-sm sm:text-base leading-relaxed">
              <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Gestión profesional en terreno, transparencia financiera y respaldo normativo
              </h4>

              <p>
                Inicié formalmente mi labor en la administración de condominios en el año <strong>2019</strong>. Durante estos años he complementado mi experiencia operativa con certificaciones de excelencia técnica: especialización en la <strong>Nueva Ley de Copropiedad Inmobiliaria N° 21.442</strong> (Armis Abogados), <strong>Contabilidad Financiera en la Pontificia Universidad Católica de Chile</strong>, y <strong>Gestión Profesional de Proyectos con Google</strong>.
              </p>

              <p className="text-sm">
                Soy socio activo del <strong>Colegio de Gestión y Administración Inmobiliaria (CGAI Chile, Registro Nº 13-563)</strong> y administrador acreditado por la <strong>Asociación Gremial de Administradores de Condominios de Chile (AGACECH)</strong>. Con <strong>ARANPRO</strong> llevamos a cada comunidad el principio fundamental de <em>"Comunidades bien gestionadas, mayor tranquilidad"</em>.
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center space-x-2 text-[#F5F4EF]">
                  <CheckCircle2 className="w-4 h-4 text-[#D4B895] shrink-0" />
                  <span>Rendición documentada mensual con boletas reales</span>
                </div>
                <div className="flex items-center space-x-2 text-[#F5F4EF]">
                  <CheckCircle2 className="w-4 h-4 text-[#D4B895] shrink-0" />
                  <span>Supervisión presencial continua de obras y personal</span>
                </div>
                <div className="flex items-center space-x-2 text-[#F5F4EF]">
                  <CheckCircle2 className="w-4 h-4 text-[#D4B895] shrink-0" />
                  <span>Plataforma PWA propia incluida para cada comunidad</span>
                </div>
                <div className="flex items-center space-x-2 text-[#F5F4EF]">
                  <CheckCircle2 className="w-4 h-4 text-[#D4B895] shrink-0" />
                  <span>Asesoría legal permanente a Comités de Administración</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CHIPS DIGITALES MODERNOS DE SOCIO & ACREDITACIONES GREMIALES */}
      <section id="certificaciones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#F5F4EF] border border-[#D4B895] rounded-full text-xs font-semibold text-[#0F3D2E]">
            <Award className="w-3.5 h-3.5 text-[#0F3D2E]" />
            <span>Chips Gremiales Acreditados</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#0F3D2E] tracking-tight">
            Acreditaciones Gremiales Oficiales de Chile
          </h3>
          <p className="text-sm text-[#4A4F4F] max-w-xl mx-auto">
            Acreditado ante los colegios y asociaciones más prestigiosas del rubro inmobiliario en nuestro país.
          </p>
        </div>

        {/* Los 2 Chips Modernos Digitales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-2">
            <CgaiBadge />
            <span className="text-[11px] text-[#4A4F4F] font-medium">
              Colegio de Gestión y Administración Inmobiliaria de Chile
            </span>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <AgacechBadge />
            <span className="text-[11px] text-[#4A4F4F] font-medium">
              Asociación Gremial de Administradores de Condominios y Edificios
            </span>
          </div>
        </div>

        {/* 3. PARRILLA DE DIPLOMAS Y CERTIFICACIONES OFICIALES */}
        <div className="pt-6 space-y-6">
          <div className="text-center space-y-1">
            <h4 className="text-xl font-bold text-[#0F3D2E]">
              Certificaciones Académicas y Profesionales
            </h4>
            <p className="text-xs text-[#4A4F4F]">
              Documentos emitidos por universidades, entidades gremiales y corporaciones internacionales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificationsList.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-3xl border border-[#D4B895] shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4 group hover:border-[#0F3D2E]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895]/50">
                      {cert.badge}
                    </span>
                    <span className="text-xs text-[#4A4F4F] font-medium">{cert.year}</span>
                  </div>

                  <div>
                    <h5 className="text-base font-bold text-[#0F3D2E] group-hover:text-[#0F3D2E] transition-colors">
                      {cert.title}
                    </h5>
                    <p className="text-xs font-semibold text-[#0F3D2E] mt-1">
                      {cert.institution}
                    </p>
                    <p className="text-xs text-[#4A4F4F] mt-2 leading-relaxed">
                      {cert.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F5F4EF] flex items-center justify-between gap-2">
                  <a
                    href={cert.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-bold text-[#0F3D2E] hover:text-[#0A291F]"
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-[#0F3D2E]" />
                    Descargar PDF
                  </a>

                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#F5F4EF] hover:bg-[#D4B895]/40 text-[#0F3D2E] rounded-xl transition-colors flex items-center border border-[#D4B895]/60"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-[#0F3D2E]" />
                    Ver Ficha
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* 4. HABILIDADES Y ÁREAS DE ESPECIALIZACIÓN */}
      <section id="habilidades" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#F5F4EF] border border-[#D4B895] rounded-full text-xs font-semibold text-[#0F3D2E]">
            <Briefcase className="w-3.5 h-3.5 text-[#0F3D2E]" />
            <span>Capacidades Técnicas & Operativas</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#0F3D2E] tracking-tight">
            Mis Habilidades y Áreas de Gestión
          </h3>
          <p className="text-sm text-[#4A4F4F] max-w-2xl mx-auto">
            Cada área clave de tu condominio es atendida con experiencia práctica, conocimiento normativo y presencia directa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          
          <div className="bg-white p-6 rounded-3xl border border-[#D4B895] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] flex items-center justify-center font-bold">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#0F3D2E]">
              Finanzas & Conciliación Bancaria
            </h4>
            <p className="text-xs text-[#4A4F4F] leading-relaxed">
              Recaudación de gastos comunes, pago puntual de cuentas y proveedores, conciliación bancaria mensual y rendición documentada. Control riguroso del Fondo de Reserva legal.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#D4B895] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] flex items-center justify-center font-bold">
              <Wrench className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#0F3D2E]">
              Mantención Preventiva de Infraestructura
            </h4>
            <p className="text-xs text-[#4A4F4F] leading-relaxed">
              Supervisión técnica de bombas de agua, motores de portones automáticos, luminarias perimetrales, piscinas, calderas y circuitos cerrados de TV (CCTV) con proveedores acreditados.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#D4B895] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#0F3D2E]">
              Gestión de Personal & Ley Laboral
            </h4>
            <p className="text-xs text-[#4A4F4F] leading-relaxed">
              Administración integral del personal (conserjes, guardias, aseo y jardinería): contratos, cálculo de horas extras, turnos, reemplazos oportunos, finiquitos y pago previsional en Previred.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#D4B895] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] flex items-center justify-center font-bold">
              <Scale className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#0F3D2E]">
              Marco Legal Ley 21.442
            </h4>
            <p className="text-xs text-[#4A4F4F] leading-relaxed">
              Asesoría permanente al Comité de Administración en asambleas ordinarias y extraordinarias, quórums de votación, actualización del Reglamento de Copropiedad y mediación de conflictos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#D4B895] shadow-xs hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] flex items-center justify-center font-bold">
              <Flame className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#0F3D2E]">
              Seguridad & Certificaciones SEC
            </h4>
            <p className="text-xs text-[#4A4F4F] leading-relaxed">
              Cumplimiento de planes de emergencia ante siniestros (PES), certificaciones periódicas de instalaciones de gas (sello verde SEC), certificación de ascensores y seguros contra incendio.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#0F3D2E] shadow-xs hover:shadow-md transition-all space-y-3 bg-gradient-to-br from-white to-[#F5F4EF]/60">
            <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#0F3D2E]">
              Plataforma Propia para Residentes
            </h4>
            <p className="text-xs text-[#4A4F4F] leading-relaxed">
              Entrego a cada comunidad mi propia plataforma web y aplicación para celulares: cada vecino puede consultar su estado de cuenta, ver las boletas del mes y los respaldos reales de cada gasto sin costo extra.
            </p>
          </div>

        </div>
      </section>

      {/* MODAL DETALLE DE CERTIFICACIÓN */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#D4B895] overflow-hidden relative p-6 sm:p-8 space-y-6">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 p-1.5 text-[#4A4F4F] hover:text-[#0F3D2E] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895]/50">
                {selectedCert.badge}
              </span>
              <h3 className="text-xl font-black text-[#0F3D2E] pt-2">
                {selectedCert.title}
              </h3>
              <p className="text-xs font-semibold text-[#0F3D2E]">
                {selectedCert.institution} • {selectedCert.year}
              </p>
            </div>

            <div className="p-4 bg-[#F5F4EF] rounded-2xl border border-[#D4B895]/60 text-xs text-[#0F3D2E] leading-relaxed space-y-2">
              <p><strong>Tipo de Documento:</strong> {selectedCert.type}</p>
              <p><strong>Alcance y Competencias:</strong> {selectedCert.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={selectedCert.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center border border-[#0F3D2E]"
              >
                <Download className="w-4 h-4 mr-1.5 text-[#D4B895]" />
                Descargar Documento PDF Oficial
              </a>

              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 bg-[#F5F4EF] hover:bg-[#D4B895]/40 text-[#0F3D2E] font-semibold text-xs rounded-xl border border-[#D4B895]/50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
