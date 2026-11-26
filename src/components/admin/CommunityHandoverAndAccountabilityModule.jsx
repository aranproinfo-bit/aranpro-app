import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Printer,
  Eye,
  Calendar,
  Briefcase,
  X,
  CheckCircle2,
  FolderArchive,
  ShieldCheck
} from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';
import { printDocumentDirectly } from '../../utils/printDocument';
import { AranproPdfStyleSelector, useAranproPdfStyle } from '../common/MauranLogo';
import {
  buildHandoverSections,
  buildAnnualSections,
  CommunityHandoverChecklistScreen,
  CommunityHandoverPautaPrint,
  handoverPautaPrintStyles
} from './CommunityHandoverChecklist';
import {
  CommunityHandoverDocumentsTray,
  CanonicalHandoverDocumentPrint,
  computeHandoverReconciliation
} from './CommunityHandoverDocumentsTray';
import { CommunityHandoverClosureStep } from './CommunityHandoverClosureStep';

export default function CommunityHandoverAndAccountabilityModule({
  currentCommunity,
  activeSubSection,
  onChangeSubSection,
  onNavigateToTab
}) {
  const {
    companySettings = {},
    calculateCommunityTotals,
    getUnitFinancials,
    updateCommunity,
    certificates = []
  } = useCommunity();

  const [pdfStyle, setPdfStyle] = useAranproPdfStyle('alt4');
  // 'traspaso' (Fase B: Entrega y Traspaso) | 'anual' (Fase A: Rendición Anual Art. 21)
  const [activePhase, setActivePhase] = useState('traspaso');
  // 'checklist' (Paso 1) | 'documentos' (Paso 2) | 'cierre' (Paso 3)
  const [activeTabView, setActiveTabView] = useState('checklist');
  const [previewPautaOpen, setPreviewPautaOpen] = useState(false);
  const [externalPreviewDocKey, setExternalPreviewDocKey] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!activeSubSection) return;
    if (activeSubSection === 'traspaso_pauta') {
      setActivePhase('traspaso');
      setActiveTabView('checklist');
    } else if (activeSubSection === 'anual_pauta') {
      setActivePhase('anual');
      setActiveTabView('checklist');
    } else if (activeSubSection === 'documentos_traspaso') {
      setActiveTabView('documentos');
    } else if (activeSubSection === 'cierre_traspaso') {
      setActiveTabView('cierre');
    }
  }, [activeSubSection]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3800);
  };

  // 1. Radiografía en tiempo real extraída de currentCommunity + Contexto
  const live = useMemo(() => {
    const c = currentCommunity || {};
    const totals = calculateCommunityTotals ? calculateCommunityTotals(c) : {};
    const units = Array.isArray(c.units) ? c.units : [];

    let paidUnitsCount = 0;
    let delinquentUnitsCount = 0;
    let totalPendingDebt = 0;
    let totalFavorBalance = 0;
    let repactacionCount = 0;
    let unitsWithEmailCount = 0;
    let committeeMembersCount = 0;
    let firstCommitteeUnit = null;

    units.forEach((u) => {
      const fin = getUnitFinancials
        ? getUnitFinancials(u)
        : { pendingDebt: Number(u.previousDebt) || 0, favorBalance: Number(u.creditBalance) || 0 };
      if ((fin.pendingDebt || 0) > 0) {
        delinquentUnitsCount += 1;
        totalPendingDebt += fin.pendingDebt || 0;
      } else {
        paidUnitsCount += 1;
      }
      totalFavorBalance += fin.favorBalance || 0;
      if (u.repactacion?.active) repactacionCount += 1;
      if (u.email && String(u.email).includes('@')) unitsWithEmailCount += 1;
      if (u.isCommittee) {
        committeeMembersCount += 1;
        if (!firstCommitteeUnit || /presidente/i.test(u.committeeRole || '')) {
          firstCommitteeUnit = u;
        }
      }
    });

    const expenses = Array.isArray(c.expenses) ? c.expenses : [];
    const backedExpensesCount = expenses.filter((e) => Boolean(e.receiptUrl || e.documentNumber)).length;
    const staff = Array.isArray(c.staff) ? c.staff : [];
    const maintenances = Array.isArray(c.preventiveMaintenances) ? c.preventiveMaintenances : [];
    const overdueMaintCount = maintenances.filter((m) =>
      /vencid|atrasad|urgent|crític/i.test(`${m.status || ''} ${m.priority || ''}`)
    ).length;
    const tickets = Array.isArray(c.communityTickets) ? c.communityTickets : [];
    const openTicketsCount = tickets.filter((t) => !/cerrad|resuelt/i.test(t.status || '')).length;
    const committeeTasks = Array.isArray(c.committeeTasks) ? c.committeeTasks : [];
    const pendingCommitteeTasksCount = committeeTasks.filter((t) => !/complet|listo|cerrad/i.test(t.status || '')).length;
    const communityCerts = certificates.filter(
      (cert) => !c.name || !cert.communityName || cert.communityName.toLowerCase().trim() === c.name.toLowerCase().trim()
    );

    const pMonth = String(c.activePeriod?.month || new Date().getMonth() + 1).padStart(2, '0');
    const pYear = c.activePeriod?.year || new Date().getFullYear();

    return {
      communityId: c.id || 'default',
      communityName: c.name || 'Comunidad',
      communityType: c.type || 'Condominio',
      communityRut: c.bankInfo?.rut || c.rut || '',
      communityEmail: c.email || c.bankInfo?.email || '',
      city: c.city || companySettings.city || 'La Serena / Coquimbo',
      address: c.address || '',
      bankName: c.bankInfo?.bank || 'Banco Estado',
      bankAccount: c.bankInfo?.accountNumber || '',
      bankBalance: totals.realBankBalance ?? c.initialBankBalance ?? 0,
      reserveFund: c.accumulatedReserveFund ?? totals.accumulatedReserveFund ?? 0,
      reservePercent: c.reserveFundPercentage ?? 5,
      totalExpenses: totals.totalExpenses ?? 0,
      totalCollected: totals.totalCollected ?? 0,
      grandTotal: totals.grandTotal ?? 0,
      periodLabel: `${pMonth}/${pYear}`,
      currentYear: pYear,
      totalUnits: units.length,
      paidUnitsCount,
      delinquentUnitsCount,
      totalPendingDebt,
      totalFavorBalance,
      repactacionCount,
      unitsWithEmailCount,
      committeeMembersCount,
      firstCommitteeUnit,
      expensesCount: expenses.length,
      backedExpensesCount,
      historicalPeriodsCount: Array.isArray(c.periodHistory) ? c.periodHistory.length : 0,
      staffCount: staff.length,
      staffNames: staff.map((s) => s.name || s.fullName).filter(Boolean).slice(0, 3).join(', '),
      payrollHistoryCount: Array.isArray(c.payrollHistory) ? c.payrollHistory.length : 0,
      providersCount: Array.isArray(c.providers) ? c.providers.length : 0,
      maintenancesCount: maintenances.length,
      overdueMaintCount,
      assemblyMinutesCount: Array.isArray(c.assemblyMinutes) ? c.assemblyMinutes.length : 0,
      proxiesCount: Array.isArray(c.registeredProxies) ? c.registeredProxies.length : 0,
      committeeMeetingsCount: Array.isArray(c.committeeMeetings) ? c.committeeMeetings.length : 0,
      novedadesCount: Array.isArray(c.committeeNovedades) ? c.committeeNovedades.length : 0,
      openTicketsCount,
      pendingCommitteeTasksCount,
      documentsCount: Array.isArray(c.documents) ? c.documents.length : 0,
      certificatesCount: communityCerts.length
    };
  }, [currentCommunity, calculateCommunityTotals, getUnitFinancials, certificates, companySettings.city]);

  const companyInfo = useMemo(() => {
    const adminName = companySettings.adminName || companySettings.administratorName || 'John Andrés Arancibia Maureira';
    const adminRut = companySettings.adminRut && companySettings.adminRut !== '14.882.140-K' ? companySettings.adminRut : '16.012.871-2';
    const companyRut = companySettings.companyRut && !String(companySettings.companyRut).includes('76.999.888') ? companySettings.companyRut : '';
    return {
      adminName,
      adminRut,
      companyRut,
      rnacNumber: companySettings.rnacNumber || '',
      phone: companySettings.phone || '+56 9 5811 8504',
      email: companySettings.email || 'contacto@aranpro.cl',
      website: companySettings.website || 'https://aranpro.cl',
      signature: companySettings.signatureDataUrl || companySettings.signature || '',
      signatureScale: Number(companySettings.signatureScale) || 1
    };
  }, [companySettings]);

  const handoverSections = useMemo(() => buildHandoverSections(live), [live]);
  const annualSections = useMemo(() => buildAnnualSections(live), [live]);
  const activeSections = activePhase === 'anual' ? annualSections : handoverSections;

  const storageKey = `aranpro_handover_v2_${live.communityId}`;
  const docStorageKey = `aranpro_handover_docs_v2_${live.communityId}`;

  const buildDefaultMeta = () => ({
    communityName: live.communityName,
    communityRut: live.communityRut,
    city: live.city,
    handoverDate: new Date().toISOString().split('T')[0],
    assemblyDate: new Date().toISOString().split('T')[0],
    annualPeriodLabel: `Enero a Diciembre ${live.currentYear}`,
    modality: 'mixta',
    outgoingAdminName: companyInfo.adminName,
    outgoingAdminRut: companyInfo.adminRut,
    committeeRepName: live.firstCommitteeUnit?.owner || '',
    committeeRepRole: live.firstCommitteeUnit?.committeeRole || 'Presidente(a) Comité',
    committeeRepRut: live.firstCommitteeUnit?.rut || '',
    committeeRepUnit: live.firstCommitteeUnit?.number || '',
    incomingAdminName: '',
    incomingAdminRut: '',
    complementaryDeadline: '30 días corridos desde recepción',
    witnessName: '',
    closingRemarks: ''
  });

  const defaultDocState = useMemo(
    () => ({
      bankStatementBalance: live.bankBalance || 0,
      pettyCashBalance: 0,
      inTransitChecks: 0,
      operationalFundDeclared: Math.max(0, (live.bankBalance || 0) - (live.reserveFund || 0)),
      reserveFundDeclared: live.reserveFund || 0,
      specialFundsDeclared: 0,
      discrepancyNotes: '',
      pendingInvoicesAmount: 0,
      budgetIncreasePct: 4.5,
      actaNotes: '',
      inventoryItems: [
        { id: 'inv-1', name: 'Juego de llaves maestras Salas Técnicas (Bombas / Tableros)', quantity: '2 juegos', condition: 'Operativo / Rotulado', delivered: true, notes: 'Entrega en mano' },
        { id: 'inv-2', name: 'Controles remotos / Mandos de portón vehicular', quantity: '2 unidades', condition: 'Operativos', delivered: true, notes: '1 activo + 1 respaldo' },
        { id: 'inv-3', name: 'Tarjetas / Tags RFID vírgenes en stock', quantity: '10 unidades', condition: 'Nuevos sin asignar', delivered: true, notes: 'En caja conserjería' },
        { id: 'inv-4', name: 'Libro de Actas foliado y Libro de Novedades de Conserjería', quantity: '2 libros', condition: 'Foliados al día', delivered: true, notes: 'Custodia oficial' },
        { id: 'inv-5', name: 'Token / Digipass bancario y timbre físico de la comunidad', quantity: '1 set', condition: 'Operativo', delivered: true, notes: live.bankName },
        { id: 'inv-6', name: 'Herramientas, maquinaria de aseo/jardín y equipos comunes', quantity: 'Según pañol', condition: 'Revisado en terreno', delivered: true, notes: 'Bodega común' }
      ],
      credentialItems: [
        { id: 'cr-1', platform: `Portal Bancario (${live.bankName})`, accountRef: live.bankAccount || 'Cuenta Corriente Comunidad', method: 'Cambio de apoderados en banco + entrega Token', transferred: true, revoked: true },
        { id: 'cr-2', platform: 'Servicio de Impuestos Internos (SII)', accountRef: live.communityRut || 'e-RUT Comunidad', method: 'Entrega clave tributaria y cambio correo recup.', transferred: true, revoked: true },
        { id: 'cr-3', platform: 'Portal Previred (Cotizaciones)', accountRef: live.communityRut || 'Empleador Comunidad', method: 'Habilitación nuevo administrador empleador', transferred: true, revoked: true },
        { id: 'cr-4', platform: 'Dirección del Trabajo (Portal MiDT)', accountRef: live.communityRut || 'Registro Laboral', method: 'Actualización representante laboral electrónico', transferred: true, revoked: true },
        { id: 'cr-5', platform: 'Correo Electrónico Institucional', accountRef: live.communityEmail || 'correo@comunidad.cl', method: 'Cambio de contraseña y teléfono 2FA en acto', transferred: true, revoked: true },
        { id: 'cr-6', platform: 'Cámaras CCTV / NVR y Central Portón / Citofonía', accountRef: 'Usuario Administrador Local', method: 'Entrega credenciales equipo conserjería', transferred: true, revoked: true }
      ],
      legalConstancias: {}
    }),
    [live.communityId, live.bankBalance, live.reserveFund, live.bankName, live.bankAccount, live.communityRut, live.communityEmail]
  );

  const [meta, setMeta] = useState(buildDefaultMeta);
  const [handoverEntries, setHandoverEntries] = useState({});
  const [annualEntries, setAnnualEntries] = useState({});
  const [mandateChecks, setMandateChecks] = useState({});
  const [docState, setDocState] = useState(defaultDocState);

  useEffect(() => {
    const defaults = buildDefaultMeta();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMeta({
          ...defaults,
          ...(parsed.meta || {}),
          communityName: parsed.meta?.communityName || defaults.communityName,
          communityRut: parsed.meta?.communityRut || defaults.communityRut
        });
        setHandoverEntries(parsed.handoverEntries || {});
        setAnnualEntries(parsed.annualEntries || {});
        setMandateChecks(parsed.mandateChecks || {});
      } else {
        setMeta(defaults);
        setHandoverEntries({});
        setAnnualEntries({});
        setMandateChecks({});
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const savedDocs = localStorage.getItem(docStorageKey);
      if (savedDocs) {
        setDocState({ ...defaultDocState, ...JSON.parse(savedDocs) });
      } else {
        setDocState(defaultDocState);
      }
    } catch (e) {
      console.error(e);
    }
  }, [storageKey, docStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          meta,
          handoverEntries,
          annualEntries,
          mandateChecks
        })
      );
    } catch (e) {
      console.error(e);
    }
  }, [storageKey, meta, handoverEntries, annualEntries, mandateChecks]);

  useEffect(() => {
    try {
      localStorage.setItem(docStorageKey, JSON.stringify(docState));
    } catch (e) {
      console.error(e);
    }
  }, [docStorageKey, docState]);

  const activeEntries = activePhase === 'anual' ? annualEntries : handoverEntries;
  const setActiveEntries = activePhase === 'anual' ? setAnnualEntries : setHandoverEntries;

  const reconciliation = useMemo(
    () => computeHandoverReconciliation(docState, live),
    [docState, live]
  );

  const checklistScore = useMemo(() => {
    const all = activeSections.flatMap((s) => s.items);
    if (!all.length) return 0;
    const done = all.filter((i) => {
      const st = activeEntries[i.id]?.status;
      return st === 'entregado' || st === 'na';
    }).length;
    return Math.round((done / all.length) * 100);
  }, [activeSections, activeEntries]);

  const handleUpdateMeta = (patch) => {
    setMeta((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateEntry = (itemId, patch) => {
    setActiveEntries((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        ...patch
      }
    }));
  };

  const handleMarkSectionDone = (items) => {
    setActiveEntries((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        const curr = next[item.id] || {};
        next[item.id] = {
          ...curr,
          status: curr.status === 'na' ? 'na' : 'entregado',
          format: curr.format || item.autoFormat || 'Mixto (Físico + Digital)'
        };
      });
      return next;
    });
    triggerToast('✓ Bloque marcado como verificado / entregado.');
  };

  const handleAutoFillFromSystem = () => {
    const allItems = activeSections.flatMap((s) => s.items);
    setActiveEntries((prev) => {
      const next = { ...prev };
      allItems.forEach((item) => {
        const curr = next[item.id] || {};
        const isNoStaffItem =
          live.staffCount === 0 && ['tr_c1', 'tr_c2', 'tr_c3', 'an_d1', 'an_d2'].includes(item.id);
        next[item.id] = {
          ...curr,
          status: curr.status || (isNoStaffItem ? 'na' : item.moduleTab ? 'entregado' : ''),
          format: curr.format || item.autoFormat || '',
          quantity: curr.quantity || item.autoQty || '',
          notes: curr.notes || item.autoNote || ''
        };
      });
      return next;
    });
    triggerToast('⚡ Datos reales de la comunidad cargados en el checklist.');
  };

  const handleResetAllEntries = () => {
    setActiveEntries({});
    triggerToast('Casillas limpiadas: lista para llenar desde cero o imprimir en blanco.');
  };

  const handlePrintPauta = () => {
    const safeCondo = (meta.communityName || live.communityName || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    const filename =
      activePhase === 'anual'
        ? `ARANPRO_Pauta_Rendicion_Anual_3Pags_${safeCondo}`
        : `ARANPRO_Pauta_Traspaso_Administracion_3Pags_${safeCondo}`;

    printDocumentDirectly('printable-community-handover-pauta', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      pdfStyle,
      extraStyles: handoverPautaPrintStyles
    });
  };

  const handlePrintClosureDoc = (docKey, slug) => {
    const safeCondo = (meta.communityName || live.communityName || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    printDocumentDirectly(`printable-closure-${docKey}`, `ARANPRO_${slug}_${safeCondo}`, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      pdfStyle,
      extraStyles: handoverPautaPrintStyles
    });
  };

  const handleArchiveHandover = () => {
    if (!currentCommunity?.id || !updateCommunity) return;
    updateCommunity(currentCommunity.id, {
      handoverStatus: 'ENTREGADA',
      handoverRecord: {
        date: meta.handoverDate,
        incomingAdminName: meta.incomingAdminName,
        committeeRepName: meta.committeeRepName,
        availableNet: reconciliation.realAvailable,
        reserveFund: reconciliation.reserve,
        checklistScore,
        archivedAt: new Date().toISOString()
      }
    });
    triggerToast('🔒 Comunidad archivada como ENTREGADA CONFORME (respaldos protegidos).');
  };

  const handleReactivateCommunity = () => {
    if (!currentCommunity?.id || !updateCommunity) return;
    updateCommunity(currentCommunity.id, {
      handoverStatus: 'ACTIVA'
    });
    triggerToast('✓ Comunidad reactivada en tu cartera activa.');
  };

  const handleArchiveAnnualRendition = (payload) => {
    if (!currentCommunity?.id || !updateCommunity) return;
    const prevHist = Array.isArray(currentCommunity.annualAccountabilityHistory)
      ? currentCommunity.annualAccountabilityHistory
      : [];
    const newEntry = {
      id: `ann-hist-${Date.now()}`,
      periodLabel: payload.periodLabel,
      assemblyDate: payload.assemblyDate,
      resultStatus: payload.resultStatus,
      quorumPct: payload.quorumPct,
      note: payload.note,
      bankBalance: reconciliation.realAvailable,
      reserveFund: reconciliation.reserve,
      totalPendingDebt: live.totalPendingDebt,
      checklistScore,
      archivedAt: new Date().toISOString()
    };
    updateCommunity(currentCommunity.id, {
      annualAccountabilityHistory: [newEntry, ...prevHist]
    });
    triggerToast('📚 Rendición Anual congelada y guardada en el historial de la comunidad.');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0F3D2E] text-white border border-[#D4B895] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#D4B895] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. CABECERA INSTITUCIONAL Y SELECTOR DE LAS 2 FASES */}
      <div className="bg-gradient-to-r from-[#0F3D2E] via-[#144937] to-[#0F3D2E] text-white p-5 sm:p-7 rounded-3xl shadow-md border border-[#D4B895]/30 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4B895] text-[#0F3D2E]">
                Ley N° 21.442 • Arts. 20° y 21°
              </span>
              <span className="text-xs text-emerald-100 font-semibold">
                {live.communityName} ({live.totalUnits} unidades)
              </span>
              {currentCommunity?.handoverStatus === 'ENTREGADA' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-300 text-slate-950">
                  Archivo Histórico • Entregada
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Rendición de Cuentas & Traspaso Oficial de Comunidad
            </h1>
            <p className="text-xs text-emerald-100/85 max-w-3xl leading-relaxed">
              Flujo completo en 3 etapas: <strong>1. Pauta y Checklist (3 páginas)</strong>, <strong>2. Cuadratura Contable, Dossier PDF y Exportación CSV/JSON</strong>, y <strong>3. Notificación, Baja de Mandatos y Cierre Histórico</strong>.
            </p>
          </div>

          <div className="bg-black/25 p-1.5 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActivePhase('traspaso');
                if (activeTabView === 'checklist') onChangeSubSection?.('traspaso_pauta');
              }}
              className={`px-4 py-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activePhase === 'traspaso'
                  ? 'bg-[#D4B895] text-[#0F3D2E] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <div>
                <span className="text-xs font-black block leading-tight">Entrega & Traspaso Final</span>
                <span className="text-[10px] font-semibold opacity-85 block">7 Bloques A–G • Cambio Admin.</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePhase('anual');
                if (activeTabView === 'checklist') onChangeSubSection?.('anual_pauta');
              }}
              className={`px-4 py-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activePhase === 'anual'
                  ? 'bg-[#D4B895] text-[#0F3D2E] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <div>
                <span className="text-xs font-black block leading-tight">Rendición de Cuentas Anual</span>
                <span className="text-[10px] font-semibold opacity-85 block">6 Bloques A–F • Asamblea Art. 21</span>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewPautaOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
              <span>Ver Previa Pauta (3 Págs)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPauta}
              className="px-4 py-2 rounded-xl bg-[#D4B895] hover:bg-[#c5a67f] text-[#0F3D2E] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Descargar Pauta PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN DE LAS 3 ETAPAS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTabView('checklist');
              onChangeSubSection?.(activePhase === 'anual' ? 'anual_pauta' : 'traspaso_pauta');
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer ${
              activeTabView === 'checklist'
                ? 'bg-[#0F3D2E] text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckSquare className={`w-4 h-4 shrink-0 ${activeTabView === 'checklist' ? 'text-[#D4B895]' : 'text-[#0F3D2E]'}`} />
              <span>1. Checklist & Pauta ({activePhase === 'anual' ? 'A–F' : 'A–G'})</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTabView === 'checklist' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-200 text-slate-700'}`}>
              {checklistScore}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabView('documentos');
              onChangeSubSection?.('documentos_traspaso');
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer ${
              activeTabView === 'documentos'
                ? 'bg-[#0F3D2E] text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderArchive className={`w-4 h-4 shrink-0 ${activeTabView === 'documentos' ? 'text-[#D4B895]' : 'text-[#0F3D2E]'}`} />
              <span>2. Cuadratura & Bandeja Docs.</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTabView === 'documentos' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-emerald-100 text-[#0F3D2E]'}`}>
              {activePhase === 'anual' ? '11 Docs' : '14 Docs'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabView('cierre');
              onChangeSubSection?.('cierre_traspaso');
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer ${
              activeTabView === 'cierre'
                ? 'bg-[#0F3D2E] text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTabView === 'cierre' ? 'text-[#D4B895]' : 'text-[#0F3D2E]'}`} />
              <span>3. Notificación, Mandatos & Cierre</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTabView === 'cierre' ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-amber-100 text-amber-900'}`}>
              Blindaje
            </span>
          </button>
        </div>
      </div>

      {/* 3. PASO 1: CHECKLIST ESTRUCTURADO */}
      {activeTabView === 'checklist' && (
        <CommunityHandoverChecklistScreen
          phase={activePhase}
          sections={activeSections}
          entries={activeEntries}
          onUpdateEntry={handleUpdateEntry}
          onMarkSectionDone={handleMarkSectionDone}
          onAutoFillFromSystem={handleAutoFillFromSystem}
          onResetAllEntries={handleResetAllEntries}
          meta={meta}
          onUpdateMeta={handleUpdateMeta}
          live={live}
          onNavigateToTab={onNavigateToTab}
          onOpenPreviewPauta={() => setPreviewPautaOpen(true)}
          onPrintPauta={handlePrintPauta}
          onGoToDocumentsStep={() => {
            setActiveTabView('documentos');
            onChangeSubSection?.('documentos_traspaso');
          }}
        />
      )}

      {/* 4. PASO 2: CUADRATURA CONTABLE, DOSSIER COMPLETO Y BANDEJA DE DOCUMENTOS */}
      {activeTabView === 'documentos' && (
        <CommunityHandoverDocumentsTray
          phase={activePhase}
          currentCommunity={currentCommunity}
          getUnitFinancials={getUnitFinancials}
          live={live}
          meta={meta}
          company={companyInfo}
          sections={activeSections}
          entries={activeEntries}
          docState={docState}
          setDocState={setDocState}
          mandateChecks={mandateChecks}
          pdfStyle={pdfStyle}
          onSetPdfStyle={setPdfStyle}
          onGoToChecklist={() => {
            setActiveTabView('checklist');
            onChangeSubSection?.(activePhase === 'anual' ? 'anual_pauta' : 'traspaso_pauta');
          }}
          onGoToClosureStep={() => {
            setActiveTabView('cierre');
            onChangeSubSection?.('cierre_traspaso');
          }}
          onOpenChecklistPreview={() => setPreviewPautaOpen(true)}
          onPrintChecklistPauta={handlePrintPauta}
          onMarkPortabilityExported={() => {
            setHandoverEntries((prev) => ({
              ...prev,
              tr_f2: {
                ...(prev.tr_f2 || {}),
                status: 'entregado',
                format: 'Digital (PDF / Excel)',
                quantity: 'CSV Excel + JSON',
                notes: 'Pack abierto de portabilidad exportado desde ARANPRO.'
              }
            }));
          }}
          onNavigateToTab={onNavigateToTab}
          onTriggerToast={triggerToast}
          externalPreviewDocKey={externalPreviewDocKey}
          onClearExternalPreview={() => setExternalPreviewDocKey(null)}
        />
      )}

      {/* 5. PASO 3: NOTIFICACIÓN, BAJA DE MANDATOS Y CIERRE HISTÓRICO */}
      {activeTabView === 'cierre' && (
        <CommunityHandoverClosureStep
          phase={activePhase}
          currentCommunity={currentCommunity}
          live={live}
          meta={meta}
          company={companyInfo}
          checklistScore={checklistScore}
          reconciliation={reconciliation}
          mandateChecks={mandateChecks}
          onToggleMandateCheck={(id) => setMandateChecks((prev) => ({ ...prev, [id]: !prev[id] }))}
          onPreviewDoc={(key) => {
            setActiveTabView('documentos');
            onChangeSubSection?.('documentos_traspaso');
            setExternalPreviewDocKey(key);
          }}
          onPrintDoc={handlePrintClosureDoc}
          onArchiveHandover={handleArchiveHandover}
          onReactivateCommunity={handleReactivateCommunity}
          onArchiveAnnualRendition={handleArchiveAnnualRendition}
          onTriggerToast={triggerToast}
        />
      )}

      {/* 6. MODAL DE VISTA PREVIA CANÓNICA DE LA PAUTA DE 3 PÁGINAS */}
      {previewPautaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-4 md:p-6 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col relative">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-black text-xs shadow-xs">
                  PDF
                </span>
                <div>
                  <h4 className="text-sm md:text-base font-black text-slate-900">
                    {activePhase === 'anual'
                      ? 'Vista Previa Oficial: Pauta de Rendición de Cuentas Anual (3 Páginas Carta)'
                      : 'Vista Previa Oficial: Pauta de Entrega y Traspaso de Administración (3 Páginas Carta)'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-mono">
                    {meta.communityName || live.communityName} • Formato Canónico ARANPRO • Ley N° 21.442
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
                <button
                  type="button"
                  onClick={handlePrintPauta}
                  className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPautaOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-100/80 p-3 md:p-5 rounded-2xl">
              <CommunityHandoverPautaPrint
                printableId="preview-community-handover-pauta"
                phase={activePhase}
                sections={activeSections}
                entries={activeEntries}
                meta={meta}
                live={live}
                company={companyInfo}
                pdfStyle={pdfStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. CONTENEDORES OCULTOS SIEMPRE MONTADOS (PAUTA + DOCUMENTOS DE PASO 3) */}
      <div className="hidden" aria-hidden="true">
        <CommunityHandoverPautaPrint
          printableId="printable-community-handover-pauta"
          phase={activePhase}
          sections={activeSections}
          entries={activeEntries}
          meta={meta}
          live={live}
          company={companyInfo}
          pdfStyle={pdfStyle}
        />
        {['carta_puesta_disposicion', 'constancia_baja_mandatos'].map((k) => (
          <CanonicalHandoverDocumentPrint
            key={k}
            printableId={`printable-closure-${k}`}
            docKey={k}
            phase={activePhase}
            currentCommunity={currentCommunity}
            getUnitFinancials={getUnitFinancials}
            live={live}
            meta={meta}
            company={companyInfo}
            sections={activeSections}
            entries={activeEntries}
            docState={docState}
            mandateChecks={mandateChecks}
            pdfStyle={pdfStyle}
          />
        ))}
      </div>
    </div>
  );
}
