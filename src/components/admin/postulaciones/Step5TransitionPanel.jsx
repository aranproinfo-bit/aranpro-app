import React, { useState, useMemo } from 'react';
import {
  FileText, CheckSquare, ShieldCheck, Mail, MessageCircle, Copy, Printer,
  Eye, Download, RefreshCw, Send, ChevronDown, ChevronUp, AlertCircle,
  Clock, CheckCircle2, UserCheck, Building2, Key, Scale, Award,
  HelpCircle, ArrowRight, BookOpen, PenTool, ExternalLink, Calendar,
  DollarSign, Sparkles, Check
} from 'lucide-react';
import { printDocumentDirectly } from '../../../utils/printDocument';
import { formatCLP } from '../../../utils/formatters';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector, useAranproPdfStyle } from '../../common/MauranLogo';

export const Step5TransitionPanel = ({
  proposalConfig = {},
  setProposalConfig = () => {},
  empresaForm = {},
  signatureImage = '',
  signatureScale = 1,
  companySettings = {},
  showAlert = () => {},
  handleShareWhatsApp = () => {},
  handleShareEmail = () => {},
  sendingEmailStep = null,
  getStepMessages = () => ({}),
  handleCopyStepMessage = () => {}
}) => {
  const [activeSubTab, setActiveSubTab] = useState('carta'); // 'carta' | 'checklist' | 'acta' | 'guias'
  const [actaOrContract, setActaOrContract] = useState('acta'); // 'acta' | 'contrato'
  const [expandedMsg, setExpandedMsg] = useState(false);
  const [copiedClause, setCopiedClause] = useState(false);
  const [pdfStyle, setPdfStyle] = useAranproPdfStyle('alt4');

  // Estados locales para la pauta interactiva de traspaso
  const [checklistValues, setChecklistValues] = useState({
    a1: true, a2: true, a3: true, a4: true, a5: true, a6: true,
    b1: true, b2: true, b3: true, b4: true, b5: true, b6: true, b7: true,
    c1: true, c2: true, c3: true, c4: true, c5: true, c6: true,
    d1: true, d2: true, d3: true, d4: true, d5: true, d6: true,
    e1: true, e2: true, e3: true, e4: true, e5: true, e6: true
  });

  const [checklistNotes, setChecklistNotes] = useState({});

  const toggleCheck = (id) => {
    setChecklistValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setNote = (id, text) => {
    setChecklistNotes(prev => ({ ...prev, [id]: text }));
  };

  // Variables calculadas
  const condo = proposalConfig.targetCondo?.trim() || 'Comunidad Valle de la Florida IV';
  const city = proposalConfig.targetCity?.trim() || empresaForm.city || 'La Serena';
  const adminName = empresaForm.adminName || 'John Andrés Arancibia Maureira';
  const adminRut = (empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2';
  const phone = empresaForm.phone || '+56 9 5811 8504';
  const email = empresaForm.email || 'contacto@aranpro.cl';
  const website = empresaForm.website || 'https://aranpro.cl';
  const feeStr = formatCLP(Number(proposalConfig.proposedMonthlyFee) || 850000);
  const effectiveSignature = signatureImage || companySettings?.signatureDataUrl || '';

  // Fechas de transición
  const noticeDate = proposalConfig.transitionNoticeDate || new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const endDate = proposalConfig.transitionEndDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const outgoingAdmin = proposalConfig.outgoingAdminName?.trim() || 'Señor(a) Administrador(a) Saliente';
  const committeePresident = proposalConfig.committeePresidentName?.trim() || 'Presidente(a) del Comité de Administración';

  // Acciones de impresión directa en formato Carta oficial con Alternativa 4
  const handlePrintTerminationNotice = () => {
    const filename = `ARANPRO_Carta_Preaviso_Termino_Administracion_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-termination-notice', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm',
      pdfStyle
    });
  };

  const handlePrintTransitionChecklist = () => {
    const filename = `ARANPRO_Pauta_Checklist_Traspaso_3Pags_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-transition-checklist', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '4mm 6mm 4mm 6mm',
      pdfStyle
    });
  };

  const handlePrintContract = () => {
    const filename = `ARANPRO_Contrato_Servicios_Administracion_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-management-contract', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '4mm 6mm 4mm 6mm',
      pdfStyle
    });
  };

  const handlePrintLegalGuides = () => {
    const filename = `ARANPRO_Guias_Legales_Asambleas_y_Quorums_Ley21442_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-legal-advisory-sheet', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '4mm 6mm 4mm 6mm',
      pdfStyle
    });
  };

  const handlePrintTransitionPackage = () => {
    const filename = `ARANPRO_Kit_Oficial_Traspaso_y_Asesoria_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-transition-package', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '4mm 6mm 4mm 6mm',
      pdfStyle
    });
  };

  // Texto de cláusulas redactadas para el libro de actas
  const assemblyClausesText = useMemo(() => {
    return `========================================================================================
CLÁUSULAS OFICIALES PARA EL LIBRO DE ACTAS DE ASAMBLEA O COMITÉ DE ADMINISTRACIÓN
(Conforme a la Ley N° 21.442 sobre Copropiedad Inmobiliaria y DS N° 7 MINVU 2025)
========================================================================================

CONDOMINIO: ${condo.toUpperCase()}
CIUDAD / COMUNA: ${city.toUpperCase()}
FECHA DE ACUERDO: ${noticeDate}

PRIMERO: TÉRMINO Y CESE DE FUNCIONES DE LA ADMINISTRACIÓN ANTERIOR.
La Asamblea / El Comité de Administración, en uso de las facultades exclusivas conferidas por el Artículo 15 letra c) y Artículo 17 de la Ley N° 21.442, acuerda poner término a los servicios de administración prestados por ${outgoingAdmin.toUpperCase()}, otorgándole un preaviso legal de 30 días corridos contados desde su notificación formal, siendo su último día de funciones el ${endDate}. Asimismo, se le exige en cumplimiento del Artículo 20 de la citada ley, la entrega de una rendición de cuentas documentada hasta el último día de su encargo, las conciliaciones bancarias al día, el traspaso material de los Libros de Actas, registro de copropietarios y las claves bancarias y de portales institucionales (SII y Dirección del Trabajo).

SEGUNDO: DESIGNACIÓN DE NUEVA ADMINISTRACIÓN PROFESIONAL.
Se acuerda unánimemente designar como nuevo Administrador de la Comunidad a don JOHN ANDRÉS ARANCIBIA MAUREIRA, cédula nacional de identidad N° ${adminRut}, de profesión Constructor Civil, con inscripción vigente a título oneroso en el Registro Nacional de Administradores de Condominios (RNAC) dependiente del Ministerio de Vivienda y Urbanismo (MINVU), quien actuará en representación de la empresa ARANPRO GESTIÓN INTEGRAL.

TERCERO: HONORARIOS MENSUALES Y PLAZO DE GESTIÓN.
Se acuerda fijar los honorarios profesionales de la administración en la suma de ${feeStr} mensuales, los que serán pagados contra la emisión de la respectiva boleta de honorarios o factura exenta dentro de los primeros 5 días hábiles de cada mes vencido. La designación regirá por el plazo legal de un año a contar de la fecha de asunción de funciones, renovable tácita y sucesivamente según lo preceptuado en el Artículo 17 de la Ley N° 21.442.

CUARTO: FACULTADES BANCARIAS, FINANCIERAS Y ADMINISTRATIVAS.
Se confieren al nuevo Administrador las más amplias facultades de administración y disposición contempladas en el Artículo 20 de la Ley N° 21.442, en el Reglamento de Copropiedad del condominio y en la legislación común. En especial y a título meramente enunciativo:
a) Bancarias: Abrir, cerrar y operar conjuntamente con los miembros autorizados del Comité de Administración las cuentas corrientes bancarias del condominio, la cuenta exclusiva del Fondo Común de Reserva, tomar depósitos a plazo, girar, endosar y depositar cheques u otros documentos mercantiles.
b) Tributarias y Laborales: Representar válidamente a la comunidad ante el Servicio de Impuestos Internos (SII), Dirección del Trabajo (DT) y portal Previred, suscribir contratos de trabajo, anexos, liquidaciones de remuneraciones y finiquitos del personal de conserjería y aseo.
c) Cobranza y Medidas de Apremiante: Liquidar y cobrar judicial y extrajudicialmente los gastos comunes ordinarios y extraordinarios, aplicar los recargos e intereses moratorios legales, y proceder a la suspensión justificada del servicio eléctrico u otros suministros a las unidades morosas que adeuden tres o más cuotas conforme al Artículo 20 N° 9 de la Ley N° 21.442.

