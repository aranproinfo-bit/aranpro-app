import React, { useState, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { formatDate, formatRut, formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { AranproConfirmModal } from '../common/AranproConfirmModal';
import {
  ClipboardList, Users, Calendar, Clock, CheckCircle2, AlertCircle,
  Plus, Printer, Search, Filter, Shield, FileText, Check,
  MessageCircle, Trash2, Edit3, AlertTriangle, UserCheck,
  BadgeCheck, X, Bell, ChevronRight, Sparkles, CheckSquare,
  Smartphone, Share2, ArrowRight, Zap, Megaphone
} from 'lucide-react';

export const CommitteeMeetingsAndLogModule = ({
  currentCommunity,
  activeSubTab = 'reuniones',
  onSubTabChange
}) => {
  const {
    companySettings,
    addCommitteeMeeting,
    updateCommitteeMeeting,
    deleteCommitteeMeeting,
    addCommitteeNovedad,
    updateCommitteeNovedad,
    deleteCommitteeNovedad,
    addCommitteeTask,
    toggleCommitteeTaskStatus,
    deleteCommitteeTask,
    toggleUnitCommittee,
    updateUnit,
    getUnitFinancials,
    addAnnouncement
  } = useCommunity();

  // Control de sub-vista activa ('reuniones' | 'novedades' | 'tareas' | 'directorio')
  const [internalTab, setInternalTab] = useState(activeSubTab || 'reuniones');
  const currentTab = onSubTabChange ? activeSubTab : internalTab;
  const setTab = onSubTabChange || setInternalTab;

  // Estados de Reuniones
  const meetings = useMemo(() => currentCommunity?.committeeMeetings || [], [currentCommunity]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(() => meetings[0]?.id || null);
  const selectedMeeting = useMemo(() => {
    return meetings.find(m => m.id === selectedMeetingId) || meetings[0] || null;
  }, [meetings, selectedMeetingId]);

  // Modal Nueva Reunión
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [newMeetingForm, setNewMeetingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '19:30 hrs',
    type: 'Sesión Ordinaria Mensual de Coordinación',
    modality: 'Mixta (Presencial + Google Meet)',
    place: 'Sala Multiuso / Telemática',
    presidentName: 'Carlos Morales Rojas',
    presidentRut: '15.428.312-4',
    secretaryName: 'Marcela Castillo Gómez',
    secretaryRut: '13.784.512-8',
    agendaTopics: [
      '1. Revisión de cuentas y conciliación bancaria del período',
      '2. Estado de mantenciones preventivas y certificaciones técnicas (Art. 40)',
      '3. Cobranza y gestión de morosidad (Art. 27° Ley 21.442)'
    ],
    agreements: [
      'Se aprueba la rendición de cuentas del mes anterior sin observaciones.'
    ],
    tasks: [],
    notes: 'Acta aprobada y suscrita por los miembros del Comité y la Administración ARANPRO.'
  });
  const [newTopicInput, setNewTopicInput] = useState('');
  const [newAgreementInput, setNewAgreementInput] = useState('');
  const [newTaskInput, setNewTaskInput] = useState({ title: '', assignee: 'Administración ARANPRO', dueDate: '', priority: 'MEDIA' });

  // Estados de Novedades
  const novedades = useMemo(() => currentCommunity?.committeeNovedades || [], [currentCommunity]);
  const [novedadFilterCategory, setNovedadFilterCategory] = useState('ALL');
  const [novedadFilterPriority, setNovedadFilterPriority] = useState('ALL');
  const [novedadSearchQuery, setNovedadSearchQuery] = useState('');
  const [showNewNovedadModal, setShowNewNovedadModal] = useState(false);
  const [newNovedadForm, setNewNovedadForm] = useState({
    title: '',
    category: 'Mantención & Accesos',
    priority: 'ALTA',
    reportedBy: 'Administración ARANPRO',
    description: '',
    elevatedToMeeting: false
  });
  const [whatsAppNovedadesCopied, setWhatsAppNovedadesCopied] = useState(false);

  // Estados de Tareas
  const tasks = useMemo(() => currentCommunity?.committeeTasks || [], [currentCommunity]);
  const [taskFilterStatus, setTaskFilterStatus] = useState('ALL');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskStandalone, setNewTaskStandalone] = useState({
    title: '',
    assignee: 'Administración ARANPRO',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIA',
    notes: ''
  });

  // Estado para Modal de Designación / Edición de Miembros del Comité (Art. 17°)
  const [showDesignateMemberModal, setShowDesignateMemberModal] = useState(false);
  const [designateForm, setDesignateForm] = useState({
    unitId: '',
    role: 'Miembro del Comité'
  });

  // 1. Estados para Resolución de Suspensión de Suministro Eléctrico (Arts. 20° y 27° Ley 21.442)
  const [showPowerCutModal, setShowPowerCutModal] = useState(false);
  const [powerCutForm, setPowerCutForm] = useState({
    unitId: 'u-12',
    company: 'CGE Compañía General de Electricidad S.A.',
    clientNumber: '8842109-2',
    meterNumber: 'MTR-55419-C12',
    warningDays: 3,
    resolutionFolio: 'RES-COM-CORTE-2026-01',
    notes: 'Habiéndose verificado una morosidad superior a 3 cuotas continuas y reiteradas comunicaciones sin respuesta, el Comité de Administración, conforme a la facultad conferida por el Art. 27° de la Ley N° 21.442, acuerda por unanimidad instruir a la empresa distribuidora la suspensión del suministro eléctrico de la unidad.'
  });
  const [powerCutCopiedFeedback, setPowerCutCopiedFeedback] = useState(false);

  // 3. Estados para Generador de Circulares del Comité a la Comunidad (Art. 17° N° 1)
  const [showCircularModal, setShowCircularModal] = useState(false);
  const [circularTemplate, setCircularTemplate] = useState('mascotas');
  const [circularForm, setCircularForm] = useState({
    folio: 'CIRCULAR-COM-2026-04',
    date: new Date().toISOString().split('T')[0],
    title: 'Regulación de Tenencia Responsable de Mascotas en Espacios Comunes',
    category: 'Convivencia & Tenencia Responsable',
    legalCitation: 'Ley N° 21.020 ("Ley Cholito") y Arts. 17° y 36° Ley N° 21.442',
    body: `Estimada comunidad:\n\nSe recuerda a todos los copropietarios y arrendatarios que la tenencia de mascotas en el condominio exige estricta responsabilidad conforme a la ley y al Reglamento de Copropiedad:\n\n1. Toda mascota debe transitar con correa y bajo supervisión de un adulto en pasajes y áreas de juegos infantiles.\n2. Es obligación inmediata el recojo de deposiciones con bolsa higiénica desechable.\n3. Queda prohibido permitir que animales deambulen sueltos o generen ruidos molestos reiterados en horarios de descanso.\n\nLas infracciones serán sancionadas con multas reglamentarias de 1 a 3 UF imputables directamente a la colilla de gastos comunes.\n\nAgradecemos su colaboración activa para una convivencia armónica y segura.`,
    committeeSigners: 'Carlos Morales Rojas (Presidente) • Marcela Castillo Gómez (Tesorera)'
  });
  const [circularPublishedFeedback, setCircularPublishedFeedback] = useState(false);
  const [circularCopiedFeedback, setCircularCopiedFeedback] = useState(false);

  // Modal de confirmación corporativo ARANPRO (reemplaza popups nativos del navegador)
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

  // 4. Estados para Reloj de Mandato Legal del Comité (Art. 17° Inciso 2)
  const [mandateInfo, setMandateInfo] = useState({
    assemblyDate: '2024-11-15',
    assemblyMinuteRef: 'Acta de Asamblea Ordinaria N° 12-2024',
    durationYears: 3
  });
  const [isEditingMandate, setIsEditingMandate] = useState(false);

  // Métricas del Mandato Legal del Comité (Ley N° 21.442 • Art. 17°)
  const mandateMetrics = useMemo(() => {
    const start = new Date(mandateInfo.assemblyDate);
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + (mandateInfo.durationYears || 3));
    
    const now = new Date();
    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.round((now - start) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.round((end - now) / (1000 * 60 * 60 * 24));
    const percent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
    
    const isExpired = daysRemaining <= 0;
    const isNearRenewal = daysRemaining > 0 && daysRemaining <= 180;
    
    return {
      startDate: mandateInfo.assemblyDate,
      endDate: end.toISOString().split('T')[0],
      totalDays,
      daysElapsed,
      daysRemaining,
      percent,
      isExpired,
      isNearRenewal
    };
  }, [mandateInfo]);

  // Miembros del Comité Vigente
  const committeeMembers = useMemo(() => {
    return (currentCommunity?.units || [])
      .filter(u => u.isCommittee)
      .map(u => {
        const fin = getUnitFinancials ? getUnitFinancials(u) : { pendingDebt: 0, previousDebt: 0 };
        const isUpToDate = (fin.pendingDebt || 0) <= 0 && (fin.previousDebt || 0) <= 0;
        return {
          unitId: u.id,
          unitNumber: u.number,
          tower: u.tower,
          name: u.owner || u.ownerName || 'Copropietario',
          rut: u.rut || u.ownerRut || '',
          phone: u.phone || u.ownerPhone || '',
          email: u.email || u.ownerEmail || '',
          role: u.committeeRole || 'Miembro del Comité',
          isUpToDate,
          pendingDebt: fin.pendingDebt || 0
        };
      });
  }, [currentCommunity, getUnitFinancials]);

  // Contadores KPIs
  const pendingTasksCount = tasks.filter(t => t.status !== 'CUMPLIDA').length;
  const urgentTasksCount = tasks.filter(t => t.status !== 'CUMPLIDA' && t.priority === 'URGENTE').length;
  const activeNovedadesCount = novedades.filter(n => n.status !== 'RESUELTO').length;

  // Filtrado de Novedades
  const filteredNovedades = useMemo(() => {
    return novedades.filter(n => {
      if (novedadFilterCategory !== 'ALL' && n.category !== novedadFilterCategory) return false;
      if (novedadFilterPriority !== 'ALL' && n.priority !== novedadFilterPriority) return false;
      if (novedadSearchQuery.trim()) {
        const q = novedadSearchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [novedades, novedadFilterCategory, novedadFilterPriority, novedadSearchQuery]);

  // Filtrado de Tareas
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (taskFilterStatus === 'PENDIENTES' && t.status === 'CUMPLIDA') return false;
      if (taskFilterStatus === 'CUMPLIDAS' && t.status !== 'CUMPLIDA') return false;
      return true;
    });
  }, [tasks, taskFilterStatus]);

  // --- Función de Impresión Oficial del Acta de Reunión de Comité ---
  const handlePrintCommitteeMinute = (minute) => {
    if (!minute) return;

    const brandName = companySettings?.brandName || 'ARANPRO';
    const primaryColor = companySettings?.colors?.primary || '#0F3D2E';
    const accentGold = companySettings?.colors?.accent || '#D4B895';
    const subtitle = companySettings?.subtitle || 'Gestión Integral de Condominios y Comunidades';
    const communityName = currentCommunity?.name || 'Condominio';
    const currentYear = new Date().getFullYear();

    const attendeesHtml = (minute.attendees || []).map(att => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 7px 10px; font-weight: bold; color: #1E293B;">${att.name}</td>
        <td style="padding: 7px 10px; color: ${primaryColor}; font-weight: 600;">${att.role}</td>
        <td style="padding: 7px 10px; color: #475569;">${att.unit || 'Casa'}</td>
        <td style="padding: 7px 10px; font-family: monospace; color: #334155;">${att.rut ? formatRut(att.rut) : '—'}</td>
        <td style="padding: 7px 10px; text-align: center;">
          <span style="background: #ECFDF5; color: #065F46; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; border: 1px solid #A7F3D0;">
            ${att.status || 'PRESENTE'}
          </span>
        </td>
      </tr>
    `).join('');

    const topicsHtml = (minute.agendaTopics || []).map((t, idx) => `
      <div style="margin-bottom: 8px; padding-left: 12px; border-left: 3px solid ${accentGold}; font-size: 11.5px; color: #334155; line-height: 1.45;">
        ${t}
      </div>
    `).join('');

    const agreementsHtml = (minute.agreements || []).map((agr, idx) => `
      <div style="margin-bottom: 10px; padding: 8px 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px;">
        <div style="font-weight: bold; color: ${primaryColor}; font-size: 11px; margin-bottom: 3px;">
          Acuerdo N° ${idx + 1}
        </div>
        <div style="font-size: 11.5px; color: #1E293B; line-height: 1.45;">
          ${agr}
        </div>
      </div>
    `).join('');

    const tasksHtml = (minute.tasks || []).map(task => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 7px 10px; font-weight: 600; color: #1E293B;">${task.title}</td>
        <td style="padding: 7px 10px; color: #475569;">${task.assignee}</td>
        <td style="padding: 7px 10px; color: #1E293B; font-weight: bold;">${task.dueDate ? formatDate(task.dueDate) : '—'}</td>
        <td style="padding: 7px 10px; text-align: center;">
          <span style="background: ${task.status === 'CUMPLIDA' ? '#ECFDF5' : '#FEF3C7'}; color: ${task.status === 'CUMPLIDA' ? '#065F46' : '#92400E'}; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;">
            ${task.status}
          </span>
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Acta_Sesion_Comite_${minute.folio || 'FOLIO'}_${communityName.replace(/\s+/g, '_')}_${minute.date}.pdf</title>
        <style>
          @page { size: letter; margin: 15mm 15mm 15mm 15mm; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
          .header-table { width: 100%; border-bottom: 2.5px solid ${primaryColor}; padding-bottom: 12px; margin-bottom: 14px; }
          .brand-title { font-size: 20px; font-weight: 900; color: ${primaryColor}; letter-spacing: -0.5px; margin: 0; }
          .brand-sub { font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
          .doc-badge { background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 8px 12px; text-align: right; }
          .kpi-row { display: table; width: 100%; table-layout: fixed; margin-bottom: 16px; border-spacing: 6px; }
          .kpi-cell { display: table-cell; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 10px; vertical-align: middle; }
          .kpi-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px; }
          .kpi-value { font-size: 13px; font-weight: 900; color: ${primaryColor}; margin-top: 2px; }
          .section-title { font-size: 11.5px; font-weight: 900; text-transform: uppercase; color: ${primaryColor}; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px; letter-spacing: 0.3px; display: flex; align-items: center; }
          table.data-table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 12px; }
          table.data-table th { background: #F1F5F9; color: #334155; font-size: 9.5px; font-weight: 800; text-transform: uppercase; padding: 6px 10px; border-bottom: 1.5px solid #CBD5E1; text-align: left; }
          .signatures-table { width: 100%; margin-top: 35px; page-break-inside: avoid; }
          .sig-box { width: 33%; text-align: center; vertical-align: top; padding: 0 10px; }
          .sig-line { border-top: 1.5px solid #334155; margin-bottom: 5px; margin-top: 40px; }
          .footer-note { margin-top: 25px; padding-top: 8px; border-top: 1px dashed #CBD5E1; font-size: 8.5px; color: #64748B; text-align: justify; line-height: 1.35; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="vertical-align: middle;">
              <h1 class="brand-title">${brandName}</h1>
              <div class="brand-sub">${subtitle}</div>
              <div style="font-size: 11px; font-weight: bold; color: ${primaryColor}; margin-top: 4px;">
                Condominio: ${communityName}
              </div>
            </td>
            <td style="vertical-align: middle; text-align: right;">
              <div class="doc-badge">
                <div style="font-size: 9px; font-weight: 800; color: #64748B; text-transform: uppercase;">Libro Oficial de Reuniones</div>
                <div style="font-size: 14px; font-weight: 900; color: ${primaryColor};">${minute.folio}</div>
                <div style="font-size: 9.5px; color: #334155; font-weight: 600; margin-top: 2px;">
                  Ley N° 21.442 • Arts. 17° y 20°
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- 4 KPIS SUPERIORES -->
        <div class="kpi-row">
          <div class="kpi-cell">
            <div class="kpi-label">Fecha y Hora</div>
            <div class="kpi-value">${formatDate(minute.date)} • ${minute.time}</div>
          </div>
          <div class="kpi-cell">
            <div class="kpi-label">Tipo de Sesión</div>
            <div class="kpi-value" style="font-size: 11px;">${minute.type}</div>
          </div>
          <div class="kpi-cell">
            <div class="kpi-label">Modalidad & Lugar</div>
            <div class="kpi-value" style="font-size: 10.5px;">${minute.modality}</div>
          </div>
          <div class="kpi-cell">
            <div class="kpi-label">Asistencia del Comité</div>
            <div class="kpi-value">${(minute.attendees || []).length} Integrantes</div>
          </div>
        </div>

        <!-- ASISTENTES -->
        <div class="section-title">1. Asistentes a la Sesión (Comité & Administración)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Cargo / Representación</th>
              <th>Vivienda</th>
              <th>RUT</th>
              <th style="text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${attendeesHtml}
          </tbody>
        </table>

        <!-- TABLA DE TEMAS TRATADOS -->
        <div class="section-title">2. Tabla de Temas Tratados en la Sesión</div>
        <div style="margin-bottom: 12px;">
          ${topicsHtml}
        </div>

        <!-- ACUERDOS ADOPTADOS -->
        <div class="section-title">3. Acuerdos y Resoluciones Aprobadas por el Comité (Art. 17°)</div>
        <div style="margin-bottom: 12px;">
          ${agreementsHtml}
        </div>

        <!-- COMPROMISOS Y TAREAS -->
        ${(minute.tasks && minute.tasks.length > 0) ? `
          <div class="section-title">4. Compromisos y Tareas Asignadas (Plan de Acción)</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Tarea / Compromiso</th>
                <th>Responsable</th>
                <th>Fecha Límite</th>
                <th style="text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${tasksHtml}
            </tbody>
          </table>
        ` : ''}

        <!-- CONSTANCIA Y FIRMAS -->
        <div style="margin-top: 14px; font-size: 10px; color: #475569; font-style: italic;">
          ${minute.notes || 'Habiéndose tratado todos los puntos de la tabla y no habiendo más materias que abordar, se levanta la sesión extendiéndose la presente acta debidamente foliada en el Libro Oficial de Actas del Comité de Administración.'}
        </div>

        <table class="signatures-table">
          <tr>
            <td class="sig-box">
              <div class="sig-line"></div>
              <div style="font-weight: bold; color: #0F172A; font-size: 10.5px;">${minute.presidentName || 'Carlos Morales Rojas'}</div>
              <div style="color: #64748B; font-size: 9px; font-weight: 600;">Presidente del Comité</div>
              <div style="font-family: monospace; font-size: 8.5px; color: #64748B;">RUT: ${minute.presidentRut ? formatRut(minute.presidentRut) : '—'}</div>
            </td>
            <td class="sig-box">
              <div class="sig-line"></div>
              <div style="font-weight: bold; color: #0F172A; font-size: 10.5px;">${minute.secretaryName || 'Marcela Castillo Gómez'}</div>
              <div style="color: #64748B; font-size: 9px; font-weight: 600;">Secretaria / Tesorera</div>
              <div style="font-family: monospace; font-size: 8.5px; color: #64748B;">RUT: ${minute.secretaryRut ? formatRut(minute.secretaryRut) : '—'}</div>
            </td>
            <td class="sig-box">
              <div class="sig-line"></div>
              <div style="font-weight: bold; color: #0F172A; font-size: 10.5px;">${minute.adminName || 'Administración ARANPRO'}</div>
              <div style="color: #64748B; font-size: 9px; font-weight: 600;">Administrador Titular (RNAC)</div>
              <div style="font-family: monospace; font-size: 8.5px; color: #64748B;">RUT: ${minute.adminRut ? formatRut(minute.adminRut) : '76.999.888-1'}</div>
            </td>
          </tr>
        </table>

        <div class="footer-note">
          <strong>FUNDAMENTO LEGAL LEY N° 21.442 SOBRE COPROPIEDAD INMOBILIARIA:</strong> De conformidad a los Artículos 17° y 20° de la Ley N° 21.442, los acuerdos adoptados por el Comité de Administración en el ejercicio de sus facultades legales y reglamentarias son obligatorios para todos los copropietarios y residentes. Este documento constituye copia fiel del Acta Oficial de Reunión de Comité, debidamente registrada y foliada en los sistemas de la Administración ${brandName}.
        </div>
      </body>
      </html>
    `;

    const dynamicTitle = `Acta_Sesion_Comite_${minute.folio || 'FOLIO'}_${communityName.replace(/\s+/g, '_')}_${minute.date}.pdf`;
    printDocumentDirectly(htmlContent, dynamicTitle);
  };

  // --- Función de Copiar Resumen para WhatsApp del Comité ---
  const handleCopyWhatsAppSummary = () => {
    const communityName = currentCommunity?.name || 'Condominio';
    const activeTasks = tasks.filter(t => t.status !== 'CUMPLIDA');

    let text = `📋 *RESUMEN DE GESTIÓN & NOVEDADES CON EL COMITÉ*\n`;
    text += `🏢 *${communityName.toUpperCase()}*\n`;
    text += `📅 _Fecha: ${formatDate(new Date().toISOString().split('T')[0])}_\n`;
    text += `⚖️ _Administración ARANPRO • Gestión Integral_\n\n`;

    text += `🔔 *NOVEDADES RECIENTES:*\n`;
    novedades.slice(0, 4).forEach((n) => {
      const icon = n.priority === 'URGENTE' ? '🚨' : n.priority === 'ALTA' ? '⚠️' : 'ℹ️';
      text += `${icon} *${n.title}* (${formatDate(n.date)})\n   _${n.description}_\n\n`;
    });

    text += `⏳ *COMPROMISOS & TAREAS EN CURSO (${activeTasks.length}):*\n`;
    activeTasks.slice(0, 4).forEach(t => {
      text += `▫️ *${t.title}* | Asignado: ${t.assignee} | Vence: ${t.dueDate ? formatDate(t.dueDate) : 'Pronto'}\n`;
    });

    if (meetings.length > 0) {
      text += `\n📖 *ÚLTIMA SESIÓN OFICIAL:*\n`;
      text += `Folio ${meetings[0].folio} (${formatDate(meetings[0].date)}) - ${meetings[0].agreements.length} acuerdos registrados en el Libro Oficial.\n`;
    }

    text += `\n_Para revisar las actas completas y bitácora ingrese al Portal de Administración ARANPRO._`;

    navigator.clipboard.writeText(text);
    setWhatsAppNovedadesCopied(true);
    setTimeout(() => setWhatsAppNovedadesCopied(false), 3000);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Plantillas pre-redactadas para Circulares del Comité
  const circularTemplates = {
    mascotas: {
      folio: 'CIRCULAR-COM-2026-04',
      title: 'Regulación de Tenencia Responsable de Mascotas en Espacios Comunes',
      category: 'Convivencia & Tenencia Responsable',
      legalCitation: 'Ley N° 21.020 ("Ley Cholito") y Arts. 17° y 36° Ley N° 21.442',
      body: `Estimada comunidad:\n\nSe recuerda a todos los copropietarios y arrendatarios que la tenencia de mascotas en el condominio exige estricta responsabilidad conforme a la ley y al Reglamento de Copropiedad:\n\n1. Toda mascota debe transitar obligatoriamente con correa y bajo supervisión de un adulto en pasajes y áreas de juegos infantiles.\n2. Es deber inexcusable el recojo inmediato de deposiciones mediante bolsa higiénica desechable.\n3. Queda prohibido permitir que animales deambulen sueltos o generen ruidos molestos reiterados en horarios de descanso.\n\nLas infracciones serán sancionadas con multas reglamentarias de 1 a 3 UF imputables directamente a la colilla de gastos comunes.\n\nAgradecemos su colaboración activa para una convivencia armónica y segura.`
    },
    ruidos: {
      folio: 'CIRCULAR-COM-2026-05',
      title: 'Normas de Convivencia y Horarios de Descanso Obligatorio',
      category: 'Seguridad & Convivencia',
      legalCitation: 'Arts. 17° y 20° Ley N° 21.442 y Ordenanza Municipal de Ruidos Molestos',
      body: `Estimados vecinos y residentes:\n\nCon el objeto de resguardar el descanso, la salud y la tranquilidad de todas las familias de la comunidad, se recuerdan las normas de convivencia:\n\n1. Horario de Silencio: De Domingo a Jueves desde las 22:00 hrs. Viernes, Sábados y vísperas de festivos desde las 00:00 hrs.\n2. Obras ruidosas, taladros y reparaciones: Permitidas exclusivamente de Lunes a Viernes de 09:00 a 18:00 hrs y Sábados de 09:00 a 14:00 hrs.\n3. Fiestas y reuniones sociales deben mantener un volumen moderado sin perturbar el descanso vecinal.\n\nConserjería y la Administración están facultadas para cursar partes e infracciones de acuerdo al Reglamento de Copropiedad.`
    },
    estacionamientos: {
      folio: 'CIRCULAR-COM-2026-06',
      title: 'Uso Correcto de Estacionamientos de Visitas y Vías de Circulación',
      category: 'Tránsito y Espacios Comunes',
      legalCitation: 'Art. 17° Ley N° 21.442 y Ley de Tránsito N° 18.290',
      body: `Estimados copropietarios y residentes:\n\nSe instruye a la comunidad respecto al correcto uso de estacionamientos de visitas y calzadas:\n\n1. Los estacionamientos de visitas son de uso exclusivo y temporal para invitados (máximo 4 horas continuas sin pernoctar salvo aviso fundado a conserjería).\n2. Queda estrictamente prohibido estacionar sobre veredas, frente a grifos de incendio o bloqueando portones de acceso.\n3. La velocidad máxima de circulación al interior del recinto es de 20 km/h.\n\nVehículos en infracción reiterada serán bloqueados con trabaruedas o derivados al juzgado de policía local.`
    },
    obras: {
      folio: 'CIRCULAR-COM-2026-07',
      title: 'Protocolo de Obras Menores, Remodelaciones y Mudanzas',
      category: 'Mantención & Seguridad',
      legalCitation: 'Arts. 17° y 20° Ley N° 21.442',
      body: `Estimada comunidad:\n\nTodo copropietario o arrendatario que planifique realizar mudanzas o trabajos de remodelación interior deberá cumplir con el siguiente protocolo:\n\n1. Notificar por escrito a la Administración con al menos 48 horas de anticipación.\n2. Horario autorizado de mudanzas: Lunes a Sábado de 09:00 a 18:00 hrs.\n3. Retiro de escombros: Es obligación del copropietario retirar sus propios escombros; queda estrictamente prohibido depositarlos en los contenedores de basura doméstica.\n4. El copropietario responderá solidariamente por cualquier daño causado a pasajes, luminarias o portones.`
    },
    personalizada: {
      folio: 'CIRCULAR-COM-2026-08',
      title: 'Comunicado Extraordinario del Comité de Administración',
      category: 'Administrativo General',
      legalCitation: 'Art. 17° Ley N° 21.442',
      body: `Estimada comunidad:\n\nPor medio de la presente, el Comité de Administración informa a los señores copropietarios lo siguiente:\n\n[Escriba aquí el detalle del comunicado oficial...]`
    }
  };

  const handleApplyCircularTemplate = (tmplKey) => {
    setCircularTemplate(tmplKey);
    const tmpl = circularTemplates[tmplKey];
    if (tmpl) {
      setCircularForm(prev => ({
        ...prev,
        folio: tmpl.folio,
        title: tmpl.title,
        category: tmpl.category,
        legalCitation: tmpl.legalCitation,
        body: tmpl.body
      }));
    }
  };

  // Imprimir Circular Oficial del Comité (PDF)
  const handlePrintCircular = () => {
    if (!currentCommunity) return;
    const brandName = companySettings?.brandName || 'ARANPRO';
    const primaryColor = companySettings?.colors?.primary || '#0F3D2E';
    const accentGold = companySettings?.colors?.accent || '#D4B895';
    const communityName = currentCommunity?.name || 'Condominio';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Circular_Comite_${circularForm.folio}_${communityName.replace(/\s+/g, '_')}.pdf</title>
        <style>
          @page { size: letter; margin: 15mm 15mm 15mm 15mm; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0F172A; margin: 0; padding: 0; font-size: 11.5px; line-height: 1.5; }
          .header-table { width: 100%; border-bottom: 2.5px solid ${primaryColor}; padding-bottom: 12px; margin-bottom: 16px; }
          .brand-title { font-size: 20px; font-weight: 900; color: ${primaryColor}; margin: 0; }
          .doc-badge { background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 8px 12px; text-align: right; }
          .title-box { background: #F8FAFC; border-left: 4px solid ${accentGold}; padding: 12px 14px; margin-bottom: 18px; border-radius: 4px; }
          .body-text { white-space: pre-wrap; font-size: 12px; color: #1E293B; line-height: 1.6; margin-bottom: 30px; text-align: justify; }
          .signatures-table { width: 100%; margin-top: 45px; page-break-inside: avoid; }
          .sig-box { width: 50%; text-align: center; vertical-align: top; padding: 0 25px; }
          .sig-line { border-top: 1.5px solid #334155; margin-bottom: 6px; margin-top: 45px; }
          .legal-footer { margin-top: 40px; padding-top: 10px; border-top: 1px dashed #CBD5E1; font-size: 9px; color: #64748B; text-align: justify; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="vertical-align: middle;">
              <h1 class="brand-title">${brandName}</h1>
              <div style="font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase;">Gestión Integral de Condominios y Comunidades</div>
              <div style="font-size: 11px; font-weight: bold; color: ${primaryColor}; margin-top: 4px;">
                ${communityName}
              </div>
            </td>
            <td style="vertical-align: middle; text-align: right;">
              <div class="doc-badge">
                <div style="font-size: 9px; font-weight: 800; color: #64748B; text-transform: uppercase;">Circular Oficial del Comité</div>
                <div style="font-size: 14px; font-weight: 900; color: ${primaryColor};">${circularForm.folio}</div>
                <div style="font-size: 9.5px; color: #334155; font-weight: 600; margin-top: 2px;">
                  Fecha: ${formatDate(circularForm.date)}
                </div>
              </div>
            </td>
          </tr>
        </table>

        <div class="title-box">
          <div style="font-size: 10px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px;">
            ${circularForm.category} • ${circularForm.legalCitation}
          </div>
          <h2 style="font-size: 15px; font-weight: 900; color: #0F172A; margin: 4px 0 0 0;">
            ${circularForm.title}
          </h2>
        </div>

        <div class="body-text">${circularForm.body}</div>

        <table class="signatures-table">
          <tr>
            <td class="sig-box">
              <div class="sig-line"></div>
              <div style="font-weight: bold; color: #0F172A; font-size: 11px;">Comité de Administración</div>
              <div style="color: #64748B; font-size: 9.5px;">${circularForm.committeeSigners}</div>
              <div style="font-size: 8.5px; color: #64748B;">Ley N° 21.442 • Art. 17°</div>
            </td>
            <td class="sig-box">
              <div class="sig-line"></div>
              <div style="font-weight: bold; color: #0F172A; font-size: 11px;">Administración ${brandName}</div>
              <div style="color: #64748B; font-size: 9.5px;">Administrador Titular (RNAC N° 48.912)</div>
              <div style="font-size: 8.5px; color: #64748B;">Ejecución y Custodia Legal</div>
            </td>
          </tr>
        </table>

        <div class="legal-footer">
          <strong>Art. 17° N° 1 Ley N° 21.442:</strong> Las circulares e instrucciones dictadas por el Comité de Administración en el ejercicio de sus facultades de resguardo y convivencia forman parte integrante de la normativa del condominio y son de obligatorio cumplimiento para todos los copropietarios, arrendatarios y residentes.
        </div>
      </body>
      </html>
    `;

    printDocumentDirectly(htmlContent, `Circular_Comite_${circularForm.folio}_${communityName.replace(/\s+/g, '_')}.pdf`);
  };

  // Publicar Circular al Mural de Avisos de la Comunidad
  const handlePublishCircularToMural = () => {
    if (!currentCommunity) return;
    addAnnouncement(currentCommunity.id, {
      title: `${circularForm.folio}: ${circularForm.title}`,
      content: `${circularForm.legalCitation}\n\n${circularForm.body}\n\n_Comité de Administración & Administración ARANPRO_`,
      priority: 'Importante'
    });
    setCircularPublishedFeedback(true);
    setTimeout(() => setCircularPublishedFeedback(false), 3500);
  };

  // Compartir Circular por WhatsApp a la Comunidad
  const handleShareCircularWhatsApp = () => {
    if (!currentCommunity) return;
    const communityName = currentCommunity?.name || 'Condominio';
    const text = 
`📢 *CIRCULAR OFICIAL DEL COMITÉ DE ADMINISTRACIÓN*
🏢 *${communityName.toUpperCase()}*
📜 *${circularForm.folio}* • _${formatDate(circularForm.date)}_

📌 *${circularForm.title.toUpperCase()}*
⚖️ _${circularForm.legalCitation}_

${circularForm.body}

_Comité de Administración & Administración ARANPRO_`;

    navigator.clipboard.writeText(text);
    setCircularCopiedFeedback(true);
    setTimeout(() => setCircularCopiedFeedback(false), 3000);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Imprimir Oficio de Suspensión Eléctrica a la Empresa Distribuidora (PDF)
  const handlePrintPowerCutOficio = () => {
    if (!currentCommunity) return;
    const selectedUnit = (currentCommunity.units || []).find(u => u.id === powerCutForm.unitId) || currentCommunity.units?.[0];
    if (!selectedUnit) return;
    const fin = getUnitFinancials ? getUnitFinancials(selectedUnit) : { totalToPay: 0, pendingDebt: 0, currentCharge: 42500 };
    const monthsDue = Math.max(1, Math.round((fin.totalToPay || fin.pendingDebt || 0) / (selectedUnit.currentCharge || 42500)));
    const brandName = companySettings?.brandName || 'ARANPRO';
    const primaryColor = companySettings?.colors?.primary || '#0F3D2E';
    const communityName = currentCommunity?.name || 'Condominio';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Oficio_Suspension_Electrica_Art27_Casa_${selectedUnit.number}_${communityName.replace(/\s+/g, '_')}.pdf</title>
        <style>
          @page { size: letter; margin: 15mm 15mm 15mm 15mm; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0F172A; margin: 0; padding: 0; font-size: 11px; line-height: 1.45; }
          .header-table { width: 100%; border-bottom: 2.5px solid #991B1B; padding-bottom: 10px; margin-bottom: 14px; }
          .brand-title { font-size: 18px; font-weight: 900; color: ${primaryColor}; margin: 0; }
          .doc-badge { background: #FEF2F2; border: 1.5px solid #F87171; border-radius: 8px; padding: 6px 12px; text-align: right; }
          .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10.5px; }
          .data-table td { padding: 6px 10px; border: 1px solid #CBD5E1; }
          .data-table td.header { background: #F8FAFC; font-weight: bold; width: 35%; color: #334155; }
          .legal-box { background: #FEF2F2; border: 1px solid #FCA5A5; border-left: 4px solid #DC2626; padding: 10px 12px; margin: 14px 0; border-radius: 4px; }
          .signatures-table { width: 100%; margin-top: 30px; page-break-inside: avoid; }
          .sig-box { width: 33.33%; text-align: center; vertical-align: top; padding: 0 10px; font-size: 9.5px; }
          .sig-line { border-top: 1.5px solid #334155; margin-bottom: 6px; margin-top: 35px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <h1 class="brand-title">${brandName}</h1>
              <div style="font-size: 9.5px; color: #64748B; font-weight: 600; text-transform: uppercase;">Administración y Gestión Inmobiliaria Integral</div>
              <div style="font-size: 11px; font-weight: bold; color: ${primaryColor}; margin-top: 2px;">
                Condominio: ${communityName}
              </div>
            </td>
            <td style="text-align: right;">
              <div class="doc-badge">
                <div style="font-size: 9px; font-weight: 800; color: #991B1B; text-transform: uppercase;">Procedimiento Especial Ley N° 21.442</div>
                <div style="font-size: 13px; font-weight: 900; color: #991B1B;">${powerCutForm.resolutionFolio}</div>
                <div style="font-size: 9px; color: #64748B; margin-top: 2px;">Fecha: ${formatDate(new Date().toISOString().slice(0, 10))}</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="font-size: 11px; line-height: 1.5; margin-bottom: 12px;">
          <strong>SEÑORES:</strong><br/>
          GERENCIA COMERCIAL & OPERACIONES DE DISTRIBUCIÓN<br/>
          <strong>${powerCutForm.company.toUpperCase()}</strong><br/>
          <u>PRESENTE</u>
        </div>

        <div style="background: #F1F5F9; padding: 8px 12px; border-left: 4px solid #991B1B; font-weight: 900; font-size: 11px; color: #0F172A; margin-bottom: 14px;">
          MATERIA: SOLICITUD FORMAL DE SUSPENSIÓN DE SUMINISTRO ELÉCTRICO POR MOROSIDAD SUPERIOR A TRES CUOTAS (ARTÍCULOS 20° Y 27° LEY N° 21.442 DE COPROPIEDAD INMOBILIARIA).
        </div>

        <div style="text-align: justify; margin-bottom: 10px;">
          De nuestra consideración:
          <br/><br/>
          Por medio de la presente, la Administración del Condominio <strong>${communityName}</strong>, con el acuerdo expreso y fundado del <strong>Comité de Administración</strong> adoptado en sesión de fecha reciente de conformidad a los Artículos 17°, 20° y 27° de la Ley N° 21.442 sobre Copropiedad Inmobiliaria, viene en solicitar a vuestra empresa concesionaria de distribución eléctrica proceder a la <strong>suspensión material del suministro eléctrico</strong> del inmueble que a continuación se individualiza:
        </div>

        <table class="data-table">
          <tr>
            <td class="header">Condominio / Comunidad:</td>
            <td><strong>${communityName}</strong> (RUT: ${currentCommunity.rut || '76.888.999-K'})</td>
          </tr>
          <tr>
            <td class="header">Dirección del Inmueble:</td>
            <td>${currentCommunity.address || 'Camino San Ramón 4500'}, ${currentCommunity.city || 'La Serena'}</td>
          </tr>
          <tr>
            <td class="header">Unidad Afectada:</td>
            <td><strong>Casa N° ${selectedUnit.number}</strong></td>
          </tr>
          <tr>
            <td class="header">Copropietario / Ocupante:</td>
            <td>${selectedUnit.owner} (RUT: ${selectedUnit.rut ? formatRut(selectedUnit.rut) : '—'})</td>
          </tr>
          <tr>
            <td class="header">N° Cliente / Suministro Distribuidora:</td>
            <td><strong style="color: #991B1B;">${powerCutForm.clientNumber}</strong></td>
          </tr>
          <tr>
            <td class="header">N° de Medidor Eléctrico:</td>
            <td><strong style="font-family: monospace;">${powerCutForm.meterNumber}</strong></td>
          </tr>
          <tr>
            <td class="header">Monto Total de Deuda Devengada:</td>
            <td><strong style="color: #991B1B;">${formatCLP(fin.totalToPay)}</strong> (Correspondiente a ${monthsDue} meses impagos)</td>
          </tr>
        </table>

        <div class="legal-box" style="font-size: 10px; text-align: justify;">
          <strong>FUNDAMENTO LEGAL Y RESOLUCIÓN DEL COMITÉ:</strong><br/>
          1. El <strong>Artículo 27° de la Ley N° 21.442</strong> prescribe: <em>"Si un copropietario incurriere en mora en el pago de tres o más cuotas, continuas o discontinuas, de los gastos comunes, el administrador, con la autorización del comité de administración, podrá solicitar a las empresas que proporcionan servicios de energía eléctrica, agua potable o telecomunicaciones, la suspensión de los servicios respectivos."</em><br/>
          2. Consta en los registros de la administración que el copropietario fue debidamente notificado otorgándole plazo legal de ${powerCutForm.warningDays} días hábiles para regularizar o repactar su deuda, sin que se haya obtenido pago ni allanamiento.<br/>
          3. <em>Resolución del Comité:</em> "${powerCutForm.notes}".
        </div>

        <div style="margin-top: 10px; font-size: 10.5px;">
          En virtud de lo expuesto, solicitamos ejecutar la orden de corte a la brevedad conforme a los protocolos establecidos por la Superintendencia de Electricidad y Combustibles (SEC).
        </div>

        <table class="signatures-table">
          <tr>
            <td class="sig-box">
              <div class="sig-line"></div>
              <strong>Administración ${brandName}</strong><br/>
              <span>Administrador Titular (RNAC N° 48.912)</span>
            </td>
            <td class="sig-box">
              <div class="sig-line"></div>
              <strong>Carlos Morales Rojas</strong><br/>
              <span>Presidente Comité (Casa 1)</span>
            </td>
            <td class="sig-box">
              <div class="sig-line"></div>
              <strong>Marcela Castillo Gómez</strong><br/>
              <span>Tesorera Comité (Casa 4)</span>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    printDocumentDirectly(htmlContent, `Oficio_Suspension_Electrica_Art27_Casa_${selectedUnit.number}_${communityName.replace(/\s+/g, '_')}.pdf`);
  };

  // Enviar advertencia previa de corte eléctrico por WhatsApp al vecino
  const handleSendPowerCutWhatsAppWarning = () => {
    if (!currentCommunity) return;
    const selectedUnit = (currentCommunity.units || []).find(u => u.id === powerCutForm.unitId) || currentCommunity.units?.[0];
    if (!selectedUnit) return;
    const fin = getUnitFinancials ? getUnitFinancials(selectedUnit) : { totalToPay: 0, pendingDebt: 0, currentCharge: 42500 };
    const monthsDue = Math.max(1, Math.round((fin.totalToPay || fin.pendingDebt || 0) / (selectedUnit.currentCharge || 42500)));
    const communityName = currentCommunity?.name || 'Condominio';

    const text = 
`⚡ *ADVERTENCIA FORMAL PREVIA DE SUSPENSIÓN ELÉCTRICA — ${communityName.toUpperCase()}*

Estimado(a) *${selectedUnit.owner}* (Casa N° ${selectedUnit.number}):
Por encargo formal del Comité de Administración, le notificamos que su unidad registra una morosidad de *${formatCLP(fin.totalToPay)}* correspondiente a *${monthsDue} meses impagos* de gastos comunes.

⚖️ *RESOLUCIÓN DEL COMITÉ DE ADMINISTRACIÓN (ART. 27° LEY N° 21.442):*
El Comité de Administración, conforme a las atribuciones conferidas por la Ley de Copropiedad Inmobiliaria, ha acordado solicitar a la empresa distribuidora (*${powerCutForm.company}*) la **suspensión del suministro eléctrico** del inmueble.

⏳ *PLAZO FINAL DE REGULARIZACIÓN:*
Dispone de un plazo perentorio de *${powerCutForm.warningDays} días hábiles* para transferir su saldo o formalizar un convenio de pago en cuotas con la Administración.

📲 Contáctenos a la brevedad para regularizar su situación y evitar el corte del suministro y los costos de reconexión.
_Comité de Administración & Administración ARANPRO_`;

    navigator.clipboard.writeText(text);
    setPowerCutCopiedFeedback(true);
    setTimeout(() => setPowerCutCopiedFeedback(false), 3500);

    const cleanPhone = (selectedUnit.phone || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length >= 8 ? `phone=${cleanPhone.startsWith('56') ? cleanPhone : '56' + cleanPhone}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(text)}`, '_blank');
  };

  // Compartir Acta Oficial por WhatsApp
  const handleShareMeetingWhatsApp = (m) => {
    if (!m) return;
    const communityName = currentCommunity?.name || 'Condominio';
    let text = `📖 *ACTA OFICIAL DE SESIÓN DE COMITÉ — ${communityName.toUpperCase()}*\n`;
    text += `📜 *Folio:* ${m.folio} • *Fecha:* ${formatDate(m.date)} (${m.time})\n`;
    text += `🏛️ *Tipo:* ${m.type} • *Modalidad:* ${m.modality}\n\n`;
    text += `✅ *ACUERDOS ADOPTADOS (Art. 17° Ley N° 21.442):*\n`;
    (m.agreements || []).forEach((agr, i) => {
      text += `${i + 1}. ${agr}\n`;
    });
    if (m.tasks && m.tasks.length > 0) {
      text += `\n⏳ *COMPROMISOS DERIVADOS:*\n`;
      m.tasks.forEach(t => {
        text += `• ${t.title} (Resp: ${t.assignee} - Vence: ${t.dueDate ? formatDate(t.dueDate) : 'Pronto'})\n`;
      });
    }
    text += `\n_Documento oficial foliado en el Libro de Actas de Administración ARANPRO._`;
    navigator.clipboard.writeText(text);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Compartir Novedad Individual por WhatsApp
  const handleShareNovedadWhatsApp = (n) => {
    if (!n) return;
    const communityName = currentCommunity?.name || 'Condominio';
    const icon = n.priority === 'URGENTE' ? '🚨' : n.priority === 'ALTA' ? '⚠️' : 'ℹ️';
    let text = `${icon} *NOVEDAD DEL COMITÉ — ${communityName.toUpperCase()}*\n`;
    text += `📌 *${n.title}*\n`;
    text += `📅 *Fecha:* ${formatDate(n.date)} (${n.time}) • *Categoría:* ${n.category}\n`;
    text += `⚖️ *Prioridad:* ${n.priority} • *Estado:* ${n.status}\n\n`;
    text += `📝 *Detalle:* ${n.description}\n`;
    text += `\n_Reportado por: ${n.reportedBy} • Administración ARANPRO_`;
    navigator.clipboard.writeText(text);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Guardar Nueva Reunión
  const handleCreateMeeting = (e) => {
    e.preventDefault();
    if (!newMeetingForm.date || newMeetingForm.agendaTopics.length === 0) return;

    const attendeesList = [
      { name: newMeetingForm.presidentName, role: 'Presidente del Comité', unit: 'Casa 1', rut: newMeetingForm.presidentRut, status: 'PRESENTE' },
      { name: newMeetingForm.secretaryName, role: 'Secretaria / Tesorera', unit: 'Casa 4', rut: newMeetingForm.secretaryRut, status: 'PRESENTE' },
      { name: 'Claudia Herrera Soto', role: 'Vocal Comité', unit: 'Casa 7', rut: '14.225.890-3', status: 'PRESENTE' },
      { name: 'Administración ARANPRO', role: 'Administrador Titular (RNAC N° 48.912)', unit: 'Administración', rut: '76.999.888-1', status: 'PRESENTE' }
    ];

    addCommitteeMeeting(currentCommunity.id, {
      ...newMeetingForm,
      attendees: attendeesList
    });

    setShowNewMeetingModal(false);
  };

  // Guardar Nueva Novedad
  const handleCreateNovedad = (e) => {
    e.preventDefault();
    if (!newNovedadForm.title || !newNovedadForm.description) return;

    addCommitteeNovedad(currentCommunity.id, newNovedadForm);
    setShowNewNovedadModal(false);
    setNewNovedadForm({
      title: '',
      category: 'Mantención & Accesos',
      priority: 'ALTA',
      reportedBy: 'Administración ARANPRO',
      description: '',
      elevatedToMeeting: false
    });
  };

  // Guardar Nueva Tarea Independiente
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskStandalone.title) return;

    addCommitteeTask(currentCommunity.id, newTaskStandalone);
    setShowNewTaskModal(false);
    setNewTaskStandalone({
      title: '',
      assignee: 'Administración ARANPRO',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'MEDIA',
      notes: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. BARRA SUPERIOR EJECUTIVA DEL COMITÉ DE ADMINISTRACIÓN */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs w-full">
        <div className="flex items-start sm:items-center space-x-3 min-w-0">
          <div className="p-2.5 bg-gradient-to-br from-[#0F3D2E] to-[#14533d] text-white rounded-2xl shadow-xs shrink-0">
            <ClipboardList className="w-5 h-5 text-[#D4B895]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Comité de Administración: Reuniones & Novedades
              </h3>
              <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full border border-[#0F3D2E]/20 uppercase shrink-0">
                Ley N° 21.442 • Arts. 17° y 20°
              </span>
              <span className="text-[9.5px] font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md hidden sm:inline-block shrink-0">
                {currentCommunity?.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Libro oficial de sesiones ordinarias y extraordinarias, actas foliadas con acuerdos, bitácora de novedades y compromisos
            </p>
          </div>
        </div>

        {/* Acciones principales rápidas a la derecha */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCircularModal(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Emitir Circular Oficial del Comité a la comunidad (Art. 17° N° 1)"
          >
            <Megaphone className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
            <span>Emitir Circular</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPowerCutModal(true)}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Resolución de Comité para Suspensión de Suministro Eléctrico (Art. 27° Ley 21.442)"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
            <span>Suspensión Eléctrica</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewMeetingModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] hover:from-[#0A291F] hover:to-[#0F3D2E] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer"
            title="Registrar una nueva reunión de comité con tabla, acuerdos y tareas"
          >
            <Plus className="w-4 h-4 mr-1.5 text-[#D4B895]" />
            Nueva Sesión de Comité
          </button>

          <button
            type="button"
            onClick={() => setShowNewNovedadModal(true)}
            className="px-3 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Anotar una novedad o evento urgente para conocimiento del comité"
          >
            <Bell className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
            Registrar Novedad
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsAppSummary}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
            title="Copiar reporte ejecutivo y abrir en WhatsApp para el Comité"
          >
            {whatsAppNovedadesCopied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span className="font-bold">¡Copiado & Abierto!</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span>WhatsApp Comité</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. KPIS EJECUTIVOS DEL COMITÉ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 bg-[#0F3D2E]/10 rounded-xl text-[#0F3D2E]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sesiones Realizadas</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{meetings.length} actas</div>
            <div className="text-[9.5px] text-slate-400">Libro foliado oficial</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${pendingTasksCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tareas & Compromisos</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {pendingTasksCount} pendientes
            </div>
            <div className="text-[9.5px] text-amber-700 font-bold">
              {urgentTasksCount > 0 ? `${urgentTasksCount} urgentes con plazo` : 'Al día'}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Novedades Activas</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{activeNovedadesCount} eventos</div>
            <div className="text-[9.5px] text-slate-400">Bitácora de gestión</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comité Vigente</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{committeeMembers.length} miembros</div>
            <div className="text-[9.5px] text-emerald-700 font-bold">100% cuotas al día</div>
          </div>
        </div>
      </div>

      {/* 3. SELECTOR DE SUB-PESTAÑAS (INTERNO) */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab('reuniones')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'reuniones'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>1. Libro Oficial de Reuniones</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            currentTab === 'reuniones' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-100 text-slate-600'
          }`}>
            {meetings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('novedades')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'novedades'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>2. Registro de Novedades & Bitácora</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            currentTab === 'novedades' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-100 text-slate-600'
          }`}>
            {novedades.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('tareas')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'tareas'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>3. Compromisos & Tareas</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            currentTab === 'tareas' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-100 text-slate-600'
          }`}>
            {pendingTasksCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('directorio')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${
            currentTab === 'directorio'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>4. Miembros del Comité (Art. 17°)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            currentTab === 'directorio' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-100 text-slate-600'
          }`}>
            {committeeMembers.length}
          </span>
        </button>
      </div>

      {/* --- VISTA 1: LIBRO OFICIAL DE REUNIONES DE COMITÉ --- */}
      {currentTab === 'reuniones' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Columna Izquierda: Índice de Actas Foliadas */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Sesiones Registradas ({meetings.length})
              </span>
              <button
                type="button"
                onClick={() => setShowNewMeetingModal(true)}
                className="text-[11px] font-bold text-[#0F3D2E] hover:underline flex items-center cursor-pointer"
              >
                <Plus className="w-3 h-3 mr-0.5" /> Nueva Sesión
              </button>
            </div>

            <div className="space-y-2">
              {meetings.map(m => {
                const isSelected = selectedMeeting?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeetingId(m.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F3D2E]/5 border-[#0F3D2E] shadow-2xs ring-1 ring-[#0F3D2E]/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-[#0F3D2E]">{m.folio}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {m.status}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{m.type}</div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1.5">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-slate-400" />{formatDate(m.date)}</span>
                      <span>•</span>
                      <span>{m.agreements?.length || 0} acuerdos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Detalle del Acta Foliada Seleccionada */}
          <div className="lg:col-span-8">
            {selectedMeeting ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-5">
                {/* Cabecera del Acta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-black text-[#0F3D2E] bg-[#0F3D2E]/10 px-2 py-0.5 rounded-md">
                        {selectedMeeting.folio}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {selectedMeeting.status}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1.5">{selectedMeeting.type}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(selectedMeeting.date)} • {selectedMeeting.time} • {selectedMeeting.modality}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePrintCommitteeMinute(selectedMeeting)}
                      className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                      title="Imprimir Acta Oficial Foliada con membrete formal ARANPRO y firmas"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                      Imprimir Acta Oficial (PDF)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareMeetingWhatsApp(selectedMeeting)}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                      title="Compartir acuerdos y temas del acta por WhatsApp al Comité"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      WhatsApp Acta
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalDialog({
                          isOpen: true,
                          type: 'danger',
                          title: '¿Eliminar Acta de Sesión?',
                          message: `¿Está seguro de eliminar el acta de sesión folio ${selectedMeeting.folio}?\n\nEsta acción borrará los acuerdos y registros asociados a esta reunión.`,
                          confirmText: 'Sí, Eliminar Acta',
                          cancelText: 'Cancelar',
                          isAlert: false,
                          onConfirm: () => {
                            setModalDialog(prev => ({ ...prev, isOpen: false }));
                            deleteCommitteeMeeting(currentCommunity.id, selectedMeeting.id);
                          },
                          onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
                        });
                      }}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar sesión del libro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Asistentes a la Sesión */}
                <div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-[#0F3D2E]" /> Asistentes del Comité y Administración
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(selectedMeeting.attendees || []).map((att, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{att.name}</div>
                          <div className="text-[11px] text-[#0F3D2E] font-semibold">{att.role} ({att.unit})</div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {att.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabla de Temas Tratados */}
                <div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1 text-[#0F3D2E]" /> Temas Tratados en la Tabla
                  </h5>
                  <div className="space-y-1.5">
                    {(selectedMeeting.agendaTopics || []).map((top, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2">
                        <span className="font-bold text-[#0F3D2E]">•</span>
                        <span>{top}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acuerdos y Resoluciones Aprobadas */}
                <div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" /> Acuerdos Aprobados por el Comité (Art. 17°)
                  </h5>
                  <div className="space-y-2">
                    {(selectedMeeting.agreements || []).map((agr, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-slate-900">
                        <div className="font-bold text-emerald-900 mb-0.5">Acuerdo N° {idx + 1}:</div>
                        <div>{agr}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tareas Asignadas */}
                {selectedMeeting.tasks && selectedMeeting.tasks.length > 0 && (
                  <div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-amber-700" /> Compromisos y Tareas Derivadas
                    </h5>
                    <div className="space-y-1.5">
                      {selectedMeeting.tasks.map((task, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{task.title}</div>
                            <div className="text-[10px] text-slate-500">Asignado: {task.assignee} • Vence: {task.dueDate ? formatDate(task.dueDate) : 'Pronto'}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.status === 'CUMPLIDA' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                No hay actas de sesión registradas todavía. Haz clic en "+ Nueva Sesión de Comité" para crear la primera.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VISTA 2: REGISTRO DE NOVEDADES & BITÁCORA --- */}
      {currentTab === 'novedades' && (
        <div className="space-y-4">
          {/* Barra de Filtros de Novedades */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en novedades..."
                  value={novedadSearchQuery}
                  onChange={(e) => setNovedadSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-48 focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>

              <select
                value={novedadFilterCategory}
                onChange={(e) => setNovedadFilterCategory(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="ALL">Todas las Categorías</option>
                <option value="Mantención & Accesos">Mantención & Accesos</option>
                <option value="Finanzas & Cobranza">Finanzas & Cobranza</option>
                <option value="Seguridad & Convivencia">Seguridad & Convivencia</option>
                <option value="Servicios Básicos">Servicios Básicos</option>
              </select>

              <select
                value={novedadFilterPriority}
                onChange={(e) => setNovedadFilterPriority(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="ALL">Todas las Prioridades</option>
                <option value="URGENTE">Urgente</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="INFORMATIVA">Informativa</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-bold shrink-0">
              Mostrando {filteredNovedades.length} de {novedades.length} eventos
            </div>
          </div>

          {/* Lista de Tarjetas de Novedades */}
          <div className="space-y-2.5">
            {filteredNovedades.map((nov) => {
              const priorityColors = {
                URGENTE: 'bg-rose-100 text-rose-800 border-rose-200',
                ALTA: 'bg-amber-100 text-amber-800 border-amber-200',
                MEDIA: 'bg-blue-100 text-blue-800 border-blue-200',
                INFORMATIVA: 'bg-slate-100 text-slate-700 border-slate-200'
              };

              return (
                <div key={nov.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${priorityColors[nov.priority] || priorityColors.MEDIA}`}>
                        {nov.priority}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {nov.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(nov.date)} • {nov.time}
                      </span>
                      {nov.elevatedToMeeting && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          📌 Elevada a Próxima Sesión
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {nov.status !== 'RESUELTO' ? (
                        <button
                          type="button"
                          onClick={() => updateCommitteeNovedad(currentCommunity.id, nov.id, { status: 'RESUELTO' })}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                        >
                          ✓ Marcar Resuelto
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ✓ Resuelto
                        </span>
                      )}

                      {!nov.elevatedToMeeting && (
                        <button
                          type="button"
                          onClick={() => updateCommitteeNovedad(currentCommunity.id, nov.id, { elevatedToMeeting: true })}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[10px] rounded-lg border border-purple-300 transition-colors cursor-pointer"
                          title="Incorporar este tema a la tabla de la próxima reunión del comité"
                        >
                          + Elevar a Reunión
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleShareNovedadWhatsApp(nov)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-300 transition-colors cursor-pointer flex items-center"
                        title="Enviar detalle de esta novedad al WhatsApp del Comité"
                      >
                        <MessageCircle className="w-3 h-3 mr-1 text-emerald-600" />
                        WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setModalDialog({
                            isOpen: true,
                            type: 'danger',
                            title: '¿Eliminar Novedad de Bitácora?',
                            message: `¿Está seguro de eliminar la novedad "${nov.title}" de la bitácora del comité?`,
                            confirmText: 'Sí, Eliminar Novedad',
                            cancelText: 'Cancelar',
                            isAlert: false,
                            onConfirm: () => {
                              setModalDialog(prev => ({ ...prev, isOpen: false }));
                              deleteCommitteeNovedad(currentCommunity.id, nov.id);
                            },
                            onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar novedad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h5 className="text-sm font-black text-slate-900">{nov.title}</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{nov.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10.5px] text-slate-400">
                    <span>Reportado por: <strong>{nov.reportedBy}</strong></span>
                    <span>Notificado al Comité: <strong className="text-emerald-700">Sí (Registrado)</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- VISTA 3: COMPROMISOS & TAREAS --- */}
      {currentTab === 'tareas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setTaskFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  taskFilterStatus === 'ALL' ? 'bg-[#0F3D2E] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todas ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilterStatus('PENDIENTES')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  taskFilterStatus === 'PENDIENTES' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pendientes ({pendingTasksCount})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilterStatus('CUMPLIDAS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  taskFilterStatus === 'CUMPLIDAS' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cumplidas ({tasks.length - pendingTasksCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowNewTaskModal(true)}
              className="px-3 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-[#D4B895]" /> + Nueva Tarea
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'CUMPLIDA';
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted ? 'bg-slate-50/70 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <button
                        type="button"
                        onClick={() => toggleCommitteeTaskStatus(currentCommunity.id, task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                          isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-[#0F3D2E]'
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div>
                        <h5 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Responsable: <strong className="text-slate-700">{task.assignee}</strong>
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      task.priority === 'URGENTE' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-400">
                      Vence: <strong className={task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted ? 'text-rose-600' : 'text-slate-700'}>
                        {task.dueDate ? formatDate(task.dueDate) : 'Sin plazo'}
                      </strong>
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleCommitteeTaskStatus(currentCommunity.id, task.id)}
                        className="text-[10px] font-bold text-[#0F3D2E] hover:underline cursor-pointer"
                      >
                        {isCompleted ? 'Reabrir Tarea' : 'Completar →'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalDialog({
                            isOpen: true,
                            type: 'danger',
                            title: '¿Eliminar Tarea?',
                            message: `¿Está seguro de eliminar la tarea "${task.title}" del registro de compromisos?`,
                            confirmText: 'Sí, Eliminar Tarea',
                            cancelText: 'Cancelar',
                            isAlert: false,
                            onConfirm: () => {
                              setModalDialog(prev => ({ ...prev, isOpen: false }));
                              deleteCommitteeTask(currentCommunity.id, task.id);
                            },
                            onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
                          });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- VISTA 4: DIRECTORIO DE MIEMBROS DEL COMITÉ --- */}
      {currentTab === 'directorio' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Directorio Oficial de Miembros del Comité ({committeeMembers.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Designación y control de inhabilidades según el Art. 17° de la Ley N° 21.442
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const firstAvailableUnit = (currentCommunity?.units || []).find(u => !u.isCommittee);
                setDesignateForm({
                  unitId: firstAvailableUnit?.id || (currentCommunity?.units?.[0]?.id || ''),
                  role: 'Vocal Comité'
                });
                setShowDesignateMemberModal(true);
              }}
              className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
              Designar / Agregar Miembro
            </button>
          </div>

          {/* Reloj de Mandato Legal del Comité & Alerta de Renovación (Art. 17° Inciso 2) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#0F3D2E]/10 rounded-xl text-[#0F3D2E] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                    Reloj de Mandato Legal del Comité (Ley N° 21.442 • Art. 17° Inciso 2)
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Plazo Legal Máximo: 3 Años
                    </span>
                  </h5>
                  <p className="text-[10.5px] text-slate-500">
                    Elegido en {mandateInfo.assemblyMinuteRef} el {formatDate(mandateMetrics.startDate)} • Vence el {formatDate(mandateMetrics.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {mandateMetrics.isExpired ? (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Mandato Vencido — Requiere Convocatoria a Asamblea
                  </span>
                ) : mandateMetrics.isNearRenewal ? (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Renovación Próxima ({mandateMetrics.daysRemaining} días)
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-emerald-600" />
                    Mandato Vigente y Hábil ({mandateMetrics.daysRemaining} días restantes)
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingMandate(!isEditingMandate)}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {isEditingMandate ? 'Cerrar Edición' : 'Editar Mandato'}
                </button>
              </div>
            </div>

            {/* Formulario rápido de edición de mandato */}
            {isEditingMandate && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Fecha de Asamblea de Elección</label>
                  <input
                    type="date"
                    value={mandateInfo.assemblyDate}
                    onChange={(e) => setMandateInfo({ ...mandateInfo, assemblyDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Ref. Acta de Elección</label>
                  <input
                    type="text"
                    value={mandateInfo.assemblyMinuteRef}
                    onChange={(e) => setMandateInfo({ ...mandateInfo, assemblyMinuteRef: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                    placeholder="Ej. Acta Asamblea N° 12-2024"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Duración Período (Años)</label>
                  <select
                    value={mandateInfo.durationYears}
                    onChange={(e) => setMandateInfo({ ...mandateInfo, durationYears: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value={1}>1 Año</option>
                    <option value={2}>2 Años</option>
                    <option value={3}>3 Años (Máximo Legal Art. 17°)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Barra de Progreso del Mandato Legal */}
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="font-bold text-slate-700">Progreso del Período de Mandato: {mandateMetrics.percent}% transcurrido</span>
                <span className="font-mono text-slate-500 font-bold">{mandateMetrics.daysElapsed} de {mandateMetrics.totalDays} días</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-500 ${
                    mandateMetrics.isExpired ? 'bg-rose-500' : mandateMetrics.isNearRenewal ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0F3D2E] to-emerald-600'
                  }`}
                  style={{ width: `${mandateMetrics.percent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start space-x-3">
            <Shield className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <div className="font-bold">Requisito Legal Art. 17° Ley N° 21.442:</div>
              <p className="mt-0.5 leading-relaxed text-emerald-900">
                Para ser miembro del Comité de Administración se requiere ser copropietario o su cónyuge/conviviente civil debidamente facultado, y <strong>encontrarse al día en el pago de los gastos comunes</strong>. El mandato tiene una duración de hasta tres años, prorrogable automáticamente si no se celebra nueva asamblea.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {committeeMembers.map((m, idx) => (
              <div key={idx} className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F3D2E] to-[#14533d] text-white flex items-center justify-center font-bold text-xs">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-900">{m.name}</h5>
                        <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#0F3D2E]/10 px-1.5 py-0.2 rounded-md">
                          {m.role}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {m.tower ? `${m.tower} - ${m.unitNumber}` : `Casa ${m.unitNumber}`}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-2 mt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">RUT:</span>
                      <span className="font-mono font-bold">{m.rut ? formatRut(m.rut) : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Teléfono:</span>
                      <span className="font-bold">{m.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Correo:</span>
                      <span className="font-bold truncate max-w-[170px]">{m.email || '—'}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Estado Gastos:</span>
                      {m.isUpToDate ? (
                        <span className="font-bold text-emerald-700 flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Al Día (Hábil)
                        </span>
                      ) : (
                        <span className="font-bold text-rose-600 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-500" /> Inhábil (Deuda: {formatCLP(m.pendingDebt)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDesignateForm({
                        unitId: m.unitId,
                        role: m.role
                      });
                      setShowDesignateMemberModal(true);
                    }}
                    className="text-[11px] font-bold text-[#0F3D2E] hover:underline cursor-pointer"
                  >
                    Editar Cargo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalDialog({
                        isOpen: true,
                        type: 'danger',
                        title: '¿Remover del Comité de Administración?',
                        message: `¿Está seguro de remover a ${m.name} (Casa ${m.unitNumber}) de su cargo en el Comité de Administración?\n\nLa unidad permanecerá como copropietario regular conforme a la Ley N° 21.442.`,
                        confirmText: 'Sí, Remover del Cargo',
                        cancelText: 'Cancelar',
                        isAlert: false,
                        onConfirm: () => {
                          setModalDialog(prev => ({ ...prev, isOpen: false }));
                          updateUnit(currentCommunity.id, m.unitId, { isCommittee: false, committeeRole: '' });
                        },
                        onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
                      });
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    Remover del Comité
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL 1: REGISTRAR NUEVA REUNIÓN DE COMITÉ --- */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#0F3D2E] text-white rounded-xl">
                  <Calendar className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Nueva Sesión del Comité de Administración</h3>
                  <p className="text-xs text-slate-500">Genera el acta oficial foliada según la Ley N° 21.442 Art. 17° y 20°</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewMeetingModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Sesión</label>
                  <input
                    type="date"
                    required
                    value={newMeetingForm.date}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, date: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="text"
                    required
                    value={newMeetingForm.time}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, time: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                    placeholder="19:30 hrs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad</label>
                  <select
                    value={newMeetingForm.modality}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, modality: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Mixta (Presencial + Google Meet)">Mixta (Presencial + Meet)</option>
                    <option value="Presencial (Sala de Reuniones)">Presencial</option>
                    <option value="Telemática (Google Meet / Zoom)">Telemática</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Sesión</label>
                <input
                  type="text"
                  required
                  value={newMeetingForm.type}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, type: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                  placeholder="Sesión Ordinaria Mensual de Coordinación"
                />
              </div>

              {/* Temas Tratados */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Tabla de Temas a Tratar</label>
                <div className="space-y-1.5">
                  {newMeetingForm.agendaTopics.map((top, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span>{top}</span>
                      <button
                        type="button"
                        onClick={() => setNewMeetingForm({
                          ...newMeetingForm,
                          agendaTopics: newMeetingForm.agendaTopics.filter((_, i) => i !== idx)
                        })}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    placeholder="Escribir nuevo tema de la tabla..."
                    className="flex-1 text-xs p-2 border border-slate-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTopicInput.trim()) return;
                      setNewMeetingForm({
                        ...newMeetingForm,
                        agendaTopics: [...newMeetingForm.agendaTopics, newTopicInput.trim()]
                      });
                      setNewTopicInput('');
                    }}
                    className="px-3 py-2 bg-[#0F3D2E] text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Acuerdos Tomados */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Acuerdos Formales del Comité (Art. 17°)</label>
                <div className="space-y-1.5">
                  {newMeetingForm.agreements.map((agr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs">
                      <span>{agr}</span>
                      <button
                        type="button"
                        onClick={() => setNewMeetingForm({
                          ...newMeetingForm,
                          agreements: newMeetingForm.agreements.filter((_, i) => i !== idx)
                        })}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newAgreementInput}
                    onChange={(e) => setNewAgreementInput(e.target.value)}
                    placeholder="Escribir acuerdo aprobado por unanimidad o mayoría..."
                    className="flex-1 text-xs p-2 border border-slate-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAgreementInput.trim()) return;
                      setNewMeetingForm({
                        ...newMeetingForm,
                        agreements: [...newMeetingForm.agreements, newAgreementInput.trim()]
                      });
                      setNewAgreementInput('');
                    }}
                    className="px-3 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewMeetingModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar & Follar Acta Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: REGISTRAR NUEVA NOVEDAD --- */}
      {showNewNovedadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Registrar Novedad en la Bitácora</h3>
                  <p className="text-xs text-slate-500">Para conocimiento directo del Comité de Administración</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewNovedadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNovedad} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Novedad / Evento</label>
                <input
                  type="text"
                  required
                  value={newNovedadForm.title}
                  onChange={(e) => setNewNovedadForm({ ...newNovedadForm, title: e.target.value })}
                  placeholder="Ej: Calibración de fotoceldas del portón completada"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newNovedadForm.category}
                    onChange={(e) => setNewNovedadForm({ ...newNovedadForm, category: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Mantención & Accesos">Mantención & Accesos</option>
                    <option value="Finanzas & Cobranza">Finanzas & Cobranza</option>
                    <option value="Seguridad & Convivencia">Seguridad & Convivencia</option>
                    <option value="Servicios Básicos">Servicios Básicos</option>
                    <option value="Administrativo General">Administrativo General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={newNovedadForm.priority}
                    onChange={(e) => setNewNovedadForm({ ...newNovedadForm, priority: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="URGENTE">Urgente</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="INFORMATIVA">Informativa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detalle de la Novedad y Acciones Realizadas</label>
                <textarea
                  required
                  rows={3}
                  value={newNovedadForm.description}
                  onChange={(e) => setNewNovedadForm({ ...newNovedadForm, description: e.target.value })}
                  placeholder="Detallar lo ocurrido y las medidas tomadas por la administración..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl resize-none"
                />
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-700 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={newNovedadForm.elevatedToMeeting}
                  onChange={(e) => setNewNovedadForm({ ...newNovedadForm, elevatedToMeeting: e.target.checked })}
                  className="rounded border-slate-300 text-[#0F3D2E]"
                />
                <span>Elevar automáticamente a tema para la próxima Sesión de Comité</span>
              </label>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewNovedadModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Registrar en Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: REGISTRAR NUEVA TAREA / COMPROMISO --- */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Nuevo Compromiso / Tarea</h3>
                  <p className="text-xs text-slate-500">Seguimiento de acuerdos del comité</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Tarea</label>
                <input
                  type="text"
                  required
                  value={newTaskStandalone.title}
                  onChange={(e) => setNewTaskStandalone({ ...newTaskStandalone, title: e.target.value })}
                  placeholder="Ej: Solicitar 3 cotizaciones para pintura de estacionamientos"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Responsable</label>
                  <input
                    type="text"
                    required
                    value={newTaskStandalone.assignee}
                    onChange={(e) => setNewTaskStandalone({ ...newTaskStandalone, assignee: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    required
                    value={newTaskStandalone.dueDate}
                    onChange={(e) => setNewTaskStandalone({ ...newTaskStandalone, dueDate: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad</label>
                <select
                  value={newTaskStandalone.priority}
                  onChange={(e) => setNewTaskStandalone({ ...newTaskStandalone, priority: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="URGENTE">Urgente</option>
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Media</option>
                  <option value="BAJA">Baja</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DESIGNAR / EDITAR MIEMBRO DEL COMITÉ --- */}
      {showDesignateMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F3D2E] text-white rounded-xl">
                  <UserCheck className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Designar Miembro del Comité</h3>
                  <p className="text-xs text-slate-500">Art. 17° Ley N° 21.442 • Requisitos de Habilidad</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDesignateMemberModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Seleccionar Copropietario / Vivienda</label>
                <select
                  value={designateForm.unitId}
                  onChange={(e) => setDesignateForm({ ...designateForm, unitId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
                >
                  {(currentCommunity?.units || []).map(u => {
                    const fin = getUnitFinancials ? getUnitFinancials(u) : { pendingDebt: 0 };
                    const hasDebt = fin.pendingDebt > 0;
                    return (
                      <option key={u.id} value={u.id}>
                        Casa {u.number} — {u.owner || u.ownerName} {hasDebt ? `(⚠️ Con Deuda: ${formatCLP(fin.pendingDebt)})` : '(🟢 Al Día)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {(() => {
                const selectedUnit = (currentCommunity?.units || []).find(u => u.id === designateForm.unitId);
                const fin = selectedUnit ? (getUnitFinancials ? getUnitFinancials(selectedUnit) : { pendingDebt: 0 }) : { pendingDebt: 0 };
                if (fin.pendingDebt > 0) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] space-y-1">
                      <div className="font-black flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
                        ADVERTENCIA LEGAL (ART. 17° LEY 21.442):
                      </div>
                      <p>
                        Esta unidad mantiene una deuda de <strong>{formatCLP(fin.pendingDebt)}</strong>. La ley exige que los miembros del comité se encuentren al día en sus gastos comunes para ejercer legalmente el cargo.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Copropietario cumple con los requisitos legales para integrar el Comité.</span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo a Asignar en el Comité</label>
                <select
                  value={designateForm.role}
                  onChange={(e) => setDesignateForm({ ...designateForm, role: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
                >
                  <option value="Presidente del Comité">Presidente(a) del Comité</option>
                  <option value="Tesorero(a) del Comité">Tesorero(a) del Comité</option>
                  <option value="Secretario(a) del Comité">Secretario(a) del Comité</option>
                  <option value="Primer Vocal">Primer Vocal</option>
                  <option value="Segundo Vocal">Segundo Vocal</option>
                  <option value="Revisor(a) de Cuentas">Revisor(a) de Cuentas</option>
                  <option value="Miembro del Comité">Miembro del Comité</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDesignateMemberModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!designateForm.unitId) return;
                    updateUnit(currentCommunity.id, designateForm.unitId, {
                      isCommittee: true,
                      committeeRole: designateForm.role
                    });
                    setShowDesignateMemberModal(false);
                  }}
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Designación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 1: PROCEDIMIENTO ESPECIAL DE SUSPENSIÓN ELÉCTRICA (ART. 27°)       */}
      {/* ========================================================================= */}
      {showPowerCutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Cabecera */}
            <div className="px-5 py-4 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                  <Zap className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black flex items-center gap-1.5 flex-wrap">
                    Suspensión de Suministro Eléctrico por Morosidad
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/40 text-rose-200 uppercase font-black tracking-wide">
                      Art. 27° Ley N° 21.442
                    </span>
                  </h4>
                  <p className="text-[11px] text-rose-200 mt-0.5">
                    Generación de Oficio Legal a la Empresa Distribuidora y Notificación Formal previa al Copropietario
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPowerCutModal(false)}
                className="p-1.5 text-rose-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-rose-950 text-[11.5px] flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Requisito Legal Art. 27° Ley N° 21.442:</strong> Si un copropietario incurre en mora de <strong>tres o más cuotas</strong> (continuas o discontinuas), el Administrador con acuerdo y autorización del Comité de Administración puede solicitar a la empresa concesionaria (CGE, Enel, etc.) la suspensión material del servicio.
                </div>
              </div>

              {/* Selector de Unidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleccionar Unidad con Deuda / Morosa
                </label>
                <select
                  value={powerCutForm.unitId}
                  onChange={(e) => setPowerCutForm({ ...powerCutForm, unitId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-xs"
                >
                  {(currentCommunity?.units || []).map(u => {
                    const fin = getUnitFinancials ? getUnitFinancials(u) : { totalToPay: 0, pendingDebt: 0 };
                    const debt = fin.totalToPay || fin.pendingDebt || 0;
                    const months = Math.max(0, Math.round(debt / (u.currentCharge || 42500)));
                    return (
                      <option key={u.id} value={u.id}>
                        {u.tower ? `${u.tower} - ${u.number}` : `Casa ${u.number}`} — {u.owner || 'Copropietario'} | Deuda: {formatCLP(debt)} ({months} cuotas impagas) {months >= 3 ? '🚨 HÁBIL CORTE ART. 27°' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Resumen de la Unidad Seleccionada */}
              {(() => {
                const selectedUnit = (currentCommunity?.units || []).find(u => u.id === powerCutForm.unitId);
                if (!selectedUnit) return null;
                const fin = getUnitFinancials ? getUnitFinancials(selectedUnit) : { totalToPay: 0, pendingDebt: 0, currentCharge: 42500 };
                const debt = fin.totalToPay || fin.pendingDebt || 0;
                const months = Math.max(1, Math.round(debt / (selectedUnit.currentCharge || 42500)));
                const isLegallyEligible = months >= 3;

                return (
                  <div className={`p-3 rounded-xl border ${isLegallyEligible ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Copropietario: {selectedUnit.owner}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isLegallyEligible ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-200 text-slate-700'}`}>
                        {months} Cuotas Impagas ({formatCLP(debt)})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-4">
                      <span>RUT: {selectedUnit.rut ? formatRut(selectedUnit.rut) : '—'}</span>
                      <span>Teléfono: {selectedUnit.phone || selectedUnit.ownerPhone || '—'}</span>
                      <span>Email: {selectedUnit.email || selectedUnit.ownerEmail || '—'}</span>
                    </div>
                    {isLegallyEligible ? (
                      <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Cumple con el estándar legal de 3 o más cuotas de morosidad para solicitar el corte a la concesionaria.
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-800 font-bold flex items-center gap-1 pt-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Atención: Tiene menos de 3 meses de deuda. La ley exige un mínimo de 3 cuotas impagas.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Empresa Distribuidora Eléctrica</label>
                  <input
                    type="text"
                    value={powerCutForm.company}
                    onChange={(e) => setPowerCutForm({ ...powerCutForm, company: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                    placeholder="Ej. CGE, Enel Distribución..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Cliente / Suministro</label>
                  <input
                    type="text"
                    value={powerCutForm.clientNumber}
                    onChange={(e) => setPowerCutForm({ ...powerCutForm, clientNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                    placeholder="Ej. 8842109-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">N° de Medidor</label>
                  <input
                    type="text"
                    value={powerCutForm.meterNumber}
                    onChange={(e) => setPowerCutForm({ ...powerCutForm, meterNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                    placeholder="Ej. MTR-55419-C12"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Plazo de Advertencia (Días)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={powerCutForm.warningDays}
                    onChange={(e) => setPowerCutForm({ ...powerCutForm, warningDays: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Folio Resolución</label>
                  <input
                    type="text"
                    value={powerCutForm.resolutionFolio}
                    onChange={(e) => setPowerCutForm({ ...powerCutForm, resolutionFolio: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Acuerdo y Fundamento del Comité</label>
                <textarea
                  rows={3}
                  value={powerCutForm.notes}
                  onChange={(e) => setPowerCutForm({ ...powerCutForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-xs resize-none"
                />
              </div>

              {powerCutCopiedFeedback && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center space-x-2 text-xs font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Mensaje legal de advertencia copiado al portapapeles y abierto en WhatsApp!</span>
                </div>
              )}
            </div>

            {/* Footer de Acciones */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPowerCutModal(false)}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendPowerCutWhatsAppWarning}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                  title="Enviar notificación formal de advertencia por WhatsApp antes del corte material"
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                  WhatsApp Advertencia Previa
                </button>

                <button
                  type="button"
                  onClick={handlePrintPowerCutOficio}
                  className="px-4 py-2 bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 text-white font-black text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer border border-rose-700"
                  title="Descargar oficio legal para presentar a la concesionaria eléctrica"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5 text-rose-300" />
                  Emitir Oficio Distribuidora (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GENERADOR DE CIRCULARES OFICIALES DEL COMITÉ (ART. 17° N° 1)     */}
      {/* ========================================================================= */}
      {showCircularModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Cabecera */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 text-[#D4B895] rounded-xl border border-white/20">
                  <Megaphone className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h4 className="text-sm font-black flex items-center gap-1.5 flex-wrap">
                    Generador de Circulares Oficiales del Comité
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-[#D4B895]/20 border border-[#D4B895]/40 text-[#D4B895] uppercase font-black tracking-wide">
                      Art. 17° N° 1 Ley N° 21.442
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-100 mt-0.5">
                    Emisión oficial con firma del comité, descarga en PDF, publicación en Mural y difusión por WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCircularModal(false)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Plantillas Rápidas Pre-Redactadas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Seleccionar Plantilla Pre-Redactada (Alineada a Ley N° 21.442):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyCircularTemplate('mascotas')}
                    className={`p-2 rounded-xl border text-left font-bold text-[11px] transition-all cursor-pointer ${
                      circularTemplate === 'mascotas' ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    🐾 Mascotas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCircularTemplate('ruidos')}
                    className={`p-2 rounded-xl border text-left font-bold text-[11px] transition-all cursor-pointer ${
                      circularTemplate === 'ruidos' ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    🔇 Ruidos & Descanso
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCircularTemplate('estacionamientos')}
                    className={`p-2 rounded-xl border text-left font-bold text-[11px] transition-all cursor-pointer ${
                      circularTemplate === 'estacionamientos' ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    🚗 Estacionamientos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCircularTemplate('obras')}
                    className={`p-2 rounded-xl border text-left font-bold text-[11px] transition-all cursor-pointer ${
                      circularTemplate === 'obras' ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    🔨 Obras & Trabajos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCircularTemplate('personalizada')}
                    className={`p-2 rounded-xl border text-left font-bold text-[11px] transition-all cursor-pointer ${
                      circularTemplate === 'personalizada' ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ✍️ Personalizada
                  </button>
                </div>
              </div>

              {/* Formulario */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Folio Oficial</label>
                  <input
                    type="text"
                    value={circularForm.folio}
                    onChange={(e) => setCircularForm({ ...circularForm, folio: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha Emisión</label>
                  <input
                    type="date"
                    value={circularForm.date}
                    onChange={(e) => setCircularForm({ ...circularForm, date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoría / Materia</label>
                  <input
                    type="text"
                    value={circularForm.category}
                    onChange={(e) => setCircularForm({ ...circularForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Título de la Circular</label>
                  <input
                    type="text"
                    value={circularForm.title}
                    onChange={(e) => setCircularForm({ ...circularForm, title: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fundamento Legal</label>
                  <input
                    type="text"
                    value={circularForm.legalCitation}
                    onChange={(e) => setCircularForm({ ...circularForm, legalCitation: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Cuerpo / Contenido del Comunicado Oficial</label>
                <textarea
                  rows={6}
                  value={circularForm.body}
                  onChange={(e) => setCircularForm({ ...circularForm, body: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl bg-white font-medium text-xs resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Firmantes del Comité de Administración</label>
                <input
                  type="text"
                  value={circularForm.committeeSigners}
                  onChange={(e) => setCircularForm({ ...circularForm, committeeSigners: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-700 text-xs font-medium"
                />
              </div>

              {/* Feedback messages */}
              {circularPublishedFeedback && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center space-x-2 text-xs font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Circular publicada con éxito en el Mural de Avisos de la Comunidad! Los vecinos ya pueden visualizarla en su portal.</span>
                </div>
              )}

              {circularCopiedFeedback && (
                <div className="p-2.5 bg-blue-50 border border-blue-300 text-blue-900 rounded-xl flex items-center space-x-2 text-xs font-bold animate-fadeIn">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>¡Texto oficial de la circular copiado al portapapeles y abierto en WhatsApp!</span>
                </div>
              )}
            </div>

            {/* Footer de Acciones */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCircularModal(false)}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePublishCircularToMural}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                  title="Publicar en el módulo de Mural & Reclamos de la comunidad"
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
                  Publicar en Mural Vecinos
                </button>

                <button
                  type="button"
                  onClick={handleShareCircularWhatsApp}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                  title="Compartir por WhatsApp al grupo comunitario"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  WhatsApp Vecinos
                </button>

                <button
                  type="button"
                  onClick={handlePrintCircular}
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-colors cursor-pointer"
                  title="Generar e imprimir PDF oficial con membrete y firmas"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                  Descargar / Imprimir PDF
                </button>
              </div>
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