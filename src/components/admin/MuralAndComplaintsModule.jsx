import React, { useState, useMemo, useEffect } from 'react';
import { vaultGet } from '../../utils/fileVault';
import { useCommunity } from '../../context/CommunityContext';
import { formatDate, formatRut, formatCLP } from '../../utils/formatters';
import { notificationService } from '../../services/notificationService';
import { SuggestionsAndComplaintsModule } from './SuggestionsAndComplaintsModule';
import { AranproConfirmModal } from '../common/AranproConfirmModal';
import { CommunityNoticePreviewModal } from '../common/CommunityNoticeSheet';
import { useEconomicIndicators } from '../../hooks/useEconomicIndicators';
import {
  Megaphone, FolderOpen, MessageSquare, AlertTriangle, ShieldCheck,
  Plus, Printer, Share2, Trash2, CheckCircle2, Clock, Pin,
  FileText, Download, Eye, Calendar, Sparkles, Check, X,
  Search, Filter, Smartphone, HelpCircle, FileCheck2, Scale,
  Building2, Users, AlertCircle, ArrowRight, ShieldAlert,
  Paperclip, ExternalLink, RefreshCw
} from 'lucide-react';

const FINE_QUICK_PRESETS = [
  {
    id: 'ruidos',
    shortLabel: '🔊 Ruidos / Fiesta',
    ufSuggested: 1,
    reason: 'Ruidos molestos y emisiones sonoras fuera del horario de descanso reglamentario',
    reglamentoArticle: 'Arts. 18° y 24° Reglamento de Copropiedad · Art. 32° Ley N° 21.442',
    evidenceSource: 'Libro de Novedades de Conserjería y reclamo vecinal',
    partialArgument:
      'Se constató emisión de música y ruidos a alto volumen provenientes de la unidad fuera del horario de silencio permitido, afectando el descanso de las viviendas colindantes pese al aviso preventivo efectuado por conserjería.'
  },
  {
    id: 'estacionamiento',
    shortLabel: '🚗 Estacionamiento / Visita',
    ufSuggested: 0.5,
    reason: 'Uso indebido de estacionamiento de visitas u obstaculización de vías comunes',
    reglamentoArticle: 'Arts. 15° y 22° Reglamento de Copropiedad · Art. 17° Ley N° 21.442',
    evidenceSource: 'Bitácora de acceso vehicular y respaldo fotográfico',
    partialArgument:
      'Vehículo vinculado a la unidad permaneció estacionado excediendo el tiempo máximo autorizado en calzo de visitas y/o zona de circulación común, obstaculizando el tránsito y uso equitativo del recinto.'
  },
  {
    id: 'mascotas',
    shortLabel: '🐾 Mascotas sueltas / Higiene',
    ufSuggested: 0.5,
    reason: 'Circulación de mascota sin correa o incumplimiento de higiene en áreas comunes',
    reglamentoArticle: 'Art. 21° Reglamento Interno · Ley N° 21.020 y Ley N° 21.442',
    evidenceSource: 'Registro de cámaras y constancia de Conserjería',
    partialArgument:
      'Se verificó circulación de mascota perteneciente a la unidad sin medio de sujeción (correa) y/o sin retiro oportuno de desechos en espacios comunes, comprometiendo la seguridad e higiene de los residentes.'
  },
  {
    id: 'areas_comunes',
    shortLabel: '🏊 Quincho / Áreas Comunes',
    ufSuggested: 1,
    reason: 'Uso de área común fuera de horario o incumplimiento de condiciones de entrega',
    reglamentoArticle: 'Arts. 19° y 25° Reglamento de Uso de Espacios Comunes',
    evidenceSource: 'Acta de recepción e inspección de Conserjería',
    partialArgument:
      'Al término del uso de equipamiento común por parte de la unidad, se verificó exceso del horario límite autorizado y/o entrega del recinto sin cumplir las condiciones de orden, aseo e integridad reglamentarias.'
  },
  {
    id: 'basura',
    shortLabel: '🗑️ Basura / Escombros',
    ufSuggested: 1,
    reason: 'Acopio indebido de basura, enseres o escombros en bienes de dominio común',
    reglamentoArticle: 'Art. 16° Reglamento de Copropiedad · Art. 8° Ley N° 21.442',
    evidenceSource: 'Inspección en terreno y registro fotográfico de Administración',
    partialArgument:
      'Se constató depósito de bolsas, cajas voluminosas o escombros fuera de los contenedores habilitados, afectando la salubridad, libre tránsito y ornato de los espacios comunes del condominio.'
  },
  {
    id: 'obras_mudanza',
    shortLabel: '🔧 Obras / Mudanza sin permiso',
    ufSuggested: 2,
    reason: 'Ejecución de trabajos ruidosos o mudanza sin autorización previa o fuera de horario',
    reglamentoArticle: 'Art. 26° Reglamento de Copropiedad · Art. 20° Ley N° 21.442',
    evidenceSource: 'Control de acceso de contratistas / Conserjería',
    partialArgument:
      'Se ejecutaron faenas con emisión de ruido, ingreso de carga o mudanza sin salvoconducto ni aviso previo a la administración, o fuera de la franja horaria hábil establecida en el reglamento.'
  },
  {
    id: 'seguridad_arriendo',
    shortLabel: '🛡️ Seguridad / Ocupantes no reg.',
    ufSuggested: 3,
    reason: 'Incumplimiento de normas de control de acceso o registro obligatorio de ocupantes',
    reglamentoArticle: 'Arts. 17°, 20° y 32° Ley N° 21.442 · Reglamento Interno',
    evidenceSource: 'Registro de control de acceso y reporte al Comité',
    partialArgument:
      'Se verificó vulneración a los protocolos de seguridad en accesos y/o permanencia de ocupantes temporales sin inscripción previa en el Registro Oficial de Copropietarios y Residentes (Art. 17° Ley N° 21.442).'
  }
];

