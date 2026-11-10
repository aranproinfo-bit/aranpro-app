import React, { useState, useMemo } from 'react';
import {
  FileText, CheckSquare, ShieldCheck, Mail, MessageCircle, Copy, Printer,
  Eye, Download, RefreshCw, Send, ChevronDown, ChevronUp, AlertCircle,
  Clock, CheckCircle2, UserCheck, Building2, Key, Scale, Award,
  HelpCircle, ArrowRight, BookOpen, PenTool, ExternalLink, Calendar,
  DollarSign, Sparkles
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

  // Estados locales para la pauta interactiva de traspaso
  const [checklistValues, setChecklistValues] = useState({
    a1: true, a2: true, a3: true, a4: true, a5: true,
    b1: true, b2: true, b3: true, b4: true, b5: true, b6: true,
    c1: true, c2: true, c3: true, c4: true,
    d1: true, d2: true, d3: true, d4: true,
    e1: true, e2: true, e3: true, e4: true
  });

  const [checklistNotes, setChecklistNotes] = useState({});

  const toggleCheck = (id) => {
    setChecklistValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setNote = (id, text) => {
    setChecklistNotes(prev => ({ ...prev, [id]: text }));
  };

  // Variables calculadas
  const condo = proposalConfig.targetCondo?.trim() || 'Comunidad Objetivo';
  const city = proposalConfig.targetCity?.trim() || 'La Serena';
  const adminName = empresaForm.adminName || 'John Andrés Arancibia Maureira';
  const adminRut = (empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2';
  const phone = empresaForm.phone || '+56 9 5811 8504';
  const email = empresaForm.email || 'contacto@aranpro.cl';
  const feeStr = formatCLP(Number(proposalConfig.proposedMonthlyFee) || 850000);

  // Fechas de transición
  const noticeDate = proposalConfig.transitionNoticeDate || new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const endDate = proposalConfig.transitionEndDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const outgoingAdmin = proposalConfig.outgoingAdminName?.trim() || 'Señor(a) Administrador(a) Saliente';
  const committeePresident = proposalConfig.committeePresidentName?.trim() || 'Presidente(a) del Comité de Administración';

  // Acciones de impresión directa
  const handlePrintTerminationNotice = () => {
    const filename = `ARANPRO_Carta_Preaviso_Termino_Administracion_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-termination-notice', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '6mm 8mm 6mm 8mm'
    });
  };

  const handlePrintTransitionChecklist = () => {
    const filename = `ARANPRO_Pauta_Checklist_Traspaso_3Pags_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-transition-checklist', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '6mm 6mm 6mm 6mm'
    });
  };

  const handlePrintContract = () => {
    const filename = `ARANPRO_Contrato_Servicios_Administracion_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-management-contract', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '6mm 8mm 6mm 8mm'
    });
  };

  const handlePrintLegalGuides = () => {
    const filename = `ARANPRO_Guias_Legales_Asambleas_y_Quorums_Ley21442_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-legal-advisory-sheet', filename, {
      pageSize: 'letter landscape',
      fitPage: true,
      margin: '5mm 5mm 5mm 5mm'
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
    showAlert('✓ Cláusulas Copiadas', 'Los párrafos legales para el Libro de Actas se han copiado al portapapeles listos para transcribir.', 'success');
    setTimeout(() => setCopiedClause(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* CABECERA MAESTRA DEL PASO 5 */}
      <div className="bg-gradient-to-br from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white p-5 md:p-6 rounded-3xl shadow-lg border border-emerald-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D4B895] text-[#0F3D2E] flex items-center justify-center font-black shadow-xs text-lg">
              5
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-[#D4B895] px-2 py-0.5 rounded-md">
                  ★ PASO 5 • ADJUDICACIÓN & RECEPCIÓN FORMAL
                </span>
                <span className="text-[10px] font-mono text-emerald-300">
                  Ley N° 21.442 & DS N° 7 MINVU
                </span>
              </div>
              <h3 className="text-base md:text-lg font-black text-white mt-0.5">
                Transición, Notificación al Saliente, Acta & Traspaso de la Comunidad
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-[#0F3D2E] bg-[#F5F4EF] border border-[#D4B895] px-3 py-1 rounded-xl">
              🎯 {condo}
            </span>
          </div>
        </div>

        <p className="text-xs text-emerald-100/90 leading-relaxed max-w-4xl">
          <strong>Cuándo usarlo:</strong> Una vez adjudicada la administración, entrega al Comité de Administración este kit pericial para <strong>notificar al administrador saliente con el preaviso legal de 30 días</strong>, auditar la entrega de claves y antecedentes con la <strong>Pauta de Traspaso de 3 páginas</strong> y redactar correctamente el <strong>Acta de Nombramiento</strong> para validar tu personería legal ante bancos y notarías.
        </p>

        {/* BARRA DE CONFIGURACIÓN RÁPIDA DE LA TRANSICIÓN */}
        <div className="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black uppercase text-[#D4B895] tracking-wider block">
              Datos para Personalizar la Notificación y el Acta de Traspaso:
            </span>
            <span className="text-[10px] text-emerald-300">Se actualiza en tiempo real en todos los documentos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-emerald-200 uppercase mb-1">
                Administrador(a) Saliente *
              </label>
              <input
                type="text"
                placeholder="Ej: Manuel Soto Henríquez"
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
                placeholder="Ej: Claudio Morales Fuentes"
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
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

            {/* VISTA PREVIA FORMATO CARTA */}
            <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 font-sans space-y-4 leading-relaxed max-w-3xl mx-auto shadow-2xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <span className="font-black text-[#0F3D2E] text-sm block">COMITÉ DE ADMINISTRACIÓN</span>
                  <span className="font-bold text-slate-700">{condo.toUpperCase()}</span>
                </div>
                <div className="text-right text-slate-500 font-mono text-[11px]">
                  {city}, {noticeDate}
                </div>
              </div>

              <div className="space-y-0.5">
                <p><strong>Señor(a):</strong> {outgoingAdmin}</p>
                <p><strong>Administrador(a) del:</strong> {condo}</p>
                <p><strong>Presente</strong></p>
                <p className="font-bold text-[#0F3D2E] pt-1">
                  REF: Notificación de término de funciones y aviso legal de 30 días (Ley N° 21.442).
                </p>
              </div>

              <p>Estimado(a):</p>
              <p>
                Por medio de la presente, el <strong>Comité de Administración del {condo}</strong>, en representación de la comunidad y en estricto ejercicio de las facultades que le confiere la <strong>Ley N° 21.442 sobre Copropiedad Inmobiliaria</strong> y el Reglamento de Copropiedad del condominio, cumple con notificarle formalmente la decisión de <strong>poner término a la prestación de sus servicios como Administrador del condominio</strong>.
              </p>
              <p>
                Con el propósito de asegurar una transición ordenada y dar cumplimiento al plazo de preaviso correspondiente, sus funciones se extenderán por <strong>30 días corridos</strong> a contar de la recepción de este documento, siendo su <strong>último día de gestión el {endDate}</strong>.
              </p>
              <p>
                Durante este período, y en estricto apego a lo establecido en el <strong>Artículo 20 y concordantes de la Ley N° 21.442</strong>, solicitamos a usted preparar y tener a disposición para la fecha de término la siguiente documentación y procesos de cierre indispensables para la continuidad operacional:
              </p>

              <div className="space-y-2 pl-3 border-l-2 border-[#0F3D2E]/40 font-medium text-slate-700">
                <p><strong>1. Rendición de Cuentas Documentada:</strong> Balance final consolidado de ingresos y egresos, junto con las cartolas bancarias y conciliaciones hasta el {endDate}.</p>
                <p><strong>2. Traspaso de Documentación:</strong> Entrega del Libro de Actas, registro actualizado de copropietarios y arrendatarios, archivo histórico de gastos comunes, planos, pólizas de seguro vigentes, certificados de instalaciones (sellos de gas SEC, ascensores Minvu) y bitácoras de mantención.</p>
                <p><strong>3. Gestión Laboral y Previsional:</strong> Contratos de trabajo y anexos vigentes del personal, comprobantes de pago de cotizaciones previsionales (Previred al día para evitar nulidad de despido Ley Bustos), liquidaciones de sueldo y finiquitos correspondientes.</p>
                <p><strong>4. Accesos, Cuentas Bancarias y Claves:</strong> Traspaso formal de credenciales de cuentas corrientes bancarias (Fondo de Reserva y cuenta ordinaria), portales del SII, Dirección del Trabajo, correos electrónicos institucionales y licencias de software utilizadas.</p>
                <p><strong>5. Caja Chica, Fondos y Llaves:</strong> Entrega física de los fondos en efectivo disponibles, detalle de cheques por cobrar o emitidos no cobrados, y la totalidad de llaves maestras, tarjetas y controles de acceso.</p>
              </div>

              <p>
                Por nuestra parte, como Comité de Administración, nos comprometemos a facilitar este proceso de transición, a revisar la rendición de cuentas en los plazos legales y a formalizar la recepción definitiva mediante un <strong>Acta de Traspaso</strong> el último día de sus funciones.
              </p>

              <p>Agradecemos su gestión durante este tiempo y confiamos en llevar a cabo este cierre de manera transparente y colaborativa.</p>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-300 pt-2 space-y-0.5">
                  <p className="font-bold text-slate-900">{committeePresident}</p>
                  <p className="text-slate-500">Presidente del Comité de Administración</p>
                  <p className="text-[10px] text-slate-400">{condo}</p>
                </div>
                <div className="border-t border-slate-300 pt-2 space-y-0.5 text-left pl-4">
                  <p className="font-bold text-slate-900">Recibí Conforme (Administrador Saliente):</p>
                  <p className="text-slate-600">Nombre: ____________________________________</p>
                  <p className="text-slate-600">RUT: ________________ Fecha: ___/___/2026</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. CHECKLIST & PAUTA DE TRASPASO ==================== */}
        {activeSubTab === 'checklist' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                  Instrumento Pericial N° 2 • Acta de Cotejo de 3 Páginas
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Solicitud Simple de Antecedentes • Checklist para la Administración Saliente
                </h4>
                <p className="text-xs text-slate-500">
                  Pauta oficial para revisar y registrar en terreno la entrega física de los antecedentes antes de habilitar el software ARANPRO.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintTransitionChecklist}
                  className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Imprimir Pauta 3 Páginas PDF</span>
                </button>
              </div>
            </div>

            {/* ADVERTENCIA LEGAL DESTACADA */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Resguardo Legal para el Comité:</strong> La recepción de documentos mediante esta pauta <strong>no implica aprobación de la gestión contable anterior</strong> ni renuncia a acciones legales. Posteriormente, ARANPRO revisará su integridad, vigencia y consistencia en la auditoría inicial de los primeros 30 días.
              </div>
            </div>

            {/* TABLA INTERACTIVA DE COTEJO */}
            <div className="space-y-4">
              {/* BLOQUE A */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>A. Gobierno y Documentación Legal</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 1</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'a1', label: 'Reglamento de copropiedad vigente, archivo de modificaciones y certificados de archivo CBR.' },
                    { id: 'a2', label: 'Libro de Actas foliado y actas firmadas de asambleas de copropietarios y sesiones del Comité.' },
                    { id: 'a3', label: 'Registro actualizado de copropietarios, arrendatarios y ocupantes con datos de contacto y porcentajes.' },
                    { id: 'a4', label: 'Plan de Emergencia y Evacuación actualizado (exigencia anual Ley 21.442) y protocolos de seguridad.' },
                    { id: 'a5', label: 'Planos de arquitectura, instalaciones (agua, gas, electricidad), manuales de uso y garantías técnicas vigentes.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                      <span className="font-semibold text-slate-800 flex-1">{item.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistValues[item.id] !== false}
                            onChange={() => toggleCheck(item.id)}
                            className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                          />
                          <span className={`font-bold ${checklistValues[item.id] !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {checklistValues[item.id] !== false ? 'Sí (Recibido)' : 'No (Pendiente)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="Observaciones..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-48 text-slate-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE B */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>B. Información Administrativa y Financiera (Para Carga en Software)</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 1 y 2</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'b1', label: 'Última rendición de cuentas documentada, balances mensuales del último año y respaldos de egresos.' },
                    { id: 'b2', label: 'Cartolas bancarias oficiales y conciliaciones bancarias al día de todas las cuentas de la comunidad.' },
                    { id: 'b3', label: 'Estado del Fondo Común de Reserva, depósitos a plazo y fondos de indemnización laboral.' },
                    { id: 'b4', label: 'Informe de morosidad detallado por unidad con desglose de deuda histórica e intereses moratorios.' },
                    { id: 'b5', label: 'Listado de convenios de pago vigentes suscritos con copropietarios morosos y cuotas pactadas.' },
                    { id: 'b6', label: 'Últimos gastos comunes emitidos y antecedentes contables de respaldo para dar continuidad al cobro.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                      <span className="font-semibold text-slate-800 flex-1">{item.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistValues[item.id] !== false}
                            onChange={() => toggleCheck(item.id)}
                            className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                          />
                          <span className={`font-bold ${checklistValues[item.id] !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {checklistValues[item.id] !== false ? 'Sí (Recibido)' : 'No (Pendiente)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="Observaciones..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-48 text-slate-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE C */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>C. Personal y Proveedores de Servicios</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 2</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'c1', label: 'Contratos de trabajo y anexos vigentes de mayordomos, conserjes y personal de aseo.' },
                    { id: 'c2', label: 'Liquidaciones de sueldo firmadas y planillas de cotizaciones previsionales (Previred) al día.' },
                    { id: 'c3', label: 'Contratos vigentes con empresas de mantención (ascensores, bombas, calderas, portones, piscina).' },
                    { id: 'c4', label: 'Listado completo de proveedores habituales, teléfonos, servicios, fechas de renovación y deudas pendientes.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                      <span className="font-semibold text-slate-800 flex-1">{item.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistValues[item.id] !== false}
                            onChange={() => toggleCheck(item.id)}
                            className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                          />
                          <span className={`font-bold ${checklistValues[item.id] !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {checklistValues[item.id] !== false ? 'Sí (Recibido)' : 'No (Pendiente)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="Observaciones..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-48 text-slate-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE D */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>D. Mantenciones, Seguros y Certificaciones Técnicas</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 2</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'd1', label: 'Pólizas de seguro de incendio de espacios comunes vigentes (Art. 43 Ley 21.442) y comprobantes de pago.' },
                    { id: 'd2', label: 'Certificación vigente de sello verde de gas SEC y mantención de salas de calderas.' },
                    { id: 'd3', label: 'Certificación oficial de transporte vertical / ascensores inscrita ante el Minvu (Ley 20.296).' },
                    { id: 'd4', label: 'Informes técnicos recientes, presupuestos aprobados y trabajos en ejecución o pendientes de pago.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                      <span className="font-semibold text-slate-800 flex-1">{item.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistValues[item.id] !== false}
                            onChange={() => toggleCheck(item.id)}
                            className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                          />
                          <span className={`font-bold ${checklistValues[item.id] !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {checklistValues[item.id] !== false ? 'Sí (Recibido)' : 'No (Pendiente)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="Observaciones..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-48 text-slate-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE E */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>E. Sistemas, Claves Digitales y Bienes bajo Custodia</span>
                  <span className="text-[10px] text-[#D4B895] font-normal">Página 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'e1', label: 'Correo institucional de la comunidad y respaldo digital completo de la documentación administrativa.' },
                    { id: 'e2', label: 'Traspaso seguro de claves y credenciales bancarias, portal SII, Dirección del Trabajo y software.' },
                    { id: 'e3', label: 'Llaves maestras, controles remotos de portones, tarjetas de acceso y equipamiento bajo custodia.' },
                    { id: 'e4', label: 'Listado foliado de reclamos de copropietarios pendientes y cobranzas judiciales o prejudiciales en curso.' }
                  ].map(item => (
                    <div key={item.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                      <span className="font-semibold text-slate-800 flex-1">{item.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistValues[item.id] !== false}
                            onChange={() => toggleCheck(item.id)}
                            className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                          />
                          <span className={`font-bold ${checklistValues[item.id] !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {checklistValues[item.id] !== false ? 'Sí (Recibido)' : 'No (Pendiente)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="Observaciones..."
                          value={checklistNotes[item.id] || ''}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs w-48 text-slate-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3. ACTA DE NOMBRAMIENTO & CONTRATO ==================== */}
        {activeSubTab === 'acta' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                  Instrumento Legal N° 3 • Personería y Validez Jurídica
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Acta de Nombramiento (Cláusulas) & Contrato de Prestación de Servicios
                </h4>
                <p className="text-xs text-slate-500">
                  En Chile la Ley N° 21.442 valida las facultades ante bancos y notarías a través del <strong>Acta de Asamblea</strong>. Adicionalmente, se incluye el Contrato Marco bilateral.
                </p>
              </div>

              {/* SELECTOR ENTRE CLÁUSULAS DEL ACTA O CONTRATO BILATERAL */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setActaOrContract('acta')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    actaOrContract === 'acta'
                      ? 'bg-[#0F3D2E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cláusulas para el Libro de Actas
                </button>
                <button
                  type="button"
                  onClick={() => setActaOrContract('contrato')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    actaOrContract === 'contrato'
                      ? 'bg-[#0F3D2E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contrato de Servicios Formal
                </button>
              </div>
            </div>

            {actaOrContract === 'acta' ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0F3D2E] shrink-0" />
                    <span>
                      <strong>Instrucción para el Comité:</strong> Transcriban estos 5 párrafos redactados al Libro de Actas de la Asamblea o del Comité y llévenla a protocolizar a Notaría con una copia autorizada para el banco.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyClauses}
                    className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#D4B895]" />
                    <span>{copiedClause ? '¡Copiado con Éxito!' : 'Copiar Cláusulas al Portapapeles'}</span>
                  </button>
                </div>

                <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap select-all border border-slate-800 shadow-inner">
                  {assemblyClausesText}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Contrato bilateral de 10 cláusulas completas entre la Comunidad y ARANPRO.
                  </span>
                  <button
                    type="button"
                    onClick={handlePrintContract}
                    className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                    <span>Imprimir Contrato Completo PDF</span>
                  </button>
                </div>

                {/* VISTA PREVIA CONTRATO MARCO */}
                <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 font-sans space-y-3 leading-relaxed max-w-3xl mx-auto shadow-2xs">
                  <div className="text-center border-b border-slate-200 pb-3">
                    <h5 className="font-black text-sm text-[#0F3D2E] uppercase">
                      CONTRATO DE PRESTACIÓN DE SERVICIOS DE ADMINISTRACIÓN DE CONDOMINIOS
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono">CONDOMINIO {condo.toUpperCase()} • LEY N° 21.442</p>
                  </div>

                  <p>
                    En {city}, a {noticeDate}, entre la <strong>Comunidad del Condominio {condo}</strong>, RUT ____________________, representada para estos efectos por el Comité de Administración a través de su Presidente(a) don(ña) <strong>{committeePresident}</strong>, cédula de identidad N° ____________________, en adelante "La Comunidad"; y por la otra parte, <strong>ARANPRO GESTIÓN INTEGRAL</strong>, representada por don <strong>{adminName}</strong>, Constructor Civil, cédula de identidad N° {adminRut}, domiciliado en {city}, e inscrito a título oneroso en el Registro Nacional de Administradores de Condominios (RNAC) del MINVU, en adelante "El Administrador", se ha convenido el siguiente contrato de prestación de servicios profesionales:
                  </p>

                  <p><strong>PRIMERO (OBJETO):</strong> La Comunidad encomienda a El Administrador la administración integral de las áreas comunes, recursos financieros, personal y sistemas técnicos del condominio {condo}, conforme a las disposiciones de la Ley N° 21.442 y su Reglamento.</p>

                  <p><strong>SEGUNDO (ALCANCE OPERATIVO):</strong> El Administrador mantendrá presencia técnica periódica en terreno para fiscalizar directamente las mantenciones de salas de bombas, grupos electrógenos, tableros eléctricos y cubiertas, además de atender contingencias operacionales 24/7.</p>

                  <p><strong>TERCERO (PLATAFORMA DIGITAL Y TRANSPARENCIA):</strong> El Administrador habilitará sin costo de licencias para la comunidad la Suite Web y App Móvil ARANPRO, garantizando acceso en tiempo real a cartolas bancarias, facturas electrónicas visadas y libro de reclamos foliado.</p>

                  <p><strong>CUARTO (HONORARIOS):</strong> La Comunidad pagará por los servicios profesionales la suma mensual de <strong>{feeStr}</strong> ({proposalConfig.taxModality || 'Factura Exenta / Boleta de Honorarios'}), pagadera dentro de los primeros 5 días hábiles del mes siguiente.</p>

                  <p><strong>QUINTO (CUENTAS BANCARIAS):</strong> Todos los dineros recaudados por concepto de gastos comunes y fondo de reserva se depositarán exclusivamente en cuentas corrientes abiertas a nombre de la Comunidad, prohibiéndose el uso de cuentas personales.</p>

                  <p><strong>SEXTO (VIGENCIA):</strong> El presente contrato tendrá una duración de un año a contar de su suscripción, renovable tácita y sucesivamente según el Artículo 17 de la Ley N° 21.442.</p>

                  <p><strong>SÉPTIMO (TÉRMINO ANTICIPADO):</strong> Cualquiera de las partes podrá poner término anticipado al presente contrato dando aviso formal por escrito a la otra con a lo menos 30 días de anticipación.</p>

                  <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="border-t border-slate-300 pt-2 space-y-0.5">
                      <p className="font-bold text-slate-900">{committeePresident}</p>
                      <p className="text-slate-500">Por la Comunidad (Comité de Administración)</p>
                    </div>
                    <div className="border-t border-slate-300 pt-2 space-y-0.5">
                      <p className="font-bold text-slate-900">{adminName}</p>
                      <p className="text-slate-500">Por ARANPRO Gestión Integral (Administrador)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. GUÍAS DE ASESORÍA LEGAL ==================== */}
        {activeSubTab === 'guias' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                  Instrumento de Autoridad Legal N° 4 • Capacitación para el Comité
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Guías Legales: Asambleas vs. Comité de Administración y Quórums (DS N° 7 / 2025)
                </h4>
                <p className="text-xs text-slate-500">
                  Material pedagógico ejecutivo para que los miembros del Comité comprendan con claridad sus atribuciones, quórums y facultades según la Ley N° 21.442.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintLegalGuides}
                  className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Imprimir Guías Legales (Horizontal)</span>
                </button>
              </div>
            </div>

            {/* CUADRO 1: DIFERENCIAS PRÁCTICAS ASAMBLEA VS COMITÉ */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-[#0F3D2E] text-white p-3 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                <span>Diferencias Prácticas según Ley N° 21.442 y Reglamento (DS N° 7, vigente desde 09.01.2025)</span>
                <span className="text-[10px] text-[#D4B895]">Guía Ejecutiva</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-2.5 font-bold w-1/4">Materia</th>
                      <th className="p-2.5 font-bold w-3/8 text-[#0F3D2E]">Asamblea de Copropietarios</th>
                      <th className="p-2.5 font-bold w-3/8 text-blue-900">Comité de Administración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 leading-relaxed">
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50/50">1. Naturaleza de las reuniones</td>
                      <td className="p-2.5">Adopta acuerdos en sesiones ordinarias o extraordinarias. Existen consultas por escrito y sesiones informativas.</td>
                      <td className="p-2.5">Sesiona para ejercer facultades legales y ejecutar/velar por los acuerdos de la Asamblea. No se clasifica en ordinarias/extraordinarias.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50/50">2. Convocatoria / Formalidad</td>
                      <td className="p-2.5">Citación formal con anticipación mínima de 5 y máxima de 15 días corridos. Sesión extraordinaria solo trata temas citados.</td>
                      <td className="p-2.5">Sin régimen formal de citación equivalente en la ley. Se rige por reglamento y deja respaldo de acuerdos.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50/50">3. Quién convoca</td>
                      <td className="p-2.5">Cita el Comité a través del presidente; si no, el administrador. Puede ser solicitada por al menos el 10% de los derechos.</td>
                      <td className="p-2.5">Corresponde al propio Comité, normalmente a través de su presidente conforme a organización interna.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50/50">4. Quórums para acuerdos</td>
                      <td className="p-2.5">Ordinaria: mayoría absoluta asistentes. Extraordinaria mayoría absoluta: 50%+1 derechos totales. Reforzada: 66% derechos totales.</td>
                      <td className="p-2.5">Mitad más uno de los miembros del Comité (acuerdos por mayoría de integrantes, no por alícuota).</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50/50">5. Representación</td>
                      <td className="p-2.5">El copropietario puede ser representado por poder o por arrendatario/ocupante registrado. <strong>El administrador NO puede representar copropietarios</strong>.</td>
                      <td className="p-2.5">Deriva de su designación personal. No existe sustitución ocasional; los miembros deben haber sido designados conforme a la ley.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-50/50">6. Integración y Plazo</td>
                      <td className="p-2.5">Órgano soberano compuesto por el 100% de los propietarios del condominio.</td>
                      <td className="p-2.5">Número impar de 3 a 5 miembros (salvo condominios pequeños). Dura el período fijado por asamblea, máximo 3 años reelegibles.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* CUADRO 2: QUÓRUMS Y MATERIAS ARTÍCULO 15 LEY 21.442 */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-[#0F3D2E] text-white p-3 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                <span>Cuadro Práctico de Asambleas • Materias y Quórum (Art. 15 Ley N° 21.442 y DS N° 7)</span>
                <span className="text-[10px] text-[#D4B895]">Regla de Votación</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-2.5 font-bold w-1/4">Tipo de Asamblea</th>
                      <th className="p-2.5 font-bold w-1/2">Materias que Pueden Tratarse</th>
                      <th className="p-2.5 font-bold w-1/8 text-center">Quórum Sesionar</th>
                      <th className="p-2.5 font-bold w-1/8 text-center">Quórum Acordar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 leading-relaxed">
                    <tr>
                      <td className="p-2.5 font-bold bg-emerald-50/40 text-[#0F3D2E]">ORDINARIA</td>
                      <td className="p-2.5">
                        a) Rendición de cuentas del administrador y aprobación del balance.<br />
                        b) Designación, reelección o renuncia de miembros del Comité.<br />
                        <strong>c) Designación o remoción del administrador o subadministrador.</strong><br />
                        d) Actualización del plan de emergencia y simulacros.<br />
                        e) Cualquier asunto ordinario de interés que no sea materia extraordinaria.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50/40">Mínimo 33% de los derechos</td>
                      <td className="p-2.5 text-center font-bold text-emerald-800 bg-emerald-50/60">Mayoría absoluta de los asistentes</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-blue-50/40 text-blue-900">EXTRAORDINARIA MAYORÍA ABSOLUTA</td>
                      <td className="p-2.5">
                        a) Modificación del reglamento de copropiedad (salvo materias reforzadas).<br />
                        b) Remoción parcial o total de miembros del Comité.<br />
                        c) Gastos o inversiones extraordinarias que excedan seis cuotas de GGCC ordinarios en 12 meses.<br />
                        d) Fijación de porcentaje de recargo al Fondo de Reserva o uso para reparaciones ordinarias.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50/40">Mayoría absoluta de los derechos</td>
                      <td className="p-2.5 text-center font-bold text-blue-900 bg-blue-50/60">Mayoría absoluta de los derechos totales</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-purple-50/40 text-purple-900">EXTRAORDINARIA MAYORÍA REFORZADA</td>
                      <td className="p-2.5">
                        a) Delegación de facultades al Comité respecto de materias delegables.<br />
                        b) Enajenación, gravamen o arrendamiento de bienes comunes.<br />
                        c) Reconstrucción o demolición del condominio.<br />
                        d) Retribución a miembros del Comité mediante descuento de gastos comunes.<br />
                        e) Contratación de seguros que modifiquen coberturas y riesgos.
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800 bg-slate-50/40">Al menos 66% de los derechos</td>
                      <td className="p-2.5 text-center font-bold text-purple-900 bg-purple-50/60">66% de los derechos totales</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ACCIONES DE ENVÍO DIRECTO AL COMITÉ (CORREO, WHATSAPP, COPIAR) */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleShareWhatsApp(5)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Enviar Paquete por WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => handleShareEmail(5)}
              disabled={sendingEmailStep === 5}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {sendingEmailStep === 5 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando Kit al Comité...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Enviar Paquete por Correo</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleCopyStepMessage(5)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Mensaje</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpandedMsg(!expandedMsg)}
            className="text-[11px] font-bold text-[#0F3D2E] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {expandedMsg ? 'Ocultar Texto Propuesto' : 'Ver Texto para el Comité'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMsg ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ACORDEÓN DE MENSAJE PROPUESTO PARA EL COMITÉ */}
        {expandedMsg && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide block">
              Mensaje Propuesto para Despachar el Kit de Transición al Comité
            </span>
            <pre className="whitespace-pre-wrap font-sans text-slate-800 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed max-h-56 overflow-y-auto">
              {getStepMessages(5)?.whatsapp || ''}
            </pre>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN OCULTA PERO MONTADA PARA GENERACIÓN DIRECTA DE PDFS OFICIALES     */}
      {/* ========================================================================= */}
      <div className="hidden" aria-hidden="true">
        {/* 1. PRINTABLE TERMINATION NOTICE (CARTA DE PREAVISO) */}
        <div id="printable-termination-notice" className="p-8 bg-white text-slate-900 font-sans text-xs space-y-4 max-w-[800px] leading-relaxed">
          <div className="flex justify-between items-start border-b border-slate-300 pb-3">
            <div>
              <span className="font-black text-[#0F3D2E] text-base block">COMITÉ DE ADMINISTRACIÓN</span>
              <span className="font-bold text-slate-800 text-sm">{condo.toUpperCase()}</span>
              <span className="text-[10px] text-slate-500 block font-mono">Ley N° 21.442 sobre Copropiedad Inmobiliaria</span>
            </div>
            <div className="text-right text-slate-600 font-mono text-xs">
              {city}, {noticeDate}
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <p><strong>Señor(a):</strong> {outgoingAdmin}</p>
            <p><strong>Administrador(a) del:</strong> {condo}</p>
            <p><strong>Presente</strong></p>
            <p className="font-black text-[#0F3D2E] text-xs pt-1.5 uppercase tracking-wide">
              REF: Notificación de término de funciones y aviso legal de 30 días (Ley N° 21.442).
            </p>
          </div>

          <p>Estimado(a):</p>
          <p>
            Por medio de la presente, el <strong>Comité de Administración del {condo}</strong>, en representación de la comunidad y en estricto ejercicio de las facultades que le confiere la <strong>Ley N° 21.442 sobre Copropiedad Inmobiliaria</strong> y el Reglamento de Copropiedad del condominio, cumple con notificarle formalmente la decisión de <strong>poner término a la prestación de sus servicios como Administrador del condominio</strong>.
          </p>
          <p>
            Con el propósito de asegurar una transición ordenada y dar cumplimiento al plazo de preaviso correspondiente, sus funciones se extenderán por <strong>30 días corridos</strong> a contar de la recepción de este documento, siendo su <strong>último día de gestión el {endDate}</strong>.
          </p>
          <p>
            Durante este período, y en estricto apego a lo establecido en el <strong>Artículo 20 y concordantes de la Ley N° 21.442</strong>, solicitamos a usted preparar y tener a disposición para la fecha de término la siguiente documentación y procesos de cierre indispensables para la continuidad operacional:
          </p>

          <div className="space-y-2 pl-3 border-l-2 border-[#0F3D2E] text-[11px] text-slate-800">
            <p><strong>1. Rendición de Cuentas Documentada:</strong> Balance final consolidado de ingresos y egresos, junto con las cartolas bancarias y conciliaciones hasta el {endDate}.</p>
            <p><strong>2. Traspaso de Documentación:</strong> Entrega del Libro de Actas, registro actualizado de copropietarios y arrendatarios, archivo histórico de gastos comunes, planos, pólizas de seguro vigentes, certificados de instalaciones (sellos de gas SEC, ascensores Minvu) y bitácoras de mantención.</p>
            <p><strong>3. Gestión Laboral y Previsional:</strong> Contratos de trabajo y anexos vigentes del personal, comprobantes de pago de cotizaciones previsionales (Previred al día para evitar nulidad de despido Ley Bustos), liquidaciones de sueldo y finiquitos correspondientes.</p>
            <p><strong>4. Accesos, Cuentas Bancarias y Claves:</strong> Traspaso formal de credenciales de cuentas corrientes bancarias (Fondo de Reserva y cuenta ordinaria), portales del SII, Dirección del Trabajo, correos electrónicos institucionales y licencias de software utilizadas.</p>
            <p><strong>5. Caja Chica, Fondos y Llaves:</strong> Entrega física de los fondos en efectivo disponibles, detalle de cheques por cobrar o emitidos no cobrados, y la totalidad de llaves maestras, tarjetas y controles de acceso.</p>
          </div>

          <p>
            Por nuestra parte, como Comité de Administración, nos comprometemos a facilitar este proceso de transición, a revisar la rendición de cuentas en los plazos legales y a formalizar la recepción definitiva mediante un <strong>Acta de Traspaso</strong> el último día de sus funciones.
          </p>

          <p>Agradecemos su gestión durante este tiempo y confiamos en llevar a cabo este cierre de manera transparente y colaborativa.</p>

          <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <p className="font-bold text-slate-900">{committeePresident}</p>
              <p className="text-slate-500">Presidente del Comité de Administración</p>
              <p className="text-[10px] text-slate-400">{condo}</p>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-0.5 text-left pl-4">
              <p className="font-bold text-slate-900">Recibí Conforme (Administrador Saliente):</p>
              <p className="text-slate-600">Nombre: ____________________________________</p>
              <p className="text-slate-600">RUT: ________________ Fecha: ___/___/2026</p>
            </div>
          </div>
        </div>

        {/* 2. PRINTABLE CHECKLIST (PAUTA DE TRASPASO 3 PÁGINAS) */}
        <div id="printable-transition-checklist" className="p-8 bg-white text-slate-900 font-sans text-xs space-y-6 max-w-[800px] leading-relaxed">
          {/* PÁGINA 1 */}
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-3">
              <div>
                <span className="font-black text-[#0F3D2E] text-sm block">JOHN ANDRÉS ARANCIBIA MAUREIRA</span>
                <span className="text-[10px] text-slate-600 font-bold block">Constructor Civil • Administrador de Condominios RNAC MINVU</span>
                <span className="text-[10px] text-slate-500 block">Documento para uso del Comité antes del cambio de administración</span>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-900 text-sm block">{condo.toUpperCase()}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{city} • Pág. 1 de 3</span>
              </div>
            </div>

            <div className="text-center py-1">
              <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Solicitud Simple de Antecedentes
              </h4>
              <p className="text-xs font-bold text-[#0F3D2E]">Checklist para solicitar hoy a la administración vigente</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-[11px] text-slate-700 leading-snug">
              <strong>El Comité puede utilizar este listado para solicitar una entrega ordenada de antecedentes y resguardar la continuidad de la comunidad.</strong> La recepción de documentos no implica aprobación de la gestión anterior; posteriormente deberán revisarse su integridad, vigencia y consistencia.
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-xs uppercase">
                A. Gobierno y Documentación Legal
              </div>
              <table className="w-full text-left text-[10.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <th className="p-2 w-3/5 font-bold">Antecedente</th>
                    <th className="p-2 w-1/10 text-center font-bold">Sí</th>
                    <th className="p-2 w-1/10 text-center font-bold">No</th>
                    <th className="p-2 w-1/5 font-bold">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="p-2 font-medium">Reglamento de copropiedad vigente y sus modificaciones.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Libro de Actas foliado y actas de asambleas y Comité.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Registro actualizado de copropietarios, arrendatarios y ocupantes.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Plan de Emergencia y demás documentos de seguridad disponibles.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Planos, manuales, garantías y antecedentes técnicos bajo custodia.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                </tbody>
              </table>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-xs uppercase">
                B. Información Administrativa y Financiera
              </div>
              <table className="w-full text-left text-[10.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <th className="p-2 w-3/5 font-bold">Antecedente</th>
                    <th className="p-2 w-1/10 text-center font-bold">Sí</th>
                    <th className="p-2 w-1/10 text-center font-bold">No</th>
                    <th className="p-2 w-1/5 font-bold">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="p-2 font-medium">Última rendición de cuentas documentada y respaldos disponibles.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Cartolas bancarias y conciliaciones actualizadas.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Estado de fondos de la comunidad y reserva.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Informe de morosidad y convenios de pago vigentes.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Listado de cuentas y obligaciones pendientes con proveedores.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Últimos gastos comunes emitidos y antecedentes necesarios para continuidad.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                </tbody>
              </table>
            </div>

            <div className="text-right text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-200">
              John Andrés Arancibia Maureira | johnn.ranacibia@gmail.com | Fono: +56 9 5811 8504
            </div>
          </div>

          {/* SALTO DE PÁGINA 2 */}
          <div className="pt-8 space-y-4">
            <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-2">
              <span className="font-bold text-[#0F3D2E] text-xs">CHECKLIST DE ANTECEDENTES • TRASPASO DE ADMINISTRACIÓN</span>
              <span className="text-[10px] text-slate-500 font-mono">{condo} • Pág. 2 de 3</span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-xs uppercase">
                C. Personal y Proveedores
              </div>
              <table className="w-full text-left text-[10.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <th className="p-2 w-3/5 font-bold">Antecedente</th>
                    <th className="p-2 w-1/10 text-center font-bold">Sí</th>
                    <th className="p-2 w-1/10 text-center font-bold">No</th>
                    <th className="p-2 w-1/5 font-bold">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="p-2 font-medium">Contratos y anexos de trabajadores vigentes, cuando corresponda.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Liquidaciones, cotizaciones previsionales y antecedentes laborales necesarios para continuidad.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Contratos vigentes con proveedores y empresas de mantención.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Listado de proveedores, contactos, servicios, fechas de renovación y trabajos pendientes.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                </tbody>
              </table>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-xs uppercase">
                D. Mantenciones, Seguros y Certificaciones
              </div>
              <table className="w-full text-left text-[10.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <th className="p-2 w-3/5 font-bold">Antecedente</th>
                    <th className="p-2 w-1/10 text-center font-bold">Sí</th>
                    <th className="p-2 w-1/10 text-center font-bold">No</th>
                    <th className="p-2 w-1/5 font-bold">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="p-2 font-medium">Pólizas de seguros vigentes (espacios comunes contra incendio y complementarias).</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Certificaciones y mantenciones de instalaciones que correspondan (gas SEC, ascensores Minvu).</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Calendario de mantenciones preventivas y correctivas (bombas, generador, calderas).</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Informes técnicos, presupuestos aprobados y trabajos en ejecución o pendientes.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                </tbody>
              </table>
            </div>

            <div className="text-right text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-200">
              John Andrés Arancibia Maureira | johnn.ranacibia@gmail.com | Fono: +56 9 5811 8504
            </div>
          </div>

          {/* SALTO DE PÁGINA 3 */}
          <div className="pt-8 space-y-4">
            <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-2">
              <span className="font-bold text-[#0F3D2E] text-xs">CHECKLIST DE ANTECEDENTES • TRASPASO DE ADMINISTRACIÓN</span>
              <span className="text-[10px] text-slate-500 font-mono">{condo} • Pág. 3 de 3</span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-[#0F3D2E] text-white px-3 py-1.5 font-bold text-xs uppercase">
                E. Sistemas, Archivos y Elementos bajo Custodia
              </div>
              <table className="w-full text-left text-[10.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <th className="p-2 w-3/5 font-bold">Antecedente</th>
                    <th className="p-2 w-1/10 text-center font-bold">Sí</th>
                    <th className="p-2 w-1/10 text-center font-bold">No</th>
                    <th className="p-2 w-1/5 font-bold">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="p-2 font-medium">Correo institucional y respaldo digital de la documentación administrativa.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Traspaso seguro de accesos y claves a plataformas utilizadas por la comunidad (bancos, SII, DT).</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Llaves, controles, tarjetas, dispositivos y demás bienes bajo custodia física.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                  <tr><td className="p-2 font-medium">Listado de reclamos, cobranzas, procedimientos, trámites y asuntos pendientes.</td><td className="p-2 text-center">☐</td><td className="p-2 text-center">☐</td><td className="p-2"></td></tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-[11px] text-emerald-950 leading-relaxed">
              <strong>Recomendación práctica para la asamblea:</strong> si se acuerda el cambio de administración, dejar en el acta la <strong>fecha de término de la administración vigente</strong>, la <strong>designación de la nueva administración</strong> cuando corresponda, el <strong>plazo de entrega de antecedentes</strong> y la persona del Comité encargada de coordinar el traspaso.
            </div>

            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">{committeePresident}</p>
                <p className="text-slate-500">Por el Comité de Administración</p>
              </div>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">{outgoingAdmin}</p>
                <p className="text-slate-500">Administrador(a) Saliente</p>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-200">
              John Andrés Arancibia Maureira | johnn.ranacibia@gmail.com | Fono: +56 9 5811 8504
            </div>
          </div>
        </div>

        {/* 3. PRINTABLE CONTRACT (CONTRATO BILATERAL) */}
        <div id="printable-management-contract" className="p-8 bg-white text-slate-900 font-sans text-xs space-y-4 max-w-[800px] leading-relaxed">
          <div className="text-center border-b-2 border-[#0F3D2E] pb-3">
            <span className="font-bold text-xs text-[#0F3D2E] tracking-wider uppercase block">REPÚBLICA DE CHILE • LEY N° 21.442</span>
            <h4 className="text-sm font-black text-slate-900 uppercase">
              CONTRATO DE PRESTACIÓN DE SERVICIOS DE ADMINISTRACIÓN PROFESIONAL DE CONDOMINIOS
            </h4>
            <p className="text-[11px] text-slate-600 font-mono font-bold">{condo.toUpperCase()} • {city.toUpperCase()}</p>
          </div>

          <p>
            En {city}, a {noticeDate}, entre la <strong>Comunidad del Condominio {condo}</strong>, debidamente representada por su Comité de Administración en la persona de su Presidente(a) don(ña) <strong>{committeePresident}</strong>, en adelante "La Comunidad"; y por la otra parte, <strong>ARANPRO GESTIÓN INTEGRAL</strong>, representada por don <strong>{adminName}</strong>, Constructor Civil, cédula de identidad N° {adminRut}, con inscripción vigente a título oneroso en el Registro Nacional de Administradores de Condominios (RNAC) del MINVU, en adelante "El Administrador", se suscribe el presente contrato de prestación de servicios profesionales:
          </p>

          <p><strong>PRIMERO (OBJETO):</strong> La Comunidad encomienda a El Administrador la gestión integral, financiera, técnica, legal y comunitaria del condominio {condo}, en estricta sujeción a las disposiciones de la Ley N° 21.442, su Reglamento y el Reglamento de Copropiedad del condominio.</p>

          <p><strong>SEGUNDO (ALCANCE OPERATIVO):</strong> El Administrador mantendrá presencia técnica en terreno con periodicidad de {proposalConfig.visitFrequency || 'visitas técnicas semanales'}, realizando inspecciones periciales periódicas a las salas de bombas, tableros eléctricos, ascensores, calderas y cubiertas, además de fiscalizar a los contratistas y atender contingencias 24/7.</p>

          <p><strong>TERCERO (SUITE DIGITAL Y TRANSPARENCIA):</strong> El Administrador habilitará sin costo de licencias para la comunidad la plataforma Web y App Móvil ARANPRO, garantizando acceso en tiempo real a cartolas bancarias, facturas electrónicas auditadas y libro de reclamos foliado.</p>

          <p><strong>CUARTO (HONORARIOS):</strong> La Comunidad pagará a El Administrador por sus servicios profesionales un honorario mensual de <strong>{feeStr}</strong> ({proposalConfig.taxModality || 'Factura Exenta / Boleta de Honorarios'}), pagadero dentro de los primeros 5 días hábiles del mes calendario siguiente.</p>

          <p><strong>QUINTO (CUENTAS BANCARIAS EXCLUSIVAS):</strong> Todos los recursos del condominio se manejarán exclusivamente en cuentas corrientes bancarias y de ahorro abiertas a nombre exclusivo de la Comunidad, prohibiéndose taxativamente el uso de cuentas personales.</p>

          <p><strong>SEXTO (VIGENCIA):</strong> El presente contrato tendrá una vigencia de un año a contar de la asunción formal de funciones, renovable tácita y sucesivamente según el Artículo 17 de la Ley N° 21.442.</p>

          <p><strong>SÉPTIMO (TÉRMINO ANTICIPADO):</strong> Cualquiera de las partes podrá poner término anticipado al presente contrato dando aviso formal por escrito a la otra con a lo menos 30 días de anticipación.</p>

          <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <p className="font-bold text-slate-900">{committeePresident}</p>
              <p className="text-slate-500">Por la Comunidad (Comité de Administración)</p>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <p className="font-bold text-slate-900">{adminName}</p>
              <p className="text-slate-500">Por ARANPRO Gestión Integral (Administrador)</p>
              <p className="text-[10px] text-slate-400 font-mono">Inscripción RNAC MINVU Vigente</p>
            </div>
          </div>
        </div>

        {/* 4. PRINTABLE LEGAL ADVISORY (GUÍAS LEGALES EN HORIZONTAL) */}
        <div id="printable-legal-advisory-sheet" className="p-6 bg-white text-slate-900 font-sans text-xs space-y-4 max-w-[1000px] leading-tight">
          <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-2">
            <div>
              <span className="font-black text-[#0F3D2E] text-sm block">ARANPRO GESTIÓN INTEGRAL • ASESORÍA LEGAL PARA COMITÉS</span>
              <span className="text-[10px] text-slate-600 block">Diferencias Prácticas y Quórums según Ley N° 21.442 y DS N° 7 MINVU (09.01.2025)</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 text-xs block">{condo.toUpperCase()}</span>
              <span className="text-[10px] text-slate-500 font-mono">{city}</span>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-[#0F3D2E] text-white px-2.5 py-1 text-[11px] font-black uppercase">
              Asambleas - Materias y Quórum (Art. 15 Ley 21.442)
            </div>
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <th className="p-1.5 w-1/4 font-bold">Tipo de Asamblea</th>
                  <th className="p-1.5 w-1/2 font-bold">Materias que Pueden Tratarse</th>
                  <th className="p-1.5 w-1/8 font-bold text-center">Quórum Sesionar</th>
                  <th className="p-1.5 w-1/8 font-bold text-center">Quórum Acordar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-1.5 font-bold text-[#0F3D2E] bg-emerald-50/50">ORDINARIA</td>
                  <td className="p-1.5">Rendición de cuentas y balances; designación/remoción del Comité; <strong>designación o remoción del administrador</strong>; actualizaciones plan de emergencia; asuntos ordinarios.</td>
                  <td className="p-1.5 text-center font-bold">Mínimo 33% derechos</td>
                  <td className="p-1.5 text-center font-bold text-emerald-800">Mayoría absoluta asistentes</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold text-blue-900 bg-blue-50/50">EXTRAORDINARIA MAYORÍA ABSOLUTA</td>
                  <td className="p-1.5">Modificación de reglamento; remoción de miembros del comité; gastos extraordinarios que excedan 6 cuotas GGCC; uso de fondo de reserva.</td>
                  <td className="p-1.5 text-center font-bold">Mayoría absoluta derechos</td>
                  <td className="p-1.5 text-center font-bold text-blue-900">Mayoría absoluta derechos totales</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold text-purple-900 bg-purple-50/50">EXTRAORDINARIA MAYORÍA REFORZADA</td>
                  <td className="p-1.5">Delegación de facultades al comité; enajenación/gravamen de bienes comunes; demolición; retribución miembros comité; seguros que modifiquen riesgos.</td>
                  <td className="p-1.5 text-center font-bold">Al menos 66% derechos</td>
                  <td className="p-1.5 text-center font-bold text-purple-900">66% derechos totales</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-right text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-200">
            John Andrés Arancibia Maureira • Constructor Civil • Administrador de Condominios RNAC MINVU • contacto@aranpro.cl
          </div>
        </div>

        {/* 5. PRINTABLE FULL TRANSITION PACKAGE (PAQUETE COMPLETO COMPILADO PARA ADJUNTO) */}
        <div id="printable-transition-package" className="p-8 bg-white text-slate-900 font-sans text-xs space-y-8 max-w-[800px]">
          {/* Portada del Kit */}
          <div className="p-8 bg-[#0F3D2E] text-white rounded-3xl text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-[#D4B895] block">
              ARANPRO GESTIÓN INTEGRAL • ASESORÍA LEGAL AL COMITÉ
            </span>
            <h3 className="text-xl font-black text-white">
              Kit Oficial de Transición, Notificación y Recepción Legal de Condominios
            </h3>
            <p className="text-xs text-emerald-100 max-w-lg mx-auto leading-relaxed">
              Documentos de respaldo pericial y legal elaborados bajo la Ley N° 21.442 y su Reglamento (DS N° 7 MINVU 2025) para la toma de control de {condo}.
            </p>
            <div className="pt-2 text-[11px] font-mono text-[#D4B895]">
              {city}, {noticeDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
