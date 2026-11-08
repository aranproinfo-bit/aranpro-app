import React, { useState, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { 
  Users, CheckCircle2, AlertCircle, Scale, Shield, FileCheck, 
  BookOpen, Calendar, Clock, MapPin, Video, Copy, Check, Printer, 
  MessageCircle, Sparkles, TrendingUp, DollarSign, BadgeCheck, 
  ClipboardList, AlertTriangle, ChevronDown, ChevronUp, RotateCcw,
  UserCheck, UserX, Award, HelpCircle, FileText, Share2, CheckSquare,
  Square, Info, ShieldCheck, ArrowRight, Mail, Send, Bell, Plus, Trash2,
  ExternalLink, Smartphone, Globe, Megaphone, Edit3, Eye, Link
} from 'lucide-react';
import { formatCLP, formatDate, formatRut } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { AranproLogo, AranproOfficialSeal } from '../common/MauranLogo';
import { WrittenConsultationsSubTab } from './assembly/WrittenConsultationsSubTab';
import { AssemblyMinutesSubTab } from './assembly/AssemblyMinutesSubTab';
import { RegisteredProxiesSubTab } from './assembly/RegisteredProxiesSubTab';

// Catálogo Oficial de Materias y Quórums según Ley N° 21.442
export const ASSEMBLY_TOPICS = [
  // 1. ASAMBLEAS ORDINARIAS (Art. 15°)
  {
    id: 'presupuesto_cuota_fija',
    name: 'Aprobación de Presupuesto Anual y Cuota Fija 2027',
    category: 'ordinaria',
    assemblyType: 'Asamblea Ordinaria',
    legalArticle: 'Art. 15° y Art. 6° Ley N° 21.442',
    description: 'Aprobación del presupuesto estimativo de gastos ordinarios, fondo de reserva (mínimo 5%) y cuota nivelada mensual para estabilizar el gasto común.',
    constitutionQuorum1st: 50.0001, // Mayoría absoluta de derechos de copropietarios hábiles
    constitutionQuorum2nd: 0, // Los copropietarios hábiles que concurran
    approvalQuorumBasis: 'presentes_habiles', // Mayoría absoluta de derechos presentes o representados
    approvalPct: 50.0001,
    bindingNature: 'Obligatoria y ejecutiva para todas las unidades',
    badgeColor: 'emerald',
    badgeLabel: 'Ordinaria (50%+1 Presentes)'
  },
  {
    id: 'rendicion_cuentas_balance',
    name: 'Rendición de Cuentas y Aprobación del Balance Anual',
    category: 'ordinaria',
    assemblyType: 'Asamblea Ordinaria',
    legalArticle: 'Art. 15° y Art. 20° Ley N° 21.442',
    description: 'Examen, fiscalización y aprobación de la gestión administrativa, estados bancarios y comprobantes de egresos del período anual anterior.',
    constitutionQuorum1st: 50.0001,
    constitutionQuorum2nd: 0,
    approvalQuorumBasis: 'presentes_habiles',
    approvalPct: 50.0001,
    bindingNature: 'Descargo de gestión o requerimiento de auditoría',
    badgeColor: 'emerald',
    badgeLabel: 'Ordinaria (50%+1 Presentes)'
  },
  {
    id: 'eleccion_comite',
    name: 'Elección o Renovación del Comité de Administración',
    category: 'ordinaria',
    assemblyType: 'Asamblea Ordinaria',
    legalArticle: 'Art. 15° y Art. 17° Ley N° 21.442',
    description: 'Designación de los copropietarios que conformarán el Comité de Administración (titulares y suplentes) con mandato de hasta 3 años reelegibles.',
    constitutionQuorum1st: 50.0001,
    constitutionQuorum2nd: 0,
    approvalQuorumBasis: 'presentes_habiles',
    approvalPct: 50.0001,
    bindingNature: 'Representación legal de la asamblea',
    badgeColor: 'emerald',
    badgeLabel: 'Ordinaria (50%+1 Presentes)'
  },
  {
    id: 'designacion_administrador',
    name: 'Designación, Renovación o Remoción del Administrador',
    category: 'ordinaria',
    assemblyType: 'Asamblea Ordinaria',
    legalArticle: 'Art. 15° y Art. 20° Ley N° 21.442',
    description: 'Nombramiento o revocación del mandato del administrador/a, debiendo contar con inscripción vigente en el Registro Nacional del MINVU.',
    constitutionQuorum1st: 50.0001,
    constitutionQuorum2nd: 0,
    approvalQuorumBasis: 'presentes_habiles',
    approvalPct: 50.0001,
    bindingNature: 'Poder de administración y cobranza',
    badgeColor: 'emerald',
    badgeLabel: 'Ordinaria (50%+1 Presentes)'
  },
  {
    id: 'reglamento_interno_convivencia',
    name: 'Reglamento Interno, Normas de Convivencia y Escala de Multas',
    category: 'ordinaria',
    assemblyType: 'Asamblea Ordinaria',
    legalArticle: 'Art. 15° y Art. 21° Ley N° 21.442',
    description: 'Regulación de horarios de descanso, uso de áreas comunes/quinchos, estacionamientos de visitas, tenencia de mascotas y cobro de multas en la colilla.',
    constitutionQuorum1st: 50.0001,
    constitutionQuorum2nd: 0,
    approvalQuorumBasis: 'presentes_habiles',
    approvalPct: 50.0001,
    bindingNature: 'Cobro ejecutivo incorporado en el gasto común',
    badgeColor: 'emerald',
    badgeLabel: 'Ordinaria (50%+1 Presentes)'
  },

  // 2. ASAMBLEAS EXTRAORDINARIAS DE MAYORÍA ABSOLUTA (Art. 15° inc. 2 / Art. 17°)
  {
    id: 'gasto_extraordinario_mayor',
    name: 'Gasto Común Extraordinario (> a 6 cuotas de gastos ordinarios)',
    category: 'extraordinaria_absoluta',
    assemblyType: 'Asamblea Extraordinaria (Mayoría Absoluta)',
    legalArticle: 'Art. 15° inc. 2 Ley N° 21.442',
    description: 'Aprobación de cuotas extraordinarias significativas para obras indispensables de reparación o modernización estructural que excedan el límite anual.',
    constitutionQuorum1st: 50.0001,
    constitutionQuorum2nd: 50.0001,
    approvalQuorumBasis: 'total_condominio',
    approvalPct: 50.0001,
    bindingNature: 'Título ejecutivo judicial y corte de suministro en caso de mora',
    badgeColor: 'amber',
    badgeLabel: 'Extraordinaria (50%+1 del Total)'
  },
  {
    id: 'retribucion_comite',
    name: 'Retribución Económica / Descuento a Miembros del Comité',
    category: 'extraordinaria_absoluta',
    assemblyType: 'Asamblea Extraordinaria (Mayoría Absoluta)',
    legalArticle: 'Art. 17° inc. 3 Ley N° 21.442',
    description: 'Acuerdo para establecer una asignación monetaria o descuento porcentual en los gastos comunes a los integrantes del Comité por su dedicación.',
    constitutionQuorum1st: 50.0001,
    constitutionQuorum2nd: 50.0001,
    approvalQuorumBasis: 'total_condominio',
    approvalPct: 50.0001,
    bindingNature: 'Descuento formal en la liquidación mensual',
    badgeColor: 'amber',
    badgeLabel: 'Extraordinaria (50%+1 del Total)'
  },
  {
    id: 'delegacion_facultades',
    name: 'Delegación de Facultades Extraordinarias al Comité',
    category: 'extraordinaria_absoluta',
    assemblyType: 'Asamblea Extraordinaria (Mayoría Absoluta)',
    legalArticle: 'Art. 15° inc. 2 Ley N° 21.442',
    description: 'Mandato expreso al Comité para suscribir contratos a plazo superior a un año o celebrar transacciones y convenios prejudiciales.',
    constitutionQuorum1st: 50.0001,
    constitutionQuorum2nd: 50.0001,
    approvalQuorumBasis: 'total_condominio',
    approvalPct: 50.0001,
    bindingNature: 'Mandato con facultades legales plenas',
    badgeColor: 'amber',
    badgeLabel: 'Extraordinaria (50%+1 del Total)'
  },
  {
    id: 'seguros_colectivos_adicionales',
    name: 'Contratación de Seguros Colectivos Adicionales (Sismo / Áreas Comunes)',
    category: 'extraordinaria_absoluta',
    assemblyType: 'Asamblea Extraordinaria (Mayoría Absoluta)',
    legalArticle: 'Art. 43° y Art. 15° Ley N° 21.442',
    description: 'Contratación de pólizas complementarias de seguros colectivos contra sismos, responsabilidad civil, desastres naturales o rotura de cañerías.',
    constitutionQuorum1st: 50.0001,
    constitutionQuorum2nd: 50.0001,
    approvalQuorumBasis: 'total_condominio',
    approvalPct: 50.0001,
    bindingNature: 'Póliza colectiva obligatoria con cobro prorrateado',
    badgeColor: 'amber',
    badgeLabel: 'Extraordinaria (50%+1 del Total)'
  },

  // 3. ASAMBLEAS EXTRAORDINARIAS DE MAYORÍA REFORZADA (66% - Art. 15° inc. 3 / Art. 17° inc. 2)
  {
    id: 'reforma_reglamento_copropiedad',
    name: 'Modificación del Reglamento de Copropiedad (Art. 15 inc. 3)',
    category: 'extraordinaria_reforzada',
    assemblyType: 'Asamblea Extraordinaria (Mayoría Reforzada 66%)',
    legalArticle: 'Art. 15° inc. 3 y Art. 17° Ley N° 21.442',
    description: 'Adecuación formal y legal de los estatutos del condominio a la Ley 21.442 para su reducción a escritura pública e inscripción obligatoria en el CBR.',
    constitutionQuorum1st: 66.0,
    constitutionQuorum2nd: 66.0,
    approvalQuorumBasis: 'total_condominio',
    approvalPct: 66.0,
    bindingNature: 'Reducción a escritura pública e inscripción en el CBR',
    badgeColor: 'rose',
    badgeLabel: 'Mayoría Reforzada (66% del Total)'
  },
  {
    id: 'uso_exclusivo_arriendo_comunes',
    name: 'Enajenación, Arrendamiento o Concesión de Bienes de Dominio Común',
    category: 'extraordinaria_reforzada',
    assemblyType: 'Asamblea Extraordinaria (Mayoría Reforzada 66%)',
    legalArticle: 'Art. 15° inc. 3 Ley N° 21.442',
    description: 'Arrendamiento de techumbres para antenas, cesión temporal de espacios o gravamen sobre terrenos y dependencias comunes de la comunidad.',
    constitutionQuorum1st: 66.0,
    constitutionQuorum2nd: 66.0,
    approvalQuorumBasis: 'total_condominio',
    approvalPct: 66.0,
    bindingNature: 'Contrato solemne con impacto en los bienes comunes',
    badgeColor: 'rose',
    badgeLabel: 'Mayoría Reforzada (66% del Total)'
  },
  {
    id: 'obras_ampliacion_nuevas',
    name: 'Obras de Ampliación, Nuevas Edificaciones o Alteraciones Mayores',
    category: 'extraordinaria_reforzada',
    assemblyType: 'Asamblea Extraordinaria (Mayoría Reforzada 66%)',
    legalArticle: 'Art. 15° inc. 3 Ley N° 21.442',
    description: 'Construcción de nueva conserjería, cierre perimetral de hormigón, techado de estacionamientos comunes o nueva sala de eventos.',
    constitutionQuorum1st: 66.0,
    constitutionQuorum2nd: 66.0,
    approvalQuorumBasis: 'total_condominio',
    approvalPct: 66.0,
    bindingNature: 'Permiso DOM Municipal y modificación de planos copropiedad',
    badgeColor: 'rose',
    badgeLabel: 'Mayoría Reforzada (66% del Total)'
  },
  {
    id: 'demolicion_reconstruccion',
    name: 'Reconstrucción, Demolición o División del Condominio',
    category: 'extraordinaria_reforzada',
    assemblyType: 'Asamblea Extraordinaria (Mayoría Reforzada 66%)',
    legalArticle: 'Art. 15° inc. 3 Ley N° 21.442',
    description: 'Demolición o reconstrucción del condominio tras un siniestro grave o decisión unánime/calificada de división patrimonial.',
    constitutionQuorum1st: 66.0,
    constitutionQuorum2nd: 66.0,
    approvalQuorumBasis: 'total_condominio',
    approvalPct: 66.0,
    bindingNature: 'Trámite notarial, judicial y municipal obligatorio',
    badgeColor: 'rose',
    badgeLabel: 'Mayoría Reforzada (66% del Total)'
  }
];

// Presets sugeridos para agregar temas rápidos a la tabla
const SUGGESTED_ADDITIONAL_TOPICS = [
  { title: 'Mantención preventiva y reparación de portón vehicular y bombas de agua', type: 'informativo', description: 'Revisión técnica de presupuestos y plan de mantenimiento preventivo.' },
  { title: 'Plan de Seguridad Comunitaria y Cámaras de Vigilancia', type: 'votacion_ordinaria', description: 'Propuesta de cotizaciones para modernización del circuito cerrado de TV.' },
  { title: 'Informe de Gestión de Morosidad y Convenios Notariales (Art. 27° Ley 21.442)', type: 'informativo', description: 'Estado de cobranza prejudicial y opciones de repactación para vecinos morosos.' },
  { title: 'Normativa de Tenencia Responsable de Mascotas y Aseo de Espacios Comunes', type: 'votacion_ordinaria', description: 'Regulación de uso de correas en patios comunes y multas por desechos.' },
  { title: 'Puntos Varios e Inquietudes de los Vecinos', type: 'varios', description: 'Espacio abierto para consultas generales de convivencia y administración.' }
];

export const AssemblyQuorumModule = ({
  currentCommunity,
  getUnitFinancials,
  getUnitLabel,
  activeSubTab = 'asamblea',
  onSubTabChange
}) => {
  const { addAnnouncement, companySettings } = useCommunity();

  // Control de sub-pestaña de Gobernanza (proviene de la barra lateral izquierda)
  const governanceTab = activeSubTab;

  // Estado de la Asamblea
  const [selectedTopicId, setSelectedTopicId] = useState('presupuesto_cuota_fija');
  const [citationNumber, setCitationNumber] = useState(1);
  const [assemblyFormat, setAssemblyFormat] = useState('mixta');
  const [assemblyDate, setAssemblyDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [assemblyTime1st, setAssemblyTime1st] = useState('19:30');
  const [assemblyTime2nd, setAssemblyTime2nd] = useState('20:00');
  const [assemblyLocation, setAssemblyLocation] = useState('Sala Multiuso / Quinchos');
  const [virtualMeetingUrl, setVirtualMeetingUrl] = useState('https://meet.google.com/cer-asamblea-2027');
  const [virtualMeetingId, setVirtualMeetingId] = useState('ID: 849 2031 9912 • Código: ARANPRO');
  const [paymentDeadlineDate, setPaymentDeadlineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  // Lista dinámica de temas adicionales en la tabla de la asamblea
  const [additionalTopics, setAdditionalTopics] = useState([
    {
      id: 'top-1',
      title: 'Mantención preventiva y revisión técnica de bombas de agua y portón',
      type: 'informativo',
      description: 'Informe técnico de la administración sobre cotizaciones recibidas para mantención anual.'
    },
    {
      id: 'top-2',
      title: 'Informe de Gestión de Morosidad y Convenios de Pago (Art. 27° Ley 21.442)',
      type: 'informativo',
      description: 'Estado de cobranza prejudicial y regularizaciones de vecinos morosos.'
    },
    {
      id: 'top-3',
      title: 'Puntos Varios e Inquietudes de la Comunidad',
      type: 'varios',
      description: 'Ronda abierta de preguntas y sugerencias de convivencia vecinal.'
    }
  ]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicType, setNewTopicType] = useState('votacion_ordinaria');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [showAddTopicRow, setShowAddTopicRow] = useState(false);

  // Modales y Canales de Notificación
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchChannelTab, setDispatchChannelTab] = useState('app'); // 'app' | 'whatsapp' | 'email' | 'pdf'
  const [appNotificationPublished, setAppNotificationPublished] = useState(false);
  const [emailDispatchCopied, setEmailDispatchCopied] = useState(false);
  const [selectedIndividualWhatsAppUnitId, setSelectedIndividualWhatsAppUnitId] = useState(null);

  // Filtro de búsqueda y pestañas pedagógicas
  const [unitFilterTab, setUnitFilterTab] = useState('ALL');
  const [searchUnitQuery, setSearchUnitQuery] = useState('');
  const [showMinutesModal, setShowMinutesModal] = useState(false);
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);
  const [minutesCopied, setMinutesCopied] = useState(false);

  // Unidades y Alícuotas reales de la comunidad
  const units = useMemo(() => currentCommunity?.units || [], [currentCommunity]);

  // Diagnóstico legal de unidades hábiles según Art. 5° de la Ley N° 21.442
  const unitsLegalStatus = useMemo(() => {
    return units.map(u => {
      const fin = getUnitFinancials ? getUnitFinancials(u) : { pendingDebt: 0, repactacionActive: false };
      const isUpToDate = (fin.pendingDebt || 0) <= 0;
      const hasRepactacion = Boolean(fin.repactacionActive);
      const isHabil = isUpToDate || hasRepactacion;

      const rawShare = parseFloat(u.share) || (units.length > 0 ? 100 / units.length : 0);
      const share = parseFloat(rawShare.toFixed(3));

      // Teléfono y Correo para despacho multicanal
      const phone = u.ownerPhone || u.residentPhone || u.phone || u.additionalUsers?.[0]?.phone || '+56984512250';
      const email = (!u.payerSameAsOwner && u.additionalUsers?.[0]?.email) || u.ownerEmail || u.email || `${u.ownerName?.toLowerCase().replace(/\s+/g, '') || 'vecino'}@gmail.com`;

      return {
        unit: u,
        fin,
        isUpToDate,
        hasRepactacion,
        isHabil,
        share,
        debtAmount: fin.pendingDebt || 0,
        phone,
        email
      };
    });
  }, [units, getUnitFinancials]);

  // Estado interactivo de Asistencia y Votación por Unidad
  const [simulatedParticipation, setSimulatedParticipation] = useState(() => {
    const initial = {};
    units.forEach(u => {
      initial[u.id] = {
        present: true,
        representationType: 'titular',
        representativeName: '',
        vote: 'a_favor'
      };
    });
    return initial;
  });

  // Materia principal seleccionada
  const selectedTopic = useMemo(() => {
    return ASSEMBLY_TOPICS.find(t => t.id === selectedTopicId) || ASSEMBLY_TOPICS[0];
  }, [selectedTopicId]);

  // Manejador de agregar temas adicionales
  const handleAddTopic = () => {
    if (!newTopicTitle.trim()) return;
    const newEntry = {
      id: `top-${Date.now()}`,
      title: newTopicTitle.trim(),
      type: newTopicType,
      description: newTopicDesc.trim() || 'Punto complementario incorporado en la orden del día.'
    };
    setAdditionalTopics(prev => [...prev, newEntry]);
    setNewTopicTitle('');
    setNewTopicDesc('');
    setShowAddTopicRow(false);
  };

  const handleRemoveTopic = (id) => {
    setAdditionalTopics(prev => prev.filter(t => t.id !== id));
  };

  const handleAddPresetTopic = (preset) => {
    const exists = additionalTopics.some(t => t.title.toLowerCase() === preset.title.toLowerCase());
    if (exists) return;
    setAdditionalTopics(prev => [...prev, {
      id: `top-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...preset
    }]);
  };

  // Actualizador de participación por unidad
  const handleTogglePresent = (unitId) => {
    setSimulatedParticipation(prev => ({
      ...prev,
      [unitId]: {
        ...prev[unitId],
        present: !prev[unitId]?.present
      }
    }));
  };

  const handleSetVote = (unitId, vote) => {
    setSimulatedParticipation(prev => ({
      ...prev,
      [unitId]: {
        ...prev[unitId],
        vote
      }
    }));
  };

  const handleSetRepresentation = (unitId, representationType, representativeName = '') => {
    setSimulatedParticipation(prev => ({
      ...prev,
      [unitId]: {
        ...prev[unitId],
        representationType,
        representativeName: representativeName || prev[unitId]?.representativeName || ''
      }
    }));
  };

  const applyQuickScenario = (scenario) => {
    const next = {};
    unitsLegalStatus.forEach(item => {
      const uId = item.unit.id;
      if (scenario === 'all_present') {
        next[uId] = {
          present: true,
          representationType: 'titular',
          representativeName: '',
          vote: 'a_favor'
        };
      } else if (scenario === 'only_habiles_present') {
        next[uId] = {
          present: item.isHabil,
          representationType: 'titular',
          representativeName: '',
          vote: item.isHabil ? 'a_favor' : 'abstencion'
        };
      } else if (scenario === 'conservative') {
        const shouldAttend = item.isHabil && (parseInt(item.unit.number, 10) % 2 === 0 || parseInt(item.unit.number, 10) === 1);
        next[uId] = {
          present: shouldAttend,
          representationType: 'titular',
          representativeName: '',
          vote: shouldAttend ? 'a_favor' : 'abstencion'
        };
      } else if (scenario === 'reset') {
        next[uId] = {
          present: false,
          representationType: 'titular',
          representativeName: '',
          vote: 'abstencion'
        };
      }
    });
    setSimulatedParticipation(next);
  };

  // CÁLCULOS MATEMÁTICOS Y JURÍDICOS DE QUÓRUM
  const quorumStats = useMemo(() => {
    const totalUnitsCount = unitsLegalStatus.length;
    const totalCommunityShare = unitsLegalStatus.reduce((acc, u) => acc + u.share, 0) || 100;

    const habilesList = unitsLegalStatus.filter(u => u.isHabil);
    const inhabilesList = unitsLegalStatus.filter(u => !u.isHabil);

    const habilesCount = habilesList.length;
    const habilesShare = habilesList.reduce((acc, u) => acc + u.share, 0);

    const inhabilesCount = inhabilesList.length;
    const inhabilesShare = inhabilesList.reduce((acc, u) => acc + u.share, 0);

    const presentUnits = unitsLegalStatus.filter(u => simulatedParticipation[u.unit.id]?.present);
    const presentCount = presentUnits.length;
    const presentTotalShare = presentUnits.reduce((acc, u) => acc + u.share, 0);

    const presentHabilesUnits = presentUnits.filter(u => u.isHabil);
    const presentHabilesCount = presentHabilesUnits.length;
    const presentHabilesShare = presentHabilesUnits.reduce((acc, u) => acc + u.share, 0);

    const presentInhabilesUnits = presentUnits.filter(u => !u.isHabil);
    const presentInhabilesCount = presentInhabilesUnits.length;
    const presentInhabilesShare = presentInhabilesUnits.reduce((acc, u) => acc + u.share, 0);

    let votesFavorShare = 0;
    let votesFavorCount = 0;
    let votesAgainstShare = 0;
    let votesAgainstCount = 0;
    let votesAbstainShare = 0;
    let votesAbstainCount = 0;

    presentHabilesUnits.forEach(item => {
      const v = simulatedParticipation[item.unit.id]?.vote || 'abstencion';
      if (v === 'a_favor') {
        votesFavorShare += item.share;
        votesFavorCount++;
      } else if (v === 'en_contra') {
        votesAgainstShare += item.share;
        votesAgainstCount++;
      } else {
        votesAbstainShare += item.share;
        votesAbstainCount++;
      }
    });

    let isConstituted = false;
    let requiredConstitutionShare = 0;
    let constitutionExplanation = '';
    let constitutionMissingShare = 0;

    if (selectedTopic.category === 'ordinaria') {
      if (citationNumber === 1) {
        requiredConstitutionShare = 50.0001;
        isConstituted = presentHabilesShare >= requiredConstitutionShare;
        constitutionMissingShare = Math.max(0, requiredConstitutionShare - presentHabilesShare);
        constitutionExplanation = isConstituted
          ? `Cumple el quórum de 1ª Citación con ${presentHabilesShare.toFixed(2)}% de derechos hábiles (mínimo 50%+1).`
          : `Faltan ${constitutionMissingShare.toFixed(2)}% de derechos para constituir la asamblea en 1ª Citación.`;
      } else {
        requiredConstitutionShare = 0;
        isConstituted = presentHabilesCount >= 1;
        constitutionExplanation = isConstituted
          ? `Constituida válidamente en 2ª Citación conforme al Art. 15° inc. 1 con los ${presentHabilesCount} copropietarios hábiles asistentes.`
          : 'Se requiere al menos 1 copropietario hábil presente en 2ª Citación.';
      }
    } else if (selectedTopic.category === 'extraordinaria_absoluta') {
      requiredConstitutionShare = 50.0001;
      isConstituted = presentHabilesShare >= requiredConstitutionShare;
      constitutionMissingShare = Math.max(0, requiredConstitutionShare - presentHabilesShare);
      constitutionExplanation = isConstituted
        ? `Constituida válidamente con ${presentHabilesShare.toFixed(2)}% de derechos (Art. 15° inc. 2).`
        : `Quórum insuficiente: Exige a lo menos el 50%+1 de los derechos totales del condominio (${requiredConstitutionShare}%). Faltan ${constitutionMissingShare.toFixed(2)}%.`;
    } else {
      requiredConstitutionShare = 66.0;
      isConstituted = presentHabilesShare >= requiredConstitutionShare;
      constitutionMissingShare = Math.max(0, requiredConstitutionShare - presentHabilesShare);
      constitutionExplanation = isConstituted
        ? `Constituida válidamente con ${presentHabilesShare.toFixed(2)}% de derechos (Art. 15° inc. 3).`
        : `Quórum insuficiente: Exige a lo menos el 66.0% de los derechos totales del condominio. Faltan ${constitutionMissingShare.toFixed(2)}%.`;
    }

    let isApproved = false;
    let requiredApprovalShare = 0;
    let approvalBaseLabel = '';
    let approvalExplanation = '';
    let approvalMissingShare = 0;

    if (selectedTopic.approvalQuorumBasis === 'presentes_habiles') {
      approvalBaseLabel = `Presentes Hábiles (${presentHabilesShare.toFixed(2)}%)`;
      requiredApprovalShare = presentHabilesShare > 0 ? (presentHabilesShare / 2) + 0.0001 : 50.0001;
      isApproved = isConstituted && votesFavorShare >= requiredApprovalShare;
      approvalMissingShare = Math.max(0, requiredApprovalShare - votesFavorShare);
      approvalExplanation = isApproved
        ? `Moción APROBADA con ${votesFavorShare.toFixed(2)}% de derechos a favor (supera el ${requiredApprovalShare.toFixed(2)}% requerido de los presentes hábiles).`
        : `Moción RECHAZADA o no aprobada: Requiere ${requiredApprovalShare.toFixed(2)}% de los presentes hábiles. Faltan ${approvalMissingShare.toFixed(2)}% de votos a favor.`;
    } else {
      const targetPct = selectedTopic.approvalPct;
      requiredApprovalShare = targetPct;
      approvalBaseLabel = `Total del Condominio (${totalCommunityShare.toFixed(2)}%)`;
      isApproved = isConstituted && votesFavorShare >= requiredApprovalShare;
      approvalMissingShare = Math.max(0, requiredApprovalShare - votesFavorShare);
      approvalExplanation = isApproved
        ? `Moción APROBADA con ${votesFavorShare.toFixed(2)}% de derechos del total del condominio (mínimo legal exigido: ${targetPct}%).`
        : `Moción RECHAZADA: La ley exige que al menos el ${targetPct}% de todos los derechos de la comunidad voten a favor. Faltan ${approvalMissingShare.toFixed(2)}% de votos favorables.`;
    }

    return {
      totalUnitsCount,
      totalCommunityShare,
      habilesCount,
      habilesShare,
      inhabilesCount,
      inhabilesShare,
      presentCount,
      presentTotalShare,
      presentHabilesCount,
      presentHabilesShare,
      presentInhabilesCount,
      presentInhabilesShare,
      votesFavorShare,
      votesFavorCount,
      votesAgainstShare,
      votesAgainstCount,
      votesAbstainShare,
      votesAbstainCount,
      isConstituted,
      requiredConstitutionShare,
      constitutionExplanation,
      constitutionMissingShare,
      isApproved,
      requiredApprovalShare,
      approvalBaseLabel,
      approvalExplanation,
      approvalMissingShare
    };
  }, [unitsLegalStatus, simulatedParticipation, selectedTopic, citationNumber]);

  const displayedUnits = useMemo(() => {
    return unitsLegalStatus.filter(item => {
      if (unitFilterTab === 'HABILES' && !item.isHabil) return false;
      if (unitFilterTab === 'IN_HABILES' && item.isHabil) return false;
      if (unitFilterTab === 'PRESENTES' && !simulatedParticipation[item.unit.id]?.present) return false;

      if (searchUnitQuery.trim()) {
        const q = searchUnitQuery.toLowerCase().trim();
        const matchNum = String(item.unit.number).includes(q);
        const matchOwner = (item.unit.ownerName || '').toLowerCase().includes(q);
        const matchRut = (item.unit.ownerRut || '').toLowerCase().includes(q);
        if (!matchNum && !matchOwner && !matchRut) return false;
      }
      return true;
    });
  }, [unitsLegalStatus, unitFilterTab, searchUnitQuery, simulatedParticipation]);

  // Redacción oficial para WhatsApp Grupal (Comunidad y Comité)
  const generateWhatsAppMessage = () => {
    const commName = currentCommunity?.name || 'Condominio';
    const dateFormatted = formatDate(assemblyDate);
    const topic = selectedTopic;
    const isOrdinaria = topic.category === 'ordinaria';

    const additionalTopicsText = additionalTopics.length > 0
      ? additionalTopics.map((t, idx) => `• *Punto ${idx + 2}:* ${t.title}\n  _${t.description}_`).join('\n')
      : '';

    return `🏛️ *CITACIÓN OFICIAL A ${topic.assemblyType.toUpperCase()}*
*${commName.toUpperCase()} • CONFORME A LA LEY N° 21.442*

Estimadas vecinas y copropietarios:
La Administración ARANPRO y el Comité de Administración convocan formalmente a la *${topic.assemblyType}* con el siguiente orden del día:

📅 *Fecha:* ${dateFormatted}
⏰ *1ª Citación:* ${assemblyTime1st} hrs
⏰ *2ª Citación:* ${assemblyTime2nd} hrs
📍 *Modalidad:* ${assemblyFormat === 'mixta' ? 'Mixta (Presencial y Zoom)' : assemblyFormat === 'telematica' ? '100% Telemática (Virtual)' : 'Presencial'}
📌 *Lugar:* ${assemblyLocation}
${assemblyFormat !== 'presencial' ? `🔗 *Enlace Virtual:* ${virtualMeetingUrl}\n🔑 *Acceso:* ${virtualMeetingId}\n` : ''}
📋 *TABLA / ORDEN DEL DÍA DE LA ASAMBLEA:*
• *Punto 1 (Principal):* ${topic.name}
  _${topic.description}_ [Quórum: ${topic.badgeLabel}]
${additionalTopicsText}

⚖️ *QUÓRUM LEGAL Y REGLAS DE VOTACIÓN (Arts. 15°, 16° y 17°):*
• *Base legal:* ${topic.legalArticle}
• *Constitución:* 1ª Citación requiere 50%+1 de los derechos. ${isOrdinaria ? 'En 2ª Citación se sesiona con los copropietarios que asistan.' : 'En 2ª Citación se exige el mismo quórum calificado.'}
• *Aprobación:* ${topic.approvalQuorumBasis === 'presentes_habiles' ? 'Mayoría absoluta de los presentes hábiles.' : `A lo menos el ${topic.approvalPct}% de todo el condominio.`}

🚨 *IMPORTANTE - COPROPIETARIOS HÁBILES (Art. 5° Ley 21.442):*
Solo tienen derecho a voto los copropietarios al día en gastos comunes o con convenio formal suscrito.
👉 *Plazo para regularizar su cuenta:* hasta el ${formatDate(paymentDeadlineDate)} para ejercer su derecho a voto en la asamblea.

📄 *PODER SIMPLE DE REPRESENTACIÓN:* Si no puede acudir, puede autorizar a un vecino o a su arrendatario mediante carta poder simple.

Atentamente,
*Administración ARANPRO & Comité de Administración*
_${companySettings?.brandName || 'ARANPRO Gestión Integral'} • www.aranpro.cl_`;
  };

  // Mensaje personalizado individual para WhatsApp de cada vecino
  const generateIndividualWhatsAppMessage = (item) => {
    const commName = currentCommunity?.name || 'Condominio';
    const dateFormatted = formatDate(assemblyDate);
    const u = item.unit;
    const owner = u.ownerName || `Copropietario(a) Casa ${u.number}`;
    const isHabil = item.isHabil;
    const share = item.share.toFixed(2);

    let statusText = '';
    if (isHabil) {
      statusText = `✅ *Su Estado Legal (Art. 5°):* Su Casa ${u.number} se encuentra *AL DÍA* (Alícuota: ${share}%). Su voto es clave para la aprobación de la tabla de la asamblea.`;
    } else {
      statusText = `⚠️ *Su Estado Legal (Art. 5°):* Su Casa ${u.number} registra una deuda pendiente de *${formatCLP(item.debtAmount)}*. Le informamos que conforme a la Ley 21.442, para ejercer su derecho a voto debe encontrarse al día o haber firmado un convenio de pago antes del ${formatDate(paymentDeadlineDate)}. ¡Le invitamos a regularizarlo para que su voz y voto cuenten!`;
    }

    return `Estimado(a) *${owner}*,

Le hacemos llegar la citación oficial a la *${selectedTopic.assemblyType}* de *${commName}*:

📅 *Fecha:* ${dateFormatted} • *1ª Citación:* ${assemblyTime1st} hrs • *2ª Citación:* ${assemblyTime2nd} hrs
📍 *Lugar / Modalidad:* ${assemblyLocation} ${assemblyFormat !== 'presencial' ? `(Enlace: ${virtualMeetingUrl})` : ''}

${statusText}

📋 *Materia a tratar:*
• *${selectedTopic.name}*
${additionalTopics.length > 0 ? additionalTopics.map((t, idx) => `• ${t.title}`).join('\n') : ''}

Si no puede asistir personalmente, recuerde que puede otorgar un *poder simple* a un vecino o a su arrendatario para representarlo.

Atentamente,
*Administración ARANPRO*`;
  };

  // Publicar la Citación en el Mural / Portal de la Aplicación para los residentes
  const handlePublishAppNotification = () => {
    if (!currentCommunity?.id) return;
    const announcementTitle = `🏛️ Convocatoria Oficial: ${selectedTopic.assemblyType} - ${formatDate(assemblyDate)}`;
    const announcementContent = `Se cita a todos los copropietarios a la ${selectedTopic.assemblyType} el día ${formatDate(assemblyDate)} (1ª Citación: ${assemblyTime1st} hrs / 2ª Citación: ${assemblyTime2nd} hrs) en ${assemblyLocation}.\n\nTabla de temas:\n1. ${selectedTopic.name}\n${additionalTopics.map((t, i) => `${i + 2}. ${t.title}`).join('\n')}\n\nConforme al Art. 5° de la Ley 21.442, solo los copropietarios hábiles (al día o con convenio) tendrán derecho a voto. Regularice su cuenta antes del ${formatDate(paymentDeadlineDate)}. Si no asiste, puede delegar poder simple.`;

    addAnnouncement(currentCommunity.id, {
      title: announcementTitle,
      content: announcementContent,
      priority: 'Urgente',
      date: new Date().toISOString().split('T')[0],
      author: 'Comité & Administración ARANPRO'
    });

    setAppNotificationPublished(true);
    setTimeout(() => setAppNotificationPublished(false), 4000);
  };

  // Preparar lista de correos para despacho masivo en CCO (BCC)
  const allCommunityEmails = useMemo(() => {
    const list = unitsLegalStatus
      .map(item => item.email)
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [unitsLegalStatus]);

  const emailSubject = `[CITACIÓN ASAMBLEA LEY 21.442] Convocatoria Oficial - ${currentCommunity?.name || 'Condominio'}`;

  const emailBodyText = `CONVOCATORIA OFICIAL A ${selectedTopic.assemblyType.toUpperCase()}
COMUNIDAD: ${currentCommunity?.name || 'Condominio'}
FECHA: ${formatDate(assemblyDate)}
1ª CITACIÓN: ${assemblyTime1st} HRS • 2ª CITACIÓN: ${assemblyTime2nd} HRS
MODALIDAD: ${assemblyFormat.toUpperCase()} - ${assemblyLocation}
${assemblyFormat !== 'presencial' ? `ENLACE VIRTUAL: ${virtualMeetingUrl} (${virtualMeetingId})` : ''}

Estimadas vecinas y copropietarios:
Por medio del presente correo, la Administración ARANPRO y el Comité de Administración citan a sesión formal de asamblea conforme a las normas de los Artículos 15°, 16° y 17° de la Ley N° 21.442 de Copropiedad Inmobiliaria.

ORDEN DEL DÍA / TABLA:
1. ${selectedTopic.name} (${selectedTopic.legalArticle})
${additionalTopics.map((t, i) => `${i + 2}. ${t.title} (${t.description})`).join('\n')}

QUÓRUMS LEGALES:
• Constitución: Requiere mayoría de derechos en 1ª citación.
• Aprobación: ${selectedTopic.approvalQuorumBasis === 'presentes_habiles' ? 'Mayoría absoluta de presentes hábiles' : `A lo menos el ${selectedTopic.approvalPct}% de todo el condominio`}.

ESTADO HÁBIL Y DERECHO A VOTO (ART. 5°):
Le recordamos que solo pueden votar los copropietarios al día en gastos comunes o con convenio formal suscrito. Plazo de regularización: hasta el ${formatDate(paymentDeadlineDate)}.

REPRESENTACIÓN:
Si no puede asistir, puede conferir mandato o poder simple firmado a un vecino o arrendatario.

Atentamente,
Administración ARANPRO & Comité de Administración
${companySettings?.email || 'contacto@aranpro.cl'}`;

  const mailtoBccLink = `mailto:${companySettings?.email || 'administracion@aranpro.cl'}?bcc=${encodeURIComponent(allCommunityEmails.join(','))}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;

  const copyWhatsAppCitacion = () => {
    navigator.clipboard.writeText(generateWhatsAppMessage());
    setWhatsappCopied(true);
    setTimeout(() => setWhatsappCopied(false), 2500);
  };

  const copyMinutesDraft = () => {
    const commName = currentCommunity?.name || 'Condominio';
    const text = `ACTA DE ${selectedTopic.assemblyType.toUpperCase()}
COMUNIDAD: ${commName}
FECHA: ${formatDate(assemblyDate)} - HORA: ${citationNumber === 1 ? assemblyTime1st : assemblyTime2nd} HRS (${citationNumber}ª CITACIÓN)
MATERIA PRINCIPAL: ${selectedTopic.name} (${selectedTopic.legalArticle})
TEMAS COMPLEMENTARIOS:
${additionalTopics.map((t, i) => `${i + 2}. ${t.title}`).join('\n')}

1. ASISTENCIA Y QUÓRUM DE CONSTITUCIÓN:
Total de Unidades: ${quorumStats.totalUnitsCount} (100% alícuota)
Unidades Presentes: ${quorumStats.presentCount} (${quorumStats.presentTotalShare.toFixed(2)}% alícuota)
Copropietarios Hábiles Presentes (Art. 5°): ${quorumStats.presentHabilesCount} (${quorumStats.presentHabilesShare.toFixed(2)}% de derechos con derecho a voto)
Copropietarios Inhábiles Presentes: ${quorumStats.presentInhabilesCount} (${quorumStats.presentInhabilesShare.toFixed(2)}% con derecho a voz)
Resultado de Constitución: ${quorumStats.isConstituted ? 'ASAMBLEA VÁLIDAMENTE CONSTITUIDA' : 'ASAMBLEA SIN QUÓRUM'}

2. RESULTADOS DE LA VOTACIÓN:
Votos a Favor: ${quorumStats.votesFavorCount} unidades (${quorumStats.votesFavorShare.toFixed(2)}% de derechos)
Votos en Contra: ${quorumStats.votesAgainstCount} unidades (${quorumStats.votesAgainstShare.toFixed(2)}% de derechos)
Abstenciones: ${quorumStats.votesAbstainCount} unidades (${quorumStats.votesAbstainShare.toFixed(2)}% de derechos)

3. RESOLUCIÓN DE LA ASAMBLEA:
${quorumStats.isApproved ? 'LA MOCIÓN RESULTA APROBADA' : 'LA MOCIÓN RESULTA RECHAZADA'} conforme a las exigencias legales del ${selectedTopic.legalArticle}.
Efecto vinculante: ${selectedTopic.bindingNature}.

Firman en señal de conformidad:
___________________________                 ___________________________
Presidente Comité Administración              Administrador del Condominio
RUT: ______________________                 RUT: ______________________`;

    navigator.clipboard.writeText(text);
    setMinutesCopied(true);
    setTimeout(() => setMinutesCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* VISTA 1: ASAMBLEA & CONVOCATORIA (SIMULADOR DE QUÓRUM) */}
      {governanceTab === 'asamblea' && (
        <>
          {/* 1. BARRA SUPERIOR DE ASAMBLEAS & QUÓRUMS (CONVOCATORIA) */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="p-2.5 bg-gradient-to-br from-[#0F3D2E] to-[#14533d] text-white rounded-2xl shadow-xs shrink-0">
                <Users className="w-5 h-5 text-[#D4B895]" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                    Calculadora & Gestión de Asambleas
                  </h3>
                  <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full border border-[#0F3D2E]/20 uppercase">
                    Ley N° 21.442 • Arts. 5°, 15°, 16° y 17°
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                    {units.length} {getUnitLabel ? getUnitLabel(currentCommunity?.type, true) : 'Casas'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generador de citaciones oficiales multi-tema, simulador de quórums legales y despacho multicanal a la app, WhatsApp y correo
                </p>
              </div>
            </div>

            {/* Acciones principales a la derecha */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* BOTÓN ESTRELLA: DESPACHO MULTICANAL */}
              <button
                type="button"
                onClick={() => setShowDispatchModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] hover:from-[#0A291F] hover:to-[#0F3D2E] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer animate-pulse"
                title="Abrir Centro de Notificación y Despacho Multicanal: App, WhatsApp, Correo y PDF"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                📢 Enviar Citación Multicanal
              </button>

              <button
                type="button"
                onClick={() => setShowBrochureModal(true)}
                className="px-3 py-2 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer"
                title="Guía didáctica en 1 página para vecinos: explica los quórums y la importancia de estar al día"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
                Folleto Vecinos
              </button>

              <button
                type="button"
                onClick={copyWhatsAppCitacion}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                title="Copiar texto formal de citación a asamblea con quórum y orden del día listo para WhatsApp"
              >
                {whatsappCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowMinutesModal(true)}
                className="px-3.5 py-2 bg-[#F5F4EF] hover:bg-[#eae7dd] text-[#0F3D2E] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer"
                title="Generar borrador oficial de Acta de Asamblea con certificación de quórum legal"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
                Acta Oficial
              </button>
            </div>
          </div>

          {/* 2. PANEL DIDÁCTICO DE MATERIA LEGAL & CONFIGURADOR DE ASAMBLEA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selector de Materia, Orden del Día y Temas Adicionales */}
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-[#0F3D2E]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Paso 1: Materia Principal a Votar (Ley N° 21.442)
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
              selectedTopic.category === 'ordinaria'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : selectedTopic.category === 'extraordinaria_absoluta'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {selectedTopic.badgeLabel}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">
              Materia jurídica principal que define el quórum de la convocatoria:
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-[#D4B895]/60 bg-[#F5F4EF]/40 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0F3D2E] transition-all cursor-pointer shadow-2xs"
            >
              <optgroup label="1. ASAMBLEAS ORDINARIAS (Mínimo anual - Art. 15°)">
                {ASSEMBLY_TOPICS.filter(t => t.category === 'ordinaria').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
              <optgroup label="2. ASAMBLEAS EXTRAORDINARIAS: MAYORÍA ABSOLUTA (Art. 15° inc. 2 / Art. 17°)">
                {ASSEMBLY_TOPICS.filter(t => t.category === 'extraordinaria_absoluta').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
              <optgroup label="3. ASAMBLEAS EXTRAORDINARIAS: MAYORÍA REFORZADA 66% (Art. 15° inc. 3 / Art. 17°)">
                {ASSEMBLY_TOPICS.filter(t => t.category === 'extraordinaria_reforzada').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Tarjeta Explicativa de la Materia Principal */}
          <div className="p-3 bg-[#F5F4EF] rounded-xl border border-[#D4B895]/40 space-y-2">
            <div>
              <span className="text-[10px] font-black uppercase text-[#0F3D2E] tracking-wider block">
                Fundamento Jurídico: {selectedTopic.legalArticle}
              </span>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                {selectedTopic.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[11px]">
              <div className="flex items-center space-x-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Quórum Aprobación:</strong> {selectedTopic.approvalQuorumBasis === 'presentes_habiles' ? '50% + 1 de presentes hábiles' : `${selectedTopic.approvalPct}% de todo el condominio`}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0" />
                <span>
                  <strong>Efecto Legal:</strong> {selectedTopic.bindingNature}
                </span>
              </div>
            </div>
          </div>

          {/* GESTOR DE LA TABLA COMPLETA / TEMAS ADICIONALES (MULTI-TEMA) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <ClipboardList className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  Orden del Día Completo (Tabla de la Asamblea)
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTopicRow(!showAddTopicRow)}
                className="px-2.5 py-1 bg-[#F5F4EF] hover:bg-[#eae7dd] text-[#0F3D2E] border border-[#D4B895] font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />
                <span>+ Agregar Tema a la Tabla</span>
              </button>
            </div>

            {/* Presets Rápidos para Agregar Temas Comunes */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
              <span className="text-slate-400 font-bold shrink-0">Temas sugeridos:</span>
              {SUGGESTED_ADDITIONAL_TOPICS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPresetTopic(preset)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition-colors cursor-pointer"
                  title={preset.description}
                >
                  + {preset.title.slice(0, 32)}...
                </button>
              ))}
            </div>

            {/* Fila para Añadir Nuevo Tema Manualmente */}
            {showAddTopicRow && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-300 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Título del tema:</label>
                    <input
                      type="text"
                      placeholder="Ej: Estado de portón vehicular y bombas"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Naturaleza:</label>
                    <select
                      value={newTopicType}
                      onChange={(e) => setNewTopicType(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    >
                      <option value="votacion_ordinaria">Votación Ordinaria</option>
                      <option value="informativo">Solo Informativo</option>
                      <option value="varios">Puntos Varios</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Breve descripción / objetivo:</label>
                  <input
                    type="text"
                    placeholder="Ej: Presentación de cotizaciones para mantención de rodamientos..."
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddTopicRow(false)}
                    className="px-2.5 py-1 bg-white border border-slate-300 text-slate-600 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="px-3 py-1 bg-[#0F3D2E] text-white rounded-lg font-bold shadow-xs"
                  >
                    Guardar Punto
                  </button>
                </div>
              </div>
            )}

            {/* Lista Numerada de Temas de la Asamblea */}
            <div className="space-y-1.5 divide-y divide-slate-100">
              {/* Punto 1: Materia Principal */}
              <div className="flex items-start justify-between gap-2 pt-1.5">
                <div className="flex items-start space-x-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-[#0F3D2E] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">{selectedTopic.name}</span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md uppercase">
                        Votación Principal ({selectedTopic.badgeLabel})
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 line-clamp-1">{selectedTopic.description}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 shrink-0">Principal</span>
              </div>

              {/* Puntos Adicionales */}
              {additionalTopics.map((top, idx) => (
                <div key={top.id} className="flex items-start justify-between gap-2 pt-1.5">
                  <div className="flex items-start space-x-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 2}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-xs">{top.title}</span>
                        <span className={`px-1.5 py-0.2 text-[9px] font-black rounded-md uppercase ${
                          top.type === 'votacion_ordinaria'
                            ? 'bg-emerald-50 text-emerald-800'
                            : top.type === 'informativo'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {top.type === 'votacion_ordinaria' ? 'Votación' : top.type === 'informativo' ? 'Informativo' : 'Varios'}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 line-clamp-1">{top.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(top.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Eliminar punto de la tabla"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Parámetros de la Convocatoria: Citación, Fechas, Modalidad y Enlaces */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Número de Citación:
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setCitationNumber(1)}
                  className={`py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                    citationNumber === 1
                      ? 'bg-[#0F3D2E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1ª Citación
                </button>
                <button
                  type="button"
                  onClick={() => setCitationNumber(2)}
                  className={`py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                    citationNumber === 2
                      ? 'bg-[#0F3D2E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2ª Citación
                </button>
              </div>
              <span className="text-[9.5px] text-slate-500 block mt-1">
                {selectedTopic.category === 'ordinaria' && citationNumber === 2
                  ? '⚡ En 2ª citación ordinaria se sesiona con los que asistan.'
                  : 'Requiere quórum de constitución.'}
              </span>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Modalidad & Enlace:
              </label>
              <select
                value={assemblyFormat}
                onChange={(e) => setAssemblyFormat(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="mixta">Mixta (Presencial + Virtual)</option>
                <option value="presencial">Solo Presencial</option>
                <option value="telematica">100% Telemática (Virtual)</option>
              </select>
              <input
                type="text"
                placeholder="https://meet.google.com/..."
                value={virtualMeetingUrl}
                onChange={(e) => setVirtualMeetingUrl(e.target.value)}
                className="w-full px-2 py-1 mt-1 rounded-lg border border-slate-200 text-[10px] text-slate-600"
                title="Enlace de la videollamada para los vecinos que asistan online"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                Fecha & Horarios:
              </label>
              <input
                type="date"
                value={assemblyDate}
                onChange={(e) => setAssemblyDate(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold"
              />
              <div className="flex items-center space-x-1 mt-1 text-[10px] text-slate-600">
                <span>1ª: {assemblyTime1st}</span>
                <span>•</span>
                <span>2ª: {assemblyTime2nd} hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnóstico en Vivo de la Comunidad (Copropietarios Hábiles vs Inhábiles - Art. 5°) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-[#0F3D2E]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Censo Hábiles Art. 5°
                </h4>
              </div>
              <span className="text-[10px] font-black text-slate-500">
                {currentCommunity?.name}
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {/* Tarjeta Hábiles */}
              <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-emerald-950 block">
                      Copropietarios Hábiles
                    </span>
                    <span className="text-[9.5px] text-emerald-700 font-semibold">
                      Al día o con convenio (Voz + Voto)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-900 block">
                    {quorumStats.habilesCount} / {quorumStats.totalUnitsCount}
                  </span>
                  <span className="text-[10px] font-black text-emerald-700">
                    {quorumStats.habilesShare.toFixed(1)}% derechos
                  </span>
                </div>
              </div>

              {/* Tarjeta Inhábiles */}
              <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-rose-950 block">
                      Copropietarios Inhábiles
                    </span>
                    <span className="text-[9.5px] text-rose-700 font-semibold">
                      Con deuda impaga (Solo voz)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-rose-900 block">
                    {quorumStats.inhabilesCount} / {quorumStats.totalUnitsCount}
                  </span>
                  <span className="text-[10px] font-black text-rose-700">
                    {quorumStats.inhabilesShare.toFixed(1)}% derechos
                  </span>
                </div>
              </div>
            </div>

            {/* Plazo de regularización */}
            <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 mt-3 text-[10.5px] text-amber-900 leading-relaxed">
              <div className="flex items-center space-x-1 font-black text-amber-950 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Fecha Límite para Regularizar:</span>
              </div>
              Los vecinos con deuda pueden pagar o pactar convenio hasta el:
              <input
                type="date"
                value={paymentDeadlineDate}
                onChange={(e) => setPaymentDeadlineDate(e.target.value)}
                className="w-full px-2 py-1 mt-1 rounded-lg border border-amber-300 bg-white font-bold text-xs text-amber-950"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Base total alícuotas:</span>
            <span className="text-slate-900 font-black">{quorumStats.totalCommunityShare.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* 3. TERMÓMETROS DE RESULTADO LEGAL EN TIEMPO REAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Termómetro 1: Quórum de Constitución */}
        <div className={`p-4 rounded-2xl border-2 transition-all ${
          quorumStats.isConstituted
            ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
            : 'bg-rose-50/50 border-rose-300 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${
                quorumStats.isConstituted ? 'bg-emerald-600' : 'bg-rose-500'
              }`}>
                {quorumStats.isConstituted ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                1. Quórum de Constitución ({citationNumber}ª Citación)
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              quorumStats.isConstituted
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800 animate-pulse'
            }`}>
              {quorumStats.isConstituted ? 'Válidamente Constituida' : 'Quórum Insuficiente'}
            </span>
          </div>

          <div className="space-y-1 my-3">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Asistencia Hábil Presente: {quorumStats.presentHabilesShare.toFixed(2)}% ({quorumStats.presentHabilesCount} casas)</span>
              <span>Exigido: {quorumStats.requiredConstitutionShare > 0 ? `${quorumStats.requiredConstitutionShare.toFixed(1)}%` : 'Sin mínimo'}</span>
            </div>
            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden relative">
              {quorumStats.requiredConstitutionShare > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                  style={{ left: `${Math.min(100, quorumStats.requiredConstitutionShare)}%` }}
                  title={`Meta legal: ${quorumStats.requiredConstitutionShare}%`}
                />
              )}
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quorumStats.isConstituted ? 'bg-emerald-600' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, (quorumStats.presentHabilesShare / (quorumStats.requiredConstitutionShare || 100)) * 100)}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
            {quorumStats.constitutionExplanation}
          </p>
        </div>

        {/* Termómetro 2: Quórum de Aprobación de la Moción */}
        <div className={`p-4 rounded-2xl border-2 transition-all ${
          quorumStats.isApproved
            ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
            : 'bg-amber-50/50 border-amber-300 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${
                quorumStats.isApproved ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                {quorumStats.isApproved ? <Award className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                2. Quórum de Aprobación (Votos a Favor)
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              quorumStats.isApproved
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-900'
            }`}>
              {quorumStats.isApproved ? 'Moción APROBADA' : 'Moción RECHAZADA / Pendiente'}
            </span>
          </div>

          <div className="space-y-1 my-3">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Votos a Favor: {quorumStats.votesFavorShare.toFixed(2)}% ({quorumStats.votesFavorCount} casas)</span>
              <span>Requerido: {quorumStats.requiredApprovalShare.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                style={{ left: `${Math.min(100, quorumStats.requiredApprovalShare)}%` }}
                title={`Meta legal: ${quorumStats.requiredApprovalShare}%`}
              />
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quorumStats.isApproved ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (quorumStats.votesFavorShare / (quorumStats.requiredApprovalShare || 100)) * 100)}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
            {quorumStats.approvalExplanation}
          </p>
        </div>
      </div>

      {/* 4. SIMULADOR PASO A PASO: LISTA NOMINAL DE VECINOS Y ASISTENCIA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-[#0F3D2E]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Paso 2: Registro Nominal de Asistencia y Sentido del Voto
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Simule la concurrencia y votación casa por casa. Los morosos pueden asistir con voz, pero la ley bloquea su voto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => applyQuickScenario('only_habiles_present')}
              className="px-2.5 py-1.5 bg-[#F5F4EF] hover:bg-[#eae7dd] text-[#0F3D2E] border border-[#D4B895] font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              Solo Hábiles Presentes
            </button>
            <button
              type="button"
              onClick={() => applyQuickScenario('all_present')}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              Todos Presentes
            </button>
            <button
              type="button"
              onClick={() => applyQuickScenario('conservative')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
            >
              Moderado (60%)
            </button>
            <button
              type="button"
              onClick={() => applyQuickScenario('reset')}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros de la Tabla */}
        <div className="p-2.5 sm:px-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setUnitFilterTab('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                unitFilterTab === 'ALL'
                  ? 'bg-[#0F3D2E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todas ({units.length})
            </button>
            <button
              type="button"
              onClick={() => setUnitFilterTab('HABILES')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                unitFilterTab === 'HABILES'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Hábiles Art. 5° ({quorumStats.habilesCount})
            </button>
            <button
              type="button"
              onClick={() => setUnitFilterTab('IN_HABILES')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                unitFilterTab === 'IN_HABILES'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Inhábiles / Mora ({quorumStats.inhabilesCount})
            </button>
            <button
              type="button"
              onClick={() => setUnitFilterTab('PRESENTES')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                unitFilterTab === 'PRESENTES'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Presentes ({quorumStats.presentCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por casa, dueño o RUT..."
              value={searchUnitQuery}
              onChange={(e) => setSearchUnitQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* Tabla Interactiva de Asistencia y Voto */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F4EF] text-slate-700 text-[10.5px] uppercase font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-center w-14">Asiste</th>
                <th className="py-2.5 px-3">Unidad</th>
                <th className="py-2.5 px-3">Copropietario(a)</th>
                <th className="py-2.5 px-3 text-center">Alícuota</th>
                <th className="py-2.5 px-3 text-center">Estado Ley 21.442</th>
                <th className="py-2.5 px-3">Representación</th>
                <th className="py-2.5 px-3 text-center">Sentido del Voto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedUnits.map((item) => {
                const uId = item.unit.id;
                const part = simulatedParticipation[uId] || {
                  present: false,
                  representationType: 'titular',
                  vote: 'abstencion'
                };

                return (
                  <tr
                    key={uId}
                    className={`transition-colors ${
                      part.present
                        ? item.isHabil
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                          : 'bg-rose-50/20 hover:bg-rose-50/40'
                        : 'hover:bg-slate-50 opacity-75'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePresent(uId)}
                        className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                          part.present
                            ? 'bg-[#0F3D2E] text-white shadow-xs'
                            : 'bg-white border-2 border-slate-300 text-transparent hover:border-slate-400'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    <td className="py-2.5 px-3 font-black text-slate-900">
                      Casa {item.unit.number}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                        {item.unit.ownerName || 'Sin copropietario asignado'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatRut(item.unit.ownerRut)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {item.share.toFixed(2)}%
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {item.isHabil ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Hábil (Vota)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                          Inhábil (Solo voz)
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      {part.present ? (
                        <select
                          value={part.representationType}
                          onChange={(e) => handleSetRepresentation(uId, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 bg-white"
                        >
                          <option value="titular">Copropietario(a)</option>
                          <option value="arrendatario">Arrendatario(a)</option>
                          <option value="poder">Poder Escrito / Mandato</option>
                        </select>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Ausente</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {part.present ? (
                        item.isHabil ? (
                          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => handleSetVote(uId, 'a_favor')}
                              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                part.vote === 'a_favor'
                                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                                  : 'text-slate-600 hover:text-emerald-700'
                              }`}
                            >
                              A Favor
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetVote(uId, 'en_contra')}
                              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                part.vote === 'en_contra'
                                  ? 'bg-rose-600 text-white shadow-xs font-black'
                                  : 'text-slate-600 hover:text-rose-700'
                              }`}
                            >
                              En Contra
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetVote(uId, 'abstencion')}
                              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                part.vote === 'abstencion'
                                  ? 'bg-slate-700 text-white shadow-xs font-black'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Abstención
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                            🚫 Inhabilitado por Mora
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SECCIÓN PEDAGÓGICA Y DIDÁCTICA: GUÍA PARA VECINOS Y COMITÉ */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-[#0F3D2E]" />
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Guía Pedagógica Ley N° 21.442: Preguntas Clave para Vecinos y Comité
            </h4>
            <p className="text-xs text-slate-500">
              Conceptos esenciales redactados en lenguaje claro y didáctico para resolver dudas comunitarias
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-[#F5F4EF]/60 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-black text-[#0F3D2E] block">
              ⚖️ ¿Por qué un vecino con deuda no puede votar? (Art. 5°)
            </span>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              La Ley 21.442 establece que solo los <strong>copropietarios hábiles</strong> tienen derecho a sufragio. Quien debe gastos comunes puede asistir a la asamblea y opinar (derecho a voz), pero su voto no se cuenta. Si firma un convenio de repactación antes de la asamblea, recupera de inmediato su derecho a voto.
            </p>
          </div>

          <div className="p-3 bg-[#F5F4EF]/60 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-black text-[#0F3D2E] block">
              🔑 ¿Puede votar un arrendatario en lugar del propietario? (Art. 16°)
            </span>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              <strong>Sí.</strong> La nueva ley presume que el arrendatario representa al propietario en las asambleas ordinarias, salvo que el contrato de arriendo o el propietario informen expresamente lo contrario por escrito a la administración antes de la sesión.
            </p>
          </div>

          <div className="p-3 bg-[#F5F4EF]/60 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-black text-[#0F3D2E] block">
              ⏱️ ¿Qué diferencia hay entre 1ª y 2ª Citación? (Art. 15°)
            </span>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              En las <strong>Asambleas Ordinarias</strong>, si en 1ª citación no llega la mayoría absoluta de la comunidad, en 2ª citación la asamblea sesiona válidamente con los vecinos hábiles que asistan, evitando que el condominio quede paralizado sin presupuesto o sin comité.
            </p>
          </div>

          <div className="p-3 bg-[#F5F4EF]/60 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-black text-[#0F3D2E] block">
              🏛️ ¿Por qué para cambiar el Reglamento se exige el 66%? (Art. 15° inc. 3)
            </span>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              El Reglamento de Copropiedad equivale a la «constitución» del condominio. Modificarlo afecta el derecho de propiedad y la convivencia de todas las familias, por lo que la ley exige <strong>mayoría reforzada (66% del total de derechos)</strong> y posterior inscripción en el Conservador de Bienes Raíces.
            </p>
          </div>
        </div>
      </div>
        </>
      )}

      {/* VISTA 2: URNA DIGITAL & CONSULTAS POR ESCRITO (ART. 15 INC. FINAL) */}
      {governanceTab === 'consultas' && (
        <WrittenConsultationsSubTab
          currentCommunity={currentCommunity}
          getUnitFinancials={getUnitFinancials}
        />
      )}

      {/* VISTA 3: LIBRO OFICIAL DE ACTAS FOLIADAS (ART. 20) */}
      {governanceTab === 'actas' && (
        <AssemblyMinutesSubTab
          currentCommunity={currentCommunity}
        />
      )}

      {/* VISTA 4: REGISTRO DE PODERES DE REPRESENTACIÓN (ART. 16°) */}
      {governanceTab === 'poderes' && (
        <RegisteredProxiesSubTab
          currentCommunity={currentCommunity}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 0: CENTRO DE NOTIFICACIÓN & DESPACHO MULTICANAL (APP, WSP, EMAIL, PDF) */}
      {/* ========================================================================= */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabecera del Centro de Despacho */}
            <div className="p-4 sm:p-5 bg-[#0F3D2E] text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4B895]/20 border border-[#D4B895]/40 flex items-center justify-center text-[#D4B895]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-white">
                      Despacho Multicanal de Citaciones Oficiales
                    </h3>
                    <span className="text-[10px] font-black bg-[#D4B895] text-[#0F3D2E] px-2 py-0.5 rounded-full uppercase">
                      Ley N° 21.442
                    </span>
                  </div>
                  <p className="text-xs text-[#D4B895]/80 mt-0.5">
                    Notifique la convocatoria a la asamblea en la App, WhatsApp grupal / individual, Correo Masivo o PDF oficial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Pestañas de Canales de Despacho */}
            <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setDispatchChannelTab('app')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                  dispatchChannelTab === 'app'
                    ? 'bg-white text-[#0F3D2E] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#0F3D2E]" />
                <span>1. Portal / Notificación App</span>
              </button>

              <button
                type="button"
                onClick={() => setDispatchChannelTab('whatsapp')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                  dispatchChannelTab === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>2. WhatsApp (Grupal & Casa por Casa)</span>
              </button>

              <button
                type="button"
                onClick={() => setDispatchChannelTab('email')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                  dispatchChannelTab === 'email'
                    ? 'bg-[#0F3D2E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>3. Correo Masivo (Email CCO)</span>
              </button>

              <button
                type="button"
                onClick={() => setDispatchChannelTab('pdf')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                  dispatchChannelTab === 'pdf'
                    ? 'bg-[#D4B895] text-[#0F3D2E] shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>4. Citación PDF / Diario Mural</span>
              </button>
            </div>

            {/* Contenido del Canal Seleccionado */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* CANAL 1: NOTIFICACIÓN EN LA APP / PORTAL RESIDENTES */}
              {dispatchChannelTab === 'app' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-900">
                      <Megaphone className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-black">Publicación en el Mural y Portal del Residente</h4>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Al presionar el botón de publicación, la citación oficial quedará fijada como <strong>Aviso Prioritario</strong> en el portal de los residentes de <strong>{currentCommunity?.name}</strong>. Todos los vecinos la verán inmediatamente al iniciar sesión o consultar sus gastos comunes.
                    </p>
                  </div>

                  {appNotificationPublished ? (
                    <div className="p-4 bg-emerald-100 rounded-2xl border-2 border-emerald-400 text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <div>
                          <strong className="block text-xs font-black">¡Citación Publicada con Éxito en el Portal!</strong>
                          <span className="text-[11px] text-emerald-700">Ya está visible en el Mural de Avisos para los residentes de {currentCommunity?.name}.</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-700 text-white font-bold text-xs rounded-xl">Publicado</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePublishAppNotification}
                      className="w-full py-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Megaphone className="w-4 h-4 text-[#D4B895]" />
                      <span>Publicar Notificación Oficial en la App y Mural de Vecinos</span>
                    </button>
                  )}

                  {/* Vista Previa del Aviso que verán los vecinos */}
                  <div className="p-4 bg-[#F5F4EF] rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Vista previa de lo que verán los vecinos en el Mural de la Aplicación:
                    </span>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full">Urgente</span>
                        <span className="text-[10.5px] text-slate-400">Hoy</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900">
                        🏛️ Convocatoria Oficial: {selectedTopic.assemblyType} - {formatDate(assemblyDate)}
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {`Se cita a todos los copropietarios a la ${selectedTopic.assemblyType} el día ${formatDate(assemblyDate)} en ${assemblyLocation}.\n\n• 1ª Citación: ${assemblyTime1st} hrs\n• 2ª Citación: ${assemblyTime2nd} hrs\n${assemblyFormat !== 'presencial' ? `• Enlace Zoom/Meet: ${virtualMeetingUrl}\n` : ''}\nTabla de la Asamblea:\n1. ${selectedTopic.name}\n${additionalTopics.map((t, i) => `${i + 2}. ${t.title}`).join('\n')}\n\nConforme al Art. 5° de la Ley N° 21.442, solo podrán votar los copropietarios hábiles (al día o con convenio vigente al ${formatDate(paymentDeadlineDate)}).`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CANAL 2: WHATSAPP (GRUPAL Y PERSONALIZADO CASA POR CASA) */}
              {dispatchChannelTab === 'whatsapp' && (
                <div className="space-y-4">
                  {/* WhatsApp Grupal */}
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-emerald-950 font-black text-xs">
                        <Users className="w-4 h-4 text-emerald-700" />
                        <span>Opción A: Difusión Grupal en WhatsApp (Grupo de Vecinos o Comité)</span>
                      </div>
                      <button
                        type="button"
                        onClick={copyWhatsAppCitacion}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer shadow-2xs"
                      >
                        {whatsappCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{whatsappCopied ? '¡Texto Copiado!' : 'Copiar Texto Grupal'}</span>
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-mono text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {generateWhatsAppMessage()}
                    </div>
                  </div>

                  {/* WhatsApp Individualizado Casa por Casa */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-800 font-black text-xs">
                        <Smartphone className="w-4 h-4 text-[#0F3D2E]" />
                        <span>Opción B: Notificación Personalizada Casa por Casa (con alícuota y estado de deuda)</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {unitsLegalStatus.length} contactos
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {unitsLegalStatus.map(item => {
                        const u = item.unit;
                        const phoneClean = (item.phone || '').replace(/[^0-9]/g, '');
                        const msg = generateIndividualWhatsAppMessage(item);
                        const waUrl = phoneClean.length >= 8 ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}` : null;

                        return (
                          <div key={u.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-black text-slate-900">Casa {u.number}</span>
                                <span className="text-slate-700 font-semibold truncate">{u.ownerName || 'Copropietario'}</span>
                                {item.isHabil ? (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md">Al Día</span>
                                ) : (
                                  <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[9px] font-black rounded-md">Deuda: {formatCLP(item.debtAmount)}</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Tel: {item.phone} • Alícuota: {item.share.toFixed(2)}%
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg);
                                  setSelectedIndividualWhatsAppUnitId(u.id);
                                  setTimeout(() => setSelectedIndividualWhatsAppUnitId(null), 2000);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                                title="Copiar mensaje personalizado"
                              >
                                {selectedIndividualWhatsAppUnitId === u.id ? '¡Copiado!' : 'Copiar'}
                              </button>

                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10.5px] flex items-center space-x-1 shadow-2xs"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>Enviar WhatsApp</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Sin teléfono</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CANAL 3: CORREO MASIVO (EMAIL CCO) */}
              {dispatchChannelTab === 'email' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-5 h-5 text-[#0F3D2E]" />
                        <h4 className="text-sm font-black text-slate-900">Despacho Oficial por Correo Electrónico</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {allCommunityEmails.length} correos de copropietarios listos para despacho masivo con Copia Oculta (CCO / BCC).
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(allCommunityEmails.join(', '));
                          setEmailDispatchCopied(true);
                          setTimeout(() => setEmailDispatchCopied(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        {emailDispatchCopied ? '¡Correos Copiados!' : 'Copiar Lista Correos'}
                      </button>

                      <a
                        href={mailtoBccLink}
                        className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                        <span>Abrir Correo Masivo (BCC)</span>
                      </a>
                    </div>
                  </div>

                  {/* Previsualización del Contenido del Correo */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="pb-2 border-b border-slate-200 flex justify-between text-slate-500 text-[11px]">
                      <span><strong>Asunto:</strong> {emailSubject}</span>
                      <span>{allCommunityEmails.length} destinatarios en CCO</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {emailBodyText}
                    </div>
                  </div>
                </div>
              )}

              {/* CANAL 4: CITACIÓN OFICIAL PDF / DIARIO MURAL FÍSICO */}
              {dispatchChannelTab === 'pdf' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Convocatoria Oficial Imprimible (Diario Mural / PDF)</h4>
                      <p className="text-xs text-slate-500">Documento formal en tamaño carta con pie de firmas para fijar en el diario mural del condominio.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
                        const docName = `Citacion_Oficial_${selectedTopic.category}_${commName}_${assemblyDate}`;
                        printDocumentDirectly('assembly-citation-printable-doc', docName);
                      }}
                      className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center cursor-pointer shadow-xs"
                    >
                      <Printer className="w-4 h-4 mr-1.5 text-[#D4B895]" />
                      <span>Imprimir / Guardar en PDF</span>
                    </button>
                  </div>

                  {/* Hoja Formal Imprimible */}
                  <div 
                    id="assembly-citation-printable-doc"
                    className="p-6 sm:p-8 bg-white rounded-2xl border-2 border-slate-300 shadow-sm space-y-4 text-xs font-serif leading-relaxed text-slate-800"
                  >
                    {/* Membrete Oficial Maestro ARANPRO */}
                    <div className="flex items-start justify-between border-b-2 border-[#0F3D2E] pb-4 font-sans">
                      <div className="flex items-center space-x-3.5">
                        <AranproLogo variant="principal" className="h-12 w-auto" />
                        <div className="border-l border-slate-300 pl-3.5 space-y-0.5">
                          <div className="text-xs font-black text-[#0F3D2E] uppercase">
                            ARANPRO • GESTIÓN INTEGRAL INMOBILIARIA
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            {companySettings?.companyRut && !String(companySettings.companyRut).includes('76.999.888') ? `RUT Empresa: ${companySettings.companyRut} • ` : ''}Ley N° 21.442 • Fono: {companySettings?.phone || '+56 9 5811 8504'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-bold text-slate-900">{currentCommunity?.name?.toUpperCase()}</div>
                        <div className="text-[10px] text-slate-500 font-mono">RUT: {currentCommunity?.bankInfo?.rut || '76.890.123-4'}</div>
                      </div>
                    </div>

                    <div className="text-center py-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#D4B895] block font-sans">
                        LEY N° 21.442 DE COPROPIEDAD INMOBILIARIA
                      </span>
                      <h2 className="text-lg font-black text-slate-900 mt-0.5 uppercase">
                        CITACIÓN Y CONVOCATORIA OFICIAL A {selectedTopic.assemblyType.toUpperCase()}
                      </h2>
                    </div>

                    <p className="text-justify text-xs">
                      En cumplimiento de lo dispuesto en los <strong>Artículos 15°, 16° y 17° de la Ley N° 21.442 de Copropiedad Inmobiliaria</strong> y en el Reglamento de Copropiedad respectivo, se convoca formalmente a todos los copropietarios de la comunidad a sesionar en <strong>{selectedTopic.assemblyType}</strong>:
                    </p>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-300 rounded-xl font-sans text-xs">
                      <div>
                        <strong>Fecha de la Asamblea:</strong> {formatDate(assemblyDate)}<br />
                        <strong>1ª Citación:</strong> {assemblyTime1st} horas<br />
                        <strong>2ª Citación:</strong> {assemblyTime2nd} horas
                      </div>
                      <div>
                        <strong>Lugar de Sesión:</strong> {assemblyLocation}<br />
                        <strong>Modalidad:</strong> {assemblyFormat.toUpperCase()}<br />
                        {assemblyFormat !== 'presencial' && <span><strong>Enlace Virtual:</strong> {virtualMeetingUrl}</span>}
                      </div>
                    </div>

                    <div>
                      <strong className="block text-xs uppercase text-slate-900 mb-1">
                        ORDEN DEL DÍA / TABLA DE MATERIAS A TRATAR:
                      </strong>
                      <ol className="list-decimal pl-5 space-y-1 font-sans text-xs">
                        <li>
                          <strong>{selectedTopic.name}:</strong> {selectedTopic.description} <em>(Quórum legal: {selectedTopic.badgeLabel})</em>.
                        </li>
                        {additionalTopics.map((top, idx) => (
                          <li key={top.id}>
                            <strong>{top.title}:</strong> {top.description}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="p-3 bg-slate-100/70 border border-slate-300 rounded-xl font-sans text-[11px] leading-relaxed">
                      <strong>REGLAS LEGALES DE PARTICIPACIÓN Y VOTO (LEY N° 21.442):</strong><br />
                      • <strong>Copropietarios Hábiles (Art. 5°):</strong> Solo tendrán derecho a voto los copropietarios que se encuentren al día en el pago de sus gastos comunes y multas, o que hubieren suscrito un convenio de repactación vigente antes del {formatDate(paymentDeadlineDate)}.<br />
                      • <strong>Representación (Art. 16°):</strong> El copropietario que no pueda asistir podrá ser representado por su arrendatario o por un tercero mediante carta poder simple.<br />
                      • <strong>Validez en 2ª Citación:</strong> {selectedTopic.category === 'ordinaria' ? 'En caso de no reunirse el quórum en 1ª citación, la asamblea sesionará válidamente en 2ª citación con los copropietarios que concurran, adoptándose los acuerdos por mayoría de los presentes hábiles.' : 'Requiere el quórum calificado de constitución en ambas citaciones.'}
                    </div>

                    <div className="pt-8 grid grid-cols-2 gap-8 text-center font-sans text-xs items-end">
                      <div>
                        <div className="h-16 flex items-center justify-center">
                          <span className="text-xs text-slate-400 italic">Firma y Visto Bueno Comité</span>
                        </div>
                        <div className="border-t border-slate-400 pt-1">
                          <strong>Presidente Comité de Administración</strong><br />
                          {currentCommunity?.name}
                        </div>
                      </div>
                      <div>
                        <div className="h-16 flex items-center justify-center gap-3">
                          <AranproOfficialSeal size="sm" showText={false} />
                          {companySettings?.signatureDataUrl ? (
                            <img 
                              src={companySettings.signatureDataUrl} 
                              alt="Firma Administrador" 
                              className="max-h-16 object-contain mx-auto"
                              style={{
                                transform: `scale(${companySettings?.signatureScale || 1.35})`,
                                transformOrigin: 'bottom center'
                              }}
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic">Firma del Administrador</span>
                          )}
                        </div>
                        <div className="border-t-2 border-[#0F3D2E] pt-1">
                          <strong>{companySettings?.adminName || companySettings?.administratorName || 'John Andrés Arancibia Maureira'}</strong><br />
                          <span className="text-[10px] text-slate-500">
                            ARANPRO • RNAC MINVU N° {companySettings?.rnacNumber || '48.912'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del Modal de Despacho */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Comunicaciones emitidas en conformidad a la Ley N° 21.442 y Ley N° 19.628 de Protección de Datos
              </span>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BORRADOR OFICIAL DE ACTA DE ASAMBLEA */}
      {/* ========================================================================= */}
      {showMinutesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-300 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#0F3D2E]" />
                <h3 className="text-base font-black text-slate-900">
                  Borrador Oficial del Acta de Asamblea (Ley N° 21.442)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMinutesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div 
              id="assembly-minutes-draft-doc"
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed text-slate-800 space-y-2 whitespace-pre-wrap max-h-[60vh] overflow-y-auto"
            >
{`ACTA DE ${selectedTopic.assemblyType.toUpperCase()}
COMUNIDAD: ${currentCommunity?.name || 'Condominio'}
FECHA: ${formatDate(assemblyDate)} • HORA: ${citationNumber === 1 ? assemblyTime1st : assemblyTime2nd} HRS (${citationNumber}ª CITACIÓN)
MODALIDAD: ${assemblyFormat.toUpperCase()} • LUGAR: ${assemblyLocation}
MATERIA PRINCIPAL: ${selectedTopic.name}
TEMAS COMPLEMENTARIOS DE LA TABLA:
${additionalTopics.map((t, i) => `${i + 2}. ${t.title}`).join('\n')}

1. CONSTITUCIÓN Y ASISTENCIA LEGAL (Art. 5° y Art. 15°):
Total Unidades del Condominio: ${quorumStats.totalUnitsCount} (100% alícuota)
Asistentes Totales: ${quorumStats.presentCount} (${quorumStats.presentTotalShare.toFixed(2)}% alícuota)
Copropietarios Hábiles con Derecho a Voto: ${quorumStats.presentHabilesCount} (${quorumStats.presentHabilesShare.toFixed(2)}% alícuota)
Copropietarios Inhábiles (solo derecho a voz por mora): ${quorumStats.presentInhabilesCount} (${quorumStats.presentInhabilesShare.toFixed(2)}% alícuota)

CERTIFICACIÓN DE QUÓRUM:
${quorumStats.isConstituted ? '✓ LA ASAMBLEA SE DECLARA VÁLIDAMENTE CONSTITUIDA PARA SESIONAR Y ADOPTAR ACUERDOS.' : '✗ NO SE REÚNE EL QUÓRUM EXIGIDO POR LA LEY N° 21.442.'}

2. VOTACIÓN DE LA MOCIÓN PRINCIPAL:
• Votos a Favor: ${quorumStats.votesFavorCount} unidades (${quorumStats.votesFavorShare.toFixed(2)}% de derechos)
• Votos en Contra: ${quorumStats.votesAgainstCount} unidades (${quorumStats.votesAgainstShare.toFixed(2)}% de derechos)
• Abstenciones: ${quorumStats.votesAbstainCount} unidades (${quorumStats.votesAbstainShare.toFixed(2)}% de derechos)

3. RESOLUCIÓN OFICIAL:
${quorumStats.isApproved 
  ? `✓ LA MOCIÓN RESULTA FORMALMENTE APROBADA con fuerza ejecutiva y obligatoria para todas las unidades conforme al ${selectedTopic.legalArticle}.`
  : `✗ LA MOCIÓN RESULTA RECHAZADA o no adoptada por no alcanzar el quórum de ${selectedTopic.approvalPct}% requerido legalmente.`}

4. CONSTANCIA DE FIRMAS:

_____________________________                 _____________________________
Presidente Comité de Administración             Administrador de la Comunidad
RUT: ________________________                 RUT: ________________________`}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Lista para exportar o imprimir en el libro oficial de actas
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={copyMinutesDraft}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center cursor-pointer transition-colors"
                >
                  {minutesCopied ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1 text-emerald-600" />}
                  <span>{minutesCopied ? '¡Acta Copiada!' : 'Copiar Texto'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
                    printDocumentDirectly('assembly-minutes-draft-doc', `Acta_Quorum_Asistencia_${commName}_${assemblyDate}`);
                  }}
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center cursor-pointer transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4 mr-1.5 text-[#D4B895]" />
                  <span>Imprimir Acta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FOLLETO DIDÁCTICO PARA VECINOS (1 PÁGINA) */}
      {/* ========================================================================= */}
      {showBrochureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-300 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-black text-slate-900">
                  Folleto Didáctico para Residentes (1 Página)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBrochureModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div 
              id="voting-brochure-printable-doc"
              className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-200 space-y-3.5 text-xs text-slate-700"
            >
              <div className="text-center pb-2 border-b border-amber-200/60">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Guía de Participación Ciudadana • Ley N° 21.442
                </span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  ¿Cómo funciona tu voto en la Asamblea de {currentCommunity?.name}?
                </h4>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-900">Tu Alícuota es el peso de tu voto:</strong>
                    <p className="text-[11px] text-slate-600">
                      En los condominios los votos no son por persona sino por el porcentaje de dominio sobre los bienes comunes (alícuota). En nuestra comunidad cada casa tiene aproximadamente un <strong>{(100 / (units.length || 1)).toFixed(2)}%</strong> de derechos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#0F3D2E] text-[#D4B895] font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <strong className="text-slate-900">Mantente al Día para ejercer tu voto (Art. 5°):</strong>
                    <p className="text-[11px] text-slate-600">
                      Si tienes saldo pendiente sin convenio, la ley prohíbe que tu voto sea contabilizado. Solo los copropietarios al día pueden decidir sobre presupuestos, cuotas y reglamentos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <strong className="text-slate-900">¿No puedes asistir? Da un poder simple:</strong>
                    <p className="text-[11px] text-slate-600">
                      Puedes autorizar a un vecino de confianza o a tu arrendatario mediante una carta o poder simple firmado para que vote en tu representación.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 text-center font-bold text-[#0F3D2E]">
                ✨ ¡Tu participación activa protege la plusvalía y la convivencia de todas nuestras familias!
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Ideal para enviar por WhatsApp o adjuntar al aviso mural
              </span>
              <button
                type="button"
                onClick={() => {
                  const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
                  printDocumentDirectly('voting-brochure-printable-doc', `Folleto_Votacion_Vecinos_${commName}`, { fitPage: true });
                }}
                className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center cursor-pointer transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4 mr-1.5 text-[#D4B895]" />
                <span>Imprimir Folleto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
