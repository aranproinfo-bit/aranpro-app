import React, { useState, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { formatDate, formatRut, formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { SuggestionsAndComplaintsModule } from './SuggestionsAndComplaintsModule';
import { AranproConfirmModal } from '../common/AranproConfirmModal';
import {
  Megaphone, FolderOpen, MessageSquare, AlertTriangle, ShieldCheck,
  Plus, Printer, Share2, Trash2, CheckCircle2, Clock, Pin,
  FileText, Download, Eye, Calendar, Sparkles, Check, X,
  Search, Filter, Smartphone, HelpCircle, FileCheck2, Scale,
  Building2, Users, AlertCircle, ArrowRight, ShieldAlert,
  Paperclip, ExternalLink, RefreshCw
} from 'lucide-react';

export const MuralAndComplaintsModule = ({
  currentCommunity,
  activeSubTab = 'mural',
  onSubTabChange
}) => {
  const {
    companySettings,
    addAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    addDocument,
    deleteDocument,
    updateUnit
  } = useCommunity();

  // Control de sub-pestaña activa ('mural' | 'documentos' | 'reclamos' | 'multas')
  const [internalTab, setInternalTab] = useState(activeSubTab || 'mural');
  const currentTab = onSubTabChange ? activeSubTab : internalTab;
  const setTab = onSubTabChange || setInternalTab;

  // Estados de Filtros y Búsqueda para Mural
  const [annSearchQuery, setAnnSearchQuery] = useState('');
  const [annPriorityFilter, setAnnPriorityFilter] = useState('ALL'); // 'ALL' | 'Urgente' | 'Importante' | 'Informativo'
  const [annCategoryFilter, setAnnCategoryFilter] = useState('ALL');

  // Estados de Filtros para Documentos
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');

  // Modales
  const [showNewAnnModal, setShowNewAnnModal] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [activeDocPreview, setActiveDocPreview] = useState(null);

  // Modal de confirmación corporativo ARANPRO (reemplaza popups nativos)
  const [modalDialog, setModalDialog] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    isAlert: false,
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Feedbacks de copiado
  const [copiedAnnId, setCopiedAnnId] = useState(null);
  const [fineSuccessMessage, setFineSuccessMessage] = useState('');

  // Formulario Nuevo Aviso
  const [annForm, setAnnForm] = useState({
    title: '',
    content: '',
    priority: 'Importante',
    category: 'Convivencia',
    location: 'Todo el Condominio',
    expiresAt: '',
    isPinned: false
  });

  // Formulario Nuevo Documento
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Reglamento de Copropiedad',
    notes: '',
    fileUrl: '',
    fileName: ''
  });

  // Formulario Aplicación de Multa (Propuesta 5)
  const [fineForm, setFineForm] = useState({
    unitId: 'u-8',
    reason: 'Ruidos molestos y música a alto volumen fuera del horario reglamentario',
    reglamentoArticle: 'Art. 18° y 24° del Reglamento de Copropiedad',
    amountClp: 39500, // Equiv. 1 UF aprox
    ufEquivalent: '1.0 UF',
    resolutionFolio: 'SANC-2026-01',
    notifyWhatsApp: true
  });

  // --- Documentación Obligatoria según Ley N° 21.442 (Propuesta 4) ---
  const legalRequirements = [
    {
      id: 'reglamento',
      title: 'Reglamento de Copropiedad Inscrito en CBR',
      legalRef: 'Art. 8° y 29° Ley N° 21.442',
      description: 'Reglamento oficial del condominio debidamente protocolizado e inscrito en el Registro de Hipotecas del CBR.',
      matchKeywords: ['reglamento', 'copropiedad', 'cbr'],
      category: 'Reglamento de Copropiedad'
    },
    {
      id: 'pes',
      title: 'Plan de Emergencia y Evacuación (PES)',
      legalRef: 'Art. 40° Ley N° 21.442',
      description: 'Protocolo de evacuación ante sismos, incendios y catástrofes, con constancia de ingreso a Bomberos y Carabineros.',
      matchKeywords: ['pes', 'emergencia', 'evacuación', 'evacuacion', 'bomberos'],
      category: 'Seguridad y Emergencia'
    },
    {
      id: 'seguro',
      title: 'Póliza de Seguro de Incendio de Espacios Comunes',
      legalRef: 'Art. 43° Ley N° 21.442',
      description: 'Contratación y vigencia de la póliza obligatoria contra riesgo de incendio de los bienes de dominio común.',
      matchKeywords: ['seguro', 'póliza', 'poliza', 'incendio'],
      category: 'Contratos y Seguros'
    },
    {
      id: 'planos',
      title: 'Planos del Condominio & Redes Sanitarias/Eléctricas',
      legalRef: 'Art. 6° Ley N° 21.442',
      description: 'Planos definitivos de arquitectura, gas, electricidad, agua potable y alcantarillado.',
      matchKeywords: ['plano', 'planos', 'redes', 'manual'],
      category: 'Planos y Arquitectura'
    },
    {
      id: 'mantenciones',
      title: 'Contratos & Certificaciones de Mantención Crítica',
      legalRef: 'Art. 40° N° 2 Ley N° 21.442',
      description: 'Mantenciones preventivas periódicas certificadas de portones automáticos, bombas de agua y calderas.',
      matchKeywords: ['mantención', 'mantencion', 'certificación', 'bombas', 'portón', 'contrato'],
      category: 'Contratos y Seguros'
    }
  ];

  // Cálculo del Checklist Legal
  const legalAuditMetrics = useMemo(() => {
    const docs = currentCommunity?.documents || [];
    let completedCount = 0;

    const checklistStatus = legalRequirements.map(req => {
      const match = docs.find(d => {
        const titleLower = (d.title || '').toLowerCase();
        const catLower = (d.category || '').toLowerCase();
        return req.matchKeywords.some(kw => titleLower.includes(kw) || catLower.includes(kw));
      });

      if (match) completedCount++;

      return {
        ...req,
        isCompleted: Boolean(match),
        matchingDoc: match
      };
    });

    const percent = Math.round((completedCount / legalRequirements.length) * 100);

    return {
      total: legalRequirements.length,
      completed: completedCount,
      percent,
      checklistStatus
    };
  }, [currentCommunity?.documents]);

  // Lista de Avisos filtrada y ordenada (Fijados primero)
  const filteredAnnouncements = useMemo(() => {
    const list = currentCommunity?.announcements || [];
    return list.filter(ann => {
      if (annPriorityFilter !== 'ALL' && ann.priority !== annPriorityFilter) return false;
      if (annCategoryFilter !== 'ALL' && (ann.category || 'General') !== annCategoryFilter) return false;
      if (annSearchQuery.trim()) {
        const q = annSearchQuery.toLowerCase();
        const matchTitle = (ann.title || '').toLowerCase().includes(q);
        const matchContent = (ann.content || '').toLowerCase().includes(q);
        const matchLoc = (ann.location || '').toLowerCase().includes(q);
        return matchTitle || matchContent || matchLoc;
      }
      return true;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  }, [currentCommunity?.announcements, annPriorityFilter, annCategoryFilter, annSearchQuery]);

  // Lista de Documentos filtrada
  const filteredDocuments = useMemo(() => {
    const list = currentCommunity?.documents || [];
    return list.filter(doc => {
      if (docCategoryFilter !== 'ALL' && doc.category !== docCategoryFilter) return false;
      if (docSearchQuery.trim()) {
        const q = docSearchQuery.toLowerCase();
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchCat = (doc.category || '').toLowerCase().includes(q);
        return matchTitle || matchCat;
      }
      return true;
    });
  }, [currentCommunity?.documents, docCategoryFilter, docSearchQuery]);

  // Unidades con Multas / Cargos Extras Activos
  const unitsWithFines = useMemo(() => {
    return (currentCommunity?.units || []).filter(u => (u.extraCharge || 0) > 0);
  }, [currentCommunity?.units]);

  const totalFinesAmount = useMemo(() => {
    return unitsWithFines.reduce((acc, u) => acc + (u.extraCharge || 0), 0);
  }, [unitsWithFines]);

  // Métricas KPIs Generales
  const activeAnnouncementsCount = currentCommunity?.announcements?.length || 0;
  const pinnedAnnouncementsCount = (currentCommunity?.announcements || []).filter(a => a.isPinned).length;
  const totalDocsCount = currentCommunity?.documents?.length || 0;
  const pendingTicketsCount = (currentCommunity?.communityTickets || []).filter(t => t.status === 'PENDIENTE').length;

  // --- Handlers ---

  // 1. Guardar nuevo aviso
  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.content.trim()) return;

    addAnnouncement(currentCommunity.id, {
      ...annForm,
      date: new Date().toISOString().split('T')[0],
      author: 'Administración ARANPRO'
    });

    setAnnForm({
      title: '',
      content: '',
      priority: 'Importante',
      category: 'Convivencia',
      location: 'Todo el Condominio',
      expiresAt: '',
      isPinned: false
    });
    setShowNewAnnModal(false);
  };

  // 2. Imprimir Lámina Formal de Diario Mural Físico (Propuesta 2)
  const handlePrintMuralPdf = (ann) => {
    if (!currentCommunity || !ann) return;
    const brandName = companySettings?.brandName || 'ARANPRO';
    const primaryColor = companySettings?.colors?.primary || '#0F3D2E';
    const accentGold = companySettings?.colors?.accent || '#D4B895';
    const communityName = currentCommunity?.name || 'Condominio';

    const priorityBadgeColor = ann.priority === 'Urgente'
      ? '#DC2626'
      : ann.priority === 'Importante'
      ? '#D97706'
      : '#059669';

    const priorityBg = ann.priority === 'Urgente'
      ? '#FEF2F2'
      : ann.priority === 'Importante'
      ? '#FFFBEB'
      : '#ECFDF5';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Diario_Mural_${communityName.replace(/\\s+/g, '_')}_${ann.title.slice(0, 20).replace(/\\s+/g, '_')}.pdf</title>
        <style>
          @page { size: letter; margin: 16mm 16mm 16mm 16mm; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0F172A; margin: 0; padding: 0; }
          .mural-frame { border: 4px solid ${primaryColor}; border-radius: 12px; padding: 24px; position: relative; }
          .header-table { width: 100%; border-bottom: 2px solid ${accentGold}; padding-bottom: 14px; margin-bottom: 20px; }
          .brand-title { font-size: 22px; font-weight: 900; color: ${primaryColor}; margin: 0; }
          .badge-box { background: ${priorityBg}; border: 2px solid ${priorityBadgeColor}; color: ${priorityBadgeColor}; font-weight: 900; font-size: 13px; text-transform: uppercase; padding: 6px 14px; border-radius: 8px; text-align: center; }
          .title-area { margin: 20px 0 16px 0; }
          .mural-title { font-size: 20px; font-weight: 900; color: #0F172A; line-height: 1.3; margin: 0; }
          .meta-bar { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; margin-bottom: 22px; }
          .content-body { font-size: 14px; line-height: 1.65; color: #1E293B; white-space: pre-wrap; text-align: justify; margin-bottom: 30px; }
          .footer-box { margin-top: 35px; border-top: 1.5px dashed #CBD5E1; padding-top: 14px; font-size: 10px; color: #64748B; text-align: justify; }
          .sig-table { width: 100%; margin-top: 30px; }
          .sig-td { width: 50%; text-align: center; padding: 0 30px; font-size: 11px; }
          .sig-line { border-top: 1.5px solid #334155; margin-top: 40px; margin-bottom: 6px; }
          .notice-instruction { background: #FEF9C3; border: 1px solid #FDE047; padding: 8px 12px; font-size: 10px; font-weight: bold; color: #854D0E; border-radius: 6px; margin-bottom: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="mural-frame">
          <div class="notice-instruction">
            📌 INSTRUCCIÓN DE CONSERJERÍA: FIJAR DE FORMA VISIBLE EN VITRINA ACRÍLICA O PANEL DEL DIARIO MURAL HASTA SU VENCIMIENTO
          </div>

          <table class="header-table">
            <tr>
              <td style="vertical-align: middle;">
                <h1 class="brand-title">${brandName}</h1>
                <div style="font-size: 11px; font-weight: bold; color: #64748B; text-transform: uppercase;">Administración y Gestión Inmobiliaria Integral</div>
                <div style="font-size: 13px; font-weight: 800; color: ${primaryColor}; margin-top: 2px;">
                  Comunidad: ${communityName}
                </div>
              </td>
              <td style="text-align: right; vertical-align: middle; width: 35%;">
                <div class="badge-box">
                  ${ann.priority === 'Urgente' ? '🚨 AVISO URGENTE' : ann.priority === 'Importante' ? '⚠️ COMUNICADO IMPORTANTE' : 'ℹ️ INFORMATIVO OFICIAL'}
                </div>
                <div style="font-size: 10px; color: #64748B; margin-top: 6px; font-weight: 600;">
                  Fecha de Fijación: ${formatDate(ann.date)}
                </div>
              </td>
            </tr>
          </table>

          <div class="title-area">
            <div style="font-size: 11px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              ${ann.category || 'Mural de Avisos'} • Ámbito: ${ann.location || 'Todo el Condominio'}
            </div>
            <h2 class="mural-title">${ann.title}</h2>
          </div>

          <table class="meta-bar" style="width: 100%;">
            <tr>
              <td><strong>Emisor:</strong> ${ann.author || 'Administración ARANPRO'}</td>
              <td><strong>Fecha de Publicación:</strong> ${formatDate(ann.date)}</td>
              <td><strong>Vigencia:</strong> ${ann.expiresAt ? formatDate(ann.expiresAt) : 'Hasta nuevo aviso'}</td>
            </tr>
          </table>

          <div class="content-body">${ann.content}</div>

          <table class="sig-table">
            <tr>
              <td class="sig-td">
                <div class="sig-line"></div>
                <strong>Administración ${brandName}</strong><br/>
                <span style="font-size: 10px; color: #64748B;">Administrador Titular (RNAC N° 48.912)</span>
              </td>
              <td class="sig-td">
                <div class="sig-line"></div>
                <strong>Comité de Administración</strong><br/>
                <span style="font-size: 10px; color: #64748B;">${communityName}</span>
              </td>
            </tr>
          </table>

          <div class="footer-box">
            <strong>FUNDAMENTO LEGAL LEY N° 21.442:</strong> Las comunicaciones emitidas por la Administración y el Comité de Administración fijadas en el diario mural o publicadas en la plataforma digital oficial constituyen avisos formales y de público conocimiento para todos los copropietarios, residentes y arrendatarios de la comunidad.
          </div>
        </div>
      </body>
      </html>
    `;

    printDocumentDirectly(htmlContent, `Diario_Mural_${communityName.replace(/\\s+/g, '_')}_${ann.id}.pdf`);
  };

  // 3. Difundir Aviso por WhatsApp (Propuesta 3)
  const handleShareAnnouncementWhatsApp = (ann) => {
    if (!currentCommunity || !ann) return;
    const communityName = currentCommunity?.name || 'Condominio';
    const icon = ann.priority === 'Urgente' ? '🚨' : ann.priority === 'Importante' ? '⚠️' : '📢';

    const text = 
`${icon} *COMUNICADO OFICIAL — ${communityName.toUpperCase()}*
📌 *${ann.title.toUpperCase()}*
⚖️ _Prioridad: ${ann.priority} • Fecha: ${formatDate(ann.date)}_

${ann.content}

📍 _Sector: ${ann.location || 'Todo el Condominio'}_
${ann.expiresAt ? `⏳ _Vigencia hasta: ${formatDate(ann.expiresAt)}_` : ''}

_Administración ARANPRO • Gestión Integral de Condominios_`;

    navigator.clipboard.writeText(text);
    setCopiedAnnId(ann.id);
    setTimeout(() => setCopiedAnnId(null), 3000);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 4. Guardar Documento Oficial
  const handleUploadDocument = (e) => {
    e.preventDefault();
    if (!docForm.title.trim()) return;

    addDocument(currentCommunity.id, {
      title: docForm.title,
      category: docForm.category,
      date: new Date().toISOString().split('T')[0],
      fileUrl: docForm.fileUrl || '',
      fileName: docForm.fileName || 'documento.pdf'
    });

    setDocForm({
      title: '',
      category: 'Reglamento de Copropiedad',
      notes: '',
      fileUrl: '',
      fileName: ''
    });
    setShowNewDocModal(false);
  };

  // 5. Cargar Multa a la Unidad en Colilla de Gastos Comunes (Propuesta 5)
  const handleApplyFineToUnit = (e) => {
    e.preventDefault();
    const targetUnit = (currentCommunity?.units || []).find(u => u.id === fineForm.unitId);
    if (!targetUnit) return;

    const previousCharge = targetUnit.extraCharge || 0;
    const newCharge = previousCharge + Number(fineForm.amountClp);
    const newDescription = targetUnit.extraChargeDescription
      ? `${targetUnit.extraChargeDescription} • Multa: ${fineForm.reason} (${fineForm.ufEquivalent})`
      : `Multa: ${fineForm.reason} (${fineForm.ufEquivalent})`;

    updateUnit(currentCommunity.id, targetUnit.id, {
      extraCharge: newCharge,
      extraChargeDescription: newDescription
    });

    setFineSuccessMessage(`¡Multa de ${formatCLP(fineForm.amountClp)} (${fineForm.ufEquivalent}) imputada con éxito a Casa ${targetUnit.number}! Aparecerá en la colilla de cobro del mes.`);
    setTimeout(() => setFineSuccessMessage(''), 5000);

    // Opcional: Imprimir Notificación de Multa
    handlePrintFineProof(targetUnit);

    setShowFineModal(false);
  };

  // Imprimir Notificación Oficial de Multa (PDF)
  const handlePrintFineProof = (targetUnit) => {
    if (!currentCommunity || !targetUnit) return;
    const brandName = companySettings?.brandName || 'ARANPRO';
    const primaryColor = companySettings?.colors?.primary || '#0F3D2E';
    const communityName = currentCommunity?.name || 'Condominio';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Notificacion_Multa_Casa_${targetUnit.number}_${communityName.replace(/\\s+/g, '_')}.pdf</title>
        <style>
          @page { size: letter; margin: 15mm 15mm 15mm 15mm; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0F172A; margin: 0; padding: 0; font-size: 11px; line-height: 1.5; }
          .header-table { width: 100%; border-bottom: 2.5px solid #991B1B; padding-bottom: 12px; margin-bottom: 16px; }
          .brand-title { font-size: 19px; font-weight: 900; color: ${primaryColor}; margin: 0; }
          .doc-badge { background: #FEF2F2; border: 1.5px solid #F87171; border-radius: 8px; padding: 6px 12px; text-align: right; }
          .title-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 10px 14px; margin-bottom: 18px; border-radius: 4px; }
          .data-table { width: 100%; border-collapse: collapse; margin: 14px 0; }
          .data-table td { padding: 6px 10px; border: 1px solid #CBD5E1; font-size: 11px; }
          .data-table td.header { background: #F8FAFC; font-weight: bold; width: 35%; color: #334155; }
          .legal-box { background: #F8FAFC; border: 1px solid #CBD5E1; padding: 10px 12px; margin: 16px 0; border-radius: 6px; font-size: 10px; text-align: justify; }
          .sig-table { width: 100%; margin-top: 40px; }
          .sig-td { width: 50%; text-align: center; padding: 0 25px; }
          .sig-line { border-top: 1.5px solid #334155; margin-top: 40px; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <h1 class="brand-title">${brandName}</h1>
              <div style="font-size: 9.5px; color: #64748B; font-weight: 600; text-transform: uppercase;">Gestión Integral de Condominios y Comunidades</div>
              <div style="font-size: 11px; font-weight: bold; color: ${primaryColor}; margin-top: 2px;">
                Condominio: ${communityName}
              </div>
            </td>
            <td style="text-align: right;">
              <div class="doc-badge">
                <div style="font-size: 9px; font-weight: 800; color: #991B1B; text-transform: uppercase;">Infracción y Sanción Reglamentaria</div>
                <div style="font-size: 13px; font-weight: 900; color: #991B1B;">${fineForm.resolutionFolio}</div>
                <div style="font-size: 9px; color: #64748B; margin-top: 2px;">Fecha: ${formatDate(new Date().toISOString().slice(0, 10))}</div>
              </div>
            </td>
          </tr>
        </table>

        <div class="title-box">
          <div style="font-size: 10px; font-weight: 800; color: #991B1B; text-transform: uppercase;">
            NOTIFICACIÓN OFICIAL DE IMPUTACIÓN DE MULTA AL GASTO COMÚN
          </div>
          <h2 style="font-size: 14px; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
            Cobro Imputable en Colilla Mensual por Infracción al Reglamento
          </h2>
        </div>

        <table class="data-table">
          <tr>
            <td class="header">Unidad Sancionada:</td>
            <td><strong>${targetUnit.tower ? `${targetUnit.tower} - ${targetUnit.number}` : `Casa N° ${targetUnit.number}`}</strong></td>
          </tr>
          <tr>
            <td class="header">Copropietario / Ocupante:</td>
            <td>${targetUnit.owner} (RUT: ${targetUnit.rut ? formatRut(targetUnit.rut) : '—'})</td>
          </tr>
          <tr>
            <td class="header">Motivo de la Sanción:</td>
            <td><strong style="color: #991B1B;">${fineForm.reason}</strong></td>
          </tr>
          <tr>
            <td class="header">Fundamento Legal / Reglamentario:</td>
            <td>${fineForm.reglamentoArticle}</td>
          </tr>
          <tr>
            <td class="header">Monto Aplicado:</td>
            <td><strong style="font-size: 13px; color: #991B1B;">${formatCLP(fineForm.amountClp)}</strong> (${fineForm.ufEquivalent})</td>
          </tr>
          <tr>
            <td class="header">Modalidad de Cobro:</td>
            <td>Cargado directamente en la colilla de gastos comunes del período activo para su recaudación conjunta.</td>
          </tr>
        </table>

        <div class="legal-box">
          <strong>FUNDAMENTO LEGAL Y PROCEDIMIENTO DE APELACIÓN (ART. 20° Y 21° LEY N° 21.442):</strong><br/>
          De conformidad a la Ley N° 21.442 sobre Copropiedad Inmobiliaria y el Reglamento Interno de la Comunidad, el Administrador y el Comité de Administración se encuentran facultados para cursar multas reglamentarias ante faltas graves a la convivencia o seguridad. El copropietario podrá formular sus descargos por escrito ante el Comité de Administración dentro de 5 días hábiles siguientes a esta notificación, o recurrir ante el Juzgado de Policía Local respectivo.
        </div>

        <table class="sig-table">
          <tr>
            <td class="sig-td">
              <div class="sig-line"></div>
              <strong>Administración ${brandName}</strong><br/>
              <span style="font-size: 9.5px; color: #64748B;">Administrador Titular (RNAC N° 48.912)</span>
            </td>
            <td class="sig-td">
              <div class="sig-line"></div>
              <strong>Comité de Administración</strong><br/>
              <span style="font-size: 9.5px; color: #64748B;">Visación y Visto Bueno Reglamentario</span>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    printDocumentDirectly(htmlContent, `Notificacion_Multa_Casa_${targetUnit.number}_${communityName.replace(/\\s+/g, '_')}.pdf`);
  };

  // Reversar / Anular Multa de una unidad
  const handleReverseFine = (unitId) => {
    updateUnit(currentCommunity.id, unitId, {
      extraCharge: 0,
      extraChargeDescription: ''
    });
    setFineSuccessMessage('Cargo de multa anulado correctamente para la unidad.');
    setTimeout(() => setFineSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-4 w-full">
      {/* ========================================================================= */}
      {/* 1. CABECERA EJECUTIVA ARANPRO (ANCHO COMPLETO)                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2.5 bg-gradient-to-br from-[#0F3D2E] to-[#14533d] text-white rounded-2xl shadow-xs shrink-0">
            <Megaphone className="w-5 h-5 text-[#D4B895]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Mural de Avisos, Documentos & Reclamos
              </h3>
              <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full border border-[#0F3D2E]/20 uppercase shrink-0">
                Ley N° 21.442 • Arts. 8°, 17° y 20°
              </span>
              <span className="text-[9.5px] font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md hidden sm:inline-block shrink-0">
                {currentCommunity?.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Diario mural físico y digital, biblioteca legal en custodia, gestión de reclamos y aplicación de multas
            </p>
          </div>
        </div>

        {/* Acciones principales rápidas a la derecha */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewAnnModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] hover:from-[#0A291F] hover:to-[#0F3D2E] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer"
            title="Publicar un nuevo comunicado en el diario mural"
          >
            <Plus className="w-4 h-4 mr-1.5 text-[#D4B895]" />
            Publicar Aviso
          </button>

          <button
            type="button"
            onClick={() => setShowNewDocModal(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Subir documento oficial a la biblioteca comunitaria"
          >
            <Paperclip className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
            Subir Documento
          </button>

          <button
            type="button"
            onClick={() => setShowFineModal(true)}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Cursar e imputar una multa reglamentaria en la colilla de gastos comunes"
          >
            <Scale className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
            Cursar Multa
          </button>
        </div>
      </div>

      {/* Banner de Feedback de Multa */}
      {fineSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{fineSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFineSuccessMessage('')}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KPIS EJECUTIVOS DEL MÓDULO                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 bg-[#0F3D2E]/10 rounded-xl text-[#0F3D2E]">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avisos en Mural</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{activeAnnouncementsCount} activos</div>
            <div className="text-[9.5px] text-emerald-700 font-bold">
              {pinnedAnnouncementsCount > 0 ? `📌 ${pinnedAnnouncementsCount} fijados en portada` : 'Diario mural digital'}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documentos en Custodia</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalDocsCount} archivos</div>
            <div className="text-[9.5px] text-blue-700 font-bold">
              {legalAuditMetrics.percent}% checklist legal (Ley 21.442)
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${pendingTicketsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reclamos & Consultas</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {currentCommunity?.communityTickets?.length || 0} recibidos
            </div>
            <div className="text-[9.5px] text-amber-700 font-bold">
              {pendingTicketsCount > 0 ? `⚠️ ${pendingTicketsCount} pendientes de respuesta` : 'Todo respondido'}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Multas Imputadas</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{formatCLP(totalFinesAmount)}</div>
            <div className="text-[9.5px] text-rose-700 font-bold">
              {unitsWithFines.length > 0 ? `${unitsWithFines.length} casas con recargo en colilla` : 'Sin multas vigentes'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE NAVEGACIÓN DE SUB-PESTAÑAS UNIFICADA                         */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('mural')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'mural'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>1. Diario Mural Digital & Avisos</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            currentTab === 'mural' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeAnnouncementsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('documentos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'documentos'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>2. Biblioteca Documental (Ley 21.442)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            currentTab === 'documentos' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-100 text-slate-600'
          }`}>
            {totalDocsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('reclamos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'reclamos'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>3. Libro Oficial de Reclamos & Sugerencias</span>
          {pendingTicketsCount > 0 && (
            <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-black bg-amber-400 text-slate-900 animate-pulse">
              {pendingTicketsCount} pend.
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('multas')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'multas'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>4. Registro de Amonestaciones & Multas</span>
          {unitsWithFines.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-100 text-rose-800">
              {unitsWithFines.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: DIARIO MURAL DIGITAL & AVISOS (PROPUESTAS 2 Y 3)                 */}
      {/* ========================================================================= */}
      {currentTab === 'mural' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar en el mural por título, texto o sector..."
                  value={annSearchQuery}
                  onChange={(e) => setAnnSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={annPriorityFilter}
                onChange={(e) => setAnnPriorityFilter(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-700"
              >
                <option value="ALL">Todas las Prioridades</option>
                <option value="Urgente">🚨 Urgente</option>
                <option value="Importante">⚠️ Importante</option>
                <option value="Informativo">ℹ️ Informativo</option>
              </select>

              <button
                type="button"
                onClick={() => setShowNewAnnModal(true)}
                className="px-3 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nuevo Aviso
              </button>
            </div>
          </div>

          {/* Grilla de Avisos en Diario Mural */}
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-700">No hay avisos que coincidan con la búsqueda</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Crea el primer comunicado oficial para mantener informada a la comunidad de {currentCommunity?.name}.
              </p>
              <button
                type="button"
                onClick={() => setShowNewAnnModal(true)}
                className="px-4 py-2 bg-[#0F3D2E] text-[#D4B895] font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Publicar Comunicado</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAnnouncements.map((ann) => {
                const isUrgente = ann.priority === 'Urgente';
                const isImportante = ann.priority === 'Importante';

                return (
                  <div
                    key={ann.id}
                    className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-2xs ${
                      ann.isPinned
                        ? 'border-2 border-[#D4B895] ring-2 ring-[#D4B895]/20 bg-gradient-to-br from-amber-50/20 via-white to-white'
                        : isUrgente
                        ? 'border-rose-300'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Cabecera del Aviso */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${
                              isUrgente
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : isImportante
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {ann.priority}
                          </span>

                          {ann.isPinned && (
                            <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-[#0F3D2E] text-[#D4B895] border border-[#D4B895]/40 flex items-center gap-1">
                              <Pin className="w-3 h-3 fill-[#D4B895]" />
                              FIJADO EN PORTADA
                            </span>
                          )}

                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {ann.category || 'General'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => togglePinAnnouncement(currentCommunity.id, ann.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              ann.isPinned
                                ? 'bg-[#0F3D2E] text-[#D4B895] border-[#0F3D2E]'
                                : 'text-slate-400 hover:text-slate-700 bg-slate-50 border-slate-200'
                            }`}
                            title={ann.isPinned ? 'Desfijar de la portada' : 'Fijar en la parte superior'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteAnnouncement(currentCommunity.id, ann.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Eliminar aviso del mural"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Título y Contenido */}
                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {ann.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                      </p>

                      {/* Metadata adicional */}
                      <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-y-1">
                        <div>
                          <strong>Fecha:</strong> {formatDate(ann.date)} • <strong>Emisor:</strong> {ann.author || 'Administración'}
                        </div>
                        {ann.expiresAt && (
                          <div className="text-amber-700 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Vigente hasta: {formatDate(ann.expiresAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de Salida: Imprimir Lámina y WhatsApp */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium">
                        📍 {ann.location || 'Todo el Condominio'}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareAnnouncementWhatsApp(ann)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] rounded-xl flex items-center shadow-2xs transition-colors cursor-pointer"
                          title="Compartir comunicado en formato WhatsApp al grupo vecinal"
                        >
                          <Share2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          {copiedAnnId === ann.id ? '¡Abierto en WhatsApp!' : 'WhatsApp'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintMuralPdf(ann)}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] hover:from-[#0A291F] hover:to-[#0F3D2E] text-[#D4B895] border border-[#D4B895] font-black text-[11px] rounded-xl flex items-center shadow-2xs transition-all cursor-pointer"
                          title="Imprimir Lámina oficial de Diario Mural en PDF para fijar en vitrina de conserjería"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                          Lámina Mural (PDF)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: BIBLIOTECA DOCUMENTAL & CHECKLIST LEGAL (PROPUESTA 4)           */}
      {/* ========================================================================= */}
      {currentTab === 'documentos' && (
        <div className="space-y-4">
          {/* SEMÁFORO DE AUDITORÍA LEGAL LEY N° 21.442 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#0F3D2E]/10 rounded-xl text-[#0F3D2E] shrink-0">
                  <FileCheck2 className="w-5 h-5 text-[#0F3D2E]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                    Auditoría de Documentación Obligatoria (Ley N° 21.442 • Arts. 8°, 40° y 43°)
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Exigencia de Copropiedad Inmobiliaria
                    </span>
                  </h4>
                  <p className="text-[10.5px] text-slate-500">
                    Control de expedientes esenciales que deben mantenerse digitalizados y a libre disposición de la asamblea y el comité
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  legalAuditMetrics.percent === 100
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {legalAuditMetrics.percent === 100 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      100% Cumplimiento Legal
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      {legalAuditMetrics.completed} de {legalAuditMetrics.total} Obligatorios Cargados ({legalAuditMetrics.percent}%)
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Barra de progreso visual */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span>Expediente Documental del Condominio: {legalAuditMetrics.percent}% al día</span>
                <span>{legalAuditMetrics.completed} / {legalAuditMetrics.total} requisitos</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-[#0F3D2E] to-emerald-600 transition-all duration-500"
                  style={{ width: `${legalAuditMetrics.percent}%` }}
                />
              </div>
            </div>

            {/* Cuadrícula de los 5 requisitos legales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
              {legalAuditMetrics.checklistStatus.map(req => (
                <div
                  key={req.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                    req.isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/40 border-amber-200 text-amber-950'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                        {req.legalRef}
                      </span>
                      {req.isCompleted ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Vigente
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Pendiente
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-black mt-1 text-slate-900">{req.title}</h5>
                    <p className="text-[10.5px] text-slate-600 mt-1 leading-snug">{req.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    {req.isCompleted ? (
                      <span className="text-[10.5px] text-slate-500 font-bold truncate">
                        📄 {req.matchingDoc?.title}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDocForm(prev => ({
                            ...prev,
                            title: req.title,
                            category: req.category
                          }));
                          setShowNewDocModal(true);
                        }}
                        className="text-[11px] font-black text-[#0F3D2E] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Cargar este documento
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buscador de Documentos y Subida */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar documentos por nombre o categoría..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-700"
              >
                <option value="ALL">Todas las Categorías</option>
                <option value="Reglamento de Copropiedad">Reglamentos CBR</option>
                <option value="Seguridad y Emergencia">Planes de Emergencia PES</option>
                <option value="Contratos y Seguros">Contratos & Seguros</option>
                <option value="Actas de Asamblea">Actas Oficiales</option>
                <option value="Planos y Arquitectura">Planos & Redes</option>
              </select>

              <button
                type="button"
                onClick={() => setShowNewDocModal(true)}
                className="px-3.5 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                Subir Documento
              </button>
            </div>
          </div>

          {/* Grilla de Documentos */}
          {filteredDocuments.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-700">No hay documentos registrados en esta categoría</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Mantén digitalizado el Reglamento de Copropiedad, Pólizas de Seguro y Plan de Emergencia de la comunidad.
              </p>
              <button
                type="button"
                onClick={() => setShowNewDocModal(true)}
                className="px-4 py-2 bg-[#0F3D2E] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-[#D4B895]" />
                <span>Subir Documento Ahora</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#0F3D2E] bg-[#0F3D2E]/10 px-2 py-0.5 rounded-full">
                        {doc.category}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-medium">
                        {formatDate(doc.date)}
                      </span>
                    </div>

                    <div className="flex items-start space-x-3 mt-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 shrink-0">
                        <FileText className="w-5 h-5 text-[#0F3D2E]" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
                          {doc.title}
                        </h5>
                        <p className="text-[10.5px] text-slate-400 font-mono mt-0.5 truncate">
                          {doc.fileName || 'documento_legal.pdf'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (doc.fileUrl) {
                          setActiveDocPreview(doc);
                        } else {
                          setModalDialog({
                            isOpen: true,
                            type: 'info',
                            title: 'Custodia Documental',
                            message: `El documento "${doc.title}" se encuentra custodiado formalmente en el servidor seguro de la copropiedad.`,
                            confirmText: 'Entendido',
                            isAlert: true,
                            onConfirm: () => setModalDialog(prev => ({ ...prev, isOpen: false })),
                            onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
                          });
                        }
                      }}
                      className="text-xs font-bold text-[#0F3D2E] hover:text-[#0A291F] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Visualizar
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteDocument(currentCommunity.id, doc.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: LIBRO OFICIAL DE RECLAMOS & SUGERENCIAS                         */}
      {/* ========================================================================= */}
      {currentTab === 'reclamos' && (
        <SuggestionsAndComplaintsModule currentCommunity={currentCommunity} />
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: REGISTRO DE AMONESTACIONES & MULTAS (PROPUESTA 5)               */}
      {/* ========================================================================= */}
      {currentTab === 'multas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Registro Oficial de Multas & Sanciones Imputadas al Gasto Común
              </h4>
              <p className="text-[11px] text-slate-500">
                Aplicación reglamentaria de multas (Arts. 18° y 20° Ley N° 21.442) con cargo directo en la colilla mensual
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFineModal(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Cursar Nueva Multa
            </button>
          </div>

          <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950">
              <div className="font-bold">Efecto Operativo de las Multas en ARANPRO:</div>
              <p className="mt-0.5 leading-relaxed text-rose-900">
                Al aplicar una multa reglamentaria, el monto se adiciona automáticamente al <strong>cargo adicional (extraCharge)</strong> de la unidad infractora en la base de datos comunitaria. De este modo, en el módulo de <strong>Cierre y Cobro del Mes</strong> y en la <strong>Colilla Individual de Pago</strong> del copropietario aparecerá detallado el cobro de la multa.
              </p>
            </div>
          </div>

          {/* Tabla de Unidades con Multas */}
          {unitsWithFines.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-black text-slate-700">Comunidad sin multas vigentes</h4>
              <p className="text-xs text-slate-400">
                No existen cargos por infracción aplicados en este período para {currentCommunity?.name}.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Unidad</th>
                      <th className="py-3 px-4">Copropietario</th>
                      <th className="py-3 px-4">Glosa / Motivo de Sanción</th>
                      <th className="py-3 px-4 text-right">Monto Multa (CLP)</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {unitsWithFines.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-slate-900">
                          {u.tower ? `${u.tower} - ${u.number}` : `Casa ${u.number}`}
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          <div className="font-bold">{u.owner}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            RUT: {u.rut ? formatRut(u.rut) : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-md">
                          <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px] inline-block mb-0.5">
                            Infracción Imputada
                          </span>
                          <p className="text-xs">{u.extraChargeDescription || 'Multa reglamentaria'}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-700 text-sm">
                          {formatCLP(u.extraCharge)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handlePrintFineProof(u)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Reimprimir Comprobante Oficial de Notificación de Multa"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              PDF
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setModalDialog({
                                  isOpen: true,
                                  type: 'danger',
                                  title: '¿Anular Cargo de Multa?',
                                  message: `¿Estás seguro de anular el cargo de multa de ${formatCLP(u.extraCharge)} para la Casa ${u.number}?\n\nEsta acción reversará el recargo en la colilla del mes del copropietario.`,
                                  confirmText: 'Sí, Anular Multa',
                                  cancelText: 'Cancelar',
                                  isAlert: false,
                                  onConfirm: () => {
                                    setModalDialog(prev => ({ ...prev, isOpen: false }));
                                    handleReverseFine(u.id);
                                  },
                                  onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
                                });
                              }}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] border border-rose-200 cursor-pointer"
                              title="Anular / Reversar cargo de multa"
                            >
                              Anular
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NUEVO AVISO EN EL DIARIO MURAL                                  */}
      {/* ========================================================================= */}
      {showNewAnnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 text-[#D4B895] rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">Publicar Aviso en el Diario Mural</h4>
                  <p className="text-[11px] text-emerald-100">
                    Aparecerá en el portal de los vecinos de {currentCommunity?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAnnModal(false)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título del Comunicado</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Corte de agua programado por mantención de bombas"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad del Aviso</label>
                  <select
                    value={annForm.priority}
                    onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-xs bg-white"
                  >
                    <option value="Informativo">ℹ️ Informativo General</option>
                    <option value="Importante">⚠️ Importante (Convivencia/Obras)</option>
                    <option value="Urgente">🚨 Urgente (Corte Suministro/Emergencia)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={annForm.category}
                    onChange={(e) => setAnnForm({ ...annForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold text-xs bg-white"
                  >
                    <option value="Convivencia">Convivencia Vecinal</option>
                    <option value="Servicios Básicos">Servicios Básicos & Suministros</option>
                    <option value="Mantención & Obras">Mantención & Obras</option>
                    <option value="Seguridad">Seguridad & Conserjería</option>
                    <option value="Administración">Administración & Cobros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sector o Ubicación Afectada</label>
                  <input
                    type="text"
                    value={annForm.location}
                    onChange={(e) => setAnnForm({ ...annForm, location: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium"
                    placeholder="Ej. Todo el Condominio, Sector Portón..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Límite / Vigencia (Opcional)</label>
                  <input
                    type="date"
                    value={annForm.expiresAt}
                    onChange={(e) => setAnnForm({ ...annForm, expiresAt: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contenido Detallado del Aviso</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escriba el comunicado con instrucciones claras, horarios y medidas para los residentes..."
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium leading-relaxed"
                />
              </div>

              {/* Opción Fijar en Portada (Pin) */}
              <label className="flex items-center space-x-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={annForm.isPinned}
                  onChange={(e) => setAnnForm({ ...annForm, isPinned: e.target.checked })}
                  className="w-4 h-4 text-[#0F3D2E] rounded-md accent-[#0F3D2E]"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">📌 Fijar este aviso en la portada del portal</span>
                  <span className="text-[11px] text-slate-500">Se mostrará permanentemente en la parte superior hasta que sea desanclado.</span>
                </div>
              </label>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewAnnModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Publicar en Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SUBIR DOCUMENTO OFICIAL A LA BIBLIOTECA                         */}
      {/* ========================================================================= */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 text-[#D4B895] rounded-xl">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">Subir Documento a la Biblioteca Legal</h4>
                  <p className="text-[11px] text-emerald-100">
                    Custodia digital conforme a la Ley N° 21.442
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDocModal(false)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Oficial del Documento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Reglamento de Copropiedad Inscrito CBR La Serena"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría Legal</label>
                <select
                  value={docForm.category}
                  onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs bg-white"
                >
                  <option value="Reglamento de Copropiedad">Reglamento de Copropiedad (CBR)</option>
                  <option value="Seguridad y Emergencia">Plan de Emergencia y Evacuación (PES)</option>
                  <option value="Contratos y Seguros">Póliza de Seguro de Incendio (Art. 43°)</option>
                  <option value="Contratos y Seguros">Contrato Mantención Instalaciones Críticas</option>
                  <option value="Actas de Asamblea">Actas Oficiales de Asamblea</option>
                  <option value="Planos y Arquitectura">Planos Definitivos & Redes</option>
                  <option value="Otros Documentos">Otros Expedientes</option>
                </select>
              </div>

              <label className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#D4B895] bg-[#F5F4EF]/60 hover:bg-[#F5F4EF] text-[#0F3D2E] text-xs font-bold transition-colors">
                <Paperclip className="w-6 h-6 mb-1 text-[#0F3D2E]" />
                <span>Adjuntar Archivo PDF o Imagen</span>
                <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                  {docForm.fileName ? `Archivo seleccionado: ${docForm.fileName}` : 'Soporta PDF, PNG, JPG hasta 15MB'}
                </span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setDocForm(prev => ({
                        ...prev,
                        fileUrl: ev.target.result,
                        fileName: file.name
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewDocModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CURSAR E IMPUTAR MULTA A LA COLILLA DE GASTO COMÚN (PROPUESTA 5) */}
      {/* ========================================================================= */}
      {showFineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-300 rounded-xl">
                  <Scale className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black flex items-center gap-1.5">
                    Imputar Multa Reglamentaria al Gasto Común
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/40 text-rose-200 uppercase font-black">
                      Art. 20° Ley N° 21.442
                    </span>
                  </h4>
                  <p className="text-[11px] text-rose-200 mt-0.5">
                    Se adicionará automáticamente al cargo del mes de la unidad para cobrarse en su colilla
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFineModal(false)}
                className="p-1.5 text-rose-300 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyFineToUnit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unidad a Sancionar</label>
                <select
                  value={fineForm.unitId}
                  onChange={(e) => setFineForm({ ...fineForm, unitId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs bg-white"
                >
                  {(currentCommunity?.units || []).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.tower ? `${u.tower} - ${u.number}` : `Casa ${u.number}`} — {u.owner || 'Copropietario'} {u.extraCharge > 0 ? `(Multa previa activa: ${formatCLP(u.extraCharge)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Infracción Constatada</label>
                <input
                  type="text"
                  required
                  value={fineForm.reason}
                  onChange={(e) => setFineForm({ ...fineForm, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-xs"
                  placeholder="Ej. Ruidos molestos en horario de silencio / Mascota suelta reincidente"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Artículo del Reglamento / Ley</label>
                  <input
                    type="text"
                    value={fineForm.reglamentoArticle}
                    onChange={(e) => setFineForm({ ...fineForm, reglamentoArticle: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Folio Sanción</label>
                  <input
                    type="text"
                    value={fineForm.resolutionFolio}
                    onChange={(e) => setFineForm({ ...fineForm, resolutionFolio: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Selector de Monto (con atajos en UF) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Seleccionar Escala de Multa Reglamentaria:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFineForm({ ...fineForm, amountClp: 19750, ufEquivalent: '0.5 UF' })}
                    className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      fineForm.amountClp === 19750 ? 'bg-rose-900 text-white border-rose-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    0.5 UF ($19.750)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFineForm({ ...fineForm, amountClp: 39500, ufEquivalent: '1.0 UF' })}
                    className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      fineForm.amountClp === 39500 ? 'bg-rose-900 text-white border-rose-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    1.0 UF ($39.500)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFineForm({ ...fineForm, amountClp: 79000, ufEquivalent: '2.0 UF' })}
                    className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      fineForm.amountClp === 79000 ? 'bg-rose-900 text-white border-rose-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    2.0 UF ($79.000)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFineForm({ ...fineForm, amountClp: 118500, ufEquivalent: '3.0 UF' })}
                    className={`p-2 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      fineForm.amountClp === 118500 ? 'bg-rose-900 text-white border-rose-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    3.0 UF ($118.500)
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600">Monto Final a Imputar:</span>
                  <input
                    type="number"
                    min="1"
                    value={fineForm.amountClp}
                    onChange={(e) => setFineForm({ ...fineForm, amountClp: Number(e.target.value), ufEquivalent: 'Monto fijado' })}
                    className="p-2 border border-slate-300 rounded-xl font-black text-rose-700 text-sm w-36"
                  />
                  <span className="text-xs font-bold text-slate-500">CLP ({fineForm.ufEquivalent})</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                ⚖️ <strong>Validación Legal:</strong> Al hacer clic en <em>"Cargar Multa en Colilla"</em>, se generará el <strong>Comprobante Oficial de Notificación (PDF)</strong> para entrega formal y se sumará inmediatamente el valor a la colilla de la unidad seleccionada.
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFineModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Cargar Multa en Colilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VISUALIZADOR DE DOCUMENTO                                       */}
      {/* ========================================================================= */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#D4B895]" />
                <div>
                  <h4 className="text-xs font-black">{activeDocPreview.title}</h4>
                  <p className="text-[10px] text-slate-400">{activeDocPreview.category} • {formatDate(activeDocPreview.date)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center min-h-[400px]">
              {activeDocPreview.fileUrl ? (
                activeDocPreview.fileUrl.startsWith('data:image') ? (
                  <img src={activeDocPreview.fileUrl} alt={activeDocPreview.title} className="max-w-full max-h-[70vh] rounded-lg shadow-sm" />
                ) : (
                  <iframe src={activeDocPreview.fileUrl} title={activeDocPreview.title} className="w-full h-[70vh] rounded-lg border border-slate-300" />
                )
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  No hay archivo adjunto para previsualizar.
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-4 py-1.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmación corporativo ARANPRO (elimina popups nativos) */}
      <AranproConfirmModal
        isOpen={modalDialog.isOpen}
        type={modalDialog.type}
        title={modalDialog.title}
        message={modalDialog.message}
        confirmText={modalDialog.confirmText}
        cancelText={modalDialog.cancelText}
        isAlert={modalDialog.isAlert}
        onConfirm={modalDialog.onConfirm}
        onCancel={modalDialog.onCancel}
      />
    </div>
  );
};
