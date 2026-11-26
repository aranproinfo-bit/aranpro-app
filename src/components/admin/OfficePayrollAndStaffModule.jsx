import { printCommunityLabor } from '../../utils/communityLaborPrint';
import { CommunityLaborHeader, CommunityLaborFooter } from './CommunityLaborStationery';
import CommunityLaborAnnex from './CommunityLaborAnnex';
import CommunityPreventionDocument from './CommunityPreventionDocument';
import CommunitySettlementDocument from './CommunitySettlementDocument';
import { PreviredStepByStepGuide, TerminationStepByStepGuide } from './LaborProcedureGuides';
import LaborRoleSelect from './LaborRoleSelect';
import LaborContractDraft from './LaborContractDraft';
import OvertimeAgreementDraft from './OvertimeAgreementDraft';
import React, { useState, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import {
  CHILE_IMM,
  CHILE_TOPE_GRATIFICACION_MENSUAL,
  AFP_RATES_CHILE,
  HEALTH_SYSTEMS_CHILE,
  MUTUAL_ENTITIES_CHILE,
  calculateOvertimeHourValue,
  calculateMonthlyPayroll,
  numberToSpanishWords,
  calculateVacationBalance,
  generatePreviredTxtContent
} from '../../utils/chileanPayrollCalculations';
import { formatCLP } from '../../utils/formatters';
import { useLaborMinimumIndicator } from '../../hooks/useLaborMinimumIndicator';
import { minimumForPayrollPeriod } from '../../utils/chileanPayrollCalculations';
import { printDocumentDirectly } from '../../utils/printDocument';
import { AranproOfficialSeal, useAranproPdfStyle, AranproPdfStyleSelector } from '../common/MauranLogo';
import {
  Users, UserPlus, FileText, Printer, CheckCircle2, AlertCircle,
  Building2, ShieldCheck, DollarSign, Calendar, Clock, Download,
  ExternalLink, Copy, Check, ChevronRight, ArrowRight, Eye, Edit3,
  Trash2, Plus, Sparkles, AlertTriangle, Briefcase, FileSpreadsheet,
  Award, Landmark, HelpCircle, X, BookOpen, Shield, ScrollText,
  Palmtree, FileCheck, FileSignature, UserMinus, Scale, ShieldAlert
} from 'lucide-react';

// Ajustes propios de la liquidación: mantienen legible la ficha sin alterar otras impresiones laborales.
const payrollSlipPrintStyles = `
  .dossier-page .payroll-brand-logo { width: 22mm !important; height: auto !important; max-height: 13mm !important; object-fit: contain !important; }
  .dossier-page .payroll-worker-details { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
  .dossier-page .payroll-net-summary { flex-direction: row !important; justify-content: space-between !important; align-items: center !important; }
  .dossier-page .payroll-net-summary > div:last-child { text-align: right !important; }
  .aranpro-print-watermark { display: none !important; }
  .dossier-page .payroll-worker-details > div { min-width: 0; overflow-wrap: anywhere; }
`;

export const OfficePayrollAndStaffModule = (props) => <OfficeStaffPanel {...props} />;

const DEFAULT_OFFICE_STAFF = [
  {
    id: 'ow-1',
    name: 'Camila Andrea Soto Valenzuela',
    rut: '18.452.910-3',
    role: 'Asistente de Administración & Atención Vecinos',
    category: 'Administración',
    shift: 'Lunes a Viernes (09:00 a 18:00 hrs)',
    weeklyHours: 40,
    contractType: 'Contrato Indefinido',
    startDate: '2025-03-01',
    status: 'ACTIVO',
    baseSalary: 680000,
    hasLegalGratification: true,
    contractualNightBonus: 0,
    contractualResponsibilityBonus: 0,
    allowanceColacion: 35000,
    allowanceMovilizacion: 30000,
    afpId: 'habitat',
    afpName: 'AFP Habitat',
    afpRate: 11.27,
    healthId: 'fonasa',
    healthName: 'Fonasa (7.0%)',
    healthSystem: 'Fonasa (7.0%)',
    healthRate: 7.0,
    mutualEntity: 'Mutual de Seguridad CChC',
    mutualRate: 0.93,
    afcEmployerRate: 2.4,
    isExemptFromAfc: false,
    bankName: 'Banco Estado',
    accountType: 'Cuenta RUT',
    accountNumber: '18452910',
    previredStatus: 'AL DÍA',
    assignedCommunities: 'Todas las comunidades'
  },
  {
    id: 'ow-2',
    name: 'Roberto Ignacio Morales Tapia',
    rut: '15.890.231-K',
    role: 'Inspector Técnico de Terreno (Bombas & Mantención)',
    category: 'Operaciones',
    shift: 'Lunes a Viernes (09:00 a 18:00 hrs)',
    weeklyHours: 40,
    contractType: 'Contrato Indefinido',
    startDate: '2025-06-15',
    status: 'ACTIVO',
    baseSalary: 580000,
    hasLegalGratification: true,
    contractualNightBonus: 0,
    contractualResponsibilityBonus: 0,
    allowanceColacion: 35000,
    allowanceMovilizacion: 30000,
    afpId: 'modelo',
    afpName: 'AFP Modelo',
    afpRate: 10.58,
    healthId: 'fonasa',
    healthName: 'Fonasa (7.0%)',
    healthSystem: 'Fonasa (7.0%)',
    healthRate: 7.0,
    mutualEntity: 'Mutual de Seguridad CChC',
    mutualRate: 0.93,
    afcEmployerRate: 2.4,
    isExemptFromAfc: false,
    bankName: 'Banco de Chile',
    accountType: 'Cuenta Vista',
    accountNumber: '15890231',
    previredStatus: 'AL DÍA',
    assignedCommunities: 'Visitas técnicas semanales'
  }
];

const normalizeOfficeWorker = (w) => {
  const baseSalary = Number(w.baseSalary) > 0 ? Number(w.baseSalary) : (Number(w.grossSalary) > 0 ? Number(w.grossSalary) : 550000);
  const isHonorarios = w.contractType === 'Boleta de Honorarios';
  const afpRaw = String(w.afpName || '').toLowerCase();
  const inferredAfpId = w.afpId || (['habitat', 'provida', 'modelo', 'cuprum', 'capital', 'planvital', 'uno'].find((id) => afpRaw.includes(id)) || 'modelo');
  return {
    ...w,
    category: w.category || 'Oficina',
    shift: w.shift || 'Lunes a Viernes (09:00 a 18:00 hrs)',
    weeklyHours: Number(w.weeklyHours) > 0 ? Number(w.weeklyHours) : 40,
    status: w.status || 'ACTIVO',
    baseSalary,
    hasLegalGratification: typeof w.hasLegalGratification === 'boolean' ? w.hasLegalGratification : !isHonorarios,
    contractualNightBonus: Number(w.contractualNightBonus) || 0,
    contractualResponsibilityBonus: Number(w.contractualResponsibilityBonus) || 0,
    allowanceColacion: Number(w.allowanceColacion) || 0,
    allowanceMovilizacion: Number(w.allowanceMovilizacion) || 0,
    afpId: inferredAfpId,
    afpName: w.afpName || 'AFP Modelo',
    afpRate: Number(w.afpRate) > 0 ? Number(w.afpRate) : 10.58,
    healthId: w.healthId || 'fonasa',
    healthName: w.healthName || w.healthSystem || 'Fonasa (7.0%)',
    healthRate: Number(w.healthRate) > 0 ? Number(w.healthRate) : 7.0,
    mutualEntity: w.mutualEntity || 'Mutual de Seguridad CChC',
    mutualRate: Number(w.mutualRate) > 0 ? Number(w.mutualRate) : 0.93,
    isExemptFromAfc: Boolean(w.isExemptFromAfc),
    bankName: w.bankName || 'Banco Estado',
    accountType: w.accountType || 'Cuenta RUT',
    accountNumber: w.accountNumber || ''
  };
};

const OfficeStaffPanel = ({
  activeSubTab = 'nomina',
  onSubTabChange
}) => {
  const { companySettings } = useCommunity();
  const [pdfStyle] = useAranproPdfStyle();

  // Sub-pestaña interna si no viene del padre
  const [internalSubTab, setInternalSubTab] = useState('nomina');
  const currentSubTab = activeSubTab || internalSubTab;
  const setSubTab = onSubTabChange || setInternalSubTab;

  // Personal propio de la oficina administradora ARANPRO (normalizado al esquema completo DT)
  const [staff, setStaff] = useState(() => {
    try {
      const saved = localStorage.getItem('aranpro_office_workers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeOfficeWorker);
        }
      }
    } catch {}
    return DEFAULT_OFFICE_STAFF;
  });

  const updateStaff = (newStaffOrFn) => {
    setStaff((prev) => {
      const updated = typeof newStaffOrFn === 'function' ? newStaffOrFn(prev) : newStaffOrFn;
      try {
        localStorage.setItem('aranpro_office_workers', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Simulación de entidad empleadora (Oficina ARANPRO)
  const currentCommunity = useMemo(() => ({
    id: 'aranpro-office',
    name: companySettings?.legalName || companySettings?.brandName || 'ARANPRO Administración SpA',
    address: companySettings?.legalAddress || companySettings?.address || 'La Serena / Coquimbo, Chile',
    city: companySettings?.city || 'La Serena / Coquimbo',
    staff: staff,
    activePeriod: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    },
    bankInfo: {
      holderName: companySettings?.legalName || companySettings?.brandName || 'ARANPRO Administración SpA',
      rut: companySettings?.companyRut && !String(companySettings.companyRut).includes('76.999.888')
        ? companySettings.companyRut
        : (companySettings?.adminRut || '76.412.890-1'),
      bank: companySettings?.bankName || 'Banco de Chile',
      accountType: companySettings?.accountType || 'Cuenta Corriente',
      accountNumber: companySettings?.accountNumber || '00-12345-67'
    }
  }), [companySettings, staff]);

  // Periodo seleccionado para cálculo (por defecto el periodo activo de la comunidad)
  const activeMonth = currentCommunity?.activePeriod?.month || (new Date().getMonth() + 1);
  const activeYear = currentCommunity?.activePeriod?.year || new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(activeMonth);
  const [selectedYear, setSelectedYear] = useState(activeYear);
  const indicator = useLaborMinimumIndicator();
  const [minimumOverrides,setMinimumOverrides] = useState({});
  const periodKey = String(selectedYear) + '-' + String(selectedMonth).padStart(2,'0');
  const knownMinimum = minimumForPayrollPeriod(selectedYear,selectedMonth,indicator.reference,indicator.today);
  const enteredMinimum = Number(minimumOverrides[periodKey]?.amount);
  const minimumSource = minimumOverrides[periodKey]?.source?.trim();
  const minimumConflict = Boolean(knownMinimum && indicator.reference?.asOf === indicator.today && indicator.today.slice(0,7)===periodKey && indicator.reference.value !== knownMinimum);
  const confirmedMinimum = enteredMinimum>0 && minimumSource ? enteredMinimum : null;
  const periodMinimum = minimumConflict ? confirmedMinimum : knownMinimum || confirmedMinimum;
  const periodLabel = `${String(selectedMonth).padStart(2, '0')}/${selectedYear}`;
  const periodLongName = `${[
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ][selectedMonth - 1]} ${selectedYear}`;

  // Inputs mensuales variables por trabajador (días, horas extras, bonos, anticipos)
  const [monthlyInputs, setMonthlyInputs] = useState(() => {
    const map = {};
    staff.forEach((w) => {
      map[w.id] = {
        daysWorked: 30,
        overtimeHours: 0,
        extraTaxableBonus: 0,
        extraNonTaxableBonus: 0,
        advances: 0,
        otherDiscounts: 0
      };
    });
    return map;
  });

  // Modales
  // Modal para Ver / Imprimir Liquidación de Sueldo DT
  const [selectedWorkerForSlip, setSelectedWorkerForSlip] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Modal para Ver / Imprimir Contrato de Trabajo DT
  const [selectedWorkerForContract, setSelectedWorkerForContract] = useState(null);
  const [annexWorker,setAnnexWorker] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Modal para Ver / Imprimir Planilla Mensual de Remuneraciones (Libro de Sueldos)
  const [showMonthlySheetModal, setShowMonthlySheetModal] = useState(false);

  // Modal para Ver / Imprimir Planilla Previred
  const [showPreviredSheetModal, setShowPreviredSheetModal] = useState(false);

  // Modal para Ver / Imprimir Nómina General de Personal
  const [showRosterModal, setShowRosterModal] = useState(false);

  // Modal para Ver / Imprimir Reglamento Interno (RIOHS)
  const [showRiohsModal, setShowRiohsModal] = useState(false);

  // Sub-sección interna de Documentos y RRHH ('contratos' | 'vacaciones' | 'horas_extras' | 'finiquitos' | 'riohs_karin')
  const [docSection, setDocSection] = useState('contratos');

  // Estado y Modales para Feriado Legal & Vacaciones DT
  const [selectedWorkerForVacation, setSelectedWorkerForVacation] = useState(null);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showVacationPrintModal, setShowVacationPrintModal] = useState(false);
  const [vacationForm, setVacationForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysTaken: 15,
    periodLabel: 'Periodo Legal Ordinario',
    notes: 'Uso de feriado legal ordinario anual pactado de común acuerdo con la administración.'
  });

  // Estado y Modales para Finiquito Laboral & Carta de Despido (Art. 159, 160, 161)
  const [selectedWorkerForSeverance, setSelectedWorkerForSeverance] = useState(null);
  const [showSeveranceModal, setShowSeveranceModal] = useState(false);
  const [severanceInitialMode, setSeveranceInitialMode] = useState('settlement');
  // Estado y Modal para Pacto Bilateral de Horas Extras (Art. 32 Código del Trabajo)
  const [selectedWorkerForOvertimePact, setSelectedWorkerForOvertimePact] = useState(null);
  const [showOvertimePactModal, setShowOvertimePactModal] = useState(false);


  // Estado para Protocolo Ley Karin
  const [showKarinModal, setShowKarinModal] = useState(false);

  // Descarga del archivo plano TXT para Previred (105 campos)
  const handleDownloadPreviredTxt = () => {
    if (!ensurePayrollReady()) return;
    try {
      const txt = generatePreviredTxtContent(currentCommunity, payrollConsolidated, selectedMonth, selectedYear);
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Previred_${(currentCommunity.name || 'Comunidad').replace(/\s+/g, '_')}_${periodLabel.replace('/', '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExpenseIntegrationToast('Archivo Previred (.txt) generado y descargado exitosamente. Listo para subir en www.previred.com.');
    } catch (err) {
      console.error('Error generando TXT Previred:', err);
      alert('Error al generar archivo TXT de Previred');
    }
  };

  // Toast / feedback de traspaso a Gastos Comunes
  const [expenseIntegrationToast, setExpenseIntegrationToast] = useState('');
  const [copiedPrevired, setCopiedPrevired] = useState(false);

  // Helper para obtener inputs de un trabajador
  const getWorkerInputs = (workerId) => {
    return monthlyInputs[workerId] || {
      daysWorked: 30,
      overtimeHours: 0,
      extraTaxableBonus: 0,
      extraNonTaxableBonus: 0,
      advances: 0,
      otherDiscounts: 0
    };
  };

  const handleUpdateWorkerInput = (workerId, field, value) => {
    setMonthlyInputs((prev) => ({
      ...prev,
      [workerId]: {
        ...getWorkerInputs(workerId),
        [field]: Number(value) || 0
      }
    }));
  };

  // Cálculos consolidados para todos los trabajadores en el periodo
  const payrollConsolidated = useMemo(() => {
    const activeStaff = staff.filter((s) => s.status !== 'FINIQUITADO');
    let totalTaxable = 0;
    let totalNonTaxable = 0;
    let totalGross = 0;
    let totalPrevisionalDiscounts = 0;
    let totalAdvances = 0;
    let totalNet = 0;
    let totalEmployerSis = 0;
    let totalEmployerAfc = 0;
    let totalEmployerMutual = 0;
    let totalEmployerCosts = 0;
    let totalCommunityCost = 0;

    const slips = activeStaff.map((w) => {
      const inputs = getWorkerInputs(w.id);
      const calc = calculateMonthlyPayroll(w, inputs, periodMinimum || 0);

      totalTaxable += calc.totalTaxable;
      totalNonTaxable += calc.totalNonTaxable;
      totalGross += calc.totalGross;
      totalPrevisionalDiscounts += calc.totalPrevisionalDiscounts;
      totalAdvances += calc.advances;
      totalNet += calc.netSalary;
      totalEmployerSis += calc.employerSisAmount;
      totalEmployerAfc += calc.employerAfcAmount;
      totalEmployerMutual += calc.employerMutualAmount;
      totalEmployerCosts += calc.totalEmployerCosts;
      totalCommunityCost += calc.totalCommunityCost;

      return { worker: w, calc };
    });

    // Total Leyes Sociales (Previred = Descuentos trabajadores + Aportes patronales)
    const totalPreviredLeyesSociales = totalPrevisionalDiscounts + totalEmployerCosts;

    return {
      activeCount: activeStaff.length,
      slips,
      totalTaxable,
      totalNonTaxable,
      totalGross,
      totalPrevisionalDiscounts,
      totalAdvances,
      totalNet,
      totalEmployerSis,
      totalEmployerAfc,
      totalEmployerMutual,
      totalEmployerCosts,
      totalPreviredLeyesSociales,
      totalCommunityCost
    };
  }, [staff, monthlyInputs, periodMinimum]);

  const pendingGratification = staff.filter(worker => worker.status !== 'FINIQUITADO' && typeof worker.hasLegalGratification !== 'boolean');
  const pendingOvertime = staff.filter(worker => {
    const inputs = getWorkerInputs(worker.id);
    return Number(inputs.overtimeHours)>0 && (!(Number(worker.weeklyHours)>0) || !(Number(inputs.overtimeSalaryBase)>=Number(worker.baseSalary) && Number(inputs.overtimeSalaryBase)>0));
  });
  const ensurePayrollReady = () => {
    if (!periodMinimum) { alert('Para calcular remuneraciones, selecciona Liquidaciones e ingresa el ingreso mínimo del período y su fuente.'); return false; }
    if (pendingGratification.length) {
      alert('Confirma en la ficha la modalidad de gratificación de: ' + pendingGratification.map(worker=>worker.name).join(', ') + '.');
      return false;
    }
    if (!pendingOvertime.length) return true;
    alert('Confirma la base de cálculo de horas extras para: ' + pendingOvertime.map(worker=>worker.name).join(', ') + '. Verifica las horas pactadas en la ficha y confirma una base que incluya los conceptos fijos que correspondan.');
    return false;
  };

  // Verificar si ya se registraron los gastos de sueldo en este periodo
  const alreadyExportedToExpenses = useMemo(() => {
    const periodStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const expenses = currentCommunity?.expenses || [];
    return expenses.some(
      (e) =>
        (e.category === 'Sueldos' || e.category === 'Remuneraciones') &&
        (e.description?.includes(periodStr) || e.description?.includes(periodLabel))
    );
  }, [currentCommunity?.expenses, selectedMonth, selectedYear, periodLabel]);

  // Una sola ficha para registrar al trabajador y preparar su contrato.
  const handleOpenCreateStaff = () => {
    const draftKey = 'aranpro-new-office-worker';
    let id = sessionStorage.getItem(draftKey);
    if (!id) {
      id = 'stf-' + crypto.randomUUID();
      sessionStorage.setItem(draftKey, id);
    }
    setSelectedWorkerForContract({id, name:'', rut:'', role:'', status:'ACTIVO'});
    setShowContractModal(true);
  };
  const handleOpenEditStaff = worker => {
    setSelectedWorkerForContract(worker);
    setShowContractModal(true);
  };
  const saveUnifiedWorker = worker => {
    const normalize = value => String(value || '').replace(/[.\s-]/g,'').toUpperCase();
    updateStaff(prev => {
      const exists = prev.some(item => item.id === worker.id);
      return exists ? prev.map(item => item.id === worker.id ? {...item, ...worker} : item) : [...prev, worker];
    });
    sessionStorage.removeItem('aranpro-new-office-worker');
  };

  // Eliminar / dar de baja trabajador
  const handleDeleteStaff = (workerId) => {
    if (!window.confirm('¿Deseas desvincular a este colaborador de la nómina de tu oficina?')) return;
    updateStaff(prev => prev.filter(w => w.id !== workerId));
  };

  // Traspasar Sueldos e Imposiciones del Mes a Gastos Comunes (1 Clic)
  const handleExportToCommunityExpenses = () => {
    if (!ensurePayrollReady()) return;
    if (payrollConsolidated.activeCount === 0) {
      alert('No hay trabajadores activos en la nómina para registrar.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const officeExpenses = JSON.parse(localStorage.getItem('aranpro_office_payroll_records') || '[]');
      const record = {
        period: periodLabel,
        date: todayStr,
        activeCount: payrollConsolidated.activeCount,
        totalNet: payrollConsolidated.totalNet,
        totalPrevired: payrollConsolidated.totalPreviredLeyesSociales,
        totalCost: payrollConsolidated.totalCommunityCost
      };
      const filtered = officeExpenses.filter(r => r.period !== periodLabel);
      filtered.push(record);
      localStorage.setItem('aranpro_office_payroll_records', JSON.stringify(filtered));
    } catch {}

    setExpenseIntegrationToast(`¡Listo! Se consolidaron exitosamente los costos de Sueldos Líquidos (${periodMinimum ? formatCLP(payrollConsolidated.totalNet) : 'Pendiente de mínimo'}) y Leyes Sociales (${periodMinimum ? formatCLP(payrollConsolidated.totalPreviredLeyesSociales) : 'Pendiente de mínimo'}) de tu oficina para el periodo ${periodLabel}.`);
    setTimeout(() => setExpenseIntegrationToast(''), 7000);
  };

  // Copiar resumen previsional al portapapeles
  const handleCopyPreviredSummary = () => {
    if (!ensurePayrollReady()) return;
    const text = `RESUMEN DE COTIZACIONES PREVISIONALES - PREVIRED
Empresa Empleadora: ${currentCommunity.name} (RUT: ${currentCommunity.bankInfo?.rut || ''})
Periodo: ${periodLabel}
Total Trabajadores: ${payrollConsolidated.activeCount}
---------------------------------------------
• Masa Salarial Imponible: ${periodMinimum ? formatCLP(payrollConsolidated.totalTaxable) : 'Pendiente de mínimo'}
• Cotizaciones AFP (Trabajadores): ${formatCLP(payrollConsolidated.totalPrevisionalDiscounts - Math.round(payrollConsolidated.totalTaxable * 0.076))}
• Cotizaciones Salud (Fonasa/Isapre 7%): ${formatCLP(Math.round(payrollConsolidated.totalTaxable * 0.07))}
• Seguro Cesantía AFC (Trabajador 0.6%): ${formatCLP(Math.round(payrollConsolidated.totalTaxable * 0.006))}
• Seguro Invalidez SIS (Empleador 1.49%): ${formatCLP(payrollConsolidated.totalEmployerSis)}
• Seguro Cesantía AFC (Empleador 2.4%): ${formatCLP(payrollConsolidated.totalEmployerAfc)}
• Mutual de Seguridad (Empleador 0.93%): ${formatCLP(payrollConsolidated.totalEmployerMutual)}
---------------------------------------------
TOTAL A DECLARAR Y PAGAR EN PREVIRED: ${formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}
TOTAL SUELDOS LÍQUIDOS A TRANSFERIR: ${formatCLP(payrollConsolidated.totalNet)}
COSTO TOTAL OFICINA: ${formatCLP(payrollConsolidated.totalCommunityCost)}`;

    navigator.clipboard.writeText(text);
    setCopiedPrevired(true);
    setTimeout(() => setCopiedPrevired(false), 3000);
  };

  // Helper para generar cabecera corporativa estándar ARANPRO en PDFs
  const renderAranproPdfHeader = (badge, title, folio) => (
    <CommunityLaborHeader employerKind="company" settings={companySettings} community={currentCommunity} badge={badge} title={title} folio={folio} period={periodLongName}/>
  );
  const renderAranproPdfFooter = (page, total, title) => (
    <CommunityLaborFooter settings={companySettings} title={title} page={page} total={total}/>
  );

  // Helper para membrete de continuidad en páginas 2+
  const renderAdminSignatureBlock = (sublabel = 'POR EL EMPLEADOR', compact = false) => {
    const adminSignature = companySettings?.signatureDataUrl || companySettings?.signature || companySettings?.digitalSignature || '';
    const adminScale = Number(companySettings?.signatureScale) || 1.35;
    return (
      <div className="space-y-1 relative text-center min-w-[260px]">
        <div className={`${compact ? 'h-12' : 'h-16'} flex items-end justify-center gap-3 md:gap-4 mb-1`}>
          {/* Sello Oficial Institucional al lado izquierdo */}
          <div className="shrink-0 flex items-center mb-0.5">
            <AranproOfficialSeal
              size="sm"
              showText={true}
              companyRut={companySettings?.companyRut && !String(companySettings.companyRut).includes('76.999.888') ? companySettings.companyRut : ''}
              rnacNumber={companySettings?.rnacNumber || ''}
            />
          </div>

          {/* Firma Manuscrita Digital al lado derecho */}
          <div className="shrink-0 flex items-end justify-center">
            {adminSignature ? (
              <img
                src={adminSignature}
                alt="Firma Empleador"
                className={`${compact ? 'h-10 max-h-12' : 'h-13 max-h-15'} w-auto max-w-[150px] object-contain`}
                style={{ transform: `scale(${adminScale})`, transformOrigin: 'bottom center' }}
              />
            ) : (
              <div className={`${compact ? 'h-9' : 'h-12'} flex items-center justify-center`}>
              </div>
            )}
          </div>
        </div>

        <div className="border-t-[1.5px] border-slate-800 pt-1.5">
          <strong className="block text-slate-900 font-black text-xs leading-tight">
            {companySettings?.adminName || '____________________'}
          </strong>
          <p className="text-[9.5px] text-slate-600 font-mono">
            RUT: {companySettings?.adminRut || '____________________'}
          </p>
          <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">
            {sublabel}
          </p>
        </div>
      </div>
    );
  };

  if (!periodMinimum && ['liquidaciones','previred','gastos_comunes'].includes(currentSubTab)) return <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3">
    <h2 className="font-bold text-amber-950">Ingreso mínimo para el período de remuneración</h2>
    <p className="text-sm">No fue posible establecer el ingreso mínimo de {periodKey} con una referencia única. Comprueba el monto general y su fuente, o selecciona otro período. El valor se utiliza para el cálculo de gratificación.</p>
    <div className="flex flex-wrap gap-3">
      <label>Mes <input aria-label="Mes" type="number" min="1" max="12" value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))} className="border rounded p-2 w-20" /></label>
      <label>Año <input aria-label="Año" type="number" min="2024" max="2100" value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))} className="border rounded p-2 w-24" /></label>
      <label>Ingreso mínimo ($) <input aria-label="Ingreso mínimo para el período" type="number" min="1" value={minimumOverrides[periodKey]?.amount||''} onChange={e=>setMinimumOverrides(v=>({...v,[periodKey]:{...v[periodKey],amount:e.target.value}}))} className="border rounded p-2 w-36" /></label>
      <label>Fuente y vigencia <input aria-label="Fuente del ingreso mínimo" value={minimumOverrides[periodKey]?.source||''} onChange={e=>setMinimumOverrides(v=>({...v,[periodKey]:{...v[periodKey],source:e.target.value}}))} className="border rounded p-2" /></label>
    </div>
  </div>;
  return (
    <div className="space-y-6">
      {/* 1. Cabecera Ejecutiva del Módulo de Remuneraciones */}
      <div className="bg-gradient-to-r from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white p-6 md:p-8 rounded-3xl shadow-lg border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4B895]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4B895]/20 text-[#D4B895] border border-[#D4B895]/30">
                <Users className="w-3.5 h-3.5 text-[#D4B895]" />
                RR.HH. & REMUNERACIONES DE MI OFICINA • ARANPRO
              </span>
              <span className="text-xs text-emerald-200/80 font-medium">
                {currentCommunity?.name}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Equipo Propio, Liquidaciones DT & Leyes Sociales
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Gestión laboral del equipo de tu oficina administradora bajo el Código del Trabajo. Cálculo de gratificaciones Art. 50, horas extras, Previred, contratos, vacaciones, finiquitos y protocolos.
            </p>
          </div>

          {/* Selector de Periodo y Acción Nueva Ficha */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <div className="bg-[#0A291F]/90 border border-[#D4B895]/30 p-2 rounded-2xl flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4B895] ml-1" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-black focus:outline-none cursor-pointer"
              >
                {[
                  { m: 1, name: 'Enero' }, { m: 2, name: 'Febrero' }, { m: 3, name: 'Marzo' },
                  { m: 4, name: 'Abril' }, { m: 5, name: 'Mayo' }, { m: 6, name: 'Junio' },
                  { m: 7, name: 'Julio' }, { m: 8, name: 'Agosto' }, { m: 9, name: 'Septiembre' },
                  { m: 10, name: 'Octubre' }, { m: 11, name: 'Noviembre' }, { m: 12, name: 'Diciembre' }
                ].map((item) => (
                  <option key={item.m} value={item.m} className="bg-[#0F3D2E] text-white">
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-black focus:outline-none cursor-pointer pr-1"
              >
                {Array.from(new Set([...Array.from({length: Math.max(4, Number(indicator.today.slice(0,4)) - 2024 + 3)}, (_,i)=>2024+i), selectedYear])).sort((a,b)=>a-b).map((y) => (
                  <option key={y} value={y} className="bg-[#0F3D2E] text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateStaff}
              className="py-2.5 px-4 rounded-2xl bg-[#D4B895] hover:bg-[#e0c8aa] text-[#0F3D2E] text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuevo Trabajador</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast de Notificación de Integración de Gastos Comunes */}
      {expenseIntegrationToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{expenseIntegrationToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setExpenseIntegrationToast('')}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Tarjetas de Métricas Ejecutivas del Periodo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
            Personal Activo
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-black text-[#0F3D2E]">
              {payrollConsolidated.activeCount}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {staff.length} Registrados
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block">
            Contratos de Oficina ARANPRO
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
            Masa Salarial Imponible
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-black text-slate-900">
              {periodMinimum && !pendingGratification.length && !pendingOvertime.length ? formatCLP(payrollConsolidated.totalTaxable) : 'Pendiente de revisión'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Base imponible cotizaciones
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
            Total Líquido a Transferir
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-black text-emerald-700">
              {periodMinimum && !pendingGratification.length && !pendingOvertime.length ? formatCLP(payrollConsolidated.totalNet) : 'Pendiente de revisión'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Sueldos líquidos en cuentas
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] block">
            Leyes Sociales (Previred)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-black text-[#0F3D2E]">
              {periodMinimum && !pendingGratification.length && !pendingOvertime.length ? formatCLP(payrollConsolidated.totalPreviredLeyesSociales) : 'Pendiente de revisión'}
            </span>
            <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              Día 13
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            AFP + Salud + AFC + SIS + Mutual
          </span>
        </div>
      </div>

      {/* ==================== SUB-PESTAÑA 1: NÓMINA DE PERSONAL & FICHAS DT ==================== */}
      {currentSubTab === 'nomina' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Trabajadores y Colaboradores de Mi Oficina
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Empleador: <strong className="text-slate-700">{currentCommunity.bankInfo?.holderName || currentCommunity.name}</strong> • RUT Patronal: <strong className="text-slate-700">{currentCommunity.bankInfo?.rut || ''}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowRosterModal(true)}
                className="py-2 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir Nómina Oficial</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateStaff}
                className="py-2 px-3.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Contratar Trabajador</span>
              </button>
            </div>
          </div>

          {staff.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No hay trabajadores registrados en tu oficina</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Registra a los conserjes, mayordomos y personal de aseo para gestionar sus sueldos, liquidaciones y leyes sociales.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateStaff}
                className="mt-2 px-4 py-2 bg-[#0F3D2E] text-[#D4B895] rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Primer Trabajador</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((worker) => (
                <div
                  key={worker.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-[#0F3D2E]/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2 py-0.5 rounded-md">
                          {worker.category || 'Oficina'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {worker.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono block">
                          RUT: {worker.rut}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          worker.status === 'ACTIVO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : worker.status === 'VACACIONES'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {worker.status || 'ACTIVO'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Cargo:</span>
                        <span className="font-bold text-slate-800">{worker.role}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Jornada:</span>
                        <span className="font-bold text-slate-800">{worker.weeklyHours ? worker.weeklyHours+' hrs' : 'Jornada por confirmar'} / {worker.shift?.split('(')[0] || 'Diurno'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Sueldo Base:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCLP(worker.baseSalary)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Previsión:</span>
                        <span className="font-bold text-slate-800">{worker.afpName} / {worker.healthName?.split('(')[0] || 'Fonasa'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                        <span>Cuenta Bancaria:</span>
                        <span className="font-mono text-[11px] text-slate-700">{worker.bankName} • {worker.accountNumber || 'Sin cuenta'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!ensurePayrollReady()) return;
                        setSelectedWorkerForSlip(worker);
                        setShowSlipModal(true);
                      }}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#0F3D2E] text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Ver Liquidación del Mes"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F3D2E]" />
                      <span>Liquidación</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkerForContract(worker);
                        setShowContractModal(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title="Ver Contrato Laboral Tipo DT"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditStaff(worker)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title="Editar Ficha del Trabajador"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(worker.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Desvincular Trabajador"
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

      {/* ==================== SUB-PESTAÑA 2: CÁLCULO MENSUAL & LIQUIDACIONES DT ==================== */}
      {currentSubTab === 'liquidaciones' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Fórmula Oficial Dirección del Trabajo (DT)
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Planilla Mensual de Remuneraciones • Periodo {periodLabel}
                </h3>
                <p className="text-xs text-slate-500">
                  Ajusta días trabajados, horas extras y anticipos de cada trabajador. Las liquidaciones se recalculan en tiempo real.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => ensurePayrollReady() && setShowMonthlySheetModal(true)}
                  className="py-2 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimir Planilla Contable del Mes</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportToCommunityExpenses}
                  className={`py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                    alreadyExportedToExpenses
                      ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                      : 'bg-[#0F3D2E] text-[#D4B895] hover:bg-[#0A291F]'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{alreadyExportedToExpenses ? '✓ Traspasado a Gastos' : 'Traspasar a Gastos Comunes'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Gratificación como anticipo referencial según los haberes ingresados y el mínimo de {formatCLP(periodMinimum)} para {periodLabel}. Fuente: {minimumConflict || !knownMinimum ? minimumSource : indicator.reference?.asOf?.slice(0,7) === periodKey && periodKey > '2026-12' ? 'indicadores.cl (fuente informada: Dirección del Trabajo)' : 'montos legales registrados'}. Revisa su procedencia, jornada parcial y ajuste anual. Los sueldos y bonos se toman de la ficha actual; verifica los montos antes de calcular períodos anteriores.
              {pendingGratification.length>0 && <strong className="block mt-1">Pendiente confirmar la gratificación de: {pendingGratification.map(worker=>worker.name).join(', ')}. Los totales son provisionales.</strong>}
              {pendingOvertime.length>0 && <strong className="block mt-1">Pendiente confirmar la base de horas extras de: {pendingOvertime.map(worker=>worker.name).join(', ')}. Los totales son provisionales.</strong>}
            </div>
            {/* Tabla Interactiva de Liquidaciones del Periodo */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Trabajador & Cargo</th>
                    <th className="p-3 text-center">Días</th>
                    <th className="p-3 text-right">Sueldo Base</th>
                    <th className="p-3 text-right">Gratif. Art. 50</th>
                    <th className="p-3 text-center">H. Extras (50%)</th>
                    <th className="p-3 text-right">Total Imponible</th>
                    <th className="p-3 text-right">No Imponible</th>
                    <th className="p-3 text-right">Leyes Sociales</th>
                    <th className="p-3 text-center">Anticipo</th>
                    <th className="p-3 text-right text-emerald-800">Líquido a Pagar</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollConsolidated.slips.map(({ worker, calc }) => {
                    const inputs = getWorkerInputs(worker.id);
                    return (
                      <tr key={worker.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <strong className="block text-slate-900 font-black">{worker.name}</strong>
                          <span className="text-[11px] text-slate-500 block">{worker.role} • RUT {worker.rut}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{worker.afpName} ({calc.afpRate}%)</span>
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={inputs.daysWorked}
                            onChange={(e) => handleUpdateWorkerInput(worker.id, 'daysWorked', e.target.value)}
                            className="w-12 text-center p-1 rounded-lg border border-slate-200 bg-white font-bold"
                          />
                        </td>

                        <td className="p-3 text-right font-mono font-medium text-slate-700">
                          {formatCLP(calc.proratedBase)}
                        </td>

                        <td className="p-3 text-right font-mono font-medium text-slate-700">
                          {formatCLP(calc.gratification)}
                        </td>

                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={inputs.overtimeHours}
                              onChange={(e) => handleUpdateWorkerInput(worker.id, 'overtimeHours', e.target.value)}
                              className="w-12 text-center p-1 rounded-lg border border-slate-200 bg-white font-bold"
                            />
                            <span className="text-[10px] text-slate-400">h</span>
                          </div>
                          {Number(inputs.overtimeHours)>0 && <label className="block mt-2 text-left text-[10px] text-slate-700">Base mensual para horas extras ($)
                            <input aria-label={'Base de horas extras de '+worker.name} type="number" min="1" value={inputs.overtimeSalaryBase||''} onChange={e=>handleUpdateWorkerInput(worker.id,'overtimeSalaryBase',e.target.value)} className="block w-28 rounded border p-1" />
                            <span>Incluye los conceptos fijos que correspondan. Confirma la base antes de emitir.</span>
                          </label>}
                          {calc.overtimeAmount > 0 && (
                            <span className="block text-[10px] text-emerald-700 font-mono">
                              +{formatCLP(calc.overtimeAmount)}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatCLP(calc.totalTaxable)}
                        </td>

                        <td className="p-3 text-right font-mono text-slate-600">
                          {formatCLP(calc.totalNonTaxable)}
                          <span className="block text-[9px] text-slate-400">Colación + Mov.</span>
                        </td>

                        <td className="p-3 text-right font-mono text-rose-700 font-medium">
                          -{formatCLP(calc.totalPrevisionalDiscounts)}
                          <span className="block text-[9px] text-slate-400">AFP + Salud + AFC</span>
                        </td>

                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            value={inputs.advances}
                            onChange={(e) => handleUpdateWorkerInput(worker.id, 'advances', e.target.value)}
                            className="w-20 text-right p-1 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-800"
                            placeholder="$0"
                          />
                        </td>

                        <td className="p-3 text-right font-mono font-black text-sm text-emerald-700 bg-emerald-50/40 rounded-xl">
                          {formatCLP(calc.netSalary)}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (!ensurePayrollReady()) return;
                        setSelectedWorkerForSlip(worker);
                              setShowSlipModal(true);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-[11px] font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Imprimir</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="p-3 uppercase">Total Nómina ({payrollConsolidated.activeCount} Pers.)</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-right font-mono">-</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-right font-mono">{formatCLP(payrollConsolidated.totalTaxable)}</td>
                    <td className="p-3 text-right font-mono">{formatCLP(payrollConsolidated.totalNonTaxable)}</td>
                    <td className="p-3 text-right font-mono text-rose-700">-{formatCLP(payrollConsolidated.totalPrevisionalDiscounts)}</td>
                    <td className="p-3 text-center font-mono">-{formatCLP(payrollConsolidated.totalAdvances)}</td>
                    <td className="p-3 text-right font-mono text-emerald-800 text-sm">{formatCLP(payrollConsolidated.totalNet)}</td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-PESTAÑA 3: PLANILLA PREVIRED & LEYES SOCIALES ==================== */}
      {currentSubTab === 'previred' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Declaración y Pago www.previred.com
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Resumen de Imposiciones y Leyes Sociales • Periodo {periodLabel}
                </h3>
                <p className="text-xs text-slate-500">
                  Consolida los montos a transferir a cada institución previsional antes del día 13 del mes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadPreviredTxt}
                  className="py-2.5 px-3.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Descargar archivo plano oficial listo para subir a previred.com"
                >
                  <Download className="w-4 h-4 text-[#D4B895]" />
                  <span>Descargar Archivo Previred (.txt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => ensurePayrollReady() && setShowPreviredSheetModal(true)}
                  className="py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimir Planilla Previred</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPreviredSummary}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedPrevired ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copiedPrevired ? '¡Copiado!' : 'Copiar Resumen'}</span>
                </button>
              </div>
            </div>

            {/* Guía paso a paso Previred */}
            <PreviredStepByStepGuide employerKind="company" />

            {/* Desglose de Leyes Sociales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Columna Izquierda: Retenciones Trabajador */}
              <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-slate-200 space-y-3">
                <h4 className="font-black text-[#0F3D2E] uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0F3D2E]" />
                  A. Cotizaciones Retenidas al Trabajador
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div>
                      <strong className="block text-slate-800">Fondos de Pensiones (AFP)</strong>
                      <span className="text-[10px] text-slate-500">Hábitat, Provida, Modelo, Capital (10.49% a 11.45%)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCLP(payrollConsolidated.totalPrevisionalDiscounts - Math.round(payrollConsolidated.totalTaxable * 0.076))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div>
                      <strong className="block text-slate-800">Salud (Fonasa / Isapre)</strong>
                      <span className="text-[10px] text-slate-500">Cotización legal del 7.00%</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCLP(Math.round(payrollConsolidated.totalTaxable * 0.07))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <div>
                      <strong className="block text-slate-800">Seguro de Cesantía AFC (Trabajador)</strong>
                      <span className="text-[10px] text-slate-500">0.6% en contratos indefinidos</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCLP(Math.round(payrollConsolidated.totalTaxable * 0.006))}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-black text-slate-900">
                  <span>Subtotal Retenciones:</span>
                  <span className="font-mono text-emerald-800">{formatCLP(payrollConsolidated.totalPrevisionalDiscounts)}</span>
                </div>
              </div>

              {/* Columna Derecha: Aportes Patronales (Costo Comunidad) */}
              <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                <h4 className="font-black text-[#0F3D2E] uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#0F3D2E]" />
                  B. Aportes Patronales de la Empresa
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-100">
                    <div>
                      <strong className="block text-slate-800">Seguro Invalidez y Sobrevivencia (SIS)</strong>
                      <span className="text-[10px] text-slate-500">1.49% a cargo exclusivo del empleador</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCLP(payrollConsolidated.totalEmployerSis)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-100">
                    <div>
                      <strong className="block text-slate-800">Seguro de Cesantía AFC (Empleador)</strong>
                      <span className="text-[10px] text-slate-500">2.4% en indefinidos / 3.0% en plazo fijo</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCLP(payrollConsolidated.totalEmployerAfc)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-100">
                    <div>
                      <strong className="block text-slate-800">Mutual de Seguridad (Ley 16.744)</strong>
                      <span className="text-[10px] text-slate-500">0.93% cotización básica laboral</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCLP(payrollConsolidated.totalEmployerMutual)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between font-black text-slate-900">
                  <span>Subtotal Aportes Patronales:</span>
                  <span className="font-mono text-emerald-800">{formatCLP(payrollConsolidated.totalEmployerCosts)}</span>
                </div>
              </div>
            </div>

            {/* Total General Previred */}
            <div className="p-4 rounded-2xl bg-[#0F3D2E] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
                  Total Consolidado a Pagar en Previred
                </span>
                <span className="text-xl md:text-2xl font-black font-mono">
                  {formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}
                </span>
                <span className="text-[11px] text-emerald-200 block">
                  Suma de retenciones legales ({formatCLP(payrollConsolidated.totalPrevisionalDiscounts)}) + aportes patronales ({formatCLP(payrollConsolidated.totalEmployerCosts)})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://www.previred.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#D4B895] hover:bg-[#e0c8aa] text-[#0F3D2E] text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>Ir a Previred.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-PESTAÑA 4: TRASPASO A GASTOS COMUNES ==================== */}
      {currentSubTab === 'gastos_comunes' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Contabilidad Automatizada Ley 21.442
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                Resumen de Costos Laborales de Oficina del Periodo {periodLabel}
              </h3>
              <p className="text-xs text-slate-500">
                Centraliza los costos de remuneraciones y leyes sociales de tu equipo administrativo para tu contabilidad interna y balances de empresa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Sueldos Líquidos a Cargar</span>
                <span className="text-lg font-black text-slate-900 font-mono block">
                  {formatCLP(payrollConsolidated.totalNet)}
                </span>
                <span className="text-[10px] text-slate-500 block">Transferencias efectivas a personal</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Imposiciones Previred a Cargar</span>
                <span className="text-lg font-black text-slate-900 font-mono block">
                  {formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}
                </span>
                <span className="text-[10px] text-slate-500 block">AFP + Fonasa/Isapre + AFC + SIS + Mutual</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[10px] font-black text-emerald-900 uppercase block">Total Gasto Común Personal</span>
                <span className="text-xl font-black text-emerald-800 font-mono block">
                  {formatCLP(payrollConsolidated.totalNet + payrollConsolidated.totalPreviredLeyesSociales)}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold block">Impacto en colillas del mes</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border-2 border-dashed border-[#0F3D2E]/30 bg-[#FDFBF7] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  {alreadyExportedToExpenses ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <strong className="text-sm text-slate-900">
                    {alreadyExportedToExpenses
                      ? 'Los sueldos de este periodo ya están registrados en Gastos Comunes'
                      : 'Listo para traspasar a Gastos Comunes'}
                  </strong>
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  {alreadyExportedToExpenses
                    ? 'Los comprobantes de liquidaciones y cotizaciones ya están contabilizados en el periodo activo. Puedes re-traspasar si actualizaste horas extras o anticipos.'
                    : 'Al presionar el botón, el sistema creará automáticamente los 2 registros de egreso con fecha de hoy y categoría "Sueldos".'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportToCommunityExpenses}
                className="py-3 px-6 rounded-2xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>{alreadyExportedToExpenses ? 'Re-actualizar en Gastos Comunes' : 'Traspasar a Gastos Comunes Ahora'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-PESTAÑA 5: CONTRATOS DE TRABAJO DT ==================== */}
      {currentSubTab === 'contratos' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Contratos de Trabajo • Código del Trabajo
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Contratos Individuales de Trabajo DT
                </h3>
                <p className="text-xs text-slate-500">
                  Contrato y anexos por trabajador, con sus funciones, jornada y condiciones de remuneración.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  {staff.length} fichas de personal
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-[#0F3D2E] shrink-0" />
                <span className="text-slate-600">
                  Consulta el contrato de cada trabajador o prepara un anexo cuando cambien su jornada o remuneración.
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 shrink-0">
                {staff.length} fichas de personal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staff.map((worker) => (
                <div
                  key={worker.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-[#FDFBF7] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      {worker.contractType}
                    </span>
                    <h4 className="text-sm font-black text-slate-900">{worker.name}</h4>
                    <p className="text-xs text-slate-600">{worker.role}</p>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Ingreso: {worker.startDate} • {worker.weeklyHours ? worker.weeklyHours+' hrs' : 'Jornada por confirmar'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkerForContract(worker);
                        setShowContractModal(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#0F3D2E] text-[#D4B895] hover:bg-[#0A291F] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver contrato de trabajo</span>
                    </button>
                    <button type="button" onClick={()=>setAnnexWorker(worker)} className="rounded-xl border border-[#0f3d2e] px-3 py-2 text-xs font-bold text-[#0f3d2e]">Preparar anexo</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-PESTAÑA 6: FERIADO LEGAL & VACACIONES DT ==================== */}
      {currentSubTab === 'vacaciones' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Feriado Legal Anual • Art. 67 Código del Trabajo
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Control de Feriado Legal & Comprobantes DT
                </h3>
                <p className="text-xs text-slate-500">
                  Cálculo automático de días devengados (1.25 días/mes), registro de solicitudes y emisión de comprobantes firmados.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Palmtree className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <strong className="block text-emerald-950 font-bold">
                    Derecho Irrenunciable al Feriado Legal (Art. 67 Código del Trabajo)
                  </strong>
                  <span className="text-emerald-800 text-[11px]">
                    Todo trabajador con más de un año de servicio tiene derecho a 15 días hábiles remunerados por año (1.25 días acumulados por mes). La DT exige comprobante firmado obligatorio.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staff.map((worker) => {
                const balance = calculateVacationBalance(worker.startDate, worker.vacationDaysTaken || 0);
                return (
                  <div
                    key={worker.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-3.5 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {worker.role}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {balance.daysRemaining} Días Saldo
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900">{worker.name}</h4>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        RUT: {worker.rut} • Ingreso: {worker.startDate}
                      </span>

                      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] border-t border-slate-100">
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-slate-400 block text-[9px]">Devengados</span>
                          <strong className="text-slate-800 font-bold">{balance.daysAccrued} d</strong>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-slate-400 block text-[9px]">Tomados</span>
                          <strong className="text-slate-800 font-bold">{balance.daysTaken} d</strong>
                        </div>
                        <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                          <span className="text-emerald-700 block text-[9px]">Disponibles</span>
                          <strong className="text-emerald-900 font-black">{balance.daysRemaining} d</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkerForVacation(worker);
                        setVacationForm({
                          startDate: new Date().toISOString().split('T')[0],
                          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          returnDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          daysTaken: Math.min(15, balance.daysRemaining || 15),
                          periodLabel: `Periodo Ordinario ${new Date().getFullYear()}`,
                          notes: 'Uso de feriado legal ordinario acordado de común acuerdo con la administración.'
                        });
                        setShowVacationModal(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#0F3D2E] text-[#D4B895] hover:bg-[#0A291F] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Palmtree className="w-3.5 h-3.5" />
                      <span>Tramitar Feriado & Comprobante DT</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-PESTAÑA 7: PACTOS DE HORAS EXTRAORDINARIAS ==================== */}
      {currentSubTab === 'horas_extras' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Jornada Extraordinaria • Art. 32 Código del Trabajo
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Pactos de Horas Extraordinarias del Personal
                </h3>
                <p className="text-xs text-slate-500">
                  Acuerdos escritos trimestrales obligatorios para atender necesidades temporales o imprevistas en la copropiedad.
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <strong className="block text-amber-950 font-bold">
                    Pacto Bilateral Escrito Obligatorio (Art. 32 Código del Trabajo)
                  </strong>
                  <span className="text-amber-800 text-[11px]">
                    El pacto escrito identifica la necesidad temporal, la jornada y la vigencia. Registra y remunera también las horas extraordinarias trabajadas con conocimiento del empleador.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staff.map((worker) => (
                <div
                  key={worker.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-3.5 shadow-2xs"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Turno: {worker.shift || 'Rotativo'}
                    </span>
                    <h4 className="text-sm font-black text-slate-900">{worker.name}</h4>
                    <p className="text-xs text-slate-600">{worker.role}</p>
                    <span className="text-[11px] text-slate-500 block font-mono">
                      Referencia solo sueldo base: {Number(worker.baseSalary) > 0 && Number(worker.weeklyHours) > 0 ? formatCLP(calculateOvertimeHourValue(worker.baseSalary, worker.weeklyHours)) : 'datos de sueldo o jornada pendientes'} · Revisar conceptos y mínimo aplicable
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWorkerForOvertimePact(worker);
                      setShowOvertimePactModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#0F3D2E] text-[#D4B895] hover:bg-[#0A291F] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Preparar pacto de horas extras</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-PESTAÑA 8: FINIQUITOS & TÉRMINO LABORAL ==================== */}
      {currentSubTab === 'finiquitos' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Término Laboral • Art. 159, 160 y 161 Código del Trabajo
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Simulador de Finiquitos & Notificaciones de Término
                </h3>
                <p className="text-xs text-slate-500">
                  Cálculo legal de indemnizaciones por años de servicio, preaviso, feriado proporcional y cartas formales con Ley Bustos.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <UserMinus className="w-5 h-5 text-slate-700 shrink-0" />
                <div>
                  <strong className="block text-slate-900 font-bold">
                    Finiquitos Laborales & Notificaciones de Término (Art. 159, 160 y 161)
                  </strong>
                  <span className="text-slate-600 text-[11px]">
                    Prepara el finiquito con el detalle de haberes, descuentos, reservas y respaldos. Para despidos, también puedes preparar la comunicación de término.
                  </span>
                </div>
              </div>
            </div>

            {/* Guía paso a paso Carta de Aviso y Finiquito */}
            <TerminationStepByStepGuide employerKind="company" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staff.map((worker) => (
                <div
                  key={worker.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-3.5 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {worker.contractType}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {worker.status || 'ACTIVO'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{worker.name}</h4>
                    <p className="text-xs text-slate-600">{worker.role}</p>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Ingreso: {worker.startDate} • Sueldo: {formatCLP(worker.baseSalary)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkerForSeverance(worker);
                        setSeveranceInitialMode('letter');
                        setShowSeveranceModal(true);
                      }}
                      className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-700" />
                      <span>Carta de Aviso</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkerForSeverance(worker);
                        setSeveranceInitialMode('settlement');
                        setShowSeveranceModal(true);
                      }}
                      className="py-2 px-2.5 rounded-xl bg-slate-900 text-amber-200 hover:bg-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-300" />
                      <span>Finiquito DT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-PESTAÑA 9: RIOHS & PROTOCOLO LEY KARIN ==================== */}
      {(currentSubTab === 'riohs' || currentSubTab === 'riohs_karin') && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Normativa de Orden, Higiene & Seguridad • Código del Trabajo, Ley N° 16.744 y Ley N° 21.643
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Reglamento interno y protocolo Ley Karin
                </h3>
                <p className="text-xs text-slate-500">
                  Instrumentos normativos oficiales exigibles por la Inspección del Trabajo y la Seremi de Salud.
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tarjeta RIOHS */}
              <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-slate-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-[#0F3D2E] bg-emerald-100 px-2 py-0.5 rounded">
                    Normativa de Orden e Higiene
                  </span>
                  <h4 className="text-base font-black text-slate-900">
                    Reglamento interno de la empresa (RIHS o RIOHS)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    La aplicación prepara un reglamento según la dotación de la empresa. Con diez o más trabajadores permanentes, incorpora también las normas de orden.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRiohsModal(true)}
                  className="py-2.5 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <ScrollText className="w-4 h-4" />
                  <span>Preparar reglamento</span>
                </button>
              </div>

              {/* Tarjeta Ley Karin */}
              <div className="p-6 rounded-3xl bg-rose-50/50 border border-rose-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Obligatorio Ley N° 21.643
                  </span>
                  <h4 className="text-base font-black text-slate-900">
                    Protocolo de Prevención & Denuncias Ley Karin
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Protocolo formal de resguardo frente al acoso laboral, acoso sexual y violencia en el trabajo en copropiedades, canales formales ante la Administración y plazos de derivación a la DT.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowKarinModal(true)}
                  className="py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Protocolo Ley Karin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: VISOR E IMPRESIÓN DE LIQUIDACIÓN DE SUELDO DT ==================== */}
      {showSlipModal && selectedWorkerForSlip && (() => {
        const inputs = getWorkerInputs(selectedWorkerForSlip.id);
        const slip = calculateMonthlyPayroll(selectedWorkerForSlip, inputs, periodMinimum || 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#0F3D2E]" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Liquidación de Sueldo DT • Periodo {periodLabel}
                    </h3>
                    <span className="text-xs text-slate-500">{selectedWorkerForSlip.name} • RUT {selectedWorkerForSlip.rut}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AranproPdfStyleSelector />
                  <button
                    type="button"
                    onClick={() =>
                      printDocumentDirectly(
                        'printable-community-payroll-slip',
                        `ARANPRO_Liquidacion_${selectedWorkerForSlip.name.replace(/\s+/g, '_')}_${periodLabel.replace('/', '_')}`,
                        { pdfStyle, fitPage: true, margin: '4mm 6mm 4mm 6mm', extraStyles: payrollSlipPrintStyles }
                      )
                    }
                    className="py-2 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Liquidación (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSlipModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* CONTENEDOR IMPRIMIBLE FORMAL DE LA LIQUIDACIÓN DE SUELDO CON ESTÁNDAR ARANPRO */}
              <div className="bg-slate-100 p-3 md:p-5 rounded-2xl max-h-[75vh] overflow-y-auto">
                <div id="printable-community-payroll-slip" className="print-area">
                  <div
                    className="dossier-page bg-white p-5 md:p-6 pl-7 md:pl-9 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px]"
                    data-pdf-style={pdfStyle}
                  >
                    <div className="space-y-2.5">
                      {/* Cabecera Oficial ARANPRO */}
                      {renderAranproPdfHeader('DOCUMENTO LABORAL', 'LIQUIDACIÓN DE REMUNERACIONES', `LIQ-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)}

                {/* Datos del Empleador y Periodo */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10.5px]">
                  <div>
                    <span className="text-slate-500 block uppercase text-[9.5px] font-bold">Empleador:</span>
                    <strong className="text-slate-900 font-bold block">{currentCommunity.bankInfo?.holderName || currentCommunity.name}</strong>
                    <span className="text-slate-600 block">RUT Patronal: <strong className="font-mono">{currentCommunity.bankInfo?.rut || '____________________'}</strong></span>
                    <span className="text-slate-600 block">Dirección: {currentCommunity.address || '____________________'}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block uppercase text-[9.5px] font-bold">Periodo de Liquidación:</span>
                    <strong className="text-xs font-black text-slate-900 block">{periodLongName}</strong>
                    <span className="text-slate-700 block font-bold">Días Trabajados: {slip.daysWorked} Días</span>
                    <span className="text-slate-500 block text-[9.5px]">Giro: Administración de Edificios y Condominios</span>
                  </div>
                </div>

                {/* Ficha del Trabajador */}
                <div className="payroll-worker-details grid grid-cols-2 md:grid-cols-4 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-[10.5px]">
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Nombre Trabajador:</span>
                    <strong className="text-slate-900 font-bold block">{selectedWorkerForSlip.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">RUT:</span>
                    <strong className="font-mono text-slate-900 block">{selectedWorkerForSlip.rut}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Cargo:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.role}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Fecha Ingreso:</span>
                    <strong className="font-mono text-slate-900 block">{selectedWorkerForSlip.startDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">AFP:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.afpName} ({slip.afpRate}%)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Salud:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.healthName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Jornada Semanal:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.weeklyHours || 44} Horas</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9.5px]">Tipo Contrato:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.contractType}</strong>
                  </div>
                </div>

                {/* Detalle de Haberes vs Descuentos */}
                <div className="grid grid-cols-2 gap-3">
                  {/* HABERES */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <div className="bg-[#0F3D2E] text-white px-2.5 py-1.5 font-black uppercase text-[10px] flex justify-between">
                      <span>1. Haberes (Imponibles y No Imponibles)</span>
                      <span>Monto (CLP)</span>
                    </div>
                    <table className="w-full text-[10px]">
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-1.5 text-slate-700">Sueldo Base Mensual ({slip.daysWorked} Días)</td>
                          <td className="p-1.5 text-right font-mono font-bold">{formatCLP(slip.proratedBase)}</td>
                        </tr>
                        {slip.gratification > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-700">Gratificación Legal Art. 50 (25% Tope)</td>
                            <td className="p-1.5 text-right font-mono font-bold">{formatCLP(slip.gratification)}</td>
                          </tr>
                        )}
                        {slip.overtimeAmount > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-700">Horas Extraordinarias al 50% ({slip.overtimeHours} hrs)</td>
                            <td className="p-1.5 text-right font-mono font-bold">{formatCLP(slip.overtimeAmount)}</td>
                          </tr>
                        )}
                        {slip.contractualNightBonus > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-700">Bono Turno Nocturno</td>
                            <td className="p-1.5 text-right font-mono font-bold">{formatCLP(slip.contractualNightBonus)}</td>
                          </tr>
                        )}
                        {slip.contractualResponsibilityBonus > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-700">Bono de Responsabilidad</td>
                            <td className="p-1.5 text-right font-mono font-bold">{formatCLP(slip.contractualResponsibilityBonus)}</td>
                          </tr>
                        )}
                        {slip.extraTaxableBonus > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-700">Otros Bonos Imponibles</td>
                            <td className="p-1.5 text-right font-mono font-bold">{formatCLP(slip.extraTaxableBonus)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-black text-slate-900">
                          <td className="p-1.5 uppercase text-[9.5px]">Total Imponible:</td>
                          <td className="p-1.5 text-right font-mono">{formatCLP(slip.totalTaxable)}</td>
                        </tr>
                        {slip.colacion > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-600">Asignación de Colación (No Imponible)</td>
                            <td className="p-1.5 text-right font-mono">{formatCLP(slip.colacion)}</td>
                          </tr>
                        )}
                        {slip.movilizacion > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-600">Asignación de Movilización (No Imponible)</td>
                            <td className="p-1.5 text-right font-mono">{formatCLP(slip.movilizacion)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-100 font-black text-slate-900 border-t border-slate-300">
                          <td className="p-2 uppercase text-[10.5px]">TOTAL HABERES BRUTOS:</td>
                          <td className="p-2 text-right font-mono text-[11px]">{formatCLP(slip.totalGross)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* DESCUENTOS */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <div className="bg-[#0F3D2E] text-white px-2.5 py-1.5 font-black uppercase text-[10px] flex justify-between">
                      <span>2. Descuentos Legales y Varios</span>
                      <span>Monto (CLP)</span>
                    </div>
                    <table className="w-full text-[10px]">
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-1.5 text-slate-700">Cotización Previsional AFP ({slip.afpRate}%)</td>
                          <td className="p-1.5 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.afpAmount)}</td>
                        </tr>
                        <tr>
                          <td className="p-1.5 text-slate-700">Cotización Salud ({slip.healthRate}%)</td>
                          <td className="p-1.5 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.healthAmount)}</td>
                        </tr>
                        {slip.afcWorkerAmount > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-700">Seguro de Cesantía AFC Trabajador (0.6%)</td>
                            <td className="p-1.5 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.afcWorkerAmount)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-black text-slate-900">
                          <td className="p-1.5 uppercase text-[9.5px]">Total Leyes Sociales:</td>
                          <td className="p-1.5 text-right font-mono text-rose-800">-{formatCLP(slip.totalPrevisionalDiscounts)}</td>
                        </tr>
                        {slip.advances > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-700">Anticipo de Sueldo / Quincena</td>
                            <td className="p-1.5 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.advances)}</td>
                          </tr>
                        )}
                        {slip.otherDiscounts > 0 && (
                          <tr>
                            <td className="p-1.5 text-slate-700">Otros Descuentos Autorizados</td>
                            <td className="p-1.5 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.otherDiscounts)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-100 font-black text-slate-900 border-t border-slate-300">
                          <td className="p-2 uppercase text-[10.5px]">TOTAL DESCUENTOS:</td>
                          <td className="p-2 text-right font-mono text-[11px] text-rose-800">-{formatCLP(slip.totalDiscounts)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recuadro Destacado: Líquido a Pagar en Palabras */}
                <div className="payroll-net-summary p-2.5 bg-emerald-50 rounded-xl border-2 border-[#0F3D2E] flex flex-col md:flex-row items-center justify-between gap-2">
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-[#0F3D2E] block">
                      ALCANCE LÍQUIDO A PAGAR (NETO):
                    </span>
                    <strong className="text-lg font-black text-[#0F3D2E] font-mono block">
                      {formatCLP(slip.netSalary)}
                    </strong>
                    <span className="text-[10px] text-emerald-900 font-bold block">
                      SON: {slip.netSalaryInWords}
                    </span>
                  </div>

                  <div className="text-right text-[10px] text-slate-600">
                    <span className="block font-bold text-slate-800">Medio de Pago: Transferencia Electrónica</span>
                    <strong className="block text-slate-900 font-mono">{selectedWorkerForSlip.bankName} • {selectedWorkerForSlip.accountNumber || 'Cuenta Registrada'}</strong>
                  </div>
                </div>

                {/* Aportes Patronales (Costo Empleador - No descontables al trabajador) */}
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[9.5px] flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700">
                    Aportes Patronales Empleador (Costo Empresa): SIS 1.49% ({formatCLP(slip.employerSisAmount)}) • AFC Empleador 2.4% ({formatCLP(slip.employerAfcAmount)}) • Mutual 0.93% ({formatCLP(slip.employerMutualAmount)})
                  </span>
                  <span className="font-mono font-black text-slate-900 shrink-0">
                    Total Costo Empresa: {formatCLP(slip.totalCommunityCost)}
                  </span>
                </div>
              </div>

              {/* Firmas Legales y Pie Institucional anclados al fondo */}
              <div className="mt-auto space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-1 text-center">
                    <div className="h-11 flex items-end justify-center mb-1">
                      {/* Espacio para firma manuscrita del trabajador */}
                    </div>
                    <div className="border-t-[1.5px] border-slate-800 pt-1">
                      <strong className="block text-slate-900 font-black text-xs leading-tight">{selectedWorkerForSlip.name}</strong>
                      <p className="text-[9.5px] text-slate-600 font-mono">RUT: {selectedWorkerForSlip.rut}</p>
                      <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">FIRMA DEL TRABAJADOR</p>
                      <p className="text-[8px] text-slate-400 mt-0.5 italic leading-tight">
                        Firma de recepción de la liquidación.
                      </p>
                    </div>
                  </div>

                  {renderAdminSignatureBlock('EN REPRESENTACIÓN DEL EMPLEADOR', true)}
                </div>

                {renderAranproPdfFooter(1, 1, 'Liquidación de remuneraciones')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})()}

      {/* ==================== MODAL 3: VISOR E IMPRESIÓN DE PLANILLA MENSUAL DE REMUNERACIONES (LIBRO DE SUELDOS) ==================== */}
      {showMonthlySheetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0F3D2E]" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Planilla General de Remuneraciones • Periodo {periodLabel}
                  </h3>
                  <span className="text-xs text-slate-500">{currentCommunity.name} • {payrollConsolidated.activeCount} Trabajadores</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AranproPdfStyleSelector />
                <button
                  type="button"
                  onClick={() =>
                    printCommunityLabor(
                      'printable-community-monthly-payroll-sheet',
                      `ARANPRO_Planilla_Remuneraciones_${currentCommunity.name.replace(/\s+/g, '_')}_${periodLabel.replace('/', '_')}`,
                      { pdfStyle, orientation: 'landscape' }
                    )
                  }
                  className="py-2 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Planilla Contable (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMonthlySheetModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENEDOR IMPRIMIBLE DE LA PLANILLA GENERAL */}
            <div className="bg-slate-100 p-3 md:p-5 rounded-2xl max-h-[75vh] overflow-y-auto">
              <div id="printable-community-monthly-payroll-sheet" className="print-area">
                <div
                  className="dossier-page bg-white p-6 md:p-8 pl-8 md:pl-10 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[980px]"
                  data-staff-report="" data-pdf-style={pdfStyle}
                >
                  <div className="space-y-4">
                    {renderAranproPdfHeader('LIBRO DE REMUNERACIONES', 'PLANILLA GENERAL DE SUELDOS & LEYES SOCIALES', `REM-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)}

              <div data-report-block="" className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Empresa Empleadora:</span>
                  <strong className="text-sm font-black text-slate-900">{currentCommunity.name}</strong>
                  <span className="text-slate-600 block text-[11px]">RUT: {currentCommunity.bankInfo?.rut || '____________________'} • {currentCommunity.address}</span>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Periodo Contable:</span>
                  <strong className="text-sm font-black text-slate-900">{periodLongName}</strong>
                  <span className="text-emerald-800 font-bold block text-[11px]">{payrollConsolidated.activeCount} Trabajadores en Nómina</span>
                </div>
              </div>

              {/* Tabla Detallada */}
              <div className="overflow-x-auto">
                <table data-report-block="" className="w-full text-[11px] text-left border border-slate-200">
                  <thead>
                    <tr className="bg-[#0F3D2E] text-white font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-2 border-r border-emerald-900/40">N°</th>
                      <th className="p-2 border-r border-emerald-900/40">Trabajador & RUT</th>
                      <th className="p-2 border-r border-emerald-900/40">Cargo</th>
                      <th className="p-2 text-center border-r border-emerald-900/40">Días</th>
                      <th className="p-2 text-right border-r border-emerald-900/40">Sueldo Base</th>
                      <th className="p-2 text-right border-r border-emerald-900/40">Gratif. Art 50</th>
                      <th className="p-2 text-right border-r border-emerald-900/40">Total Imponible</th>
                      <th className="p-2 text-right border-r border-emerald-900/40">No Imponible</th>
                      <th className="p-2 text-right border-r border-emerald-900/40">Leyes Soc. Trab.</th>
                      <th className="p-2 text-right border-r border-emerald-900/40">Anticipos</th>
                      <th className="p-2 text-right border-r border-emerald-900/40 bg-emerald-950">Líquido a Pagar</th>
                      <th className="p-2 text-right">Costo Empresa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payrollConsolidated.slips.map(({ worker, calc }, idx) => (
                      <tr key={worker.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-2 border-r border-slate-200 font-bold text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200">
                          <strong className="block text-slate-900">{worker.name}</strong>
                          <span className="font-mono text-[10px] text-slate-500">{worker.rut}</span>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-slate-700">{worker.role}</td>
                        <td className="p-2 text-center border-r border-slate-200 font-bold">{calc.daysWorked}</td>
                        <td className="p-2 text-right font-mono border-r border-slate-200">{formatCLP(calc.proratedBase)}</td>
                        <td className="p-2 text-right font-mono border-r border-slate-200">{formatCLP(calc.gratification)}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200">{formatCLP(calc.totalTaxable)}</td>
                        <td className="p-2 text-right font-mono border-r border-slate-200">{formatCLP(calc.totalNonTaxable)}</td>
                        <td className="p-2 text-right font-mono text-rose-700 border-r border-slate-200">-{formatCLP(calc.totalPrevisionalDiscounts)}</td>
                        <td className="p-2 text-right font-mono border-r border-slate-200">{calc.advances > 0 ? `-${formatCLP(calc.advances)}` : '$0'}</td>
                        <td className="p-2 text-right font-mono font-black text-emerald-800 bg-emerald-50/70 border-r border-slate-200">{formatCLP(calc.netSalary)}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">{formatCLP(calc.totalCommunityCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
                      <td colSpan={6} className="p-2.5 uppercase text-right">TOTALES PERIODO {periodLabel}:</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(payrollConsolidated.totalTaxable)}</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(payrollConsolidated.totalNonTaxable)}</td>
                      <td className="p-2.5 text-right font-mono text-rose-700">-{formatCLP(payrollConsolidated.totalPrevisionalDiscounts)}</td>
                      <td className="p-2.5 text-right font-mono">-{formatCLP(payrollConsolidated.totalAdvances)}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-800 text-xs bg-emerald-100">{formatCLP(payrollConsolidated.totalNet)}</td>
                      <td className="p-2.5 text-right font-mono text-xs">{formatCLP(payrollConsolidated.totalCommunityCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Resumen de Egreso para Gastos Comunes */}
              <div data-report-summary="" className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">1. Total Sueldos Líquidos Transferidos:</span>
                  <strong className="text-sm font-black text-emerald-800 font-mono">{formatCLP(payrollConsolidated.totalNet)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">2. Total Leyes Sociales (Previred):</span>
                  <strong className="text-sm font-black text-[#0F3D2E] font-mono">{formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Total Costo Personal Oficina:</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">{formatCLP(payrollConsolidated.totalCommunityCost)}</strong>
                </div>
              </div>
            </div>

            {/* Firma de Respaldo y Pie Institucional anclados al fondo */}
            <div className="mt-auto space-y-4 pt-6">
              <div className="labor-contract-end flex justify-center text-center text-xs">
                {renderAdminSignatureBlock('REPRESENTANTE LEGAL • LIBRO DE SUELDOS')}
              </div>

              {renderAranproPdfFooter(1, 1, 'Libro General de Remuneraciones & Leyes Sociales')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* ==================== MODAL 4: VISOR E IMPRESIÓN DE PLANILLA PREVIRED ==================== */}
      {showPreviredSheetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[#0F3D2E]" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Planilla de Cotizaciones Previsionales Previred • Periodo {periodLabel}
                  </h3>
                  <span className="text-xs text-slate-500">{currentCommunity.name} • Vencimiento Electrónico Día 13</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AranproPdfStyleSelector />
                <button
                  type="button"
                  onClick={() =>
                    printCommunityLabor(
                      'printable-community-previred-sheet',
                      `ARANPRO_Previred_${currentCommunity.name.replace(/\s+/g, '_')}_${periodLabel.replace('/', '_')}`,
                      { pdfStyle, orientation: 'landscape' }
                    )
                  }
                  className="py-2 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Planilla Previred (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviredSheetModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENEDOR IMPRIMIBLE PREVIRED */}
            <div className="bg-slate-100 p-3 md:p-5 rounded-2xl max-h-[75vh] overflow-y-auto">
              <div id="printable-community-previred-sheet" className="print-area">
                <div
                  className="dossier-page bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[880px]"
                  data-staff-report="" data-pdf-style={pdfStyle}
                >
                  <div className="space-y-4">
                    {renderAranproPdfHeader('PLANILLA PREVISIONAL', 'INFORME DE COTIZACIONES LEYES SOCIALES PREVIRED', `PREV-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)}

              <div data-report-block="" className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">RUT Patronal / Empresa Pagadora:</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">{currentCommunity.bankInfo?.rut || '____________________'}</strong>
                  <span className="text-slate-600 block text-[11px]">{currentCommunity.bankInfo?.holderName || currentCommunity.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Fecha Límite Declaración y Pago:</span>
                  <strong className="text-sm font-black text-amber-800 block">Día 13 del Mes Siguiente</strong>
                  <span className="text-slate-500 block text-[10px]">Vía Transferencia Electrónica www.previred.com</span>
                </div>
              </div>

              {/* Nómina de Cotizantes */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table data-report-block="" className="w-full text-[11px] text-left">
                  <thead className="bg-[#0F3D2E] text-white font-bold uppercase text-[9px]">
                    <tr>
                      <th className="p-2">Trabajador & RUT</th>
                      <th className="p-2">Entidad AFP</th>
                      <th className="p-2">Salud</th>
                      <th className="p-2 text-right">Renta Imponible</th>
                      <th className="p-2 text-right">Cotiz. AFP</th>
                      <th className="p-2 text-right">Salud (7%)</th>
                      <th className="p-2 text-right">AFC Trab.</th>
                      <th className="p-2 text-right">AFC Emp.</th>
                      <th className="p-2 text-right">SIS 1.49%</th>
                      <th className="p-2 text-right">Mutual</th>
                      <th className="p-2 text-right">Total Leyes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payrollConsolidated.slips.map(({ worker, calc }) => (
                      <tr key={worker.id} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">
                          {worker.name}
                          <span className="block font-mono text-[9px] text-slate-500">{worker.rut}</span>
                        </td>
                        <td className="p-2 text-slate-700">{worker.afpName} ({calc.afpRate}%)</td>
                        <td className="p-2 text-slate-700">{worker.healthName?.split('(')[0] || 'Fonasa'}</td>
                        <td className="p-2 text-right font-mono">{formatCLP(calc.totalTaxable)}</td>
                        <td className="p-2 text-right font-mono">{formatCLP(calc.afpAmount)}</td>
                        <td className="p-2 text-right font-mono">{formatCLP(calc.healthAmount)}</td>
                        <td className="p-2 text-right font-mono">{formatCLP(calc.afcWorkerAmount)}</td>
                        <td className="p-2 text-right font-mono">{formatCLP(calc.employerAfcAmount)}</td>
                        <td className="p-2 text-right font-mono">{formatCLP(calc.employerSisAmount)}</td>
                        <td className="p-2 text-right font-mono">{formatCLP(calc.employerMutualAmount)}</td>
                        <td className="p-2 text-right font-mono font-black text-emerald-800">
                          {formatCLP(calc.totalPrevisionalDiscounts + calc.totalEmployerCosts)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
                      <td colSpan={3} className="p-2.5 uppercase">TOTALES CONSOLIDADOS PREVIRED:</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(payrollConsolidated.totalTaxable)}</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(payrollConsolidated.totalPrevisionalDiscounts - Math.round(payrollConsolidated.totalTaxable * 0.076))}</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(Math.round(payrollConsolidated.totalTaxable * 0.07))}</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(Math.round(payrollConsolidated.totalTaxable * 0.006))}</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(payrollConsolidated.totalEmployerAfc)}</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(payrollConsolidated.totalEmployerSis)}</td>
                      <td className="p-2.5 text-right font-mono">{formatCLP(payrollConsolidated.totalEmployerMutual)}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-900 text-xs bg-emerald-100">
                        {formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Recuadro de Total a Pagar */}
              <div data-report-summary="" className="p-4 bg-emerald-50 rounded-2xl border-2 border-[#0F3D2E] flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] block">
                    TOTAL GENERAL A TRANSFERIR EN PREVIRED:
                  </span>
                  <strong className="text-xl font-black text-[#0F3D2E] font-mono block">
                    {formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}
                  </strong>
                  <span className="text-xs text-emerald-800 font-bold block">
                    SON: {numberToSpanishWords(payrollConsolidated.totalPreviredLeyesSociales)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">Cuenta de Cargo: Cuenta Corriente Empresa</span>
                  <span className="text-xs text-slate-500 font-mono block">{currentCommunity.bankInfo?.bank} • {currentCommunity.bankInfo?.accountNumber}</span>
                </div>
              </div>
            </div>

            {/* Firma y Pie Institucional anclados al fondo */}
            <div className="mt-auto space-y-4 pt-6">
              <div className="labor-contract-end flex justify-center text-center text-xs">
                {renderAdminSignatureBlock('DECLARACIÓN Y PAGO PREVIRED • EMPLEADOR')}
              </div>

              {renderAranproPdfFooter(1, 1, 'Planilla de Cotizaciones Previsionales Previred')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* ==================== MODAL 5: VISOR E IMPRESIÓN DE NÓMINA OFICIAL DE PERSONAL ==================== */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0F3D2E]" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Nómina Oficial de Trabajadores • {currentCommunity.name}
                  </h3>
                  <span className="text-xs text-slate-500">Registro General del Personal de Oficina</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AranproPdfStyleSelector />
                <button
                  type="button"
                  onClick={() =>
                    printCommunityLabor(
                      'printable-community-staff-roster',
                      `ARANPRO_Nomina_Personal_${currentCommunity.name.replace(/\s+/g, '_')}`,
                      { pdfStyle, orientation: 'portrait' }
                    )
                  }
                  className="py-2 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Nómina (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRosterModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENEDOR IMPRIMIBLE NÓMINA */}
            <div className="bg-slate-100 p-3 md:p-5 rounded-2xl max-h-[75vh] overflow-y-auto">
              <div id="printable-community-staff-roster" className="print-area">
                <div
                  className="dossier-page bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[880px]"
                  data-staff-report="" data-pdf-style={pdfStyle}
                >
                  <div className="space-y-4">
                    {renderAranproPdfHeader('REGISTRO OFICIAL', 'NÓMINA DE TRABAJADORES DE OFICINA', `NOM-${new Date().getFullYear()}`)}

                    <div data-report-block="" className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <strong className="block text-slate-900 font-bold">{currentCommunity.name}</strong>
                        <span className="text-slate-600 block text-[11px]">RUT Patronal: {currentCommunity.bankInfo?.rut || '____________________'} • {currentCommunity.address}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-800 font-black block text-sm">{staff.length} Trabajadores Registrados</span>
                        <span className="text-slate-500 block text-[10px]">Actualizado al {new Date().toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>

                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table data-report-block="" className="w-full text-[11px] text-left">
                        <thead className="bg-[#0F3D2E] text-white font-bold uppercase text-[9px]">
                          <tr>
                            <th className="p-2">N°</th>
                            <th className="p-2">Nombre Completo</th>
                            <th className="p-2">RUT</th>
                            <th className="p-2">Cargo / Turno</th>
                            <th className="p-2">Jornada</th>
                            <th className="p-2">Contrato</th>
                            <th className="p-2 text-right">Sueldo Base</th>
                            <th className="p-2">Previsión</th>
                            <th className="p-2">Contacto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {staff.map((w, idx) => (
                            <tr key={w.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-2 text-center font-bold">{idx + 1}</td>
                              <td className="p-2 font-bold text-slate-900">{w.name}</td>
                              <td className="p-2 font-mono text-slate-700">{w.rut}</td>
                              <td className="p-2 text-slate-700">
                                {w.role}
                                <span className="block text-[9px] text-slate-400">{w.shift}</span>
                              </td>
                              <td className="p-2 text-slate-700">{w.weeklyHours || 44} hrs</td>
                              <td className="p-2 text-slate-700">{w.contractType}</td>
                              <td className="p-2 font-mono font-bold text-slate-900 text-right">{formatCLP(w.baseSalary)}</td>
                              <td className="p-2 text-slate-600">
                                {w.afpName}
                                <span className="block text-[9px] text-slate-400">{w.healthName?.split('(')[0] || 'Fonasa'}</span>
                              </td>
                              <td className="p-2 text-[10px] text-slate-600 font-mono">
                                {w.phone || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Firma y Pie Institucional anclados al fondo */}
                  <div className="mt-auto space-y-4 pt-6">
                    <div className="labor-contract-end flex justify-center text-center text-xs">
                      {renderAdminSignatureBlock('REPRESENTANTE LEGAL • EMPLEADOR')}
                    </div>

                    {renderAranproPdfFooter(1, 1, 'Nómina Oficial de Trabajadores de Oficina')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContractModal && selectedWorkerForContract && <LaborContractDraft employerKind="company" key={selectedWorkerForContract.id} worker={selectedWorkerForContract} community={currentCommunity} settings={companySettings || {}} onSaveWorker={saveUnifiedWorker} onClose={() => setShowContractModal(false)} />}

      {annexWorker && <CommunityLaborAnnex employerKind="company" key={currentCommunity.id+':'+annexWorker.id} community={currentCommunity} worker={annexWorker} settings={companySettings||{}} onClose={()=>setAnnexWorker(null)}/>}
      {(showRiohsModal || showKarinModal) && <CommunityPreventionDocument employerKind="company" key={currentCommunity.id+':'+showRiohsModal} kind={showRiohsModal?'regulation':'karin'} community={currentCommunity} settings={companySettings||{}} onSave={laborPrevention => {
    try {
      localStorage.setItem('aranpro_office_labor_prevention', JSON.stringify(laborPrevention));
    } catch {}
  }} onClose={()=>{setShowRiohsModal(false);setShowKarinModal(false);}}/>}

      {/* ==================== MODAL 8: FORMULARIO SOLICITUD DE VACACIONES ==================== */}
      {showVacationModal && selectedWorkerForVacation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Tramitar Feriado Legal (Vacaciones DT)
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">
                    {selectedWorkerForVacation.name} • RUT {selectedWorkerForVacation.rut}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVacationModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen de saldo calculado */}
            {(() => {
              const balance = calculateVacationBalance(selectedWorkerForVacation.startDate, selectedWorkerForVacation.vacationDaysTaken || 0);
              return (
                <div className="grid grid-cols-3 gap-2.5 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold block">Días Devengados</span>
                    <strong className="text-sm font-black text-emerald-950 font-mono">{balance.daysAccrued} d</strong>
                    <span className="text-[9px] text-emerald-700 block">1.25 d/mes</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold block">Días Tomados</span>
                    <strong className="text-sm font-black text-emerald-950 font-mono">{balance.daysTaken} d</strong>
                    <span className="text-[9px] text-emerald-700 block">Registrados</span>
                  </div>
                  <div className="bg-white rounded-xl p-1 border border-emerald-300">
                    <span className="text-[10px] text-emerald-800 font-black block">Saldo Disponible</span>
                    <strong className="text-base font-black text-[#0F3D2E] font-mono">{balance.daysRemaining} d</strong>
                    <span className="text-[9px] text-emerald-600 block">Hábiles</span>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Inicio Vacaciones *</label>
                  <input
                    type="date"
                    value={vacationForm.startDate}
                    onChange={(e) => setVacationForm({ ...vacationForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Término Vacaciones *</label>
                  <input
                    type="date"
                    value={vacationForm.endDate}
                    onChange={(e) => setVacationForm({ ...vacationForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Reincorporación a Turno *</label>
                  <input
                    type="date"
                    value={vacationForm.returnDate}
                    onChange={(e) => setVacationForm({ ...vacationForm, returnDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Días Hábiles a Utilizar *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={vacationForm.daysTaken}
                    onChange={(e) => setVacationForm({ ...vacationForm, daysTaken: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Periodo Devengado / Glosa</label>
                <input
                  type="text"
                  value={vacationForm.periodLabel}
                  onChange={(e) => setVacationForm({ ...vacationForm, periodLabel: e.target.value })}
                  placeholder="Ej: Periodo Ordinario 2025-2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones / Suplencia</label>
                <textarea
                  rows="2"
                  value={vacationForm.notes}
                  onChange={(e) => setVacationForm({ ...vacationForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVacationModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVacationModal(false);
                    setShowVacationPrintModal(true);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generar e Imprimir Comprobante Oficial DT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 9: VISOR E IMPRESIÓN COMPROBANTE FERIADO LEGAL DT ==================== */}
      {showVacationPrintModal && selectedWorkerForVacation && (() => {
        const balance = calculateVacationBalance(selectedWorkerForVacation.startDate, selectedWorkerForVacation.vacationDaysTaken || 0);
        const daysRemainingAfter = Math.max(0, balance.daysRemaining - vacationForm.daysTaken);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Palmtree className="w-5 h-5 text-emerald-800" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Comprobante Oficial de Feriado Legal • DT
                    </h3>
                    <span className="text-xs text-slate-500">{selectedWorkerForVacation.name} • RUT {selectedWorkerForVacation.rut}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AranproPdfStyleSelector />
                  <button
                    type="button"
                    onClick={() =>
                      printDocumentDirectly(
                        'printable-community-vacation-slip',
                        `ARANPRO_Comprobante_Feriado_${selectedWorkerForVacation.name.replace(/\s+/g, '_')}`,
                        { pdfStyle, fitPage: true, margin: '4mm 6mm 4mm 6mm' }
                      )
                    }
                    className="py-2 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Comprobante (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVacationPrintModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* CONTENEDOR IMPRIMIBLE DEL COMPROBANTE DE FERIADO LEGAL */}
              <div className="bg-slate-100 p-3 md:p-5 rounded-2xl max-h-[75vh] overflow-y-auto">
                <div id="printable-community-vacation-slip" className="print-area">
                  <div
                    className="dossier-page bg-white p-6 md:p-8 pl-8 md:pl-10 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px]"
                    data-pdf-style={pdfStyle}
                  >
                    <div className="space-y-4">
                      {renderAranproPdfHeader('INSTRUMENTO LABORAL', 'COMPROBANTE OFICIAL DE FERIADO LEGAL', `VAC-${new Date().getFullYear()}-${selectedWorkerForVacation.id}`)}

                      <div className="text-center space-y-0.5 border-b border-slate-200 pb-2">
                        <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                          COMPROBANTE OFICIAL DE FERIADO LEGAL (VACACIONES)
                        </h2>
                        <p className="text-[10px] text-slate-600 font-bold">
                          DIRECCIÓN DEL TRABAJO • ARTÍCULOS 67, 68, 69 Y 70 DEL CÓDIGO DEL TRABAJO
                        </p>
                      </div>

                      {/* Individualización de las partes */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                        <div>
                          <span className="text-slate-500 uppercase text-[9.5px] font-bold block">Empresa Empleadora:</span>
                          <strong className="text-slate-900 block font-bold">{currentCommunity.bankInfo?.holderName || currentCommunity.name}</strong>
                          <span className="text-slate-600 block">RUT Patronal: <strong className="font-mono">{currentCommunity.bankInfo?.rut || '____________________'}</strong></span>
                          <span className="text-slate-600 block">Dirección: {currentCommunity.address || '____________________'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 uppercase text-[9.5px] font-bold block">Trabajador(a):</span>
                          <strong className="text-slate-900 block font-bold">{selectedWorkerForVacation.name}</strong>
                          <span className="text-slate-600 block">RUT: <strong className="font-mono">{selectedWorkerForVacation.rut}</strong></span>
                          <span className="text-slate-600 block">Cargo: {selectedWorkerForVacation.role} (Ingreso: {selectedWorkerForVacation.startDate})</span>
                        </div>
                      </div>

                      {/* Detalle del Feriado Otorgado */}
                      <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-[#0F3D2E] space-y-3">
                        <span className="text-[10px] font-black uppercase text-[#0F3D2E] tracking-wider block">
                          DETALLE DEL FERIADO LEGAL REMUNERADO CONCEDIDO
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-[11px]">
                          <div className="bg-white p-2 rounded-xl border border-emerald-200">
                            <span className="text-slate-500 text-[10px] block">Fecha de Inicio:</span>
                            <strong className="text-slate-900 font-bold block font-mono">{vacationForm.startDate}</strong>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-emerald-200">
                            <span className="text-slate-500 text-[10px] block">Fecha de Término:</span>
                            <strong className="text-slate-900 font-bold block font-mono">{vacationForm.endDate}</strong>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-emerald-200">
                            <span className="text-slate-500 text-[10px] block">Reincorporación:</span>
                            <strong className="text-emerald-900 font-bold block font-mono">{vacationForm.returnDate}</strong>
                          </div>
                          <div className="bg-[#0F3D2E] text-white p-2 rounded-xl">
                            <span className="text-emerald-200 text-[10px] block">Días Hábiles:</span>
                            <strong className="text-base font-black block font-mono">{vacationForm.daysTaken} Días</strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/80 text-[10px] text-slate-700">
                          <div><strong>Periodo:</strong> {vacationForm.periodLabel}</div>
                          <div className="text-center"><strong>Días Totales Acumulados:</strong> {balance.daysAccrued} días</div>
                          <div className="text-right"><strong>Saldo Restante al Regreso:</strong> <span className="font-bold text-[#0F3D2E] font-mono">{daysRemainingAfter} días hábiles</span></div>
                        </div>
                      </div>

                      {/* Declaración de Recepción Conforme */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-justify text-xs text-slate-700 leading-relaxed">
                        <p>
                          En la ciudad de <strong>{currentCommunity.city || '____________________'}</strong>, a {new Date().toLocaleDateString('es-CL')}, el Trabajador declara que hace uso efectivo de su feriado legal anual en conformidad con lo previsto en el Artículo 67 y siguientes del Código del Trabajo, con goce íntegro de sus remuneraciones ordinarias, dejando expresa constancia de haber recibido a su entera satisfacción los días concedidos por el Empleador.
                        </p>
                      </div>
                    </div>

                    {/* Firmas Legales ancladas al fondo */}
                    <div className="mt-auto space-y-4 pt-6">
                      <div className="grid grid-cols-2 gap-12 text-center text-xs">
                        <div className="space-y-1 text-center">
                          <div className="h-12 flex items-end justify-center mb-1">
                            {/* Espacio firma trabajador */}
                          </div>
                          <div className="border-t-[1.5px] border-slate-800 pt-1.5">
                            <strong className="block text-slate-900 font-black text-xs leading-tight">{selectedWorkerForVacation.name}</strong>
                            <p className="text-[9.5px] text-slate-600 font-mono">RUT: {selectedWorkerForVacation.rut}</p>
                            <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">FIRMA DEL TRABAJADOR (RECIBÍ CONFORME)</p>
                          </div>
                        </div>

                        {renderAdminSignatureBlock('POR EL EMPLEADOR', true)}
                      </div>

                      {renderAranproPdfFooter(1, 1, 'Comprobante de Feriado Legal DT')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showSeveranceModal && selectedWorkerForSeverance && <CommunitySettlementDocument employerKind="company" initialMode={severanceInitialMode} key={currentCommunity.id+':'+selectedWorkerForSeverance.id+':'+severanceInitialMode} community={currentCommunity} worker={selectedWorkerForSeverance} settings={companySettings||{}} onClose={()=>setShowSeveranceModal(false)}/>}
      {showOvertimePactModal && selectedWorkerForOvertimePact && <OvertimeAgreementDraft employerKind="company" key={selectedWorkerForOvertimePact.id} worker={selectedWorkerForOvertimePact} community={currentCommunity} settings={companySettings || {}} onClose={() => setShowOvertimePactModal(false)} />}

    </div>
  );
};
