import React, { useState } from 'react';
import { AranproLogo } from '../common/MauranLogo';
import { Shield, Lock, FileText, CheckCircle2, X, Scale, UserCheck, AlertTriangle } from 'lucide-react';

export const LegalAspectsModal = ({ isOpen, onClose, initialTab = 'terminos' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera Modal */}
        <div className="bg-[#0F3D2E] text-white p-5 sm:p-6 border-b-2 border-[#D4B895] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#D4B895]/20 border border-[#D4B895]/40 flex items-center justify-center text-[#D4B895]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Aspectos Legales, Privacidad y Propiedad Intelectual
              </h3>
              <p className="text-xs text-[#D4B895]">
                ARANPRO Gestión Integral • Conforme a la legislación de la República de Chile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de pestañas */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex space-x-2 sm:space-x-4 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('terminos')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'terminos'
                ? 'border-[#0F3D2E] text-[#0F3D2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Términos de Uso & Propiedad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacidad')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'privacidad'
                ? 'border-[#0F3D2E] text-[#0F3D2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacidad y Datos (Ley 19.628)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ley21442')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ley21442'
                ? 'border-[#0F3D2E] text-[#0F3D2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Cumplimiento Ley 21.442 & RNAC</span>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
          
          {/* TAB 1: TÉRMINOS Y PROPIEDAD INTELECTUAL */}
          {activeTab === 'terminos' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-emerald-950 text-sm">Propiedad Intelectual y Titularidad de Software</h4>
                  <p className="text-xs text-emerald-900 mt-1">
                    La plataforma web, la aplicación móvil progresiva (PWA), sus algoritmos de cálculo, base de datos, logotipos, marcas comerciales e interfaces son propiedad exclusiva de <strong>John Andrés Arancibia Maureira (ARANPRO)</strong>, desarrollados con la arquitectura técnica de <strong>Red-Enlace Soluciones Digitales</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  1. Licencia de Uso Limitada y Restricciones
                </h4>
                <p>
                  Se concede a las comunidades de copropietarios, administradores autorizados y residentes una licencia no exclusiva, intransferible y revocable para utilizar el software con el único propósito de gestionar los gastos comunes, asambleas y rendiciones de su respectivo condominio.
                </p>
                <p className="font-semibold text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200">
                  Queda estrictamente prohibida la reproducción, duplicación, descompilación, ingeniería inversa, reventa, sublicenciamiento o explotación comercial del software o de su código fuente sin el consentimiento expreso y por escrito del titular de los derechos.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  2. Responsabilidad sobre la Información Contable
                </h4>
                <p>
                  ARANPRO provee la infraestructura tecnológica y de auditoría contable. Los respaldos de boletas, facturas y transferencias bancarias cargadas por comités o usuarios constituyen declaraciones informativas sujetas a las resoluciones de las asambleas de copropietarios y a la conciliación en las cuentas corrientes oficiales del condominio.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  3. Disponibilidad y Continuidad del Servicio
                </h4>
                <p>
                  La plataforma opera sobre infraestructura en la nube de alta disponibilidad (Cloudflare y Supabase con redundancia geográfica). Si bien se garantiza un estándar óptimo de operación continua (99.9% uptime), el servicio puede experimentar interrupciones programadas para mejoras de seguridad o mantención preventiva.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: POLÍTICA DE PRIVACIDAD Y LEY 19.628 */}
          {activeTab === 'privacidad' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-blue-950 text-sm">Protección de Datos Personales (Ley N° 19.628)</h4>
                  <p className="text-xs text-blue-900 mt-1">
                    Garantizamos el resguardo confidencial de los datos de copropietarios, residentes y arrendatarios en estricto cumplimiento con la legislación chilena sobre protección de la vida privada.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  1. Finalidad Exclusiva de los Datos Recopilados
                </h4>
                <p>
                  Los datos personales (nombre, RUT, correo electrónico, número de teléfono, unidad habitacional y comprobantes de transferencia) se recaban y procesan únicamente para:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
                  <li>Emisión y despacho de colillas de cobro individual y cartolas de cuenta corriente.</li>
                  <li>Citación formal a asambleas ordinarias y extraordinarias conforme al Art. 15° de la Ley 21.442.</li>
                  <li>Envío de alertas de emergencia, avisos de corte de suministros o mantenciones del condominio.</li>
                  <li>Emisión de certificados oficiales de residencia y de no deuda.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-100 rounded-xl text-slate-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Compromiso de No Divulgación: ARANPRO jamás venderá, arrendará ni compartirá las bases de datos de residentes con empresas de marketing, crédito o terceros comerciales.
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  2. Derechos del Titular (Acceso, Rectificación y Cancelación)
                </h4>
                <p>
                  Todo residente o copropietario tiene derecho a solicitar la verificación o rectificación de sus datos de contacto comunicándose formalmente con la administración a través de los canales oficiales (`contacto@aranpro.cl` o vía portal de residentes).
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CUMPLIMIENTO LEY 21.442 Y RNAC MINVU */}
          {activeTab === 'ley21442' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-[#F5F4EF] rounded-2xl border border-[#D4B895] flex items-start gap-3">
                <Scale className="w-5 h-5 text-[#0F3D2E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-[#0F3D2E] text-sm">
                    Estándares de la Nueva Ley de Copropiedad Inmobiliaria N° 21.442
                  </h4>
                  <p className="text-xs text-slate-700 mt-1">
                    La plataforma fue construida específicamente para responder a las exigencias jurídicas, contables y de gobernanza impuestas por la Ley 21.442 y su Reglamento.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 text-xs mb-1">Validez del Correo Electrónico</h5>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Conforme al Art. 5° y concordantes, las comunicaciones y colillas enviadas al correo formalmente registrado por el copropietario tienen plena validez legal y procesal.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 text-xs mb-1">Fondo de Reserva Obligatorio</h5>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Cálculo y recaudación separada del Fondo de Reserva legalmente exigido, asegurando su intangibilidad para obras mayores y siniestros.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 text-xs mb-1">Rendición Documentada de Gastos</h5>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Obligatoriedad de mantener a disposición de los copropietarios las facturas, boletas y comprobantes de egreso en el portal digital.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 text-xs mb-1">Acreditación RNAC MINVU</h5>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Administración profesional inscrita en el Registro Nacional de Administradores de Condominios del Ministerio de Vivienda y Urbanismo: <strong>Reg. N° 48.912</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                <span className="font-bold text-slate-900 block">Certificaciones Gremiales y Vigencia:</span>
                <p>
                  • Socio Activo <strong>CGAI Chile</strong> (Colegio de Gestión y Administración Inmobiliaria de Chile A.G., Socio N° 13-563).<br />
                  • Miembro <strong>AGACECH</strong> (Asociación Gremial de Administradores de Condominios y Edificios de Chile).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer del Modal */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} ARANPRO • Red-Enlace Soluciones Digitales. Todos los derechos reservados.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Entendido y Aceptar
          </button>
        </div>

      </div>
    </div>
  );
};
