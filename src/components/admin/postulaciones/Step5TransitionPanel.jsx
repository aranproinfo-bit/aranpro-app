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

  // Acciones de impresión directa
  const handlePrintTerminationNotice = () => {
    const filename = `Carta_Termino_Administracion_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-termination-notice', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm',
      pdfStyle: 'neutral'
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
      pageSize: 'letter landscape',
      fitPage: true,
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
    showAlert?.('✓ Cláusulas Copiadas', 'El texto canónico para el Libro de Actas ha sido copiado al portapapeles listo para transcribir.', 'success');
    setTimeout(() => setCopiedClause(false), 3000);
  };

  return (
    <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-emerald-700/30 shadow-xs hover:border-emerald-700/60 transition-all space-y-4">
      {/* 1. ENCABEZADO UNIFICADO CON LOS PASOS 1, 2, 3 Y 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-black text-lg shrink-0 mt-0.5 shadow-xs">
            5
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                ★ PASO 5 • ADJUDICACIÓN & RECEPCIÓN FORMAL
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Ley N° 21.442 & DS N° 7 MINVU
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900 mt-0.5">
              Paso 5: Notificación al Saliente, Pauta de Traspaso & Cláusulas del Acta
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-bold text-[#0F3D2E] bg-[#F5F4EF] border border-[#D4B895] px-2.5 py-1 rounded-xl">
            {proposalConfig.targetCondo || 'Comunidad'}
          </span>
          <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        <strong>Cuándo usarlo:</strong> Una vez adjudicada la administración, entrega al Comité este kit pericial para <strong>notificar al administrador saliente con el preaviso legal de 30 días</strong>, auditar la entrega de antecedentes con la <strong>Pauta de Traspaso de 3 páginas</strong> y formalizar el <strong>Acta de Nombramiento</strong> con facultades bancarias plenas ante bancos y notarías.
      </p>

      {/* BARRA DE CONFIGURACIÓN DE NOMBRES Y PLAZOS */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-black uppercase text-[#0F3D2E] tracking-wider block">
            Datos para Personalizar la Notificación y el Acta de Traspaso ({condo}):
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Actualización en tiempo real</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Administrador(a) Saliente *
            </label>
            <input
              type="text"
              placeholder="Ej: Manuel Soto Henríquez"
              value={proposalConfig.outgoingAdminName || ''}
              onChange={(e) => setProposalConfig({ ...proposalConfig, outgoingAdminName: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Presidente(a) del Comité *
            </label>
            <input
              type="text"
              placeholder="Ej: Claudio Morales Fuentes"
              value={proposalConfig.committeePresidentName || ''}
              onChange={(e) => setProposalConfig({ ...proposalConfig, committeePresidentName: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Fecha Notificación (Preaviso)
            </label>
            <input
              type="text"
              placeholder="Ej: 30 de octubre de 2026"
              value={proposalConfig.transitionNoticeDate || ''}
              onChange={(e) => setProposalConfig({ ...proposalConfig, transitionNoticeDate: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Último Día de Gestión (30 Días)
            </label>
            <input
              type="text"
              placeholder="Ej: 30 de noviembre de 2026"
              value={proposalConfig.transitionEndDate || ''}
              onChange={(e) => setProposalConfig({ ...proposalConfig, transitionEndDate: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
            />
          </div>
        </div>
      </div>

      {/* SELECTOR DE SUBPESTAÑAS */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
        {[
          { id: 'carta', label: '1. Carta de Notificación (Preaviso 30 Días)', icon: Mail },
          { id: 'checklist', label: '2. Checklist de Traspaso (3 Págs)', icon: CheckSquare },
          { id: 'acta', label: '3. Cláusulas Acta & Contrato', icon: BookOpen },
          { id: 'guias', label: '4. Fichas Guías (Asambleas & Quórums)', icon: Scale }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isAct = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAct
                  ? 'bg-[#0F3D2E] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DE LA SUBPESTAÑA ACTIVA */}
      <div className="space-y-4">
        {/* ==================== SUBTAB 1: CARTA DE PREAVISO ==================== */}
        {activeSubTab === 'carta' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Carta de Término de Funciones y Preaviso de 30 Días al Administrador Saliente
                </span>
                <span className="text-[11px] text-slate-500">
                  Redactada conforme a la Ley N° 21.442 (Art. 20) para firma del Comité de Administración.
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrintTerminationNotice}
                className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                <span>Imprimir / Descargar PDF (1 Pág)</span>
              </button>
            </div>

            {/* VISTA PREVIA ORIGINAL DE LA CARTA */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 space-y-3 max-w-2xl mx-auto leading-relaxed shadow-inner">
              <div className="flex justify-between items-start border-b border-slate-300 pb-2">
                <div>
                  <span className="font-bold text-slate-900 block">COMITÉ DE ADMINISTRACIÓN</span>
                  <span className="text-[11px] text-[#0F3D2E] font-bold block">{condo}</span>
                  <span className="text-[10px] text-slate-500 block">Ley N° 21.442 sobre Copropiedad Inmobiliaria</span>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  {city}, {noticeDate}
                </div>
              </div>

              <div className="space-y-0.5 text-slate-700">
                <p><strong>Señor(a):</strong> {outgoingAdmin}</p>
                <p><strong>Administrador(a) del:</strong> {condo}</p>
                <p><strong>Presente</strong></p>
                <p className="pt-1 text-[#0F3D2E] font-bold">
                  REF: Notificación de término de funciones y aviso de 30 días.
                </p>
              </div>

              <p>Estimado(a):</p>
              <p>
                Por medio de la presente, el Comité de Administración del <strong>{condo}</strong>, en representación de la comunidad y en ejercicio de las facultades que le confiere la Ley N° 21.442 sobre Copropiedad Inmobiliaria y el Reglamento de Copropiedad, cumple con notificarle formalmente la decisión de poner término a la prestación de sus servicios como Administrador del condominio.
              </p>
              <p>
                Con el propósito de asegurar una transición ordenada y dar cumplimiento al plazo de preaviso correspondiente, sus funciones se extenderán por <strong>30 días a contar de la entrega de este documento</strong>, siendo su último día de gestión el <strong>{endDate}</strong>.
              </p>
              <p>
                Durante este período, y en estricto apego a lo establecido en el Artículo 20 (y concordantes) de la nueva Ley de Copropiedad Inmobiliaria (Ley 21.442), solicitamos a usted preparar y tener a disposición para la fecha de término la siguiente documentación y procesos de cierre:
              </p>

              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 text-[11px]">
                <p>• <strong>Rendición de Cuentas Documentada:</strong> Balance final de ingresos y egresos, junto con las cartolas bancarias y conciliaciones hasta el {endDate}.</p>
                <p>• <strong>Traspaso de Documentación:</strong> Entrega del Libro de Actas, registro actualizado de copropietarios, archivo de gastos comunes, planos, pólizas de seguro, certificados de instalaciones (ascensores, gas) y bitácoras de mantención.</p>
                <p>• <strong>Gestión Laboral y Previsional:</strong> Contratos de trabajo del personal del condominio, comprobantes de pago de cotizaciones (Previred), liquidaciones de sueldo al día y finiquitos en caso de corresponder.</p>
                <p>• <strong>Accesos, Cuentas y Claves:</strong> Traspaso formal de las credenciales de cuentas bancarias (Fondo de Reserva y cuenta ordinaria), portal del SII, Dirección del Trabajo, correos electrónicos y cualquier software de administración utilizado.</p>
                <p>• <strong>Caja Chica y Fondos:</strong> Entrega de los fondos en efectivo y detalle de cheques por cobrar o emitidos no cobrados.</p>
              </div>

              <p>
                Por nuestra parte, como Comité de Administración, nos comprometemos a facilitar este proceso de transición, a revisar la rendición de cuentas en los plazos legales y a formalizar la recepción mediante un Acta de Traspaso el último día de sus funciones.
              </p>
              <p>
                Agradecemos su gestión durante este tiempo y esperamos llevar a cabo este cierre de manera transparente y colaborativa.
              </p>

              <div className="pt-4 grid grid-cols-2 gap-6 border-t border-slate-200 text-center">
                <div className="space-y-0.5">
                  <div className="h-8 border-b border-slate-400" />
                  <p className="font-bold text-slate-800">{committeePresident}</p>
                  <p className="text-[10px] text-slate-500">Presidente del Comité de Administración</p>
                  <p className="text-[9px] text-slate-400">{condo}</p>
                </div>
                <div className="space-y-0.5 text-left">
                  <div className="h-8 border-b border-slate-400" />
                  <p className="font-bold text-slate-800">Recibí Conforme (Administrador Saliente)</p>
                  <p className="text-[10px] text-slate-500">Nombre y RUT: ____________________</p>
                  <p className="text-[9px] text-slate-400">Fecha de recepción: ___/___/2026</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBTAB 2: CHECKLIST DE TRASPASO (3 PÁGS) ==================== */}
        {activeSubTab === 'checklist' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Solicitud Simple de Antecedentes • Checklist para solicitar hoy a la administración vigente
                </span>
                <span className="text-[11px] text-slate-500">
                  Formato de 3 páginas exactas estructurado en Bloques A, B, C, D y E con casillas de verificación.
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrintTransitionChecklist}
                className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                <span>Imprimir Checklist (3 Págs)</span>
              </button>
            </div>

            {/* TABLAS INTERACTIVAS ORIGINALES */}
            <div className="space-y-3 max-w-3xl mx-auto">
              {/* BLOQUE A */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-2 font-bold text-xs flex justify-between">
                  <span>A. GOBIERNO Y DOCUMENTACIÓN LEGAL</span>
                  <span className="text-[10px] text-[#D4B895]">Pág. 1 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'a1', label: 'Reglamento de copropiedad vigente y sus modificaciones.' },
                    { id: 'a2', label: 'Libro de Actas foliado y actas de asambleas y Comité.' },
                    { id: 'a3', label: 'Registro actualizado de copropietarios, arrendatarios y ocupantes.' },
                    { id: 'a4', label: 'Plan de Emergencia y demás documentos de seguridad disponibles.' },
                    { id: 'a5', label: 'Planos, manuales, garantías y antecedentes técnicos bajo custodia.' }
                  ].map(item => (
                    <div key={item.id} className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3 h-3" />}
                      </button>
                      <span className="flex-1 font-medium text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE B */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-2 font-bold text-xs flex justify-between">
                  <span>B. INFORMACIÓN ADMINISTRATIVA Y FINANCIERA</span>
                  <span className="text-[10px] text-[#D4B895]">Pág. 1 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'b1', label: 'Última rendición de cuentas documentada y respaldos disponibles.' },
                    { id: 'b2', label: 'Cartolas bancarias y conciliaciones actualizadas.' },
                    { id: 'b3', label: 'Estado de fondos de la comunidad y reserva.' },
                    { id: 'b4', label: 'Informe de morosidad y convenios de pago vigentes.' },
                    { id: 'b5', label: 'Listado de cuentas y obligaciones pendientes con proveedores.' },
                    { id: 'b6', label: 'Últimos gastos comunes emitidos y antecedentes necesarios para continuidad.' }
                  ].map(item => (
                    <div key={item.id} className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3 h-3" />}
                      </button>
                      <span className="flex-1 font-medium text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE C */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-2 font-bold text-xs flex justify-between">
                  <span>C. PERSONAL Y PROVEEDORES</span>
                  <span className="text-[10px] text-[#D4B895]">Pág. 2 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'c1', label: 'Contratos y anexos de trabajadores vigentes, cuando corresponda.' },
                    { id: 'c2', label: 'Liquidaciones, cotizaciones previsionales y antecedentes laborales necesarios para continuidad.' },
                    { id: 'c3', label: 'Contratos vigentes con proveedores y empresas de mantención.' },
                    { id: 'c4', label: 'Listado de proveedores, contactos, servicios, fechas de renovación y trabajos pendientes.' }
                  ].map(item => (
                    <div key={item.id} className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3 h-3" />}
                      </button>
                      <span className="flex-1 font-medium text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE D */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-2 font-bold text-xs flex justify-between">
                  <span>D. MANTENCIONES, SEGUROS Y CERTIFICACIONES</span>
                  <span className="text-[10px] text-[#D4B895]">Pág. 2 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'd1', label: 'Pólizas de seguros vigentes (espacios comunes contra incendio y complementarias).' },
                    { id: 'd2', label: 'Certificaciones y mantenciones de instalaciones que correspondan (gas SEC, ascensores Minvu).' },
                    { id: 'd3', label: 'Calendario de mantenciones preventivas y correctivas (bombas, generador, calderas).' },
                    { id: 'd4', label: 'Informes técnicos, presupuestos aprobados y trabajos en ejecución o pendientes.' }
                  ].map(item => (
                    <div key={item.id} className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3 h-3" />}
                      </button>
                      <span className="flex-1 font-medium text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOQUE E */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-2 font-bold text-xs flex justify-between">
                  <span>E. SISTEMAS, ARCHIVOS Y ELEMENTOS BAJO CUSTODIA</span>
                  <span className="text-[10px] text-[#D4B895]">Pág. 3 de 3</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'e1', label: 'Correo institucional y respaldo digital de la documentación administrativa.' },
                    { id: 'e2', label: 'Traspaso seguro de accesos y claves a plataformas utilizadas por la comunidad (bancos, SII, DT).' },
                    { id: 'e3', label: 'Llaves, controles, tarjetas, dispositivos y demás bienes bajo custodia física.' },
                    { id: 'e4', label: 'Listado de reclamos, cobranzas, procedimientos, trámites y asuntos pendientes.' }
                  ].map(item => (
                    <div key={item.id} className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer ${
                          checklistValues[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {checklistValues[item.id] && <Check className="w-3 h-3" />}
                      </button>
                      <span className="flex-1 font-medium text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBTAB 3: ACTA & CONTRATO ==================== */}
        {activeSubTab === 'acta' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Formalización Legal: Cláusulas para el Libro de Actas & Contrato Marco
                </span>
                <span className="text-[11px] text-slate-500">
                  La personería legal del administrador ante bancos y notarías se valida mediante el <strong>Acta de Nombramiento</strong>.
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActaOrContract('acta')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    actaOrContract === 'acta' ? 'bg-[#0F3D2E] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cláusulas Libro de Actas
                </button>
                <button
                  type="button"
                  onClick={() => setActaOrContract('contrato')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    actaOrContract === 'contrato' ? 'bg-[#0F3D2E] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contrato Marco (2 Págs)
                </button>
              </div>
            </div>

            {actaOrContract === 'acta' ? (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyClauses}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedClause ? '✓ ¡Copiado!' : 'Copiar Cláusulas del Acta'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
                  {assemblyClausesText}
                </pre>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePrintContract}
                    className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                    <span>Imprimir Contrato (2 Págs)</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p><strong>Contrato Marco Bilateral (10 Cláusulas):</strong> Regula detalladamente la relación entre el Comité y ARANPRO Gestión Integral, estableciendo 2 visitas técnicas presenciales semanales, emergencias 24/7, suite digital sin cobro de licencias, honorario mensual de {feeStr}, cuentas corrientes exclusivas de la comunidad y preaviso formal de 30 días.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SUBTAB 4: GUÍAS LEGALES ==================== */}
        {activeSubTab === 'guias' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Asesoría Legal para Comités: Diferencias Prácticas y Quórums según Ley N° 21.442
                </span>
                <span className="text-[11px] text-slate-500">
                  Cuadros comparativos oficiales listos para consulta o impresión horizontal en 1 sola página.
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrintLegalGuides}
                className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                <span>Imprimir Ficha Quórums (Horizontal)</span>
              </button>
            </div>

            {/* TABLA ORIGINAL DE QUÓRUMS */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F3D2E] text-white">
                  <tr>
                    <th className="p-2.5 font-bold">Tipo de Asamblea</th>
                    <th className="p-2.5 font-bold">Materias que Pueden Tratarse</th>
                    <th className="p-2.5 font-bold text-center">Quórum Sesionar</th>
                    <th className="p-2.5 font-bold text-center">Quórum Acordar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-2.5 font-bold text-[#0F3D2E]">ORDINARIA</td>
                    <td className="p-2.5">Rendición de cuentas y balances; designación/remoción del Comité; <strong>designación o remoción del administrador</strong>; actualizaciones plan de emergencia; asuntos ordinarios.</td>
                    <td className="p-2.5 text-center font-bold">Mínimo 33% derechos</td>
                    <td className="p-2.5 text-center font-bold text-emerald-800">Mayoría absoluta asistentes</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-blue-900">EXTRAORDINARIA MAYORÍA ABSOLUTA</td>
                    <td className="p-2.5">Modificación de reglamento; remoción de miembros del comité; gastos extraordinarios que excedan 6 cuotas GGCC; uso de fondo de reserva.</td>
                    <td className="p-2.5 text-center font-bold">Mayoría absoluta derechos</td>
                    <td className="p-2.5 text-center font-bold text-blue-900">Mayoría absoluta derechos totales</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-purple-900">EXTRAORDINARIA MAYORÍA REFORZADA</td>
                    <td className="p-2.5">Delegación de facultades al comité; enajenación/gravamen de bienes comunes; demolición; retribución miembros comité; seguros que modifiquen riesgos.</td>
                    <td className="p-2.5 text-center font-bold">Al menos 66% derechos</td>
                    <td className="p-2.5 text-center font-bold text-purple-900">66% derechos totales</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* BOTONES DE ACCIÓN INMEDIATA PASO 5 */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
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
          {expandedMsg ? 'Ocultar Texto Propuesto' : 'Ver Texto Propuesto'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMsg ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ACORDEÓN DE TEXTO PROPUESTO PASO 5 */}
      {expandedMsg && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide block">
            Mensaje para Compartir el Kit de Asesoría Legal y Pauta de Traspaso
          </span>
          <pre className="whitespace-pre-wrap font-sans text-slate-800 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
            {getStepMessages(5)?.whatsapp}
          </pre>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN OCULTA: ELEMENTOS CANÓNICOS IMPRIMIBLES CON CONTENIDO ORIGINAL REPARADO */}
      {/* ========================================================================= */}
      <div className="hidden" aria-hidden="true">

        {/* 1. CARTA DE TÉRMINO — DOCUMENTO NEUTRO DEL COMITÉ (sin marca ARANPRO, formato legal, 1 página Carta) */}
        <div id="printable-termination-notice" data-pdf-style="neutral">
          <div
            data-pdf-style="neutral"
            className="dossier-page page-1 bg-white text-black"
            style={{ fontFamily: "'Times New Roman', Times, Georgia, serif", fontSize: '13.5pt', lineHeight: 1.5 }}
          >
            <div style={{ padding: '6mm 8mm 0 8mm' }}>
              <p style={{ textAlign: 'right', margin: '0 0 14px 0' }}>{city}, {noticeDate}</p>

              <p style={{ margin: 0 }}>Señor(a)</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{outgoingAdmin}</p>
              <p style={{ margin: 0 }}>Administrador(a) del {condo}</p>
              <p style={{ margin: '0 0 12px 0' }}>Presente</p>

              <p style={{ margin: '0 0 12px 0' }}>
                <strong>Ref.:</strong> Notificación de término de funciones y aviso de 30 días.
              </p>

              <p style={{ margin: '0 0 8px 0' }}>Estimado(a):</p>
              <p style={{ margin: '0 0 8px 0', textAlign: 'justify' }}>
                Por medio de la presente, el Comité de Administración del <strong>{condo}</strong>, en representación de la comunidad y en ejercicio de las facultades que le confiere la Ley N° 21.442 sobre Copropiedad Inmobiliaria y el Reglamento de Copropiedad, cumple con notificarle formalmente la decisión de poner término a la prestación de sus servicios como Administrador del condominio.
              </p>
              <p style={{ margin: '0 0 8px 0', textAlign: 'justify' }}>
                Con el propósito de asegurar una transición ordenada y dar cumplimiento al plazo de preaviso correspondiente, sus funciones se extenderán por <strong>30 días a contar de la entrega de este documento</strong>, siendo su último día de gestión el <strong>{endDate}</strong>.
              </p>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                Durante este período, y en estricto apego a lo establecido en el Artículo 20 (y concordantes) de la Ley N° 21.442 sobre Copropiedad Inmobiliaria, solicitamos a usted preparar y tener a disposición, para la fecha de término, la siguiente documentación y procesos de cierre:
              </p>

              <ol style={{ margin: '0 0 8px 0', paddingLeft: '22px', textAlign: 'justify', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '4px' }}><strong>Rendición de Cuentas Documentada:</strong> Balance final de ingresos y egresos, junto con las cartolas bancarias y conciliaciones hasta el {endDate}.</li>
                <li style={{ marginBottom: '4px' }}><strong>Traspaso de Documentación:</strong> Entrega del Libro de Actas, registro actualizado de copropietarios, archivo de gastos comunes, planos, pólizas de seguro, certificados de instalaciones (ascensores, gas) y bitácoras de mantención.</li>
                <li style={{ marginBottom: '4px' }}><strong>Gestión Laboral y Previsional:</strong> Contratos de trabajo del personal del condominio, comprobantes de pago de cotizaciones (Previred), liquidaciones de sueldo al día y finiquitos en caso de corresponder.</li>
                <li style={{ marginBottom: '4px' }}><strong>Accesos, Cuentas y Claves:</strong> Traspaso formal de las credenciales de cuentas bancarias (Fondo de Reserva y cuenta ordinaria), portal del SII, Dirección del Trabajo, correos electrónicos y cualquier software de administración utilizado.</li>
                <li><strong>Caja Chica y Fondos:</strong> Entrega de los fondos en efectivo y detalle de cheques por cobrar o emitidos no cobrados.</li>
              </ol>

              <p style={{ margin: '0 0 8px 0', textAlign: 'justify' }}>
                Por nuestra parte, como Comité de Administración, nos comprometemos a facilitar este proceso de transición, a revisar la rendición de cuentas en los plazos legales y a formalizar la recepción mediante un Acta de Traspaso el último día de sus funciones.
              </p>
              <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
                Agradecemos su gestión durante este tiempo y esperamos llevar a cabo este cierre de manera transparente y colaborativa.
              </p>
              <p style={{ margin: '0 0 34px 0' }}>Atentamente,</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', fontSize: '12.5pt' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
                    <div style={{ fontWeight: 'bold' }}>{committeePresident}</div>
                    <div>Presidente del Comité de Administración</div>
                    <div>{condo}</div>
                  </div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
                    <div style={{ fontWeight: 'bold' }}>Recibí Conforme</div>
                    <div>Nombre y RUT: ______________________</div>
                    <div>Fecha de recepción: ____ / ____ / 2026</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. PRINTABLE CHECKLIST DE ANTECEDENTES (EXACTAMENTE 3 PÁGINAS FOLIADAS) */}
        <div id="printable-transition-checklist" data-pdf-style={pdfStyle}>
          {/* PÁGINA 1 DE 3 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-6 pl-10 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-snug relative overflow-hidden"
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
              <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-2">
                <div>
                  <span className="font-black text-[#0F3D2E] text-xs block">{adminName.toUpperCase()}</span>
                  <span className="text-[9.5px] text-slate-600 font-bold block">Constructor Civil • Administrador de Condominios RNAC MINVU</span>
                  <span className="text-[9px] text-slate-500 block">Documento para uso del Comité antes del cambio de administración</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-xs block">{condo.toUpperCase()}</span>
                  <span className="text-[9px] text-slate-500 font-mono block">{city} • Pág. 1 de 3</span>
                </div>
              </div>

              <div className="text-center py-0.5">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  SOLICITUD SIMPLE DE ANTECEDENTES
                </h4>
                <p className="text-[11px] font-bold text-[#0F3D2E]">Checklist para solicitar hoy a la administración vigente</p>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[10px] text-slate-700 leading-snug">
                <strong>El Comité puede utilizar este listado para solicitar una entrega ordenada de antecedentes y resguardar la continuidad de la comunidad.</strong> La recepción de documentos no implica aprobación de la gestión anterior; posteriormente deberán revisarse su integridad, vigencia y consistencia.
              </div>

              {/* BLOQUE A */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1 font-bold text-[10.5px] uppercase">
                  A. Gobierno y Documentación Legal
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="p-1.5 w-3/5 font-bold">Antecedente</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">Sí</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">No</th>
                      <th className="p-1.5 w-1/5 font-bold">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 font-medium">Reglamento de copropiedad vigente y sus modificaciones.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Libro de Actas foliado y actas de asambleas y Comité.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Registro actualizado de copropietarios, arrendatarios y ocupantes.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Plan de Emergencia y demás documentos de seguridad disponibles.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Planos, manuales, garantías y antecedentes técnicos bajo custodia.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                  </tbody>
                </table>
              </div>

              {/* BLOQUE B */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1 font-bold text-[10.5px] uppercase">
                  B. Información Administrativa y Financiera
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="p-1.5 w-3/5 font-bold">Antecedente</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">Sí</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">No</th>
                      <th className="p-1.5 w-1/5 font-bold">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 font-medium">Última rendición de cuentas documentada y respaldos disponibles.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Cartolas bancarias y conciliaciones actualizadas.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Estado de fondos de la comunidad y reserva.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Informe de morosidad y convenios de pago vigentes.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Listado de cuentas y obligaciones pendientes con proveedores.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Últimos gastos comunes emitidos y antecedentes necesarios para continuidad.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-right text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-200 relative z-10">
              {adminName} | {email} | Fono: {phone}
            </div>
          </div>

          {/* PÁGINA 2 DE 3 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-2 bg-white p-6 pl-10 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-snug relative overflow-hidden"
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

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-2">
                <span className="font-bold text-[#0F3D2E] text-xs">CHECKLIST DE ANTECEDENTES • TRASPASO DE ADMINISTRACIÓN</span>
                <span className="text-[9px] text-slate-500 font-mono">{condo} • Pág. 2 de 3</span>
              </div>

              {/* BLOQUE C */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1 font-bold text-[10.5px] uppercase">
                  C. Personal y Proveedores
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="p-1.5 w-3/5 font-bold">Antecedente</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">Sí</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">No</th>
                      <th className="p-1.5 w-1/5 font-bold">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 font-medium">Contratos y anexos de trabajadores vigentes, cuando corresponda.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Liquidaciones, cotizaciones previsionales y antecedentes laborales necesarios para continuidad.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Contratos vigentes con proveedores y empresas de mantención.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Listado de proveedores, contactos, servicios, fechas de renovación y trabajos pendientes.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                  </tbody>
                </table>
              </div>

              {/* BLOQUE D */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1 font-bold text-[10.5px] uppercase">
                  D. Mantenciones, Seguros y Certificaciones
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="p-1.5 w-3/5 font-bold">Antecedente</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">Sí</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">No</th>
                      <th className="p-1.5 w-1/5 font-bold">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 font-medium">Pólizas de seguros vigentes (espacios comunes contra incendio y complementarias).</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Certificaciones y mantenciones de instalaciones que correspondan (gas SEC, ascensores Minvu).</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Calendario de mantenciones preventivas y correctivas (bombas, generador, calderas).</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Informes técnicos, presupuestos aprobados y trabajos en ejecución o pendientes.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-right text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-200 relative z-10">
              {adminName} | {email} | Fono: {phone}
            </div>
          </div>

          {/* PÁGINA 3 DE 3 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-3 bg-white p-6 pl-10 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-snug relative overflow-hidden"
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

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-2">
                <span className="font-bold text-[#0F3D2E] text-xs">CHECKLIST DE ANTECEDENTES • TRASPASO DE ADMINISTRACIÓN</span>
                <span className="text-[9px] text-slate-500 font-mono">{condo} • Pág. 3 de 3</span>
              </div>

              {/* BLOQUE E */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1 font-bold text-[10.5px] uppercase">
                  E. Sistemas, Archivos y Elementos bajo Custodia
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="p-1.5 w-3/5 font-bold">Antecedente</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">Sí</th>
                      <th className="p-1.5 w-1/10 text-center font-bold">No</th>
                      <th className="p-1.5 w-1/5 font-bold">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td className="p-1.5 font-medium">Correo institucional y respaldo digital de la documentación administrativa.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Traspaso seguro de accesos y claves a plataformas utilizadas por la comunidad (bancos, SII, DT).</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Llaves, controles, tarjetas, dispositivos y demás bienes bajo custodia física.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                    <tr><td className="p-1.5 font-medium">Listado de reclamos, cobranzas, procedimientos, trámites y asuntos pendientes.</td><td className="p-1.5 text-center">☐</td><td className="p-1.5 text-center">☐</td><td className="p-1.5"></td></tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-[10px] text-emerald-950 leading-relaxed">
                <strong>Recomendación práctica para la asamblea:</strong> si se acuerda el cambio de administración, dejar en el acta la <strong>fecha de término de la administración vigente</strong>, la <strong>designación de la nueva administración</strong> cuando corresponda, el <strong>plazo de entrega de antecedentes</strong> y la persona del Comité encargada de coordinar el traspaso.
              </div>
            </div>

            {/* Firmas originales */}
            <div className="pt-3 border-t border-slate-200 relative z-10">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-1.5 space-y-0.5">
                  <p className="font-bold text-slate-900">{committeePresident}</p>
                  <p className="text-[10px] text-slate-500">Por el Comité de Administración</p>
                </div>
                <div className="border-t border-slate-400 pt-1.5 space-y-0.5">
                  <p className="font-bold text-slate-900">{outgoingAdmin}</p>
                  <p className="text-[10px] text-slate-500">Administrador(a) Saliente</p>
                </div>
              </div>

              <div className="text-right text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-200 mt-2">
                {adminName} | {email} | Fono: {phone}
              </div>
            </div>
          </div>
        </div>

        {/* 3. PRINTABLE GUÍAS LEGALES (EXACTAMENTE 1 PÁGINA HORIZONTAL CARTA SIN HOJAS VACÍAS) */}
        <div id="printable-legal-advisory-sheet" data-pdf-style={pdfStyle}>
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-6 pl-10 min-h-[195px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[1050px] leading-snug relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>

            <div className="space-y-2 relative z-10">
              <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-1.5">
                <div>
                  <span className="font-black text-[#0F3D2E] text-xs uppercase tracking-tight block">
                    ARANPRO GESTIÓN INTEGRAL • ASESORÍA LEGAL PARA COMITÉS
                  </span>
                  <span className="text-[9.5px] text-slate-600 block">
                    Diferencias Prácticas y Quórums según Ley N° 21.442 y DS N° 7 MINVU (09.01.2025)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-xs block">{condo.toUpperCase()}</span>
                  <span className="text-[9px] text-slate-500 font-mono block">{city}, Región de Coquimbo</span>
                </div>
              </div>

              {/* TABLA EXACTA DEL PDF ORIGINAL */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <div className="bg-[#0F3D2E] text-white px-3 py-1 font-bold text-[10.5px] uppercase">
                  ASAMBLEAS - MATERIAS Y QUÓRUM (ART. 15 LEY 21.442)
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="p-2 w-1/4 font-bold">Tipo de Asamblea</th>
                      <th className="p-2 w-1/2 font-bold">Materias que Pueden Tratarse</th>
                      <th className="p-2 w-1/8 text-center font-bold">Quórum Sesionar</th>
                      <th className="p-2 w-1/8 text-center font-bold">Quórum Acordar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 font-bold text-[#0F3D2E] bg-emerald-50/30">ORDINARIA</td>
                      <td className="p-2">Rendición de cuentas y balances; designación/remoción del Comité; <strong>designación o remoción del administrador</strong>; actualizaciones plan de emergencia; asuntos ordinarios.</td>
                      <td className="p-2 text-center font-bold">Mínimo 33% derechos</td>
                      <td className="p-2 text-center font-bold text-emerald-800">Mayoría absoluta asistentes</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-blue-900 bg-blue-50/30">EXTRAORDINARIA MAYORÍA ABSOLUTA</td>
                      <td className="p-2">Modificación de reglamento; remoción de miembros del comité; gastos extraordinarios que excedan 6 cuotas GGCC; uso de fondo de reserva.</td>
                      <td className="p-2 text-center font-bold">Mayoría absoluta derechos</td>
                      <td className="p-2 text-center font-bold text-blue-900">Mayoría absoluta derechos totales</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-purple-900 bg-purple-50/30">EXTRAORDINARIA MAYORÍA REFORZADA</td>
                      <td className="p-2">Delegación de facultades al comité; enajenación/gravamen de bienes comunes; demolición; retribución miembros comité; seguros que modifiquen riesgos.</td>
                      <td className="p-2 text-center font-bold">Al menos 66% derechos</td>
                      <td className="p-2 text-center font-bold text-purple-900">66% derechos totales</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ficha complementaria del Comité */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-[9.5px]">
                <div>
                  <span className="font-bold text-[#0F3D2E] block uppercase">Facultades Exclusivas del Comité (DS N° 7 MINVU):</span>
                  <p className="text-slate-600">• Dictar normas de convivencia y reglamentos internos operativos.</p>
                  <p className="text-slate-600">• Autorizar convenios de pago a unidades morosas hasta 12 cuotas.</p>
                  <p className="text-slate-600">• Aplicar multas del reglamento y aprobar presupuestos ordinarios.</p>
                </div>
                <div>
                  <span className="font-bold text-rose-900 block uppercase">Materias Prohibidas (Reservadas a la Asamblea):</span>
                  <p className="text-slate-600">• Modificación del Reglamento de Copropiedad.</p>
                  <p className="text-slate-600">• Gastos extraordinarios que superen 6 cuotas de gastos comunes.</p>
                  <p className="text-slate-600">• Enajenación, gravamen o demolición de bienes comunes.</p>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>{adminName} • Constructor Civil • Administrador RNAC MINVU</div>
              <div className="font-bold text-[#0F3D2E]">Cuadro Oficial de Quórums y Asambleas • Ley N° 21.442</div>
              <div>{email}</div>
            </div>
          </div>
        </div>

        {/* 4. PRINTABLE CONTRATO MARCO (2 PÁGINAS CARTA) */}
        <div id="printable-management-contract" data-pdf-style={pdfStyle}>
          {/* PÁGINA 1 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-1 bg-white p-6 pl-10 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-snug relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="text-center space-y-0.5 border-b-2 border-[#0F3D2E] pb-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">REPÚBLICA DE CHILE • LEY N° 21.442</span>
                <h4 className="text-sm font-black text-slate-900 uppercase">
                  CONTRATO DE PRESTACIÓN DE SERVICIOS DE ADMINISTRACIÓN PROFESIONAL DE CONDOMINIOS
                </h4>
                <p className="text-[10px] text-[#0F3D2E] font-bold uppercase">{condo} • {city}</p>
              </div>

              <div className="space-y-2 text-[10px] leading-relaxed text-slate-800 text-justify">
                <p>
                  En <strong>{city}</strong>, a {noticeDate}, entre la <strong>Comunidad del Condominio {condo}</strong>, debidamente representada por su Comité de Administración en la persona de su Presidente(a) don(ña) <strong>{committeePresident}</strong>, en adelante "La Comunidad"; y por la otra parte, <strong>ARANPRO GESTIÓN INTEGRAL</strong>, representada por don <strong>John Andrés Arancibia Maureira</strong>, Constructor Civil, cédula de identidad N° {adminRut}, con inscripción vigente en el Registro Nacional de Administradores de Condominios (RNAC) del MINVU, en adelante "El Administrador", se suscribe el presente contrato:
                </p>

                <p><strong>PRIMERO (OBJETO):</strong> La Comunidad encomienda a El Administrador la gestión integral, financiera, técnica, legal y comunitaria del condominio {condo}, en estricta sujeción a las disposiciones de la Ley N° 21.442, su Reglamento y el Reglamento de Copropiedad del condominio.</p>
                <p><strong>SEGUNDO (ALCANCE OPERATIVO):</strong> El Administrador mantendrá presencia técnica en terreno con periodicidad de 2 visitas técnicas presenciales por semana + atención de emergencias 24/7, realizando inspecciones periciales periódicas a las salas de bombas, tableros eléctricos, ascensores, calderas y cubiertas.</p>
                <p><strong>TERCERO (SUITE DIGITAL Y TRANSPARENCIA):</strong> El Administrador habilitará sin costo de licencias para la comunidad la plataforma Web y App Móvil ARANPRO, garantizando acceso en tiempo real a cartolas bancarias, facturas electrónicas auditadas y libro de reclamos foliado.</p>
                <p><strong>CUARTO (HONORARIOS):</strong> La Comunidad pagará a El Administrador por sus servicios profesionales un honorario mensual de {feeStr} (Factura Exenta / Boleta de Honorarios Profesional), pagadero dentro de los primeros 5 días hábiles del mes calendario siguiente.</p>
                <p><strong>QUINTO (CUENTAS BANCARIAS EXCLUSIVAS):</strong> Todos los recursos del condominio se manejarán exclusivamente en cuentas corrientes bancarias y de ahorro abiertas a nombre exclusivo de la Comunidad, prohibiéndose taxativamente el uso de cuentas personales.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Contrato de Servicios de Administración • {condo} (Pág. 1 de 2)</div>
              <div>{city}, Chile</div>
            </div>
          </div>

          {/* PÁGINA 2 */}
          <div
            data-pdf-style={pdfStyle}
            className="dossier-page page-2 bg-white p-6 pl-10 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-snug relative overflow-hidden"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
              <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
              <div className="w-[2px] h-full bg-transparent" />
              <div className="w-[1.5px] h-full bg-[#D4B895]" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="space-y-2 text-[10px] leading-relaxed text-slate-800 text-justify">
                <p><strong>SEXTO (VIGENCIA):</strong> El presente contrato tendrá una vigencia de un año a contar de la asunción formal de funciones, renovable tácita y sucesivamente según el Artículo 17 de la Ley N° 21.442.</p>
                <p><strong>SÉPTIMO (TÉRMINO ANTICIPADO):</strong> Cualquiera de las partes podrá poner término anticipado al presente contrato dando aviso formal por escrito a la otra con a lo menos 30 días de anticipación.</p>
                <p><strong>OCTAVO (COBRANZA Y APREMIOS):</strong> Se faculta expresamente al Administrador para cobrar gastos comunes ordinarios y extraordinarios y solicitar el corte de suministro eléctrico a deudores de 3 cuotas impagas conforme al Art. 20 N° 9 Ley 21.442.</p>
                <p><strong>NOVENO (GESTIÓN LABORAL):</strong> Supervisión directa del personal de conserjería y verificación mensual del pago previsional en Previred (Ley Bustos).</p>
                <p><strong>DÉCIMO (PERSONERÍA Y EJEMPLARES):</strong> El presente contrato se firma en 2 ejemplares de idéntico tenor, quedando uno en poder de cada parte.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 relative z-10">
              <div className="grid grid-cols-2 gap-8 text-center text-[10.5px]">
                <div className="space-y-1">
                  <div className="h-12 border-b border-slate-400" />
                  <p className="font-bold text-slate-900">{committeePresident}</p>
                  <p className="text-[9.5px] text-[#0F3D2E] font-bold">Presidente(a) del Comité de Administración</p>
                  <p className="text-[9px] text-slate-500 font-mono">Por la Comunidad (Comité de Administración)</p>
                </div>

                <div className="space-y-1">
                  <div className="h-12 flex items-end justify-center pb-0.5 overflow-visible">
                    {effectiveSignature ? (
                      <img
                        src={effectiveSignature}
                        alt="Firma Administrador"
                        className="h-10 max-h-12 w-auto max-w-[180px] object-contain mx-auto"
                        style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                      />
                    ) : (
                      <div className="border-b border-slate-400 w-full h-8" />
                    )}
                  </div>
                  <div className="border-t border-[#0F3D2E] pt-0.5">
                    <p className="font-black text-slate-900">{adminName}</p>
                    <p className="text-[9.5px] text-[#0F3D2E] font-bold">Por ARANPRO Gestión Integral (Administrador)</p>
                    <p className="text-[9px] text-slate-600 font-mono">Inscripción RNAC MINVU Vigente</p>
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

        {/* 5. PRINTABLE FULL PACKAGE */}
        <div id="printable-transition-package" data-pdf-style={pdfStyle} className="space-y-4">
          <div className="p-8 bg-white text-slate-900 text-xs space-y-4 max-w-[800px]">
            <div className="p-6 bg-[#0F3D2E] text-white rounded-2xl text-center space-y-2">
              <span className="text-[10px] font-mono text-[#D4B895] uppercase tracking-widest block">ARANPRO GESTIÓN INTEGRAL</span>
              <h3 className="text-lg font-black text-white">Kit Oficial de Transición y Traspaso de Administración</h3>
              <p className="text-xs text-emerald-100">{condo} • {city}, {noticeDate}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
