import { CommitteeGuide, guideTitles, printCommitteeGuide } from './CommitteeGuides';
import { ContractDetailsForm } from './ContractDetailsForm';
import React, { useState, useMemo } from 'react';
import {
  FileText, CheckSquare, ShieldCheck, Mail, MessageCircle, Copy, Printer,
  Eye, Download, RefreshCw, Send, ChevronDown, ChevronUp, AlertCircle,
  Clock, CheckCircle2, UserCheck, Building2, Key, Scale, Award,
  HelpCircle, ArrowRight, BookOpen, PenTool, ExternalLink, Calendar,
  DollarSign, Sparkles, Check, X
} from 'lucide-react';
import { ManagementContract, managementContractPrintStyles } from './ManagementContract';
import { printDocumentDirectly } from '../../../utils/printDocument';
import { formatCLP } from '../../../utils/formatters';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector, useAranproPdfStyle } from '../../common/MauranLogo';
import { TransitionChecklistPrint, TransitionChecklistScreen, transitionChecklistPrintStyles } from './TransitionChecklist';
import { activeProposalConditions } from '../../../utils/proposalConditions';
import { CanonicalPdfHeader, CanonicalPdfPageFooter, CanonicalPdfFinalSignature, canonicalPortraitPrintStyles, canonicalLandscapePrintStyles } from '../../common/CanonicalPdfParts';