QUINTO: MANDATO ESPECIAL PARA PROTOCOLIZACIÓN Y REDUCCIÓN A ESCRITURA PÚBLICA.
Se faculta expresamente a don JOHN ANDRÉS ARANCIBIA MAUREIRA o al Presidente del Comité de Administración don(ña) ${committeePresident}, para que cualesquiera de ellos indistintamente pueda concurrir ante Notario Público a protocolizar la presente acta o reducirla a escritura pública si fuere necesario para su acreditación ante entidades bancarias, conservatorias o judiciales.`;
  }, [condo, city, noticeDate, outgoingAdmin, endDate, adminRut, feeStr, committeePresident]);

  const handleCopyClauses = () => {
    navigator.clipboard.writeText(assemblyClausesText);
    setCopiedClause(true);
    showAlert?.('✓ Cláusulas Copiadas', 'El texto canónico para el Libro de Actas ha sido copiado al portapapeles listo para pegar en el borrador de asamblea o sesión de comité.', 'success');
    setTimeout(() => setCopiedClause(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* CABECERA PRINCIPAL DEL PASO 5 */}
      <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-[#0F3D2E] via-[#14533D] to-[#0A291F] text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4B895]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-700/50 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#D4B895] text-[#0F3D2E] shadow-2xs">
                Paso 5 • Cierre Comercial & Asesoría Legal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800/80 text-emerald-200 border border-emerald-600/40">
                Ley N° 21.442 & DS N° 7 MINVU
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Scale className="w-6 h-6 text-[#D4B895]" />
              Adjudicación, Preaviso al Saliente, Acta Legal & Pauta de Traspaso
            </h3>
            <p className="text-xs text-emerald-100 max-w-3xl leading-relaxed">
              Guía práctica y jurídica para acompañar al Comité en la toma de control del condominio. Genera en 1 clic la carta formal de preaviso de 30 días al saliente, la pauta de recepción contable de 3 páginas, el acta notarial con facultades bancarias plenas y el contrato bilateral.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintTransitionPackage}
              className="px-4 py-2.5 rounded-2xl bg-[#D4B895] hover:bg-[#c2a37e] text-[#0F3D2E] font-black text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Kit Completo (PDF)</span>
            </button>
            <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
          </div>
        </div>

        {/* BARRA DE CONFIGURACIÓN DE NOMBRES Y PLAZOS DE TRANSICIÓN */}
        <div className="pt-4 pb-1">
          <div className="text-[11px] font-black text-[#D4B895] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Parámetros del Proceso de Transición ({condo}):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">
                Administrador(a) Saliente *
              </label>
              <input
                type="text"
                placeholder="Ej: Claudio Morales Fuentes"
                value={proposalConfig.outgoingAdminName || ''}
                onChange={(e) => setProposalConfig({ ...proposalConfig, outgoingAdminName: e.target.value })}
                className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-600/60 rounded-xl text-white font-bold placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">
                Presidente(a) del Comité *
              </label>
              <input
                type="text"
                placeholder="Ej: Directiva Comité de Administración"
                value={proposalConfig.committeePresidentName || ''}
                onChange={(e) => setProposalConfig({ ...proposalConfig, committeePresidentName: e.target.value })}
                className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-600/60 rounded-xl text-white font-bold placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">
                Fecha Notificación (Aviso 30 Días)
              </label>
              <input
                type="text"
                placeholder="Ej: 30 de octubre de 2026"
                value={proposalConfig.transitionNoticeDate || ''}
                onChange={(e) => setProposalConfig({ ...proposalConfig, transitionNoticeDate: e.target.value })}
                className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-600/60 rounded-xl text-white font-medium placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">
                Último Día de Funciones (Cierre)
              </label>
              <input
                type="text"
                placeholder="Ej: 30 de noviembre de 2026"
                value={proposalConfig.transitionEndDate || ''}
                onChange={(e) => setProposalConfig({ ...proposalConfig, transitionEndDate: e.target.value })}
                className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-600/60 rounded-xl text-white font-medium placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
              />
            </div>
          </div>
        </div>

        {/* SELECTOR DE LOS 4 INSTRUMENTOS DEL PASO 5 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-emerald-800/40 mt-3">
          {[
            { id: 'carta', label: '1. Carta de Notificación (Preaviso 30 Días)', icon: Mail },
            { id: 'checklist', label: '2. Checklist & Pauta de Traspaso (3 Págs)', icon: CheckSquare },
            { id: 'acta', label: '3. Acta de Nombramiento & Contrato', icon: BookOpen },
            { id: 'guias', label: '4. Guías Legales (Asambleas & Quórums)', icon: Scale }
          ].map(tab => {
            const TabIcon = tab.icon;
            const isAct = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAct
                    ? 'bg-[#D4B895] text-[#0F3D2E] shadow-sm font-black'
                    : 'bg-emerald-900/50 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/50'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isAct ? 'text-[#0F3D2E]' : 'text-emerald-300'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO DEL SUBTAB SELECCIONADO */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        {/* ==================== 1. CARTA DE TÉRMINO & PREAVISO ==================== */}
        {activeSubTab === 'carta' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                  Instrumento Legal N° 1 • Notificación Formal de Término
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Carta de Notificación de Término de Funciones y Preaviso de 30 Días
                </h4>
                <p className="text-xs text-slate-500">
                  Enviada por el Comité de Administración al administrador saliente. Cita formalmente la Ley N° 21.442 y exige los 5 bloques obligatorios de entrega.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintTerminationNotice}
                  className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Imprimir / Descargar PDF</span>
                </button>
              </div>
            </div>

            {/* VISTA PREVIA INTERACTIVA DE LA CARTA */}
            <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 space-y-4 max-w-3xl mx-auto leading-relaxed shadow-inner">
              <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                <div>
                  <div className="font-black text-[#0F3D2E] text-sm uppercase">COMITÉ DE ADMINISTRACIÓN</div>
                  <div className="font-bold text-slate-700">{condo}</div>
                  <div className="text-[11px] text-slate-500">Ley N° 21.442 sobre Copropiedad Inmobiliaria</div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  {city}, {noticeDate}
                </div>
              </div>

              <div className="space-y-1 text-slate-700">
                <p><strong>Señor(a):</strong> {outgoingAdmin}</p>
                <p><strong>Administrador(a) Saliente del:</strong> {condo}</p>
                <p><strong>Presente</strong></p>
                <p className="pt-1 text-[#0F3D2E] font-bold">
                  REF: NOTIFICACIÓN DE TÉRMINO DE FUNCIONES Y AVISO LEGAL DE 30 DÍAS (LEY N° 21.442).
                </p>
              </div>

              <p>Estimado(a):</p>
              <p>
                Por medio de la presente, el Comité de Administración del <strong>{condo}</strong>, en representación de la comunidad y en estricto ejercicio de las facultades que le confiere la <strong>Ley N° 21.442 sobre Copropiedad Inmobiliaria</strong> y el Reglamento de Copropiedad del condominio, cumple con notificarle formalmente la decisión de <strong>poner término a la prestación de sus servicios como Administrador del condominio</strong>.
              </p>
              <p>
                Con el propósito de asegurar una transición ordenada y dar cumplimiento al plazo de preaviso legal, sus funciones se extenderán por <strong>30 días corridos</strong> a contar de la recepción de este documento, siendo su <strong>último día de gestión el {endDate}</strong>.
              </p>
              <p>
                Durante este período, y en estricto apego a lo establecido en el <strong>Artículo 20 y concordantes de la Ley N° 21.442</strong>, solicitamos a usted preparar y tener a disposición para la fecha de término la siguiente documentación y procesos indispensables para la continuidad operacional:
              </p>

              <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 text-[11px]">
                <p><strong>1. Rendición de Cuentas Documentada:</strong> Balance final consolidado de ingresos y egresos, junto con las cartolas bancarias y conciliaciones hasta el {endDate}.</p>
                <p><strong>2. Traspaso de Documentación:</strong> Entrega del Libro de Actas foliado, registro actualizado de copropietarios y arrendatarios, archivo histórico de gastos comunes, planos, pólizas de seguro vigentes y certificados de instalaciones (sellos de gas SEC, ascensores Minvu).</p>
                <p><strong>3. Gestión Laboral y Previsional:</strong> Contratos de trabajo y anexos vigentes, comprobantes de pago de cotizaciones previsionales (Previred al día para evitar nulidad Ley Bustos), liquidaciones y finiquitos.</p>
                <p><strong>4. Accesos, Cuentas Bancarias y Claves:</strong> Traspaso formal de credenciales bancarias (Fondo de Reserva y cuenta ordinaria), portales del SII, Dirección del Trabajo, correos institucionales y licencias.</p>
                <p><strong>5. Caja Chica, Fondos y Llaves:</strong> Entrega física de los fondos en efectivo disponibles, detalle de cheques pendientes, llaves maestras, tarjetas y controles de acceso.</p>
              </div>

              <p>
                Por nuestra parte, como Comité de Administración, nos comprometemos a facilitar este proceso de transición, a revisar la rendición de cuentas en los plazos legales y a formalizar la recepción definitiva mediante un <strong>Acta de Traspaso</strong> el último día de sus funciones.
              </p>
              <p>
                Agradecemos su gestión durante este tiempo y confiamos en llevar a cabo este cierre de manera transparente y colaborativa.
              </p>

              <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-200">
                <div className="text-center space-y-1">
                  <div className="h-12 border-b border-slate-400" />
                  <p className="font-bold text-slate-800">{committeePresident}</p>
                  <p className="text-[10px] text-slate-500">Presidente(a) del Comité de Administración</p>
                  <p className="text-[9px] text-slate-400">{condo}</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="h-12 border-b border-slate-400" />
                  <p className="font-bold text-slate-800">Recibí Conforme (Administrador Saliente)</p>
                  <p className="text-[10px] text-slate-500">Nombre: ________________________</p>
                  <p className="text-[9px] text-slate-400">RUT: ____________ Fecha: ___/___/2026</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. CHECKLIST INTERACTIVO DE TRASPASO ==================== */}
        {activeSubTab === 'checklist' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                  Instrumento Legal N° 2 • Protocolo de Auditoría y Recepción
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Pauta & Checklist de Recepción de la Comunidad (3 Páginas)
                </h4>
                <p className="text-xs text-slate-500">
                  Herramienta interactiva con casillas de verificación. Asegura que no se escape ningún antecedente legal, financiero, laboral o técnico.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintTransitionChecklist}
                  className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Imprimir Checklist (3 Págs)</span>
                </button>
              </div>
            </div>

            {/* BLOQUES INTERACTIVOS CON TOGGLE */}
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* BLOQUE A */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white p-3 font-black text-xs flex items-center justify-between">
                  <span>BLOQUE A: GOBIERNO, LEGALIDAD Y DOCUMENTACIÓN INSTITUCIONAL</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 1 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'a1', label: 'Reglamento de Copropiedad vigente y modificaciones inscritas en CBR.' },
                    { id: 'a2', label: 'Libro de Actas foliado con actas de asambleas y reuniones de comité.' },
                    { id: 'a3', label: 'Registro oficial de copropietarios, arrendatarios y prorrateos.' },
                    { id: 'a4', label: 'Plan de Emergencia y Evacuación formalizado (Art. 40 Ley 21.442).' },
                    { id: 'a5', label: 'Planos de arquitectura, instalaciones y carpeta municipal DOM.' },
                    { id: 'a6', label: 'Títulos de dominio y contratos de arriendo de bienes comunes.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <input
                          type="text"
                          placeholder="Observaciones / Estado físico..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE B */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white p-3 font-black text-xs flex items-center justify-between">
                  <span>BLOQUE B: INFORMACIÓN FINANCIERA, BANCARIA Y COBRANZA (CARGA ARANPRO)</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 1 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'b1', label: 'Cartolas bancarias y conciliaciones mensuales actualizadas al día.' },
                    { id: 'b2', label: 'Última rendición documentada (facturas, boletas y comprobantes de egreso).' },
                    { id: 'b3', label: 'Estado de cuentas del Fondo Común de Reserva (cuenta exclusiva).' },
                    { id: 'b4', label: 'Informe consolidado de morosidad por unidad y convenios vigentes.' },
                    { id: 'b5', label: 'Nómina de obligaciones pendientes con proveedores y servicios básicos.' },
                    { id: 'b6', label: 'Copia digital de colillas y gastos comunes emitidos últimos 12 meses.' },
                    { id: 'b7', label: 'Rendición y saldo en efectivo de la Caja Chica de conserjería.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <input
                          type="text"
                          placeholder="Observaciones / Saldo o folio..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE C */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white p-3 font-black text-xs flex items-center justify-between">
                  <span>BLOQUE C: RECURSOS HUMANOS, GESTIÓN LABORAL Y PREVISIONAL</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 2 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'c1', label: 'Contratos de trabajo y anexos actualizados a jornada 40 horas.' },
                    { id: 'c2', label: 'Comprobantes de pago de cotizaciones previsionales (Previred al día).' },
                    { id: 'c3', label: 'Últimas 3 liquidaciones de sueldo firmadas por cada trabajador.' },
                    { id: 'c4', label: 'Certificado de antecedentes laborales y previsionales F30 / F30-1 DT.' },
                    { id: 'c5', label: 'Credenciales OS-10 de guardias y conserjes vigentes.' },
                    { id: 'c6', label: 'Finiquitos ratificados de extrabajadores y juicios laborales pendientes.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <input
                          type="text"
                          placeholder="Observaciones laborales..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE D */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white p-3 font-black text-xs flex items-center justify-between">
                  <span>BLOQUE D: MANTENCIONES TÉCNICAS CRÍTICAS, SEGUROS Y CERTIFICACIONES</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 2 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'd1', label: 'Pólizas de seguro colectivas contra incendio y endosos bancarios.' },
                    { id: 'd2', label: 'Certificación de Sello Verde de gas SEC vigente.' },
                    { id: 'd3', label: 'Certificación vigente de ascensores inscrita en el MINVU (Ley 20.296).' },
                    { id: 'd4', label: 'Bitácoras y contratos de mantención de salas de bombas e impulsión.' },
                    { id: 'd5', label: 'Informe de mantención de grupo generador y transferencia automática.' },
                    { id: 'd6', label: 'Mantención de calderas, sistemas contra incendio y portones vehiculares.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <input
                          type="text"
                          placeholder="Observaciones técnicas o vigencia..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE E */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white p-3 font-black text-xs flex items-center justify-between">
                  <span>BLOQUE E: SISTEMAS, ACCESOS DIGITALES, CLAVES Y BIENES BAJO CUSTODIA</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 3 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'e1', label: 'Correo institucional del condominio y entrega de contraseñas.' },
                    { id: 'e2', label: 'Clave y acceso tributario al Servicio de Impuestos Internos (SII).' },
                    { id: 'e3', label: 'Clave y registro de usuarios en portal Dirección del Trabajo y Previred.' },
                    { id: 'e4', label: 'Credenciales de acceso a plataformas bancarias.' },
                    { id: 'e5', label: 'Claves maestras de control de acceso, software anterior y CCTV.' },
                    { id: 'e6', label: 'Entrega física de llaves maestras, tarjetas y controles de acceso.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 space-y-1">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <input
                          type="text"
                          placeholder="Observaciones de entrega..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3. ACTA DE NOMBRAMIENTO VS CONTRATO MARCO ==================== */}
        {activeSubTab === 'acta' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                  Instrumento Legal N° 3 • Formalización Jurídica
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Acta de Nombramiento Oficial vs. Contrato Marco Bilateral
                </h4>
                <p className="text-xs text-slate-500">
                  En Chile, la personería legal del administrador ante bancos y notarías se acredita principalmente mediante el <strong>Acta de Asamblea reducida a escritura pública</strong>. Adicionalmente, se provee el Contrato formal de 10 cláusulas para respaldo de la directiva.
                </p>
              </div>

              {/* TOGGLE ENTRE ACTA Y CONTRATO */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActaOrContract('acta')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    actaOrContract === 'acta' ? 'bg-[#0F3D2E] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cláusulas para Libro de Actas
                </button>
                <button
                  type="button"
                  onClick={() => setActaOrContract('contrato')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    actaOrContract === 'contrato' ? 'bg-[#0F3D2E] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contrato Marco Bilateral (2 Págs)
                </button>
              </div>
            </div>

            {actaOrContract === 'acta' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Texto Canónico listo para transcribir al Libro de Actas o sesión de Comité:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyClauses}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedClause ? '✓ ¡Copiado!' : 'Copiar Cláusulas del Acta'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
                  {assemblyClausesText}
                </pre>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Contrato Marco Bilateral Formal (10 Cláusulas • 2 Páginas)
                  </span>
                  <button
                    type="button"
                    onClick={handlePrintContract}
                    className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                    <span>Imprimir Contrato (2 Págs)</span>
                  </button>
                </div>

                {/* VISTA PREVIA DEL CONTRATO EN 2 PÁGINAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Página 1 */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-inner">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-black text-[#0F3D2E]">CONTRATO DE ADMINISTRACIÓN</span>
                      <span className="text-[10px] text-slate-400 font-mono">Página 1 de 2</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      En {city}, a {noticeDate}, entre la <strong>Comunidad {condo}</strong>, representada por su Presidente(a) don(ña) {committeePresident}, y <strong>ARANPRO GESTIÓN INTEGRAL</strong>, representada por don <strong>John Andrés Arancibia Maureira</strong>, Constructor Civil, RUT {adminRut}, se suscribe el presente contrato:
                    </p>
                    <div className="space-y-2 text-[10.5px] text-slate-700">
                      <p><strong>PRIMERO (OBJETO):</strong> Gestión integral directiva, operativa, técnica, contable y comunitaria bajo la Ley N° 21.442.</p>
                      <p><strong>SEGUNDO (ALCANCE OPERATIVO):</strong> 2 visitas técnicas semanales en terreno, atención de emergencias 24/7 y supervisión pericial de salas de bombas, tableros y cubiertas.</p>
                      <p><strong>TERCERO (SUITE DIGITAL):</strong> Habilitación 100% gratuita de plataforma Web y App Móvil ARANPRO con cartolas en tiempo real y libro de reclamos digital.</p>
                      <p><strong>CUARTO (HONORARIOS):</strong> Honorario profesional de {feeStr} mensuales contra factura exenta o boleta de honorarios pagadero dentro de los primeros 5 días hábiles.</p>
                      <p><strong>QUINTO (CUENTAS BANCARIAS):</strong> Fondos en cuenta corriente y fondo de reserva exclusivos a nombre del condominio.</p>
                    </div>
                  </div>

                  {/* Página 2 */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-inner">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-black text-[#0F3D2E]">CONTRATO DE ADMINISTRACIÓN</span>
                      <span className="text-[10px] text-slate-400 font-mono">Página 2 de 2</span>
                    </div>
                    <div className="space-y-2 text-[10.5px] text-slate-700">
                      <p><strong>SEXTO (COBRANZA Y APREMIOS):</strong> Cobranza judicial/extrajudicial y corte justificado de suministro eléctrico por 3 cuotas impagas (Art. 20 N° 9).</p>
                      <p><strong>SÉPTIMO (GESTIÓN LABORAL):</strong> Supervisión de conserjería, aseo y pago oportuno en Previred (Ley Bustos).</p>
                      <p><strong>OCTAVO (RENDICIÓN DE CUENTAS):</strong> Rendición documentada mensual a la directiva y anual en asamblea ordinaria.</p>
                      <p><strong>NOVENO (VIGENCIA):</strong> 1 año a contar de la asunción, renovable tácitamente (Art. 17 Ley 21.442).</p>
                      <p><strong>DÉCIMO (TÉRMINO ANTICIPADO):</strong> Preaviso formal por escrito de 30 días corridos.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="h-10 border-b border-slate-300" />
                        <p className="font-bold text-[10px] text-slate-800">{committeePresident}</p>
                        <p className="text-[9px] text-slate-500">Por la Comunidad</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-10 border-b border-slate-300" />
                        <p className="font-bold text-[10px] text-slate-800">{adminName}</p>
                        <p className="text-[9px] text-slate-500">Por ARANPRO (RNAC MINVU)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. GUÍAS LEGALES: ASAMBLEAS & QUÓRUMS ==================== */}
        {activeSubTab === 'guias' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                  Instrumento Legal N° 4 • Fichas de Asesoría al Comité
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Guías Legales: Asambleas vs. Comité & Cuadro Maestro de Quórums
                </h4>
                <p className="text-xs text-slate-500">
                  Cuadros comparativos oficiales estructurados según la Ley N° 21.442 y su Reglamento (DS N° 7 MINVU 2025). Entrega claridad jurídica inmediata a la directiva.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintLegalGuides}
                  className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Imprimir Guías Legales (2 Págs)</span>
                </button>
              </div>
            </div>

            {/* TABLAS RESUMEN EN PANTALLA */}
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <h5 className="font-black text-[#0F3D2E] uppercase text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Ficha 1: El Comité de Administración bajo el DS N° 7 MINVU (2025)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700">
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1">
                    <span className="font-bold text-emerald-900 block">Atribuciones Exclusivas del Comité:</span>
                    <p>• Dictar normas de convivencia y reglamentos internos.</p>
                    <p>• Nombrar y remover al Administrador si la asamblea le delegó la facultad.</p>
                    <p>• Autorizar convenios de pago a morosos (hasta 12 cuotas).</p>
                    <p>• Aprobar presupuestos ordinarios de mantención y aplicar multas.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-rose-100 space-y-1">
                    <span className="font-bold text-rose-900 block">Materias Prohibidas (Solo Asamblea):</span>
                    <p>• Modificar el Reglamento de Copropiedad.</p>
                    <p>• Gastos extraordinarios superiores a 6 cuotas de gastos comunes.</p>
                    <p>• Enajenar, gravar o arrendar bienes comunes.</p>
                    <p>• Reconstrucción o demolición del condominio.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h5 className="font-black text-slate-900 uppercase text-xs flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-[#0F3D2E]" />
                  Ficha 2: Cuadro de Quórums Oficiales (Art. 15 Ley 21.442)
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-[#0F3D2E] text-white">
                      <tr>
                        <th className="p-2 font-bold">Tipo de Asamblea</th>
                        <th className="p-2 font-bold">Materias Tratadas</th>
                        <th className="p-2 font-bold text-center">Quórum Sesionar</th>
                        <th className="p-2 font-bold text-center">Quórum Acordar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr>
                        <td className="p-2 font-bold text-[#0F3D2E]">ORDINARIA</td>
                        <td className="p-2">Cuentas, balances, designación o remoción de administrador y comité, plan de emergencia.</td>
                        <td className="p-2 text-center font-bold">Mínimo 33% derechos</td>
                        <td className="p-2 text-center font-bold text-emerald-800">Mayoría asistentes</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-blue-900">EXTRAORDINARIA MAYORÍA ABSOLUTA</td>
                        <td className="p-2">Modificación de reglamento, remoción de comité, gastos {'>'} 6 cuotas GGCC, uso de fondo de reserva.</td>
                        <td className="p-2 text-center font-bold">Mayoría absoluta derechos</td>
                        <td className="p-2 text-center font-bold text-blue-900">Mayoría absoluta totales</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-purple-900">EXTRAORDINARIA MAYORÍA REFORZADA</td>
                        <td className="p-2">Delegación de facultades al comité, enajenación bienes comunes, demolición, retribución comité.</td>
                        <td className="p-2 text-center font-bold">Al menos 66% derechos</td>
                        <td className="p-2 text-center font-bold text-purple-900">66% derechos totales</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACCIONES FINALES Y DESPACHO MULTICANAL DEL PASO 5 */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleShareWhatsApp(5)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Compartir Kit por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareEmail(5)}
              disabled={sendingEmailStep === 5}
              className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {sendingEmailStep === 5 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando por Correo...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Enviar Kit por Correo (PDF Adjunto)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleCopyStepMessage(5)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Texto</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpandedMsg(!expandedMsg)}
            className="text-[11px] font-bold text-[#0F3D2E] hover:underline flex items-center gap-1 cursor-pointer ml-auto"
          >
            {expandedMsg ? 'Ocultar Texto Propuesto' : 'Ver Texto Propuesto para el Comité'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMsg ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ACORDEÓN DE TEXTO DEL PASO 5 */}
        {expandedMsg && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide block">
              Mensaje Propuesto para Acompañar al Comité con el Kit de Asesoría Legal y Traspaso
            </span>
            <pre className="whitespace-pre-wrap font-sans text-slate-800 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
              {getStepMessages(5)?.whatsapp}
            </pre>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN OCULTA: CONTENEDORES CANÓNICOS IMPRIMIBLES (EXACTAMENTE CARTA CON .dossier-page) */}
      {/* ========================================================================= */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 select-none" aria-hidden="true">

        {/* ==================== 1. PRINTABLE CARTA DE NOTIFICACIÓN DE TÉRMINO (EXACTAMENTE 1 PÁGINA) ==================== */}
        <div id="printable-termination-notice" data-pdf-style={pdfStyle}>
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* Filete doble izquierdo Alternativa 4 */}
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>

            {/* Sello de agua central sutil */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              {/* Membrete Corporativo Maestro ARANPRO */}
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                <div className="flex items-center space-x-3">
                  <AranproLogo variant="principal" className="h-10 w-auto" />
                  <div className="space-y-0.5 border-l border-slate-300 pl-3">
                    <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                      {empresaForm.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS'}
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                      Asesoría Legal y Técnica al Comité • Ley N° 21.442 de Copropiedad Inmobiliaria
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {email} • {phone} • {city}, Chile
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#0F3D2E]">{condo}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{city}, {noticeDate}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-bold text-[#0F3D2E]">
                    NOTIFICACIÓN FORMAL
                  </div>
                </div>
              </div>

              {/* Protocolo de Notificación */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[10.5px]">
                <div>
                  <p><strong>A:</strong> {outgoingAdmin}</p>
                  <p><strong>Cargo:</strong> Administrador(a) Saliente</p>
                  <p><strong>Comunidad:</strong> {condo}</p>
                </div>
                <div>
                  <p><strong>DE:</strong> Comité de Administración {condo}</p>
                  <p><strong>Marco Legal:</strong> Ley N° 21.442 (Arts. 15, 17 y 20)</p>
                  <p><strong>Plazo Preaviso:</strong> 30 días corridos</p>
                </div>
              </div>

              <div className="text-[11px] font-bold text-[#0F3D2E] uppercase tracking-wide border-b border-emerald-200 pb-1">
                REF: NOTIFICACIÓN FORMAL DE TÉRMINO DE FUNCIONES Y PREAVISO LEGAL DE 30 DÍAS
              </div>

              {/* Cuerpo de la Carta */}
              <div className="space-y-2 text-[10.5px] leading-relaxed text-slate-800 text-justify">
                <p>Estimado(a) Administrador(a):</p>
                <p>
                  Por medio del presente instrumento, el <strong>Comité de Administración del Condominio {condo}</strong>, en representación de la comunidad y en ejercicio exclusivo de las facultades conferidas por el Artículo 15 letra c) y Artículo 17 de la <strong>Ley N° 21.442 sobre Copropiedad Inmobiliaria</strong> y el Reglamento de Copropiedad, cumple con notificarle formalmente la decisión de <strong>poner término a la prestación de sus servicios de administración</strong>.
                </p>
                <p>
                  Con el propósito de garantizar un proceso de transición ordenado y dar cumplimiento al plazo de preaviso legal, sus funciones se extenderán por <strong>30 días corridos</strong> a contar de la recepción del presente aviso, fijándose como su <strong>último día de funciones el {endDate}</strong>.
                </p>
                <p>
                  Durante este período, y en estricto cumplimiento del <strong>Artículo 20 de la Ley N° 21.442</strong>, se le exige preparar y hacer entrega material bajo acta de los siguientes 5 bloques indispensables:
                </p>

                <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200 space-y-1 text-[10px]">
                  <p><strong>1. Rendición de Cuentas:</strong> Balance final consolidado y conciliaciones bancarias al día hasta el {endDate}.</p>
                  <p><strong>2. Documentación Oficial:</strong> Libros de Actas foliados, registro de copropietarios, planos DOM y pólizas de seguro vigentes.</p>
                  <p><strong>3. Respaldo Laboral:</strong> Contratos, anexos de jornada y comprobantes Previred al día para resguardo de la Ley Bustos.</p>
                  <p><strong>4. Accesos y Claves:</strong> Claves de cuentas bancarias (reserva y ordinaria), clave del SII, portal Dirección del Trabajo y software.</p>
                  <p><strong>5. Custodia Material:</strong> Entrega física de llaves maestras, controles vehiculares/peatonales y rendición de caja chica.</p>
                </div>

                <p>
                  El Comité de Administración formalizará la recepción definitiva mediante el <strong>Acta de Traspaso</strong> el último día de su encargo. Agradecemos su gestión durante su período y confiamos en un cierre profesional y transparente.
                </p>
              </div>
            </div>

            {/* Bloque de Firmas Canónico */}
            <div className="pt-3 border-t border-slate-200 relative z-10">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div className="space-y-1">
                  <div className="h-10 border-b border-slate-400" />
                  <p className="font-bold text-[10.5px] text-slate-900 leading-tight">{committeePresident}</p>
                  <p className="text-[9.5px] text-[#0F3D2E] font-bold">Presidente(a) del Comité de Administración</p>
                  <p className="text-[9px] text-slate-500 font-mono">En representación de la Comunidad {condo}</p>
                </div>
                <div className="space-y-1 text-left">
                  <div className="h-10 border-b border-slate-400" />
                  <p className="font-bold text-[10px] text-slate-900 leading-tight">Recibí Conforme (Administrador Saliente)</p>
                  <p className="text-[9px] text-slate-600 font-mono">Nombre: ____________________________________</p>
                  <p className="text-[9px] text-slate-600 font-mono">RUT: ________________ Fecha: ___/___/2026</p>
                </div>
              </div>

              {/* Pie de Página Canónico */}
              <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                <div>ARANPRO Gestión Integral • {website}</div>
                <div className="font-bold text-[#0F3D2E]">Carta de Preaviso y Notificación al Saliente • Ley N° 21.442 (Pág. 1 de 1)</div>
                <div>{city}, Chile</div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 2. PRINTABLE CHECKLIST DE TRASPASO (EXACTAMENTE 3 PÁGINAS) ==================== */}
        <div id="printable-transition-checklist" data-pdf-style={pdfStyle}>
          {/* PÁGINA 1 DE 3 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                <div className="flex items-center space-x-3">
                  <AranproLogo variant="principal" className="h-10 w-auto" />
                  <div className="space-y-0.5 border-l border-slate-300 pl-3">
                    <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                      ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                      Protocolo Oficial de Auditoría y Traspaso de Administración • Ley N° 21.442
                    </p>
                    <p className="text-[9px] text-slate-500">{email} • {phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#0F3D2E]">{condo}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{city}, {noticeDate}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-bold text-[#0F3D2E]">
                    PÁGINA 1 DE 3
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  SOLICITUD SIMPLE DE ANTECEDENTES & CHECKLIST DE TRASPASO
                </h4>
                <p className="text-[10px] text-slate-500">
                  Pauta oficial de entrega para resguardar la continuidad administrativa y financiera de la comunidad. La recepción física no constituye aprobación de balances pendientes.
                </p>
              </div>

              {/* BLOQUE A */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-[10.5px] flex justify-between">
                  <span>A. GOBIERNO, LEGALIDAD Y DOCUMENTACIÓN INSTITUCIONAL</span>
                  <span className="text-[9px] text-[#D4B895]">Entrega / Recepción</span>
                </div>
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-1.5 w-8 text-center">OK</th>
                      <th className="p-1.5">Antecedente / Documento Requerido</th>
                      <th className="p-1.5 w-44">Observaciones / Estado Físico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Reglamento de Copropiedad vigente y modificaciones inscritas en el CBR.</td><td className="p-1.5 text-slate-500">{checklistNotes['a1'] || 'Copia protocolizada en archivo'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Libro de Actas oficial foliado con sesiones de Asamblea y Comité.</td><td className="p-1.5 text-slate-500">{checklistNotes['a2'] || 'Libro físico foliado'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Registro actualizado de copropietarios, arrendatarios y prorrateos.</td><td className="p-1.5 text-slate-500">{checklistNotes['a3'] || 'Base digital + padrón'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Plan de Emergencia y Evacuación formalizado (Art. 40 Ley 21.442).</td><td className="p-1.5 text-slate-500">{checklistNotes['a4'] || 'Aprobado Bomberos/Carabineros'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Planos de arquitectura, instalaciones y carpeta municipal DOM.</td><td className="p-1.5 text-slate-500">{checklistNotes['a5'] || 'Planos sanitarios y eléctricos'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Títulos de dominio y contratos de arriendo de bienes comunes.</td><td className="p-1.5 text-slate-500">{checklistNotes['a6'] || 'Carátulas contractuales'}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* BLOQUE B */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-[10.5px] flex justify-between">
                  <span>B. INFORMACIÓN FINANCIERA, BANCARIA Y COBRANZA (CARGA EN SOFTWARE)</span>
                  <span className="text-[9px] text-[#D4B895]">Cuentas y Balances</span>
                </div>
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-1.5 w-8 text-center">OK</th>
                      <th className="p-1.5">Antecedente / Documento Requerido</th>
                      <th className="p-1.5 w-44">Observaciones / Estado Físico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Cartolas bancarias y conciliaciones actualizadas al último día de funciones.</td><td className="p-1.5 text-slate-500">{checklistNotes['b1'] || 'Banco Estado / Cuentas vigentes'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Última rendición documentada (facturas, boletas y respaldos de egresos).</td><td className="p-1.5 text-slate-500">{checklistNotes['b2'] || 'Comprobantes timbrados'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Estado de fondos del condominio y cuenta exclusiva Fondo Común de Reserva.</td><td className="p-1.5 text-slate-500">{checklistNotes['b3'] || 'Saldo disponible verificado'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Informe de morosidad consolidado por unidad y convenios de pago vigentes.</td><td className="p-1.5 text-slate-500">{checklistNotes['b4'] || 'Planilla saldo mora histórica'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Nómina de cuentas y obligaciones pendientes de pago a proveedores.</td><td className="p-1.5 text-slate-500">{checklistNotes['b5'] || 'Facturas pendientes por vencer'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Copia digital de colillas de cobro y gastos comunes últimos 12 meses.</td><td className="p-1.5 text-slate-500">{checklistNotes['b6'] || 'Histórico mensual'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Rendición y entrega de saldo en efectivo de Caja Chica de conserjería.</td><td className="p-1.5 text-slate-500">{checklistNotes['b7'] || 'Arqueo físico conforme'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Checklist de Solicitud de Antecedentes • {condo} (Pág. 1 de 3)</div>
              <div>{city}, Chile</div>
            </div>
          </div>

          {/* PÁGINA 2 DE 3 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-2 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                <div className="flex items-center space-x-3">
                  <AranproLogo variant="principal" className="h-10 w-auto" />
                  <div className="space-y-0.5 border-l border-slate-300 pl-3">
                    <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                      ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                      Protocolo Oficial de Auditoría y Traspaso de Administración • Ley N° 21.442
                    </p>
                    <p className="text-[9px] text-slate-500">{email} • {phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#0F3D2E]">{condo}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{city}, {noticeDate}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-bold text-[#0F3D2E]">
                    PÁGINA 2 DE 3
                  </div>
                </div>
              </div>

              {/* BLOQUE C */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-[10.5px] flex justify-between">
                  <span>C. RECURSOS HUMANOS, GESTIÓN LABORAL Y PREVISIONAL</span>
                  <span className="text-[9px] text-[#D4B895]">Personal del Condominio</span>
                </div>
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-1.5 w-8 text-center">OK</th>
                      <th className="p-1.5">Antecedente / Documento Requerido</th>
                      <th className="p-1.5 w-44">Observaciones / Estado Físico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Contratos de trabajo y anexos vigentes actualizados a jornada 40 horas.</td><td className="p-1.5 text-slate-500">{checklistNotes['c1'] || 'Dotación de conserjería y aseo'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Comprobantes de pago de cotizaciones previsionales (Previred al día).</td><td className="p-1.5 text-slate-500">{checklistNotes['c2'] || 'Al día para evitar Ley Bustos'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Últimas 3 liquidaciones de sueldo firmadas por cada trabajador.</td><td className="p-1.5 text-slate-500">{checklistNotes['c3'] || 'Conforme registro de firmas'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Certificado de antecedentes laborales y previsionales F30 / F30-1 DT.</td><td className="p-1.5 text-slate-500">{checklistNotes['c4'] || 'Sin multas laborales activas'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Credenciales vigentes OS-10 de Carabineros de conserjes y guardias.</td><td className="p-1.5 text-slate-500">{checklistNotes['c5'] || 'Certificación vigente'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Finiquitos ratificados de extrabajadores y juicios laborales pendientes.</td><td className="p-1.5 text-slate-500">{checklistNotes['c6'] || 'Archivo de finiquitos notariados'}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* BLOQUE D */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-[10.5px] flex justify-between">
                  <span>D. MANTENCIONES TÉCNICAS CRÍTICAS, SEGUROS Y CERTIFICACIONES</span>
                  <span className="text-[9px] text-[#D4B895]">Seguridad e Instalaciones</span>
                </div>
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-1.5 w-8 text-center">OK</th>
                      <th className="p-1.5">Antecedente / Documento Requerido</th>
                      <th className="p-1.5 w-44">Observaciones / Estado Físico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Pólizas de seguro colectivas contra incendio de espacios comunes y endosos.</td><td className="p-1.5 text-slate-500">{checklistNotes['d1'] || 'Póliza vigente con banco'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Certificado de Sello Verde de instalaciones de gas SEC vigente.</td><td className="p-1.5 text-slate-500">{checklistNotes['d2'] || 'Sello verde vigente'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Certificación de ascensores inscrita en el registro MINVU (Ley 20.296).</td><td className="p-1.5 text-slate-500">{checklistNotes['d3'] || 'Sello y bitácora técnica'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Bitácoras y contratos de mantención de salas de bombas e impulsión.</td><td className="p-1.5 text-slate-500">{checklistNotes['d4'] || 'Visitas preventivas mensuales'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Informe de mantención y carga de grupo electrógeno de emergencia.</td><td className="p-1.5 text-slate-500">{checklistNotes['d5'] || 'Pruebas de transferencia al día'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Mantenimiento de calderas, sistemas de incendio y portones vehiculares.</td><td className="p-1.5 text-slate-500">{checklistNotes['d6'] || 'Equipos operativos'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Checklist de Solicitud de Antecedentes • {condo} (Pág. 2 de 3)</div>
              <div>{city}, Chile</div>
            </div>
          </div>

          {/* PÁGINA 3 DE 3 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-3 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                <div className="flex items-center space-x-3">
                  <AranproLogo variant="principal" className="h-10 w-auto" />
                  <div className="space-y-0.5 border-l border-slate-300 pl-3">
                    <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                      ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                      Protocolo Oficial de Auditoría y Traspaso de Administración • Ley N° 21.442
                    </p>
                    <p className="text-[9px] text-slate-500">{email} • {phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#0F3D2E]">{condo}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{city}, {noticeDate}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-bold text-[#0F3D2E]">
                    PÁGINA 3 DE 3
                  </div>
                </div>
              </div>

              {/* BLOQUE E */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-[10.5px] flex justify-between">
                  <span>E. SISTEMAS, ACCESOS DIGITALES, CLAVES Y BIENES BAJO CUSTODIA</span>
                  <span className="text-[9px] text-[#D4B895]">Accesos y Fondos</span>
                </div>
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-1.5 w-8 text-center">OK</th>
                      <th className="p-1.5">Antecedente / Documento Requerido</th>
                      <th className="p-1.5 w-44">Observaciones / Estado Físico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Correo institucional del condominio y entrega de contraseñas de acceso.</td><td className="p-1.5 text-slate-500">{checklistNotes['e1'] || 'Credenciales transferidas'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Clave y acceso tributario al portal del Servicio de Impuestos Internos (SII).</td><td className="p-1.5 text-slate-500">{checklistNotes['e2'] || 'RUT comunidad operativo'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Clave y usuario administrador en Dirección del Trabajo (DT) y Previred.</td><td className="p-1.5 text-slate-500">{checklistNotes['e3'] || 'Acceso representante legal'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Credenciales bancarias (Banca en Línea) y cambio de apoderados.</td><td className="p-1.5 text-slate-500">{checklistNotes['e4'] || 'Cuentas corrientes verificadas'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Claves maestras de control de acceso, software anterior y sistema CCTV.</td><td className="p-1.5 text-slate-500">{checklistNotes['e5'] || 'DVR/NVR cámaras entregado'}</td></tr>
                    <tr><td className="p-1.5 text-center font-bold text-emerald-800">☑</td><td className="p-1.5 font-semibold">Entrega física de llaves maestras, tarjetas y controles vehiculares.</td><td className="p-1.5 text-slate-500">{checklistNotes['e6'] || 'Manojo de llaves rotulado'}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* CUADRO DE REGULARIZACIÓN Y OBSERVACIONES */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 space-y-1 text-[10px]">
                <span className="font-bold text-[#0F3D2E] block uppercase tracking-wide">
                  Acuerdos y Plazos de Regularización (Art. 20 Ley N° 21.442):
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Los antecedentes que figuren con observaciones o pendientes en este acto deberán ser subsanados por el Administrador Saliente dentro del plazo legal máximo de 10 días hábiles. La firma del presente checklist acredita la entrega y recepción física de la información, reservándose el Comité y la Administración Entrante el derecho a auditar la veracidad contable de los saldos bancarios y tributarios.
                </p>
              </div>
            </div>

            {/* TALÓN DE FIRMAS TRIPARTITO CANÓNICO */}
            <div className="pt-3 border-t border-slate-200 relative z-10">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <div className="h-10 border-b border-slate-400" />
                  <p className="font-bold text-[10px] text-slate-900 leading-tight">{outgoingAdmin}</p>
                  <p className="text-[9px] text-slate-600 font-semibold">Administrador(a) Saliente</p>
                  <p className="text-[8.5px] text-slate-400 font-mono">Entrega Conforme</p>
                </div>

                <div className="space-y-1">
                  <div className="h-10 border-b border-slate-400" />
                  <p className="font-bold text-[10px] text-slate-900 leading-tight">{committeePresident}</p>
                  <p className="text-[9px] text-[#0F3D2E] font-bold">Comité de Administración</p>
                  <p className="text-[8.5px] text-slate-400 font-mono">Revisa y Recibe</p>
                </div>

                <div className="space-y-1">
                  <div className="h-10 flex items-end justify-center pb-0.5 overflow-visible">
                    {effectiveSignature ? (
                      <img
                        src={effectiveSignature}
                        alt="Firma Administrador"
                        className="h-9 max-h-10 w-auto max-w-[140px] object-contain mx-auto"
                        style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                      />
                    ) : (
                      <div className="border-b border-slate-400 w-full h-8" />
                    )}
                  </div>
                  <div className="border-t border-[#0F3D2E] pt-0.5">
                    <p className="font-black text-[10px] text-slate-900 leading-tight">{adminName}</p>
                    <p className="text-[8.5px] text-[#0F3D2E] font-bold">Constructor Civil • RNAC MINVU</p>
                    <p className="text-[8px] text-slate-500 font-mono">Administración Entrante ARANPRO</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                <div>ARANPRO Gestión Integral • {website}</div>
                <div className="font-bold text-[#0F3D2E]">Checklist de Solicitud de Antecedentes • {condo} (Pág. 3 de 3)</div>
                <div>{city}, Chile</div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 3. PRINTABLE CONTRATO MARCO (EXACTAMENTE 2 PÁGINAS) ==================== */}
        <div id="printable-management-contract" data-pdf-style={pdfStyle}>
          {/* PÁGINA 1 DE 2 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                <div className="flex items-center space-x-3">
                  <AranproLogo variant="principal" className="h-10 w-auto" />
                  <div className="space-y-0.5 border-l border-slate-300 pl-3">
                    <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                      ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                      Contrato de Prestación de Servicios de Administración • Ley N° 21.442
                    </p>
                    <p className="text-[9px] text-slate-500">{email} • {phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#0F3D2E]">{condo}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{city}, {noticeDate}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-bold text-[#0F3D2E]">
                    PÁGINA 1 DE 2
                  </div>
                </div>
              </div>

              <div className="text-center space-y-0.5 border-b border-emerald-200 pb-2">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES DE ADMINISTRACIÓN
                </h4>
                <p className="text-[10px] text-slate-500 font-mono uppercase">
                  Condominio {condo} • {city}, Región de Coquimbo
                </p>
              </div>

              <div className="space-y-2.5 text-[10.5px] leading-relaxed text-slate-800 text-justify">
                <p>
                  En <strong>{city}</strong>, a <strong>{noticeDate}</strong>, entre la <strong>Comunidad del Condominio {condo}</strong>, debidamente representada por su Comité de Administración en la persona de su Presidente(a) don(ña) <strong>{committeePresident}</strong>, en adelante "La Comunidad"; y por la otra parte, <strong>ARANPRO GESTIÓN INTEGRAL</strong>, representada por don <strong>John Andrés Arancibia Maureira</strong>, Constructor Civil, cédula de identidad N° {adminRut}, con inscripción vigente a título oneroso en el Registro Nacional de Administradores de Condominios (RNAC) dependiente del Ministerio de Vivienda y Urbanismo (MINVU), en adelante "El Administrador", se suscribe el presente contrato de prestación de servicios profesionales:
                </p>

                <p>
                  <strong>PRIMERO (OBJETO Y MARCO LEGAL):</strong> La Comunidad encomienda a El Administrador la gestión integral, financiera, técnica, legal y comunitaria del condominio {condo}, en estricta sujeción a las disposiciones de la Ley N° 21.442, su Reglamento (DS N° 7 MINVU 2025) y el Reglamento de Copropiedad del condominio.
                </p>

                <p>
                  <strong>SEGUNDO (ALCANCE OPERATIVO Y PRESENCIA EN TERRENO):</strong> El Administrador mantendrá presencia técnica en terreno con una periodicidad regular de {proposalConfig.visitFrequency || '2 visitas técnicas presenciales por semana'} más atención de contingencias operativas 24/7, realizando inspecciones periciales periódicas a las salas de bombas, tableros eléctricos, ascensores, cubiertas y áreas comunes, fiscalizando el cumplimiento de los contratos de mantención vigentes.
                </p>

                <p>
                  <strong>TERCERO (SUITE DIGITAL Y TRANSPARENCIA CONTABLE):</strong> El Administrador implementará sin costo de licencias ni cargos mensuales para la comunidad la plataforma Web y App Móvil ARANPRO, garantizando a los copropietarios y directiva acceso en tiempo real a cartolas bancarias conciliadas, facturas auditadas con respaldo digital y el Libro Oficial de Reclamos foliado (Art. 20 Ley 21.442).
                </p>

                <p>
                  <strong>CUARTO (HONORARIOS PROFESIONALES):</strong> La Comunidad pagará a El Administrador por sus servicios profesionales la suma mensual de <strong>{feeStr}</strong> ({proposalConfig.taxModality || 'Factura Exenta / Boleta de Honorarios Profesional'}), pagadero dentro de los primeros 5 días hábiles del mes calendario vencido.
                </p>

                <p>
                  <strong>QUINTO (CUENTAS BANCARIAS EXCLUSIVAS):</strong> Todos los recursos del condominio se manejarán única y exclusivamente en cuentas corrientes bancarias y de ahorro abiertas a nombre exclusivo de la Comunidad (cuenta ordinaria de gastos comunes y cuenta exclusiva del Fondo Común de Reserva), prohibiéndose taxativamente el uso de cuentas personales.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Contrato de Servicios de Administración • {condo} (Pág. 1 de 2)</div>
              <div>{city}, Chile</div>
            </div>
          </div>

          {/* PÁGINA 2 DE 2 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-2 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                <div className="flex items-center space-x-3">
                  <AranproLogo variant="principal" className="h-10 w-auto" />
                  <div className="space-y-0.5 border-l border-slate-300 pl-3">
                    <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                      ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                      Contrato de Prestación de Servicios de Administración • Ley N° 21.442
                    </p>
                    <p className="text-[9px] text-slate-500">{email} • {phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#0F3D2E]">{condo}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{city}, {noticeDate}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-bold text-[#0F3D2E]">
                    PÁGINA 2 DE 2
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-[10.5px] leading-relaxed text-slate-800 text-justify">
                <p>
                  <strong>SEXTO (FACULTADES DE COBRANZA Y MEDIDAS DE APREMIANTE):</strong> Se confiere a El Administrador la facultad expresa de liquidar y cobrar judicial y extrajudicialmente los gastos comunes ordinarios y extraordinarios, aplicar los recargos e intereses moratorios previstos en la ley, y proceder a la suspensión justificada del servicio eléctrico u otros suministros a las unidades morosas que adeuden tres o más cuotas conforme al Artículo 20 N° 9 de la Ley N° 21.442.
                </p>

                <p>
                  <strong>SÉPTIMO (GESTIÓN LABORAL Y PREVISIONAL):</strong> El Administrador supervisará al personal de conserjería y aseo, velando por el cumplimiento de los contratos, registros de asistencia y el pago oportuno de las cotizaciones de seguridad social en Previred, garantizando la total indemnidad laboral del Comité de Administración respecto a la Ley Bustos.
                </p>

                <p>
                  <strong>OCTAVO (RENDICIÓN DE CUENTAS):</strong> El Administrador presentará rendiciones de cuentas documentadas mensuales al Comité de Administración y una cuenta general documentada anual ante la Asamblea Ordinaria de Copropietarios.
                </p>

                <p>
                  <strong>NOVENO (VIGENCIA Y RENOVACIÓN):</strong> El presente contrato tendrá una vigencia legal de un año a contar de la asunción formal de funciones, renovable tácita y sucesivamente según lo preceptuado en el Artículo 17 de la Ley N° 21.442, salvo acuerdo en contrario de la Asamblea o Comité.
                </p>

                <p>
                  <strong>DÉCIMO (TÉRMINO ANTICIPADO):</strong> Cualquiera de las partes podrá poner término anticipado al presente contrato dando aviso formal por escrito a la otra con a lo menos 30 días de anticipación, procediendo El Administrador a la entrega de la rendición final de cuentas, conciliaciones bancarias y traspaso de claves en los términos del Artículo 20.
                </p>

                <p>
                  <strong>PERSONERÍA Y EJEMPLARES:</strong> La personería de don(ña) {committeePresident} consta en el Libro de Actas del condominio. La personería de don John Andrés Arancibia Maureira consta en la constitución de ARANPRO Gestión Integral. El presente contrato se firma en 2 ejemplares de idéntico tenor y fecha, quedando uno en poder de cada parte.
                </p>
              </div>
            </div>

            {/* BLOQUE DE FIRMAS CANÓNICO CON FIRMA Y SELLO */}
            <div className="pt-3 border-t border-slate-200 relative z-10">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div className="space-y-1">
                  <div className="h-14 border-b border-slate-400" />
                  <p className="font-bold text-[11px] text-slate-900 leading-tight">{committeePresident}</p>
                  <p className="text-[9.5px] text-[#0F3D2E] font-bold">Presidente(a) del Comité de Administración</p>
                  <p className="text-[9px] text-slate-500 font-mono">Por la Comunidad {condo}</p>
                </div>

                <div className="space-y-1">
                  <div className="h-14 flex items-end justify-center pb-0.5 overflow-visible">
                    {effectiveSignature ? (
                      <img
                        src={effectiveSignature}
                        alt="Firma Administrador"
                        className="h-12 max-h-14 w-auto max-w-[200px] object-contain mx-auto"
                        style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                      />
                    ) : (
                      <div className="border-b border-slate-400 w-full h-10" />
                    )}
                  </div>
                  <div className="border-t border-[#0F3D2E] pt-0.5">
                    <p className="font-black text-[11px] text-slate-900 leading-tight">{adminName}</p>
                    <p className="text-[9.5px] text-[#0F3D2E] font-bold">Constructor Civil • Administrador RNAC MINVU</p>
                    <p className="text-[9px] text-slate-600 font-mono">RUT: {adminRut} • Representante Legal ARANPRO</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                <div>ARANPRO Gestión Integral • {website}</div>
                <div className="font-bold text-[#0F3D2E]">Contrato de Servicios de Administración • {condo} (Pág. 2 de 2)</div>
                <div>{city}, Chile</div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 4. PRINTABLE GUÍAS LEGALES (EXACTAMENTE 2 PÁGINAS) ==================== */}
        <div id="printable-legal-advisory-sheet" data-pdf-style={pdfStyle}>
          {/* PÁGINA 1 DE 2: EL COMITÉ DE ADMINISTRACIÓN (DS N° 7 MINVU) */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                <div className="flex items-center space-x-3">
                  <AranproLogo variant="principal" className="h-10 w-auto" />
                  <div className="space-y-0.5 border-l border-slate-300 pl-3">
                    <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                      ARANPRO • ASESORÍA LEGAL PARA COMITÉS DE ADMINISTRACIÓN
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                      Guía N° 1: Atribuciones, Responsabilidades y Límites Normativos • DS N° 7 MINVU
                    </p>
                    <p className="text-[9px] text-slate-500">{email} • {phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#0F3D2E]">{condo}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{city}, {noticeDate}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-bold text-[#0F3D2E]">
                    FICHA GUÍA 1 DE 2
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  EL COMITÉ DE ADMINISTRACIÓN BAJO LA LEY N° 21.442 Y EL DECRETO SUPREMO N° 7
                </h4>
                <p className="text-[10px] text-slate-500">
                  Criterios jurisprudenciales y prácticos para el ejercicio legítimo del cargo directivo en copropiedad inmobiliaria.
                </p>
              </div>

              {/* SECCIÓN 1: COMPOSICIÓN Y MANDATO */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-[10px]">
                <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold flex justify-between">
                  <span>1. ESTRUCTURA, REQUISITOS Y DURACIÓN DEL MANDATO</span>
                  <span className="text-[9px] text-[#D4B895]">Art. 17 Ley 21.442</span>
                </div>
                <div className="p-3 bg-slate-50 space-y-1.5 text-slate-700">
                  <p>• <strong>Quiénes pueden ser miembros:</strong> Copropietarios al día en gastos comunes, sus cónyuges, convivientes civiles o mandatarios designados por poder notarial.</p>
                  <p>• <strong>Duración del mandato:</strong> Máximo 3 años en funciones, con posibilidad expresa de reelección indefinida por acuerdo de asamblea.</p>
                  <p>• <strong>Composición colegiada:</strong> Debe integrarse por un número impar (mínimo 3 miembros) y elegir entre ellos a un Presidente y cargos de apoyo.</p>
                </div>
              </div>

              {/* SECCIÓN 2: ATRIBUCIONES EXCLUSIVAS DEL COMITÉ */}
              <div className="border border-emerald-300 rounded-xl overflow-hidden text-[10px]">
                <div className="bg-emerald-800 text-white px-3 py-1.5 font-bold flex justify-between">
                  <span>2. FACULTADES Y OBLIGACIONES EXCLUSIVAS DEL COMITÉ</span>
                  <span className="text-[9px] text-emerald-200">Ámbito de Decisión Directa</span>
                </div>
                <div className="p-3 bg-white space-y-1.5 text-slate-700">
                  <p>• <strong>Reglamentación Interna:</strong> Dictar normas de convivencia, horarios de uso de quinchos, piscinas y áreas comunes.</p>
                  <p>• <strong>Designación / Remoción del Administrador:</strong> Nombrar, fijar honorarios o cesar al administrador si la asamblea le delegó la facultad.</p>
                  <p>• <strong>Convenios de Pago:</strong> Celebrar acuerdos de reprogramación de deudas por gastos comunes de hasta 12 cuotas con unidades morosas.</p>
                  <p>• <strong>Aplicación de Multas:</strong> Cursar infracciones económicas expresamente contempladas en el Reglamento de Copropiedad previa notificación.</p>
                  <p>• <strong>Uso de Cuentas:</strong> Autorizar giros mancomunados de la cuenta ordinaria y cautelar el Fondo Común de Reserva.</p>
                </div>
              </div>

              {/* SECCIÓN 3: MATERIAS PROHIBIDAS AL COMITÉ (RESERVADAS A LA ASAMBLEA) */}
              <div className="border border-rose-300 rounded-xl overflow-hidden text-[10px]">
                <div className="bg-rose-900 text-white px-3 py-1.5 font-bold flex justify-between">
                  <span>3. MATERIAS PROHIBIDAS AL COMITÉ (RESERVADAS EXCLUSIVAMENTE A LA ASAMBLEA)</span>
                  <span className="text-[9px] text-rose-200">Nulidad Legal Absoluta si las acuerda el Comité</span>
                </div>
                <div className="p-3 bg-white space-y-1.5 text-slate-700">
                  <p>• <strong>Modificación del Reglamento de Copropiedad:</strong> Requiere Asamblea Extraordinaria de Mayoría Absoluta.</p>
                  <p>• <strong>Gastos Extraordinarios Mayores:</strong> Inversiones que superen el equivalente a 6 cuotas de gastos comunes ordinarios.</p>
                  <p>• <strong>Enajenación de Bienes Comunes:</strong> Venta, gravamen, hipoteca o arrendamiento de bienes del condominio.</p>
                  <p>• <strong>Demolición o Reconstrucción:</strong> Modificaciones estructurales sustantivas de las edificaciones comunitarias.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Guía de Asesoría Legal al Comité • {condo} (Pág. 1 de 2)</div>
              <div>{city}, Chile</div>
            </div>
          </div>

          {/* PÁGINA 2 DE 2: CUADRO DE MATERIAS Y QUÓRUMS (ART. 15 LEY 21.442) */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-2 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[360px] h-[360px] object-contain" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                <div className="flex items-center space-x-3">
                  <AranproLogo variant="principal" className="h-10 w-auto" />
                  <div className="space-y-0.5 border-l border-slate-300 pl-3">
                    <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                      ARANPRO • ASESORÍA LEGAL PARA COMITÉS DE ADMINISTRACIÓN
                    </div>
                    <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                      Guía N° 2: Cuadro Maestro de Quórums y Materias de Asambleas • Artículo 15 Ley 21.442
                    </p>
                    <p className="text-[9px] text-slate-500">{email} • {phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black text-[#0F3D2E]">{condo}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{city}, {noticeDate}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8.5px] font-bold text-[#0F3D2E]">
                    FICHA GUÍA 2 DE 2
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  CUADRO OFICIAL DE MATERIAS Y QUÓRUMS DE ASAMBLEAS (ART. 15 LEY N° 21.442)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Tabla de constitución y acuerdos vinculantes para validar legalmente las asambleas y votaciones remotas ante Notario Público y Conservador.
                </p>
              </div>

              {/* TABLA MAESTRA COMPLETA DE QUÓRUMS */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-[10px]">
                <table className="w-full text-left">
                  <thead className="bg-[#0F3D2E] text-white">
                    <tr>
                      <th className="p-2 font-bold w-36">Tipo de Asamblea</th>
                      <th className="p-2 font-bold">Materias que Pueden Tratarse</th>
                      <th className="p-2 font-bold text-center w-28">Quórum Sesionar</th>
                      <th className="p-2 font-bold text-center w-28">Quórum Acordar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-2.5 font-bold text-[#0F3D2E] bg-emerald-50/40">
                        ORDINARIA<br/>
                        <span className="text-[8.5px] font-normal text-slate-500">Al menos 1 vez al año</span>
                      </td>
                      <td className="p-2.5 text-slate-700">
                        Rendición de cuentas documentada y balances; designación o remoción del Comité; <strong>designación o remoción del Administrador</strong>; presupuestos anuales; actualizaciones del plan de emergencia; asuntos de interés común.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50">
                        Mínimo 33% derechos
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-800 bg-emerald-50/60">
                        Mayoría absoluta asistentes
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-blue-900 bg-blue-50/40">
                        EXTRAORDINARIA MAYORÍA ABSOLUTA
                      </td>
                      <td className="p-2.5 text-slate-700">
                        Modificación del Reglamento de Copropiedad; remoción parcial o total del Comité; gastos extraordinarios que excedan 6 cuotas de GGCC ordinarios; uso del Fondo Común de Reserva; reconstrucción parcial.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50">
                        Mayoría absoluta derechos
                      </td>
                      <td className="p-2.5 text-center font-bold text-blue-900 bg-blue-50/60">
                        Mayoría absoluta derechos totales
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-purple-900 bg-purple-50/40">
                        EXTRAORDINARIA MAYORÍA REFORZADA
                      </td>
                      <td className="p-2.5 text-slate-700">
                        Delegación de facultades al Comité de Administración; enajenación, gravamen o arrendamiento de bienes comunes; demolición; retribución económica a miembros del comité; seguros que alteren riesgos.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50">
                        Al menos 66% derechos
                      </td>
                      <td className="p-2.5 text-center font-bold text-purple-900 bg-purple-50/60">
                        66% derechos totales
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-amber-900 bg-amber-50/40">
                        CONSULTA POR ESCRITO<br/>
                        <span className="text-[8.5px] font-normal text-slate-500">Votación Digital</span>
                      </td>
                      <td className="p-2.5 text-slate-700" colSpan="3">
                        Procedimiento formal contemplado en el <strong>Artículo 15 Inciso Final</strong>. Permite someter a votación escrita o mediante la plataforma digital ARANPRO las materias de asamblea ordinaria o extraordinaria, evitando suspensiones por falta de asistencia física y acelerando la toma de acuerdos.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* VISADO PERICIAL ARANPRO */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 flex items-center justify-between text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-bold text-[#0F3D2E] block uppercase">Visado Pericial y Legal ARANPRO:</span>
                  <p className="text-slate-600">
                    Documento de referencia jurídica elaborado conforme a la Ley N° 21.442 y su Reglamento (DS N° 7 MINVU 2025).
                  </p>
                </div>
                <div className="shrink-0 text-right font-mono text-[9px] text-slate-500 pl-4 border-l border-slate-200">
                  <p className="font-bold text-slate-800">{adminName}</p>
                  <p className="text-[#0F3D2E]">Constructor Civil • RNAC MINVU</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Cuadro Maestro de Quórums y Asambleas • {condo} (Pág. 2 de 2)</div>
              <div>{city}, Chile</div>
            </div>
          </div>
        </div>

        {/* ==================== 5. PRINTABLE FULL TRANSITION PACKAGE (PAQUETE COMPLETO COMPILADO) ==================== */}
        <div id="printable-transition-package" data-pdf-style={pdfStyle} className="space-y-6">
          {/* Portada Oficial del Kit */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-8 pl-12 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]" aria-hidden="true">
              <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" className="w-[450px] h-[450px] object-contain" />
            </div>

            <div className="space-y-6 relative z-10 my-auto text-center">
              <div className="flex justify-center mb-4">
                <AranproLogo variant="principal" className="h-16 w-auto" />
              </div>

              <div className="inline-block px-4 py-1 rounded-full bg-[#0F3D2E] text-[#D4B895] text-xs font-black tracking-widest uppercase shadow-sm">
                ARANPRO GESTIÓN INTEGRAL • ASESORÍA LEGAL AL COMITÉ
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                  Kit Oficial de Transición, Notificación y Traspaso de Condominios
                </h2>
                <p className="text-sm font-bold text-[#0F3D2E]">
                  Condominio {condo} • {city}, Chile
                </p>
                <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed pt-2">
                  Compendio legal, técnico y operativo elaborado bajo los preceptos de la <strong>Ley N° 21.442 sobre Copropiedad Inmobiliaria</strong> y su Reglamento (DS N° 7 MINVU 2025). Diseñado para acompañar a la directiva en la toma de control administrativa y financiera.
                </p>
              </div>

              {/* Índice Oficial del Paquete */}
              <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <span className="font-black text-[#0F3D2E] text-[11px] uppercase tracking-wider block border-b border-slate-200 pb-1">
                  Contenido Oficial del Kit:
                </span>
                <p className="text-slate-700"><strong>Doc 1:</strong> Carta Formal de Término y Preaviso de 30 Días al Saliente.</p>
                <p className="text-slate-700"><strong>Doc 2:</strong> Pauta & Checklist de Recepción Contable y Técnica (3 Páginas).</p>
                <p className="text-slate-700"><strong>Doc 3:</strong> Contrato Marco Bilateral de Administración (10 Cláusulas).</p>
                <p className="text-slate-700"><strong>Doc 4:</strong> Ficha Guía: El Comité de Administración bajo el DS N° 7 MINVU.</p>
                <p className="text-slate-700"><strong>Doc 5:</strong> Cuadro Maestro de Quórums y Materias de Asambleas (Art. 15).</p>
              </div>

              <div className="pt-4 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[11px] font-black text-slate-900">{adminName}</p>
                  <p className="text-[9.5px] text-[#0F3D2E] font-bold">Constructor Civil • Administrador RNAC MINVU</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Portada Oficial del Kit de Traspaso • Ley N° 21.442</div>
              <div>{city}, Chile</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