const FINE_PARTIAL_CLAUSES = [
  {
    label: '+ Ignoró aviso de conserjería',
    text: 'Cabe hacer presente que personal de conserjería efectuó requerimiento preventivo previo, sin obtener corrección oportuna de la conducta.'
  },
  {
    label: '+ Consta foto / cámaras',
    text: 'Los hechos cuentan con respaldo objetivo en registro fotográfico y/o sistema de televigilancia en custodia de la administración.'
  },
  {
    label: '+ Reclamo de vecinos',
    text: 'La infracción generó reclamos formales de unidades vecinas ingresados al libro oficial de la comunidad.'
  },
  {
    label: '+ Conducta reiterada',
    text: 'Se deja constancia de que la unidad registra antecedentes previos por hechos de similar naturaleza durante el período.'
  }
];

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
  const [privateTechnicalReports, setPrivateTechnicalReports] = useState([]);
  useEffect(() => {
    let live = true;
    setPrivateTechnicalReports([]);
    if (currentCommunity?.id && currentTab === 'documentos') vaultGet(`technical-reports-${currentCommunity.id}`).then(rows => {if (live) setPrivateTechnicalReports(Array.isArray(rows) ? rows : []);}).catch(error => console.warn('No se pudieron cargar informes técnicos:', error));
    return () => {live = false;};
  }, [currentCommunity?.id, currentTab]);

  // Modales
  const [showNewAnnModal, setShowNewAnnModal] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const indicators = useEconomicIndicators(showFineModal);
  const [activeDocPreview, setActiveDocPreview] = useState(null);
  const [noticePreviewState, setNoticePreviewState] = useState({
    isOpen: false,
    notice: null,
    allowStyleSwitch: false
  });

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
    visitDate: '',
    visitTime: '10:00 a 12:00 h',
    isPinned: false
  });

  // Formulario directo para Aviso de Visita de Administración (Media Carta 2 copias)
  const [visitQuickForm, setVisitQuickForm] = useState({
    title: 'Visita de administración',
    visitDate: new Date().toISOString().slice(0, 10),
    visitTime: '10:00 a 12:00 h',
    location: 'Accesos principales y áreas comunes',
    content:
      'Revisión presencial en terreno de accesos, instalaciones críticas, áreas comunes y coordinación operativa junto a conserjería y Comité de Administración.'
  });

  // Formulario Nuevo Documento
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Reglamento de Copropiedad',
    notes: '',
    fileUrl: '',
    fileName: ''
  });

  // Formulario Aplicación de Amonestación ($0) o Multa sincronizado 1-a-1 con el PDF Oficial
  const [fineForm, setFineForm] = useState({
    sanctionMode: 'fine', // 'fine' | 'warning'
    presetId: 'ruidos',
    unitId: 'u-8',
    conditionType: 'Primera infracción reglamentaria',
    incidentDate: new Date().toISOString().slice(0, 10),
    incidentTime: '23:30 hrs',
    reason: FINE_QUICK_PRESETS[0].reason,
    partialArgument: FINE_QUICK_PRESETS[0].partialArgument,
    reglamentoArticle: FINE_QUICK_PRESETS[0].reglamentoArticle,
    evidenceSource: FINE_QUICK_PRESETS[0].evidenceSource,
    appealTerm: '5 días hábiles',
    amountClp: '',
    ufEquivalent: 'Monto por definir',
    ufDate: '',
    ufValue: null,
    resolutionFolio: 'SANC-2026-01',
    notifyWhatsApp: true
  });

  const openSanctionModal = (mode = 'fine', overrides = {}) => {
    const defaultUnitId =
      overrides.unitId ||
      fineForm.unitId ||
      currentCommunity?.units?.[0]?.id ||
      'u-1';
    const year = new Date().getFullYear();
    const isWarningMode = mode === 'warning';
    setFineForm((prev) => ({
      ...prev,
      sanctionMode: mode,
      unitId: defaultUnitId,
      conditionType: isWarningMode
        ? 'Apercibimiento preventivo'
        : overrides.conditionType ||
          (prev.conditionType === 'Apercibimiento preventivo'
            ? 'Primera infracción reglamentaria'
            : prev.conditionType),
      appealTerm: isWarningMode
        ? '48 horas hábiles'
        : overrides.appealTerm || (prev.appealTerm === '48 horas hábiles' ? '5 días hábiles' : prev.appealTerm),
      resolutionFolio:
        overrides.resolutionFolio ||
        (isWarningMode
          ? prev.resolutionFolio?.startsWith('ADV-')
            ? prev.resolutionFolio
            : `ADV-${year}-01`
          : prev.resolutionFolio?.startsWith('SANC-')
          ? prev.resolutionFolio
          : `SANC-${year}-01`),
      ...overrides
    }));
    setShowFineModal(true);
  };
  const fineUfOutdated = !!fineForm.ufDate && (!indicators.ufCurrent || fineForm.ufDate !== indicators.today || fineForm.ufValue !== indicators.data?.uf?.value);

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

  // Historial consolidado de Amonestaciones / Advertencias Preventivas ($0)
  const registeredWarnings = useMemo(() => {
    const list = [];
    (currentCommunity?.units || []).forEach((u) => {
      (u.warningsHistory || []).forEach((w) => {
        list.push({ ...w, unit: u });
      });
    });
    return list.sort((a, b) => String(b.issuedDate || '').localeCompare(String(a.issuedDate || '')));
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
      visitDate: '',
      visitTime: '10:00 a 12:00 h',
      isPinned: false
    });
    setShowNewAnnModal(false);
  };

  // 2. Vista Previa e Impresión Afiche Media Carta (2 copias por Hoja Carta)
  const handlePrintMuralPdf = (ann) => {
    if (!currentCommunity || !ann) return;
    setNoticePreviewState({
      isOpen: true,
      allowStyleSwitch: true,
      notice: {
        title: ann.title,
        content: ann.content,
        category: ann.category,
        priority: ann.priority,
        location: ann.location || 'Toda la comunidad',
        date: ann.date || new Date().toISOString().slice(0, 10),
        expiresAt: ann.expiresAt || '',
        visitDate: ann.visitDate || ann.expiresAt || ann.date || new Date().toISOString().slice(0, 10),
        visitTime: ann.visitTime || '10:00 a 12:00 h'
      }
    });
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

  // 5. Emitir Advertencia Preventiva ($0) o Cargar Multa en Colilla de Gastos Comunes
  const handleApplyFineToUnit = (e) => {
    e.preventDefault();
    const targetUnit =
      (currentCommunity?.units || []).find((u) => u.id === fineForm.unitId) ||
      currentCommunity?.units?.[0];
    if (!targetUnit) return;

    const unitLabel = targetUnit.tower
      ? `${targetUnit.tower} - ${targetUnit.number}`
      : `Casa ${targetUnit.number}`;

    // MODO A: AMONESTACIÓN / ADVERTENCIA PREVENTIVA ($0 SIN RECARGO EN COLILLA)
    if (fineForm.sanctionMode === 'warning') {
      const warningRecord = {
        id: `warn-${Date.now()}`,
        variant: 'warning',
        conditionType: fineForm.conditionType || 'Apercibimiento preventivo',
        incidentDate: fineForm.incidentDate || new Date().toISOString().slice(0, 10),
        incidentTime: fineForm.incidentTime || '',
        reason: fineForm.reason,
        partialArgument: fineForm.partialArgument || '',
        reglamentoArticle:
          fineForm.reglamentoArticle || 'Arts. 17°, 20° y 21° Ley N° 21.442 · Reglamento Interno',
        evidenceSource: fineForm.evidenceSource || 'Libro de Novedades de Conserjería',
        appealTerm: fineForm.appealTerm || '48 horas hábiles',
        resolutionFolio:
          fineForm.resolutionFolio ||
          `ADV-${new Date().getFullYear()}-${String((targetUnit.warningsHistory?.length || 0) + 1).padStart(2, '0')}`,
        issuedDate: new Date().toISOString().slice(0, 10)
      };

      const prevWarnings = Array.isArray(targetUnit.warningsHistory) ? targetUnit.warningsHistory : [];
      updateUnit(currentCommunity.id, targetUnit.id, {
        warningsHistory: [warningRecord, ...prevWarnings]
      });

      setFineSuccessMessage(
        `¡Advertencia preventiva (${warningRecord.resolutionFolio}) registrada para ${unitLabel} sin recargo en colilla ($0)! Se abrió el documento oficial con sus 2 copias.`
      );
      setTimeout(() => setFineSuccessMessage(''), 6000);

      setNoticePreviewState({
        isOpen: true,
        allowStyleSwitch: false,
        notice: {
          ...warningRecord,
          variant: 'warning',
          unitLabel,
          ownerName: targetUnit.owner || '',
          ownerRut: targetUnit.rut || '',
          folio: warningRecord.resolutionFolio,
          date: warningRecord.issuedDate
        }
      });

      setShowFineModal(false);
      return;
    }

    // MODO B: MULTA REGLAMENTARIA CON CARGO EN COLILLA MENSUAL
    if (!Number.isFinite(Number(fineForm.amountClp)) || Number(fineForm.amountClp) <= 0 || fineUfOutdated) return;

    const previousCharge = targetUnit.extraCharge || 0;
    const newCharge = previousCharge + Number(fineForm.amountClp);
    const detail = `${fineForm.ufEquivalent}${fineForm.ufDate ? `; UF $${fineForm.ufValue.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} del ${fineForm.ufDate}, indicadores.cl` : ''}`;
    const newDescription = targetUnit.extraChargeDescription
      ? `${targetUnit.extraChargeDescription} • Multa: ${fineForm.reason} (${detail})`
      : `Multa: ${fineForm.reason} (${detail})`;

    const savedFineRecord = {
      conditionType: fineForm.conditionType || 'Primera infracción reglamentaria',
      incidentDate: fineForm.incidentDate || new Date().toISOString().slice(0, 10),
      incidentTime: fineForm.incidentTime || '',
      reason: fineForm.reason,
      partialArgument: fineForm.partialArgument || '',
      reglamentoArticle: fineForm.reglamentoArticle || 'Art. 18° y 24° del Reglamento de Copropiedad',
      evidenceSource: fineForm.evidenceSource || 'Libro de Novedades de Conserjería',
      appealTerm: fineForm.appealTerm || '5 días hábiles',
      amountClp: Number(fineForm.amountClp),
      ufEquivalent: fineForm.ufEquivalent || '',
      resolutionFolio: fineForm.resolutionFolio || 'SANC-2026-01',
      issuedDate: new Date().toISOString().slice(0, 10)
    };

    updateUnit(currentCommunity.id, targetUnit.id, {
      extraCharge: newCharge,
      extraChargeDescription: newDescription,
      lastFineRecord: savedFineRecord
    });

    void notificationService.notifyUnitFineApplied({
      community: currentCommunity,
      unit: targetUnit,
      fine: fineForm
    });

    setFineSuccessMessage(`¡Multa de ${formatCLP(fineForm.amountClp)} (${fineForm.ufEquivalent}) imputada y notificada en línea a Casa ${targetUnit.number}! Aparecerá en la colilla de cobro del mes.`);
    setTimeout(() => setFineSuccessMessage(''), 5000);

    // Abrir Vista Previa Oficial Media Carta (2 Copias por Hoja) lista para imprimir
    handlePrintFineProof(targetUnit, fineForm);

    setShowFineModal(false);
  };

  // Construir datos normalizados de Notificación de Multa (Media Carta 2-por-hoja)
  const buildFineNoticePayload = (targetUnit, overrideFine = null) => {
    const unitLabel = targetUnit.tower
      ? `${targetUnit.tower} - ${targetUnit.number}`
      : `Casa ${targetUnit.number}`;

    const src = overrideFine || targetUnit.lastFineRecord || null;
    if (src) {
      return {
        variant: 'fine',
        unitLabel,
        ownerName: targetUnit.owner || '',
        ownerRut: targetUnit.rut || '',
        conditionType: src.conditionType || 'Primera infracción reglamentaria',
        incidentDate: src.incidentDate || src.issuedDate || new Date().toISOString().slice(0, 10),
        incidentTime: src.incidentTime || '',
        amountClp: Number(src.amountClp || targetUnit.extraCharge || 0),
        ufEquivalent: src.ufEquivalent || '',
        reason: src.reason || 'Infracción al Reglamento de Copropiedad',
        partialArgument: src.partialArgument || '',
        reglamentoArticle:
          src.reglamentoArticle || 'Art. 18° y 24° del Reglamento de Copropiedad',
        evidenceSource: src.evidenceSource || 'Libro de Novedades de Conserjería',
        appealTerm: src.appealTerm || '5 días hábiles',
        folio: src.resolutionFolio || 'SANC-2026-01',
        date: src.issuedDate || new Date().toISOString().slice(0, 10)
      };
    }

    const rawDesc = String(targetUnit.extraChargeDescription || '')
      .replace(/^Multa:\s*/i, '')
      .trim();
    const ufMatch = /\(([^)]*UF[^)]*)\)/i.exec(rawDesc);
    const cleanedReason = rawDesc.replace(/\s*\([^)]*UF[^)]*\)\s*$/i, '').trim();

    return {
      variant: 'fine',
      unitLabel,
      ownerName: targetUnit.owner || '',
      ownerRut: targetUnit.rut || '',
      conditionType: 'Infracción reglamentaria vigente',
      incidentDate: new Date().toISOString().slice(0, 10),
      incidentTime: '',
      amountClp: Number(targetUnit.extraCharge || 0),
      ufEquivalent: ufMatch ? ufMatch[1].split(';')[0].trim() : '',
      reason: cleanedReason || 'Infracción constatada al Reglamento de Copropiedad',
      partialArgument:
        'Hecho verificado y registrado por la administración conforme a los antecedentes del período vigente, imputándose su cobro al estado mensual de gastos comunes de la unidad.',
      reglamentoArticle: 'Arts. 17°, 20° y 27° Ley N° 21.442 · Reglamento de Copropiedad',
      evidenceSource: 'Registro administrativo y Libro de Conserjería',
      appealTerm: '5 días hábiles',
      folio: `SANC-${new Date().getFullYear()}-${String(targetUnit.number).padStart(2, '0')}`,
      date: new Date().toISOString().slice(0, 10)
    };
  };

  // Vista Previa e Impresión Oficial de Multa (Media Carta · 2 Ejemplares por Hoja)
  const handlePrintFineProof = (targetUnit, overrideFine = null) => {
    if (!currentCommunity || !targetUnit) return;
    setNoticePreviewState({
      isOpen: true,
      allowStyleSwitch: false,
      notice: buildFineNoticePayload(targetUnit, overrideFine)
    });
  };

  // Eliminar una Advertencia Preventiva del historial de la unidad
  const handleDeleteWarning = (unitId, warningId) => {
    const u = (currentCommunity?.units || []).find((item) => item.id === unitId);
    if (!u) return;
    updateUnit(currentCommunity.id, unitId, {
      warningsHistory: (u.warningsHistory || []).filter((w) => w.id !== warningId)
    });
    setFineSuccessMessage('Registro de advertencia preventiva eliminado correctamente.');
    setTimeout(() => setFineSuccessMessage(''), 4000);
  };

  // Reversar / Anular Multa de una unidad
  const handleReverseFine = (unitId) => {
    updateUnit(currentCommunity.id, unitId, {
      extraCharge: 0,
      extraChargeDescription: '',
      lastFineRecord: null
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
                Avisos de Convivencia, Visitas, Reclamos & Multas
              </h3>
              <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full border border-[#0F3D2E]/20 uppercase shrink-0">
                Ley N° 21.442 • Arts. 8°, 17° y 20°
              </span>
              <span className="text-[9.5px] font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md hidden sm:inline-block shrink-0">
                {currentCommunity?.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Afiches de convivencia, avisos de visita en terreno, multas con base legal (media carta 2 copias) y biblioteca
            </p>
          </div>
        </div>

        {/* Acciones principales rápidas a la derecha */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAnnForm((prev) => ({ ...prev, category: 'Convivencia' }));
              setShowNewAnnModal(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] hover:from-[#0A291F] hover:to-[#0F3D2E] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer"
            title="Crear e imprimir un Afiche de Convivencia o Comunicado para el mural"
          >
            <Plus className="w-4 h-4 mr-1.5 text-[#D4B895]" />
            Afiche Convivencia
          </button>

          <button
            type="button"
            onClick={() => setTab('visitas')}
            className="px-3.5 py-2 bg-[#F5F4EF] hover:bg-[#eae7dc] text-[#0F3D2E] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Emitir e imprimir Aviso de Visita de Administración (2 copias media carta)"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
            Aviso de Visita
          </button>

          <button
            type="button"
            onClick={() => openSanctionModal('warning')}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Emitir Amonestación o Advertencia Preventiva sin cobro ($0) en formato media carta (2 copias)"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
            Emitir Advertencia
          </button>

          <button
            type="button"
            onClick={() => openSanctionModal('fine')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Cursar e imprimir Notificación de Multa reglamentaria (2 copias media carta)"
          >
            <Scale className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
            Cursar Multa
          </button>

          <button
            type="button"
            onClick={() => setShowNewDocModal(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Subir documento oficial a la biblioteca comunitaria"
          >
            <Paperclip className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
            Subir Doc
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
          <span>1. Comunicados & Afiches</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            currentTab === 'mural' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeAnnouncementsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('visitas')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'visitas'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>2. Avisos de Visita (PDF)</span>
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
          <span>3. Biblioteca Documental</span>
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
          <span>4. Reclamos & Sugerencias</span>
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
          <span>5. Amonestaciones & Multas</span>
          {(unitsWithFines.length + registeredWarnings.length) > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-100 text-rose-800">
              {unitsWithFines.length + registeredWarnings.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA ESPECIAL: AVISOS DE VISITA DE ADMINISTRACIÓN EN TERRENO (PDF 2 COPIAS) */}
      {/* ========================================================================= */}
      {currentTab === 'visitas' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F5F4EF] border border-[#D4B895] rounded-xl text-[#0F3D2E]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Generador de Aviso de Visita de Administración / Mantención (Media Carta · 2 Copias)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Genera en 1 clic la hoja Carta con 2 ejemplares: Ejemplar 1 para Mural / Residentes y Ejemplar 2 con constancia para Conserjería o Libro de Registro.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Aviso</label>
                <input
                  type="text"
                  value={visitQuickForm.title}
                  onChange={(e) => setVisitQuickForm({ ...visitQuickForm, title: e.target.value })}
                  placeholder="Ej. Visita de administración"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha Programada</label>
                <input
                  type="date"
                  value={visitQuickForm.visitDate}
                  onChange={(e) => setVisitQuickForm({ ...visitQuickForm, visitDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Horario Estimado</label>
                <input
                  type="text"
                  value={visitQuickForm.visitTime}
                  onChange={(e) => setVisitQuickForm({ ...visitQuickForm, visitTime: e.target.value })}
                  placeholder="Ej. 10:00 a 12:00 h"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sector / Alcance</label>
                <input
                  type="text"
                  value={visitQuickForm.location}
                  onChange={(e) => setVisitQuickForm({ ...visitQuickForm, location: e.target.value })}
                  placeholder="Ej. Accesos principales y áreas comunes"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Motivo y Detalle de la Visita</label>
                <textarea
                  rows={2}
                  value={visitQuickForm.content}
                  onChange={(e) => setVisitQuickForm({ ...visitQuickForm, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setNoticePreviewState({
                    isOpen: true,
                    allowStyleSwitch: true,
                    notice: {
                      variant: 'visit',
                      title: visitQuickForm.title || 'Visita de administración',
                      content: visitQuickForm.content,
                      category: 'Visita de Administración',
                      priority: 'Importante',
                      location: visitQuickForm.location || 'Áreas comunes',
                      visitDate: visitQuickForm.visitDate,
                      visitTime: visitQuickForm.visitTime,
                      date: new Date().toISOString().slice(0, 10)
                    }
                  })
                }
                className="px-4 py-2 bg-white hover:bg-slate-50 text-[#0F3D2E] border border-[#0F3D2E] font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#0F3D2E]" />
                <span>Solo Vista Previa / Imprimir PDF (2 copias)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const payload = {
                    title: visitQuickForm.title || 'Visita de administración',
                    content: visitQuickForm.content,
                    category: 'Visita de Administración',
                    priority: 'Importante',
                    location: visitQuickForm.location || 'Áreas comunes',
                    visitDate: visitQuickForm.visitDate,
                    visitTime: visitQuickForm.visitTime,
                    expiresAt: visitQuickForm.visitDate,
                    isPinned: true,
                    date: new Date().toISOString().slice(0, 10),
                    author: 'Administración ARANPRO'
                  };
                  addAnnouncement(currentCommunity.id, payload);
                  setNoticePreviewState({
                    isOpen: true,
                    allowStyleSwitch: true,
                    notice: { ...payload, variant: 'visit' }
                  });
                }}
                className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D4B895]" />
                <span>Publicar en Portal Vecinal + Abrir PDF (2 copias)</span>
              </button>
            </div>
          </div>

          {/* Historial de Visitas y Mantenciones publicadas en el Mural */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Visitas y Mantenciones Programadas en esta Comunidad
            </h5>
            {(currentCommunity?.announcements || []).filter((a) =>
              /visita|mantenci|revisi|servicio/i.test(`${a.category || ''} ${a.title || ''}`)
            ).length === 0 ? (
              <p className="text-xs text-slate-500">
                Aún no hay visitas publicadas en el mural. Usa el formulario superior para imprimir un aviso inmediato o publicarlo para los residentes.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(currentCommunity?.announcements || [])
                  .filter((a) => /visita|mantenci|revisi|servicio/i.test(`${a.category || ''} ${a.title || ''}`))
                  .map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-[#F5F4EF]/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#0F3D2E] truncate">{ann.title}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{ann.content}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          📅 {formatDate(ann.visitDate || ann.expiresAt || ann.date)} {ann.visitTime ? `• 🕒 ${ann.visitTime}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrintMuralPdf({ ...ann, variant: 'visit' })}
                        className="px-3 py-1.5 bg-[#0F3D2E] text-[#D4B895] font-black text-[11px] rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>PDF (2 copias)</span>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                          title="Vista previa e impresión en formato afiche media carta (2 copias por hoja carta)"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                          Afiche / PDF (2 copias)
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-[#0F3D2E]">Informes técnicos guardados en este navegador</h4>
            <p className="text-xs text-slate-600">Borradores para administración, no publicados a residentes. Para abrirlos o generar el PDF, entra en Mi Empresa → Inspección técnica y selecciona esta comunidad.</p>
            {privateTechnicalReports.length ? privateTechnicalReports.map(report => <div key={report.id} className="text-xs p-2 bg-slate-50 rounded-lg">{report.report?.purpose || 'Informe técnico'} • {new Date(report.savedAt).toLocaleDateString('es-CL')}</div>) : <p className="text-xs text-slate-500">No hay borradores guardados para esta comunidad en este navegador.</p>}
          </div>
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
      {/* VISTA 4: REGISTRO DE AMONESTACIONES & MULTAS                              */}
      {/* ========================================================================= */}
      {currentTab === 'multas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Registro Oficial de Amonestaciones Preventivas ($0) & Multas Reglamentarias
              </h4>
              <p className="text-[11px] text-slate-500">
                Emite un apercibimiento preventivo previo sin cobro o imputa una multa en colilla (formato oficial media carta · 2 copias)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openSanctionModal('warning')}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-black text-xs rounded-xl flex items-center shadow-2xs transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
                + Emitir Advertencia ($0)
              </button>
              <button
                type="button"
                onClick={() => openSanctionModal('fine')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                + Cursar Nueva Multa
              </button>
            </div>
          </div>

          {/* BLOQUE 1: AMONESTACIONES Y ADVERTENCIAS PREVENTIVAS ($0) */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-amber-50/70 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  1. Amonestaciones y Advertencias Preventivas Emitidas (Sin Recargo · $0)
                </h5>
              </div>
              <span className="text-[10.5px] font-bold text-amber-800">
                {registeredWarnings.length} registradas
              </span>
            </div>

            {registeredWarnings.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No hay advertencias preventivas registradas aún. Usa <strong>«+ Emitir Advertencia ($0)»</strong> para notificar formalmente a una unidad antes de aplicar multa.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Folio / Fecha</th>
                      <th className="py-2.5 px-4">Unidad</th>
                      <th className="py-2.5 px-4">Causal y Antecedentes</th>
                      <th className="py-2.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {registeredWarnings.map((w) => {
                      const u = w.unit;
                      const unitLabel = u.tower ? `${u.tower} - ${u.number}` : `Casa ${u.number}`;
                      return (
                        <tr key={w.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono">
                            <div className="font-black text-amber-900">{w.resolutionFolio || 'ADV'}</div>
                            <div className="text-[10px] text-slate-500">{formatDate(w.issuedDate || w.incidentDate)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-900">{unitLabel}</div>
                            <div className="text-[10.5px] text-slate-500">{u.owner}</div>
                          </td>
                          <td className="py-3 px-4 max-w-md">
                            <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200 text-[10px] inline-block mb-0.5">
                              Apercibimiento Preventivo ($0)
                            </span>
                            <div className="font-bold text-slate-800">{w.reason}</div>
                            {w.partialArgument && (
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{w.partialArgument}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setNoticePreviewState({
                                    isOpen: true,
                                    allowStyleSwitch: false,
                                    notice: {
                                      ...w,
                                      variant: 'warning',
                                      unitLabel,
                                      ownerName: u.owner || '',
                                      ownerRut: u.rut || '',
                                      folio: w.resolutionFolio,
                                      date: w.issuedDate
                                    }
                                  })
                                }
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                                Vista / PDF (2 copias)
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openSanctionModal('fine', {
                                    unitId: u.id,
                                    conditionType: 'Reincidencia reglamentaria',
                                    reason: w.reason,
                                    partialArgument: `${w.partialArgument ? `${w.partialArgument} ` : ''}Pese a notificación de advertencia preventiva previa (Folio ${w.resolutionFolio}), se constató reiteración de la infracción.`.trim(),
                                    reglamentoArticle: w.reglamentoArticle,
                                    evidenceSource: w.evidenceSource
                                  })
                                }
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px] cursor-pointer"
                                title="Cursar multa por reincidencia tomando como base esta advertencia"
                              >
                                Escalar a Multa
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteWarning(u.id, w.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                                title="Eliminar registro de advertencia"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950">
              <div className="font-bold">2. Multas Reglamentarias con Cargo en Colilla Mensual:</div>
              <p className="mt-0.5 leading-relaxed text-rose-900">
                Al aplicar una multa pecuniaria, el monto se suma automáticamente al <strong>cargo adicional</strong> de la unidad infractora para cobrarse en el <strong>Cierre y Cobro del Mes</strong> y en su <strong>Colilla Individual</strong>.
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
                              title="Ver e imprimir Notificación Oficial Media Carta (2 copias: Residente y Conserjería/Registro)"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                              Vista / PDF (2 copias)
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
                    <option value="Convivencia">Convivencia Vecinal (Afiche Media Carta)</option>
                    <option value="Visita de Administración">Visita de Administración en Terreno</option>
                    <option value="Mantención & Obras">Mantención & Obras Programadas</option>
                    <option value="Servicios Básicos">Servicios Básicos & Suministros</option>
                    <option value="Seguridad">Seguridad & Conserjería</option>
                    <option value="Administración">Administración & Cobros</option>
                  </select>
                </div>
              </div>

              {(annForm.category === 'Visita de Administración' ||
                annForm.category === 'Mantención & Obras' ||
                annForm.category === 'Servicios Básicos') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F5F4EF] border border-[#D4B895]/60 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-[#0F3D2E] mb-1">
                      Fecha Programada de Visita / Actividad
                    </label>
                    <input
                      type="date"
                      value={annForm.visitDate}
                      onChange={(e) => setAnnForm({ ...annForm, visitDate: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F3D2E] mb-1">
                      Horario Estimado (para afiche de visita)
                    </label>
                    <input
                      type="text"
                      value={annForm.visitTime}
                      onChange={(e) => setAnnForm({ ...annForm, visitTime: e.target.value })}
                      placeholder="Ej. 10:00 a 12:00 h"
                      className="w-full p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                    />
                  </div>
                </div>
              )}

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

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handlePrintMuralPdf({
                      ...annForm,
                      title: annForm.title || (annForm.category === 'Visita de Administración' ? 'Visita de administración' : 'Cuidemos la buena convivencia'),
                      content: annForm.content || 'Comunicado oficial dirigido a todos los residentes de la comunidad.',
                      date: new Date().toISOString().slice(0, 10)
                    })
                  }
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0F3D2E] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vista Previa Afiche (2 copias)</span>
                </button>
                <div className="flex items-center space-x-2">
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
      {/* MODAL 3: EMITIR ADVERTENCIA PREVENTIVA ($0) O IMPUTAR MULTA EN COLILLA    */}
      {/* ========================================================================= */}
      {showFineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            <div
              className={`px-5 py-4 text-white flex items-center justify-between shrink-0 ${
                fineForm.sanctionMode === 'warning'
                  ? 'bg-gradient-to-r from-[#0F3D2E] via-[#14533d] to-slate-900'
                  : 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    fineForm.sanctionMode === 'warning'
                      ? 'bg-[#D4B895]/20 text-[#D4B895]'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {fineForm.sanctionMode === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-[#D4B895]" />
                  ) : (
                    <Scale className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black flex items-center gap-1.5 flex-wrap">
                    {fineForm.sanctionMode === 'warning'
                      ? 'Emitir Amonestación / Advertencia Preventiva ($0)'
                      : 'Imputar Multa Reglamentaria al Gasto Común'}
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white uppercase font-black">
                      Art. 17°, 20° y 27° Ley N° 21.442
                    </span>
                  </h4>
                  <p className="text-[11px] text-white/80 mt-0.5">
                    {fineForm.sanctionMode === 'warning'
                      ? 'Apercibimiento formal sin cobro en colilla: deja constancia oficial y genera las 2 copias media carta'
                      : 'Selecciona causal rápida, ajusta la argumentación parcial y carga la multa en la colilla del mes'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFineModal(false)}
                className="p-1.5 text-white/75 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyFineToUnit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {/* SELECTOR DE TIPO DE DOCUMENTO: ADVERTENCIA ($0) VS MULTA (CON COBRO) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => openSanctionModal('warning')}
                  className={`py-2 px-3 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    fineForm.sanctionMode === 'warning'
                      ? 'bg-[#0F3D2E] text-[#D4B895] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>1. Advertencia Preventiva ($0)</span>
                </button>
                <button
                  type="button"
                  onClick={() => openSanctionModal('fine')}
                  className={`py-2 px-3 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    fineForm.sanctionMode === 'fine'
                      ? 'bg-rose-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>2. Multa con Cobro en Colilla</span>
                </button>
              </div>
              {/* 1. PLANTILLAS DE LLENADO RÁPIDO (1 CLIC) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                    Alternativas de Llenado Rápido (Autocompleta causal, norma, respaldo y argumento base)
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">100% editable</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FINE_QUICK_PRESETS.map((preset) => {
                    const isSelected = fineForm.presetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          const suggestedClp = indicators.ufCurrent
                            ? Math.round(indicators.data.uf.value * preset.ufSuggested)
                            : fineForm.amountClp;
                          setFineForm((prev) => ({
                            ...prev,
                            presetId: preset.id,
                            reason: preset.reason,
                            partialArgument: preset.partialArgument,
                            reglamentoArticle: preset.reglamentoArticle,
                            evidenceSource: preset.evidenceSource,
                            ...(indicators.ufCurrent
                              ? {
                                  amountClp: suggestedClp,
                                  ufEquivalent: `${preset.ufSuggested.toFixed(1)} UF`,
                                  ufDate: indicators.data.uf.date,
                                  ufValue: indicators.data.uf.value
                                }
                              : {})
                          }));
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-900 text-white border-rose-900 shadow-2xs'
                            : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {preset.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. UNIDAD, CALIFICACIÓN Y FOLIO */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidad a Sancionar</label>
                  <select
                    value={fineForm.unitId}
                    onChange={(e) => setFineForm({ ...fineForm, unitId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs bg-white"
                  >
                    {(currentCommunity?.units || []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.tower ? `${u.tower} - ${u.number}` : `Casa ${u.number}`} — {u.owner || 'Copropietario'}{' '}
                        {u.extraCharge > 0 ? `(Multa previa: ${formatCLP(u.extraCharge)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Calificación de la Falta</label>
                  <select
                    value={fineForm.conditionType}
                    onChange={(e) => setFineForm({ ...fineForm, conditionType: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs bg-white"
                  >
                    {fineForm.sanctionMode === 'warning' ? (
                      <>
                        <option value="Apercibimiento preventivo">Apercibimiento Preventivo ($0)</option>
                        <option value="Última advertencia previa a multa">Última Advertencia Previa a Multa</option>
                      </>
                    ) : (
                      <>
                        <option value="Primera infracción reglamentaria">1ª Infracción Reglamentaria</option>
                        <option value="Reincidencia reglamentaria">Reincidencia (Recargo Reglamentario)</option>
                        <option value="Falta grave a la convivencia / seguridad">Falta Grave (Seguridad / Convivencia)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Folio</label>
                  <input
                    type="text"
                    value={fineForm.resolutionFolio}
                    onChange={(e) => setFineForm({ ...fineForm, resolutionFolio: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* 3. CAUSAL + ARGUMENTACIÓN PARCIAL COMBINABLE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Causal / Título de la Infracción Constatada
                </label>
                <input
                  type="text"
                  required
                  value={fineForm.reason}
                  onChange={(e) => setFineForm({ ...fineForm, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs text-slate-900"
                  placeholder="Ej. Ruidos molestos en horario de silencio nocturno"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Argumentación Parcial y Relato del Hecho (aparece en el documento impreso)
                  </label>
                  <span className="text-[10px] text-slate-500">Agrega frases con 1 clic o redacta el detalle puntual:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {FINE_PARTIAL_CLAUSES.map((clause, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setFineForm((prev) => ({
                          ...prev,
                          partialArgument: prev.partialArgument?.includes(clause.text)
                            ? prev.partialArgument
                            : `${(prev.partialArgument || '').trim()} ${clause.text}`.trim()
                        }))
                      }
                      className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10.5px] font-bold cursor-pointer transition-colors"
                      title={clause.text}
                    >
                      {clause.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  required
                  value={fineForm.partialArgument}
                  onChange={(e) => setFineForm({ ...fineForm, partialArgument: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium leading-relaxed text-slate-800"
                  placeholder="Detalle el hecho constatado, lugar, circunstancias y antecedentes relevantes..."
                />
              </div>

              {/* 4. FECHA/HORA DEL HECHO, NORMA, RESPALDO Y PLAZO DE DESCARGOS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha del Hecho</label>
                  <input
                    type="date"
                    value={fineForm.incidentDate}
                    onChange={(e) => setFineForm({ ...fineForm, incidentDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora Aprox. / Franja</label>
                  <input
                    type="text"
                    value={fineForm.incidentTime}
                    onChange={(e) => setFineForm({ ...fineForm, incidentTime: e.target.value })}
                    placeholder="Ej. 23:45 hrs / Madrugada"
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Plazo de Descargos</label>
                  <select
                    value={fineForm.appealTerm}
                    onChange={(e) => setFineForm({ ...fineForm, appealTerm: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="5 días hábiles">5 días hábiles (Estándar)</option>
                    <option value="48 horas hábiles">48 horas hábiles</option>
                    <option value="10 días corridos">10 días corridos</option>
                  </select>
                </div>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medio de Verificación / Respaldo</label>
                  <input
                    type="text"
                    list="fine-evidence-options"
                    value={fineForm.evidenceSource}
                    onChange={(e) => setFineForm({ ...fineForm, evidenceSource: e.target.value })}
                    placeholder="Ej. Libro de Novedades de Conserjería"
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                  <datalist id="fine-evidence-options">
                    <option value="Libro de Novedades de Conserjería" />
                    <option value="Registro fotográfico y cámaras de seguridad" />
                    <option value="Acta del Comité de Administración" />
                    <option value="Reclamo formal en Libro de Copropiedad" />
                    <option value="Inspección presencial de Administración" />
                  </datalist>
                </div>
              </div>

              {/* 5. ESCALA DE MULTA EN UF (SOLO EN MODO MULTA) O AVISO PREVENTIVO ($0) */}
              {fineForm.sanctionMode === 'warning' ? (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 text-[11px] leading-relaxed">
                  🛡️ <strong>Apercibimiento Preventivo sin Cobro ($0):</strong> Esta notificación <strong>no agrega recargos</strong> en la colilla de gastos comunes de la unidad, pero queda guardada en el registro oficial de amonestaciones por si luego debes escalarla a multa por reincidencia.
                </div>
              ) : (
                <div className="p-3 bg-rose-50/40 border border-rose-200/70 rounded-xl">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Seleccionar Escala de Multa Reglamentaria:
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[0.5, 1, 2, 3].map((quantity) => {
                      const amount = indicators.ufCurrent ? Math.round(indicators.data.uf.value * quantity) : null;
                      const label = `${quantity.toFixed(1)} UF`;
                      return (
                        <button
                          key={quantity}
                          type="button"
                          disabled={!indicators.ufCurrent}
                          onClick={() =>
                            setFineForm({
                              ...fineForm,
                              amountClp: amount,
                              ufEquivalent: label,
                              ufDate: indicators.data.uf.date,
                              ufValue: indicators.data.uf.value
                            })
                          }
                          className={`p-2 rounded-xl border text-center font-bold text-xs disabled:opacity-40 cursor-pointer ${
                            fineForm.ufEquivalent === label && fineForm.ufDate === indicators.today
                              ? 'bg-rose-900 text-white border-rose-900'
                              : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {label}
                          {amount !== null ? ` (${formatCLP(amount)})` : ''}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-600 mb-2">
                    {indicators.ufCurrent
                      ? `UF del ${indicators.data.uf.date}: $${indicators.data.uf.value.toLocaleString('es-CL', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}.`
                      : 'UF de hoy no disponible: puedes ingresar el monto manualmente en pesos.'}{' '}
                    Datos:{' '}
                    <a href="https://indicadores.cl/api/" target="_blank" rel="noreferrer" className="underline">
                      indicadores.cl
                    </a>{' '}
                    ·{' '}
                    <a
                      href={`https://www.sii.cl/valores_y_fechas/uf/uf${indicators.today.slice(0, 4)}.htm`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      SII
                    </a>
                    .
                  </p>
                  {fineUfOutdated && (
                    <p className="text-rose-700 font-bold mb-2">
                      La UF seleccionada ya no está vigente o ha cambiado. Vuelve a elegir la escala o ingresa un monto manual.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Monto Final a Imputar:</span>
                    <input
                      type="number"
                      min="1"
                      required={fineForm.sanctionMode === 'fine'}
                      value={fineForm.amountClp}
                      onChange={(e) =>
                        setFineForm({
                          ...fineForm,
                          amountClp: e.target.value,
                          ufEquivalent: 'Monto fijado',
                          ufDate: '',
                          ufValue: null
                        })
                      }
                      placeholder="Ej. 41412"
                      className="p-2 border border-slate-300 bg-white rounded-xl font-black text-rose-700 text-sm w-36"
                    />
                    <span className="text-xs font-bold text-slate-600">CLP ({fineForm.ufEquivalent})</span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                ⚖️ <strong>Formato Legal Doble Copia (Media Carta):</strong> Todos los datos, la argumentación parcial, el medio de respaldo y el plazo de descargos se reflejan directamente en la <strong>Notificación Oficial (2 copias por hoja Carta)</strong>.
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const previewUnit =
                      (currentCommunity?.units || []).find((u) => u.id === fineForm.unitId) ||
                      currentCommunity?.units?.[0];
                    if (!previewUnit) return;
                    if (fineForm.sanctionMode === 'warning') {
                      const unitLabel = previewUnit.tower
                        ? `${previewUnit.tower} - ${previewUnit.number}`
                        : `Casa ${previewUnit.number}`;
                      setNoticePreviewState({
                        isOpen: true,
                        allowStyleSwitch: false,
                        notice: {
                          ...fineForm,
                          variant: 'warning',
                          unitLabel,
                          ownerName: previewUnit.owner || '',
                          ownerRut: previewUnit.rut || '',
                          folio: fineForm.resolutionFolio || 'ADV-2026-01',
                          date: new Date().toISOString().slice(0, 10)
                        }
                      });
                    } else {
                      handlePrintFineProof(previewUnit, {
                        ...fineForm,
                        amountClp: Number(
                          fineForm.amountClp ||
                            (indicators.ufCurrent ? Math.round(indicators.data.uf.value) : 41412)
                        ),
                        ufEquivalent:
                          fineForm.amountClp
                            ? fineForm.ufEquivalent
                            : indicators.ufCurrent
                            ? '1.0 UF'
                            : 'Monto referencial'
                      });
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-rose-700" />
                  <span>Vista Previa (2 copias)</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowFineModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 font-black text-xs rounded-xl shadow-xs cursor-pointer ${
                      fineForm.sanctionMode === 'warning'
                        ? 'bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895]'
                        : 'bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 text-white'
                    }`}
                  >
                    {fineForm.sanctionMode === 'warning'
                      ? 'Registrar y Abrir Advertencia PDF'
                      : 'Cargar Multa en Colilla'}
                  </button>
                </div>
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
      {/* Modal unificado de Vista Previa e Impresión Media Carta (2 Copias por Hoja) */}
      <CommunityNoticePreviewModal
        isOpen={noticePreviewState.isOpen}
        onClose={() => setNoticePreviewState((prev) => ({ ...prev, isOpen: false }))}
        notice={noticePreviewState.notice}
        community={currentCommunity}
        companySettings={companySettings}
        allowStyleSwitch={noticePreviewState.allowStyleSwitch}
      />

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