export const Step5TransitionPanel = ({
  onSaveContract,
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
  const [selectedGuide, setSelectedGuide] = useState('comite');
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('carta'); // 'carta' | 'checklist' | 'acta' | 'guias'
  const [actaOrContract, setActaOrContract] = useState('acta'); // 'acta' | 'contrato'
  const [expandedMsg, setExpandedMsg] = useState(false);
  const [previewStep5Modal, setPreviewStep5Modal] = useState(null);
  const [copiedClause, setCopiedClause] = useState(false);
  const [pdfStyle, setPdfStyle] = useAranproPdfStyle('alt4');
  const [transitionStatus, setTransitionStatus] = useState({});
  const [transitionNotes, setTransitionNotes] = useState({});

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
  const feeStr = !proposalConfig.unknownDetails && Number(proposalConfig.proposedMonthlyFee) > 0 ? formatCLP(Number(proposalConfig.proposedMonthlyFee)) : 'por definir';
  const terms = activeProposalConditions(proposalConfig);
  const effectiveSignature = signatureImage || companySettings?.signatureDataUrl || '';
  const effectiveSignatureScale = Number(companySettings?.signatureScale) || Number(signatureScale) || 1;

  // Fechas de transición
  const noticeDate = proposalConfig.transitionNoticeDate || new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const endDate = proposalConfig.transitionEndDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const outgoingAdmin = proposalConfig.outgoingAdminName?.trim() || 'Señor(a) Administrador(a) Saliente';
  const committeePresident = proposalConfig.committeePresidentName?.trim() || 'Presidente(a) del Comité de Administración';

  // La carta es un documento del Comité: sus campos no deben inventar datos cuando
  // aún no se han completado en el formulario del Paso 5.
  const terminationNotice = {
    condo: proposalConfig.targetCondo?.trim() || '',
    city: proposalConfig.targetCity?.trim() || '',
    date: proposalConfig.transitionNoticeDate?.trim() || '',
    endDate: proposalConfig.transitionEndDate?.trim() || '',
    agreementReference: proposalConfig.transitionAgreementReference?.trim() || '',
    outgoingAdmin: proposalConfig.outgoingAdminName?.trim() || '',
    committeePresident: proposalConfig.committeePresidentName?.trim() || ''
  };

  // Acciones de impresión directa
  const handlePrintTerminationNotice = () => {
    const filename = `Carta_Termino_Administracion_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-termination-notice', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '12mm 15mm 12mm 15mm',
      pdfStyle: 'neutral',
      extraStyles: '.dossier-page{height:255mm !important;min-height:255mm !important;max-height:255mm !important;overflow:hidden !important;display:flex !important;padding:0 !important;page-break-after:avoid !important;break-after:avoid !important;} .dossier-page > div{padding:0 !important;} .dossier-page li, .dossier-page p{orphans:3;widows:3;} .sig-block{page-break-inside:avoid !important;break-inside:avoid !important;}'
    });
  };

  const handlePrintTransitionChecklist = () => {
    const filename = `ARANPRO_Pauta_Checklist_Traspaso_3Pags_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-transition-checklist', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      pdfStyle,
      extraStyles: transitionChecklistPrintStyles
    });
  };

  const handlePrintContract = () => {
    const filename = `ARANPRO_Contrato_Servicios_Administracion_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-management-contract', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      extraStyles: managementContractPrintStyles,
      pdfStyle
    });
  };

  const handlePrintLegalGuides = () => printCommitteeGuide(selectedGuide, proposalConfig);

  const handlePrintTransitionPackage = () => {
    const filename = `ARANPRO_Kit_Oficial_Traspaso_y_Asesoria_${condo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    printDocumentDirectly('printable-transition-package', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      extraStyles: canonicalPortraitPrintStyles,
      pdfStyle
    });
  };

  // Texto de cláusulas redactadas para el libro de actas
  const assemblyClausesText = useMemo(() => {
    return `========================================================================================
PROPUESTA DE ACUERDOS PARA EL LIBRO DE ACTAS DE ASAMBLEA O COMITÉ DE ADMINISTRACIÓN
(Conforme a la Ley N° 21.442 sobre Copropiedad Inmobiliaria y DS N° 7 MINVU 2025)
========================================================================================

CONDOMINIO: ${(proposalConfig.targetCondo?.trim() || '____________________').toUpperCase()}
CIUDAD / COMUNA: ${(proposalConfig.targetCity?.trim() || '____________________').toUpperCase()}
FECHA DE ACUERDO: ____________________

PRIMERO: TÉRMINO Y CESE DE FUNCIONES DE LA ADMINISTRACIÓN ANTERIOR.
La asamblea o el comité, según sus facultades y el acuerdo que efectivamente corresponda, acuerda poner término a las funciones de ${outgoingAdmin}, dejando constancia de la fecha y forma de notificación y de las condiciones aplicables conforme al contrato, la ley y el reglamento de copropiedad. Fecha de término: ${proposalConfig.transitionEndDate?.trim() || '____________________'}. Se solicitará una rendición documentada de la gestión y se coordinará la entrega de libros, registros, antecedentes financieros, contratos, archivos y accesos institucionales, mediante un acta de traspaso que identifique lo recibido y lo pendiente. Los accesos se transferirán o revocarán por los medios autorizados por cada entidad.

SEGUNDO: DESIGNACIÓN DE NUEVA ADMINISTRACIÓN PROFESIONAL.
Se acuerda designar como administrador(a) a ${empresaForm.adminName?.trim() || '____________________'}, RUT ${empresaForm.adminRut?.trim() || '____________________'}, en la calidad y representación que se acrediten en el acuerdo y en el contrato correspondiente. Inicio de funciones: ${terms.startDate || '____________________'}. Se dejará constancia de la verificación de su inscripción vigente en el Registro Nacional de Administradores de Condominios, cuando corresponda, y de la aceptación del encargo. La administración se ejercerá conforme a la Ley N° 21.442, su reglamento, el reglamento de copropiedad y los acuerdos aplicables.

TERCERO: HONORARIOS MENSUALES Y PLAZO DE GESTIÓN.
Se acuerdan honorarios mensuales de ${feeStr}; su forma y oportunidad de pago, documentación tributaria y eventuales servicios adicionales se establecerán en el contrato o acuerdo respectivo. Duración y renovación acordadas: ${terms.contractDuration || '____________________'}. Lo anterior se entiende sin perjuicio de las facultades legales de remoción y de las consecuencias contractuales que correspondan.

CUARTO: FACULTADES BANCARIAS, FINANCIERAS Y ADMINISTRATIVAS.
El administrador ejercerá las funciones legales y las facultades que se le otorguen válidamente, con los límites y controles establecidos por la ley, el reglamento de copropiedad y los acuerdos respectivos. Las atribuciones bancarias, de representación, contratación y firma se detallarán expresamente en el instrumento que corresponda, incluyendo responsables, modalidades y límites de autorización: ____________________. La cobranza y cualquier medida por morosidad se sujetarán a los requisitos legales y reglamentarios aplicables.

QUINTO: MANDATO ESPECIAL PARA PROTOCOLIZACIÓN Y REDUCCIÓN A ESCRITURA PÚBLICA.
Se designa a ____________________ para las gestiones de formalización. Cuando la designación sea acordada por la asamblea, el acta deberá reducirse a escritura pública en los términos del artículo 18 de la Ley N° 21.442. Registrar asistentes, quórum, votación y demás antecedentes del acuerdo efectivo en el acta correspondiente.

RENDICIÓN Y SEGUIMIENTO: El administrador rendirá cuenta documentada de su gestión al comité mensualmente, a la asamblea en sesión ordinaria y al término de la administración, conforme al artículo 21 de la Ley N° 21.442. Las partes coordinarán el seguimiento de los antecedentes pendientes de traspaso.`;
  }, [proposalConfig.targetCondo, proposalConfig.targetCity, outgoingAdmin, empresaForm.adminName, empresaForm.adminRut, feeStr, terms.startDate, terms.contractDuration, proposalConfig.transitionEndDate]);

  const handleCopyClauses = () => {
    navigator.clipboard.writeText(assemblyClausesText);
    setCopiedClause(true);
    showAlert?.('✓ Cláusulas Copiadas', 'El texto canónico para el Libro de Actas ha sido copiado al portapapeles listo para transcribir.', 'success');
    setTimeout(() => setCopiedClause(false), 3000);
  };

  return (
    <div className="p-5 md:p-6 rounded-3xl shadow-xs bg-teal-50/70 border border-teal-200 hover:border-teal-300 transition-all space-y-4">
      {/* 1. ENCABEZADO UNIFICADO CON LOS PASOS 1, 2, 3 Y 4 */}
      <div className="flex flex-col gap-2.5 border-b border-teal-200/60 pb-3">
        {/* Fila Superior: Número + Título Completo + Flecha Desplegable */}
        <div className="flex items-center justify-between gap-3 cursor-pointer select-none w-full" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-200 text-teal-900 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
              5
            </div>
            <h4 className="text-base font-black text-slate-900 leading-snug">
              Paso 5: Notificación al Saliente, Pauta de Traspaso & Cláusulas del Acta
            </h4>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Fila Inferior: Chips y Selector de Diseño PDF */}
        <div className="flex flex-wrap items-center justify-between gap-2 pl-0 sm:pl-[52px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              ★ PASO 5 • ADJUDICACIÓN & RECEPCIÓN FORMAL
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Ley N° 21.442 & DS N° 7 MINVU
            </span>
            <span className="text-[11px] font-mono font-bold text-[#0F3D2E] bg-[#F5F4EF] border border-[#D4B895] px-2.5 py-0.5 rounded-xl">
              {proposalConfig.targetCondo || 'Comunidad'}
            </span>
          </div>
          <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
        </div>
      </div>

      {isOpen && (
        <>
        <p className="text-xs text-slate-600 leading-relaxed">
        <strong>Cuándo usarlo:</strong> Una vez acordado el término de la administración, entrega al Comité este kit para <strong>notificar al administrador saliente con el plazo de aviso pactado</strong>, auditar la entrega de antecedentes con la <strong>Pauta de Traspaso de 3 páginas</strong> y formalizar el <strong>Acta de Nombramiento</strong>.
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

          <div className="sm:col-span-2 md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Antecedente del Acuerdo de Término (Recomendado)
            </label>
            <input
              type="text"
              placeholder="Ej: Asamblea extraordinaria de 30 de octubre de 2026, Acta N° 12"
              value={proposalConfig.transitionAgreementReference || ''}
              onChange={(e) => setProposalConfig({ ...proposalConfig, transitionAgreementReference: e.target.value })}
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
              <div style={{ width: '100%' }}>
                <span className="text-xs font-bold text-slate-900 block">
                  Carta de Término de Funciones y Preaviso de 30 Días al Administrador Saliente
                </span>
                <span className="text-[11px] text-slate-500">
                  Redactada conforme a la Ley N° 21.442 (Art. 20) para firma del Comité de Administración.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewStep5Modal('carta')}
                  className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Ver / Descargar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintTerminationNotice}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                  <span>Imprimir Carta</span>
                </button>
              </div>
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
                Por medio de la presente, y conforme al acuerdo de la Comunidad{terminationNotice.agreementReference ? <> contenido en <strong>{terminationNotice.agreementReference}</strong></> : ''}, se notifica formalmente el término de la prestación de sus servicios como Administrador(a) del condominio.
              </p>
              <p>
                Con el propósito de asegurar una transición ordenada y de acuerdo con el plazo de aviso aplicable, sus funciones se extenderán por <strong>30 días a contar de la entrega de este documento</strong>, siendo su último día de gestión el <strong>{endDate}</strong>.
              </p>
              <p>
                Durante este período, y en estricto apego a lo establecido en el Artículo 20 (y concordantes) de la nueva Ley de Copropiedad Inmobiliaria (Ley 21.442), solicitamos a usted preparar y tener a disposición para la fecha de término la siguiente documentación y procesos de cierre:
              </p>

              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 text-[11px]">
                <p>• <strong>Rendición de Cuentas Documentada:</strong> Balance final de ingresos y egresos, junto con las cartolas bancarias y conciliaciones hasta el {endDate}.</p>
                <p>• <strong>Traspaso de Documentación:</strong> Entrega del Libro de Actas, registro actualizado de copropietarios, archivo de gastos comunes, planos, pólizas de seguro, certificados de instalaciones (ascensores, gas) y bitácoras de mantención.</p>
                <p>• <strong>Gestión Laboral y Previsional:</strong> Contratos de trabajo del personal del condominio, comprobantes de pago de cotizaciones (Previred), liquidaciones de sueldo al día y finiquitos en caso de corresponder.</p>
                <p>• <strong>Accesos y Autorizaciones:</strong> Entrega o regularización de usuarios administradores, mecanismos de recuperación y autorizaciones de cuentas bancarias, portal del SII, Dirección del Trabajo, correos electrónicos y software de administración utilizado.</p>
                <p>• <strong>Caja Chica y Fondos:</strong> Entrega de los fondos en efectivo y detalle de cheques por cobrar o emitidos no cobrados.</p>
              </div>

              <p>
                Por nuestra parte, como Comité de Administración, nos comprometemos a facilitar este proceso de transición, a revisar la rendición de cuentas en los plazos legales y a formalizar la recepción mediante un Acta de Traspaso el último día de sus funciones.
              </p>
              <p>
                La entrega material de antecedentes, fondos y accesos no constituye aprobación ni liberación de responsabilidad respecto de la gestión anterior; estos serán revisados conforme a la ley, al reglamento de copropiedad y al contrato aplicable.
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
              <div style={{ width: '100%' }}>
                <span className="text-xs font-bold text-slate-900 block">
                  Solicitud Simple de Antecedentes • Checklist para solicitar hoy a la administración vigente
                </span>
                <span className="text-[11px] text-slate-500">
                  Pauta en siete bloques; las selecciones y observaciones se incluyen en el PDF.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewStep5Modal('checklist')}
                  className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Ver Checklist (3 Págs)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintTransitionChecklist}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                  <span>Imprimir Checklist</span>
                </button>
              </div>
            </div>

            <TransitionChecklistScreen status={transitionStatus} setStatus={setTransitionStatus} notes={transitionNotes} setNotes={setTransitionNotes} />
            {/* TABLAS ANTERIORES */}
            {false && <div className="space-y-3 max-w-3xl mx-auto">
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
            </div>}
          </div>
        )}

        {/* ==================== SUBTAB 3: ACTA & CONTRATO ==================== */}
        {activeSubTab === 'acta' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div style={{ width: '100%' }}>
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
                  Contrato de Administración
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
                <div className="flex justify-end items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewStep5Modal('contrato')}
                    className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                    <span>Ver Contrato Completo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintContract}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                    <span>Imprimir Contrato</span>
                  </button>
                </div>
                <ContractDetailsForm onSave={onSaveContract} proposalConfig={proposalConfig} setProposalConfig={setProposalConfig} empresaForm={empresaForm} companySettings={companySettings} />
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p><strong>Contrato de Administración (24 cláusulas y anexo):</strong> La frecuencia de visitas, atención de emergencias y condiciones se toman de la propuesta para esta comunidad. Honorario mensual: {feeStr}. Completa los datos de individualización y acuerdos antes de firmar. El modelo corresponde a una prestación independiente y requiere revisar la modalidad real de contratación.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SUBTAB 4: GUÍAS LEGALES ==================== */}
        {activeSubTab === 'guias' && <div className="space-y-4">
          <p className="text-sm text-slate-600">Material de apoyo para entregar al comité: una guía de dos páginas sobre el comité, asambleas y quórums.</p>
          <div className="flex flex-wrap gap-2">{Object.entries(guideTitles).map(([kind,title])=><button key={kind} type="button" className={`rounded-xl border px-4 py-2 text-sm ${selectedGuide===kind?'bg-[#0F3D2E] text-white':'bg-white'}`} onClick={()=>setSelectedGuide(kind)}>{title}</button>)}</div>
          <div className="flex gap-2"><button type="button" className="rounded bg-[#0F3D2E] text-white px-4 py-2" onClick={()=>setPreviewStep5Modal('guias')}>Ver ficha seleccionada</button><button type="button" className="rounded border px-4 py-2" onClick={handlePrintLegalGuides}>Imprimir ficha seleccionada</button></div>
          <div className="overflow-auto max-h-[700px]"><CommitteeGuide kind={selectedGuide} proposalConfig={proposalConfig} empresaForm={empresaForm} signature={effectiveSignature} signatureScale={effectiveSignatureScale}/></div>
        </div>}

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

      
      {/* ==================== MODAL DE VISTA PREVIA DEL PASO 5 ==================== */}
      {previewStep5Modal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-4 md:p-6 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col relative">
            {/* Header del Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-bold text-sm shadow-xs">
                  ★5
                </span>
                <div>
                  <h4 className="text-sm md:text-base font-black text-slate-900">
                    {previewStep5Modal === 'carta' && 'Vista Previa: Carta de Notificación de Término (1 Pág)'}
                    {previewStep5Modal === 'checklist' && 'Vista Previa: Checklist & Pauta de Traspaso (3 Págs)'}
                    {previewStep5Modal === 'contrato' && 'Vista Previa: Contrato de Administración'}
                    {previewStep5Modal === 'guias' && guideTitles[selectedGuide]}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-mono">
                    {condo} • Ley N° 21.442 sobre Copropiedad Inmobiliaria
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (previewStep5Modal === 'carta') handlePrintTerminationNotice();
                    if (previewStep5Modal === 'checklist') handlePrintTransitionChecklist();
                    if (previewStep5Modal === 'contrato') handlePrintContract();
                    if (previewStep5Modal === 'guias') handlePrintLegalGuides();
                  }}
                  className="px-3.5 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Imprimir / Descargar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewStep5Modal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenedor con Scroll de la Hoja Completa */}
            <div className="overflow-y-auto flex-1 pr-1 bg-slate-100/70 p-2 md:p-4 rounded-2xl flex flex-col items-center gap-4">
              {/* VISTA PREVIA 1: CARTA */}
              {previewStep5Modal === 'carta' && (
                <div className="bg-white p-8 md:p-12 shadow-lg border border-slate-200 w-full max-w-[850px] text-black" style={{ fontFamily: "'Times New Roman', Times, Georgia, serif", fontSize: '11pt', lineHeight: 1.35 }}>
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
                  <p style={{ margin: '0 0 35px 0' }}>Atentamente,</p>

                  <div className="sig-block" style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', fontSize: '10.5pt', marginTop: '10px' }}>
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
              )}

              {/* La vista previa comparte datos y contenido con la impresión. */}
              {previewStep5Modal === 'checklist' && <div className="overflow-x-auto max-w-full"><TransitionChecklistPrint printableId="preview-transition-checklist" condo={proposalConfig.targetCondo?.trim() || ''} outgoingAdmin={proposalConfig.outgoingAdminName?.trim() || ''} committeePresident={proposalConfig.committeePresidentName?.trim() || ''} endDate={proposalConfig.transitionEndDate?.trim() || ''} city={city} adminName={adminName} adminRut={adminRut} phone={phone} email={email} website={website} signature={effectiveSignature} signatureScale={effectiveSignatureScale} companyRut={empresaForm.companyRut} pdfStyle={pdfStyle} status={transitionStatus} notes={transitionNotes} /></div>}

              {/* Mismo componente, redacción y firma que el documento imprimible. */}
              {previewStep5Modal === 'contrato' && (
                <div className="overflow-x-auto max-w-full">
                  <ManagementContract companySettings={companySettings} proposalConfig={proposalConfig} empresaForm={empresaForm} signature={effectiveSignature} signatureScale={effectiveSignatureScale} pdfStyle={pdfStyle} />
                </div>
              )}

              {previewStep5Modal === 'guias' && <div className="overflow-auto max-w-full"><CommitteeGuide kind={selectedGuide} proposalConfig={proposalConfig} empresaForm={empresaForm} signature={effectiveSignature} signatureScale={effectiveSignatureScale}/></div>}

            </div>
          </div>
        </div>
      )}

      </>
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
            style={{ fontFamily: "'Times New Roman', Times, Georgia, serif", fontSize: '10.75pt', lineHeight: 1.26 }}
          >
            <div style={{ padding: '1mm 2mm 0 2mm', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ width: '100%' }}>
              <p style={{ textAlign: 'right', margin: '0 0 11px 0' }}>
                {terminationNotice.city}{terminationNotice.city && terminationNotice.date ? ', ' : ''}{terminationNotice.date}
              </p>

              <p style={{ margin: 0 }}>Señor(a)</p>
              <p style={{ margin: 0, fontWeight: 'bold', minHeight: '1em' }}>{terminationNotice.outgoingAdmin}</p>
              <p style={{ margin: 0 }}>Administrador(a) del {terminationNotice.condo}</p>
              <p style={{ margin: '0 0 10px 0' }}>Presente</p>

              <p style={{ margin: '0 0 12px 0' }}>
                <strong>Ref.:</strong> Notificación de término de funciones y aviso de 30 días.
              </p>

              <p style={{ margin: '0 0 6px 0' }}>Estimado(a):</p>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                Por medio de la presente, y conforme al acuerdo de la Comunidad{terminationNotice.agreementReference ? <> contenido en <strong>{terminationNotice.agreementReference}</strong></> : ''}, se notifica formalmente el término de la prestación de sus servicios como Administrador(a) del condominio.
              </p>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                Con el propósito de asegurar una transición ordenada y de acuerdo con el plazo de aviso aplicable, sus funciones se extenderán por <strong>30 días a contar de la entrega de este documento</strong>, siendo su último día de gestión el <strong>{terminationNotice.endDate}</strong>.
              </p>
              <p style={{ margin: '0 0 5px 0', textAlign: 'justify' }}>
                Durante este período, y en estricto apego a lo establecido en el Artículo 20 (y concordantes) de la Ley N° 21.442 sobre Copropiedad Inmobiliaria, solicitamos a usted preparar y tener a disposición, para la fecha de término, la siguiente documentación y procesos de cierre:
              </p>

              <ol style={{ margin: '0 0 6px 0', paddingLeft: '20px', textAlign: 'justify', listStyleType: 'decimal' }}>
                <li style={{ marginBottom: '2px' }}><strong>Rendición de Cuentas Documentada:</strong> Balance final de ingresos y egresos, junto con las cartolas bancarias y conciliaciones hasta el {terminationNotice.endDate}.</li>
                <li style={{ marginBottom: '2px' }}><strong>Traspaso de Documentación:</strong> Entrega del Libro de Actas, registro actualizado de copropietarios, archivo de gastos comunes, planos, pólizas de seguro, certificados de instalaciones (ascensores, gas) y bitácoras de mantención.</li>
                <li style={{ marginBottom: '2px' }}><strong>Gestión Laboral y Previsional:</strong> Contratos de trabajo del personal del condominio, comprobantes de pago de cotizaciones (Previred), liquidaciones de sueldo al día y finiquitos en caso de corresponder.</li>
                <li style={{ marginBottom: '2px' }}><strong>Accesos y Autorizaciones:</strong> Entrega o regularización de usuarios administradores, mecanismos de recuperación y autorizaciones de cuentas bancarias, portal del SII, Dirección del Trabajo, correos electrónicos y software de administración utilizado.</li>
                <li><strong>Caja Chica y Fondos:</strong> Entrega de los fondos en efectivo y detalle de cheques por cobrar o emitidos no cobrados.</li>
              </ol>

              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                Por nuestra parte, como Comité de Administración, nos comprometemos a facilitar este proceso de transición, a revisar la rendición de cuentas en los plazos legales y a formalizar la recepción mediante un Acta de Traspaso el último día de sus funciones.
              </p>
              <p style={{ margin: '0 0 8px 0', textAlign: 'justify' }}>
                La entrega material de antecedentes, fondos y accesos no constituye aprobación ni liberación de responsabilidad respecto de la gestión anterior; estos serán revisados conforme a la ley, al reglamento de copropiedad y al contrato aplicable.
              </p>
              <p style={{ margin: '0 0 8px 0', textAlign: 'justify' }}>
                Agradecemos su gestión durante este tiempo y esperamos llevar a cabo este cierre de manera transparente y colaborativa.
              </p>
              <p style={{ margin: 0 }}>Atentamente,</p>
              </div>

              <div style={{ width: '100%' }}>
                <div className="sig-block" style={{ display: 'flex', justifyContent: 'space-between', gap: '26px', fontSize: '10.75pt', marginTop: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
                    <div style={{ fontWeight: 'bold', minHeight: '1em' }}>{terminationNotice.committeePresident}</div>
                    <div>Presidente del Comité de Administración</div>
                    <div>{terminationNotice.condo}</div>
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
        </div>

        {/* 2. PRINTABLE CHECKLIST DE ANTECEDENTES (EXACTAMENTE 3 PÁGINAS FOLIADAS) */}
        <TransitionChecklistPrint endDate={proposalConfig.transitionEndDate?.trim() || ''} condo={proposalConfig.targetCondo?.trim() || ''} outgoingAdmin={proposalConfig.outgoingAdminName?.trim() || ''} committeePresident={proposalConfig.committeePresidentName?.trim() || ''} city={city} adminName={adminName} adminRut={adminRut} phone={phone} email={email} website={website} signature={effectiveSignature} signatureScale={effectiveSignatureScale} companyRut={empresaForm.companyRut} pdfStyle={pdfStyle} status={transitionStatus} notes={transitionNotes} />
        <div id="legacy-transition-checklist" data-pdf-style={pdfStyle}>
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

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Pauta de Traspaso • Ley N° 21.442 (Pág. 1 de 3)</div>
              <div>{city}</div>
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

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono relative z-10">
              <div>ARANPRO Gestión Integral • {website}</div>
              <div className="font-bold text-[#0F3D2E]">Pauta de Traspaso • Ley N° 21.442 (Pág. 2 de 3)</div>
              <div>{city}</div>
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

              <div className="pt-2 mt-3 border-t border-slate-200 flex items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AranproOfficialSeal
                    size="sm"
                    companyRut={companySettings?.companyRut && !String(companySettings.companyRut).includes('76.999.888') ? companySettings.companyRut : ''}
                    rnacNumber=""
                    showCaption={true}
                  />
                  <div className="text-[9px] text-slate-600 border-l border-slate-200 pl-3 space-y-0.5">
                    <p><strong>Contacto Directo:</strong> <span className="font-mono font-bold text-[#0F3D2E]">{phone}</span></p>
                    <p><strong>Correo:</strong> <span className="font-mono">{email}</span></p>
                    <p><strong>Sitio Web:</strong> <span className="font-mono text-[#0F3D2E] font-bold">{website}</span></p>
                  </div>
                </div>

                <div className="text-center min-w-[220px]">
                  <div className="h-12 flex items-end justify-center pb-0.5 overflow-visible">
                    {effectiveSignature && (
                      <img
                        src={effectiveSignature}
                        alt="Firma del administrador"
                        className="h-11 max-h-12 w-auto max-w-[220px] object-contain mx-auto"
                        style={{ transform: `scale(${effectiveSignatureScale})`, transformOrigin: 'bottom center' }}
                      />
                    )}
                  </div>
                  <div className="border-t-[1.5px] border-slate-800 pt-0.5">
                    <span className="text-[10.5px] font-black text-slate-900 block leading-tight">{adminName}</span>
                    <span className="text-[8.5px] text-[#0F3D2E] font-bold block leading-tight">Constructor Civil • Administrador de Condominios</span>
                    <span className="text-[8.5px] text-slate-600 font-mono block">RUT: {adminRut} • Ley N° 21.442</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                <div>ARANPRO Gestión Integral • {website}</div>
                <div className="font-bold text-[#0F3D2E]">Pauta de Traspaso • Ley N° 21.442 (Pág. 3 de 3)</div>
                <div>{city}</div>
              </div>
            </div>
          </div>
        </div>

        <div id="printable-legal-advisory-sheet" data-pdf-style={pdfStyle}>
          {['comite'].map(kind=><div key={kind} id={`printable-guide-${kind}`} data-pdf-style={pdfStyle}><CommitteeGuide kind={kind} proposalConfig={proposalConfig} empresaForm={empresaForm} signature={effectiveSignature} signatureScale={effectiveSignatureScale}/></div>)}
        </div>

        {/* 4. Contrato: texto único para vista previa y ambas rutas de impresión. */}
        <div id="printable-management-contract" data-pdf-style={pdfStyle}>
          <ManagementContract companySettings={companySettings} proposalConfig={proposalConfig} empresaForm={empresaForm} signature={effectiveSignature} signatureScale={effectiveSignatureScale} pdfStyle={pdfStyle} />
        </div>

        {/* 5. PRINTABLE FULL PACKAGE */}
        <div id="printable-transition-package" data-pdf-style={pdfStyle}>
          <div className="dossier-page bg-white text-slate-900 text-xs flex flex-col justify-between max-w-[850px] mx-auto">
            <div className="space-y-4"><CanonicalPdfHeader badge="KIT DE TRANSICIÓN" description="Traspaso de administración" page={1} community={condo} email={email} phone={phone} city={city} />
              <div className="p-6 bg-[#0F3D2E] text-white rounded-2xl text-center space-y-2"><h3 className="text-lg font-black text-white">Kit Oficial de Transición y Traspaso de Administración</h3><p className="text-xs text-emerald-100">{condo} • {city}, {noticeDate}</p></div>
              <p className="text-sm text-slate-700 text-center">Esta es la portada de presentación. Los documentos de traspaso se generan por separado.</p>
            </div>
            <div className="mt-auto pt-1.5 space-y-1"><CanonicalPdfFinalSignature companyRut={empresaForm.companyRut} phone={phone} email={email} website={website} signature={effectiveSignature} signatureScale={signatureScale} adminName={adminName} adminRut={adminRut} /><CanonicalPdfPageFooter website={website} label="Kit de transición" page={1} totalPages={1} city={city} /></div>
          </div>
        </div>

      </div>
    </div>
  );
};
