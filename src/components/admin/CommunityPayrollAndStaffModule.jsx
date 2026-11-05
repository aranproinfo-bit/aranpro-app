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
  numberToSpanishWords
} from '../../utils/chileanPayrollCalculations';
import { formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { AranproLogo, AranproOfficialSeal, useAranproPdfStyle, AranproPdfStyleSelector } from '../common/MauranLogo';
import {
  Users, UserPlus, FileText, Printer, CheckCircle2, AlertCircle,
  Building2, ShieldCheck, DollarSign, Calendar, Clock, Download,
  ExternalLink, Copy, Check, ChevronRight, ArrowRight, Eye, Edit3,
  Trash2, Plus, Sparkles, AlertTriangle, Briefcase, FileSpreadsheet,
  Award, Landmark, HelpCircle, X, BookOpen, Shield, ScrollText
} from 'lucide-react';

export const CommunityPayrollAndStaffModule = ({
  currentCommunity,
  activeSubTab = 'nomina',
  onSubTabChange
}) => {
  const { updateCommunity, addExpense, companySettings } = useCommunity();
  const [pdfStyle] = useAranproPdfStyle();

  // Sub-pestaña interna si no viene del padre
  const [internalSubTab, setInternalSubTab] = useState('nomina');
  const currentSubTab = activeSubTab || internalSubTab;
  const setSubTab = onSubTabChange || setInternalSubTab;

  // Lista de personal del condominio
  const staff = currentCommunity?.staff || [];

  // Periodo seleccionado para cálculo (por defecto el periodo activo de la comunidad)
  const activeMonth = currentCommunity?.activePeriod?.month || (new Date().getMonth() + 1);
  const activeYear = currentCommunity?.activePeriod?.year || new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(activeMonth);
  const [selectedYear, setSelectedYear] = useState(activeYear);
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
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    rut: '',
    role: 'Conserje Titular Diurno',
    category: 'Conserjería',
    shift: 'Turno Mañana (07:00 a 15:00 hrs)',
    weeklyHours: 44,
    contractType: 'Contrato Indefinido',
    startDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVO',
    phone: '',
    email: '',
    address: '',
    baseSalary: 520000,
    hasLegalGratification: true,
    contractualNightBonus: 0,
    contractualResponsibilityBonus: 0,
    allowanceColacion: 35000,
    allowanceMovilizacion: 30000,
    afpId: 'habitat',
    healthId: 'fonasa',
    mutualEntity: 'Mutual de Seguridad CChC',
    mutualRate: 0.93,
    isExemptFromAfc: false,
    bankName: 'Banco Estado',
    accountType: 'Cuenta RUT',
    accountNumber: '',
    vacationDaysRemaining: 15
  });

  // Modal para Ver / Imprimir Liquidación de Sueldo DT
  const [selectedWorkerForSlip, setSelectedWorkerForSlip] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Modal para Ver / Imprimir Contrato de Trabajo DT
  const [selectedWorkerForContract, setSelectedWorkerForContract] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Modal para Ver / Imprimir Planilla Mensual de Remuneraciones (Libro de Sueldos)
  const [showMonthlySheetModal, setShowMonthlySheetModal] = useState(false);

  // Modal para Ver / Imprimir Planilla Previred
  const [showPreviredSheetModal, setShowPreviredSheetModal] = useState(false);

  // Modal para Ver / Imprimir Nómina General de Personal
  const [showRosterModal, setShowRosterModal] = useState(false);

  // Modal para Ver / Imprimir Reglamento Interno (RIOHS)
  const [showRiohsModal, setShowRiohsModal] = useState(false);

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
      const calc = calculateMonthlyPayroll(w, inputs);

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
  }, [staff, monthlyInputs]);

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

  // Abrir modal de creación
  const handleOpenCreateStaff = () => {
    setEditingStaffId(null);
    setStaffForm({
      name: '',
      rut: '',
      role: 'Conserje Titular Diurno',
      category: 'Conserjería',
      shift: 'Turno Mañana (07:00 a 15:00 hrs)',
      weeklyHours: 44,
      contractType: 'Contrato Indefinido',
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVO',
      phone: '',
      email: '',
      address: '',
      baseSalary: 520000,
      hasLegalGratification: true,
      contractualNightBonus: 0,
      contractualResponsibilityBonus: 0,
      allowanceColacion: 35000,
      allowanceMovilizacion: 30000,
      afpId: 'habitat',
      healthId: 'fonasa',
      mutualEntity: 'Mutual de Seguridad CChC',
      mutualRate: 0.93,
      isExemptFromAfc: false,
      bankName: 'Banco Estado',
      accountType: 'Cuenta RUT',
      accountNumber: '',
      vacationDaysRemaining: 15
    });
    setShowStaffModal(true);
  };

  // Abrir modal de edición
  const handleOpenEditStaff = (w) => {
    setEditingStaffId(w.id);
    setStaffForm({
      name: w.name || '',
      rut: w.rut || '',
      role: w.role || 'Conserje Titular Diurno',
      category: w.category || 'Conserjería',
      shift: w.shift || 'Turno Mañana (07:00 a 15:00 hrs)',
      weeklyHours: w.weeklyHours || 44,
      contractType: w.contractType || 'Contrato Indefinido',
      startDate: w.startDate || new Date().toISOString().split('T')[0],
      status: w.status || 'ACTIVO',
      phone: w.phone || '',
      email: w.email || '',
      address: w.address || '',
      baseSalary: w.baseSalary || 520000,
      hasLegalGratification: w.hasLegalGratification !== false,
      contractualNightBonus: w.contractualNightBonus || 0,
      contractualResponsibilityBonus: w.contractualResponsibilityBonus || 0,
      allowanceColacion: w.allowanceColacion || 35000,
      allowanceMovilizacion: w.allowanceMovilizacion || 30000,
      afpId: w.afpId || 'habitat',
      healthId: w.healthId || 'fonasa',
      mutualEntity: w.mutualEntity || 'Mutual de Seguridad CChC',
      mutualRate: w.mutualRate || 0.93,
      isExemptFromAfc: !!w.isExemptFromAfc,
      bankName: w.bankName || 'Banco Estado',
      accountType: w.accountType || 'Cuenta RUT',
      accountNumber: w.accountNumber || '',
      vacationDaysRemaining: w.vacationDaysRemaining || 15
    });
    setShowStaffModal(true);
  };

  // Guardar ficha de trabajador
  const handleSaveStaffForm = (e) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.rut.trim()) return;

    const afpObj = AFP_RATES_CHILE.find((a) => a.id === staffForm.afpId) || AFP_RATES_CHILE[0];
    const healthObj = HEALTH_SYSTEMS_CHILE.find((h) => h.id === staffForm.healthId) || HEALTH_SYSTEMS_CHILE[0];

    const workerData = {
      ...staffForm,
      baseSalary: Number(staffForm.baseSalary) || 500000,
      weeklyHours: Number(staffForm.weeklyHours) || 44,
      contractualNightBonus: Number(staffForm.contractualNightBonus) || 0,
      contractualResponsibilityBonus: Number(staffForm.contractualResponsibilityBonus) || 0,
      allowanceColacion: Number(staffForm.allowanceColacion) || 0,
      allowanceMovilizacion: Number(staffForm.allowanceMovilizacion) || 0,
      vacationDaysRemaining: Number(staffForm.vacationDaysRemaining) || 15,
      afpName: afpObj.name,
      afpRate: afpObj.rate,
      healthName: healthObj.name,
      healthRate: healthObj.defaultRate
    };

    let updatedStaff;
    if (editingStaffId) {
      updatedStaff = staff.map((s) => (s.id === editingStaffId ? { ...s, ...workerData } : s));
    } else {
      const newStaff = {
        id: `stf-${Date.now()}`,
        ...workerData
      };
      updatedStaff = [...staff, newStaff];
    }

    updateCommunity(currentCommunity.id, { staff: updatedStaff });
    setShowStaffModal(false);
  };

  // Eliminar / dar de baja trabajador
  const handleDeleteStaff = (workerId) => {
    if (!window.confirm('¿Deseas desvincular a este trabajador de la nómina activa de la comunidad?')) return;
    const updatedStaff = staff.filter((s) => s.id !== workerId);
    updateCommunity(currentCommunity.id, { staff: updatedStaff });
  };

  // Traspasar Sueldos e Imposiciones del Mes a Gastos Comunes (1 Clic)
  const handleExportToCommunityExpenses = () => {
    if (payrollConsolidated.activeCount === 0) {
      alert('No hay trabajadores activos en la nómina para registrar.');
      return;
    }

    if (alreadyExportedToExpenses) {
      if (!window.confirm('Ya existen gastos de remuneraciones registrados para este periodo. ¿Deseas registrarlos nuevamente?')) {
        return;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Gasto 1: Sueldos Líquidos del Personal
    addExpense({
      communityId: currentCommunity.id,
      category: 'Sueldos',
      description: `Sueldos Líquidos Personal Condominio (${payrollConsolidated.activeCount} trabajadores) - Periodo ${periodLabel}`,
      provider: `Nómina Personal ${currentCommunity.name}`,
      providerRut: currentCommunity.bankInfo?.rut || '65.184.920-K',
      documentType: 'Planilla de Sueldos Líquidos',
      documentNumber: `REM-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
      date: todayStr,
      amount: payrollConsolidated.totalNet,
      fundSource: 'ordinario',
      status: 'pagado',
      paymentDate: todayStr,
      paymentMethod: 'transferencia',
      paymentReference: `TEF-REM-${selectedYear}${String(selectedMonth).padStart(2, '0')}`,
      approvedByCommittee: true,
      receiptNotes: `Pago electrónico de sueldos líquidos transferidos a cuentas bancarias del personal según nómina oficial.`
    });

    // Gasto 2: Leyes Sociales e Imposiciones Previred
    addExpense({
      communityId: currentCommunity.id,
      category: 'Sueldos',
      description: `Planilla Imposiciones y Leyes Sociales (Previred: AFP, Fonasa/Isapre, AFC, SIS, Mutual) - Periodo ${periodLabel}`,
      provider: 'Previred S.A. / Cajas y Fondos Previsionales',
      providerRut: '96.953.940-2',
      documentType: 'Planilla de Cotizaciones Previsionales',
      documentNumber: `PREV-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
      date: todayStr,
      amount: payrollConsolidated.totalPreviredLeyesSociales,
      fundSource: 'ordinario',
      status: 'pagado',
      paymentDate: todayStr,
      paymentMethod: 'transferencia',
      paymentReference: `PREVIRED-${selectedYear}${String(selectedMonth).padStart(2, '0')}`,
      approvedByCommittee: true,
      receiptNotes: `Declaración y pago electrónico en www.previred.com para ${payrollConsolidated.activeCount} trabajadores del condominio.`
    });

    setExpenseIntegrationToast(`¡Listo! Se registraron exitosamente en Gastos & Respaldos los Sueldos Líquidos (${formatCLP(payrollConsolidated.totalNet)}) y las Leyes Sociales (${formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}) del periodo ${periodLabel}.`);
    setTimeout(() => setExpenseIntegrationToast(''), 7000);
  };

  // Copiar resumen previsional al portapapeles
  const handleCopyPreviredSummary = () => {
    const text = `RESUMEN DE COTIZACIONES PREVISIONALES - PREVIRED
Condominio: ${currentCommunity.name} (RUT: ${currentCommunity.bankInfo?.rut || '65.184.920-K'})
Periodo: ${periodLabel}
Total Trabajadores: ${payrollConsolidated.activeCount}
---------------------------------------------
• Masa Salarial Imponible: ${formatCLP(payrollConsolidated.totalTaxable)}
• Cotizaciones AFP (Trabajadores): ${formatCLP(payrollConsolidated.totalPrevisionalDiscounts - Math.round(payrollConsolidated.totalTaxable * 0.076))}
• Cotizaciones Salud (Fonasa/Isapre 7%): ${formatCLP(Math.round(payrollConsolidated.totalTaxable * 0.07))}
• Seguro Cesantía AFC (Trabajador 0.6%): ${formatCLP(Math.round(payrollConsolidated.totalTaxable * 0.006))}
• Seguro Invalidez SIS (Empleador 1.49%): ${formatCLP(payrollConsolidated.totalEmployerSis)}
• Seguro Cesantía AFC (Empleador 2.4%): ${formatCLP(payrollConsolidated.totalEmployerAfc)}
• Mutual de Seguridad (Empleador 0.93%): ${formatCLP(payrollConsolidated.totalEmployerMutual)}
---------------------------------------------
TOTAL A DECLARAR Y PAGAR EN PREVIRED: ${formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}
TOTAL SUELDOS LÍQUIDOS A TRANSFERIR: ${formatCLP(payrollConsolidated.totalNet)}
COSTO TOTAL COMUNIDAD: ${formatCLP(payrollConsolidated.totalCommunityCost)}`;

    navigator.clipboard.writeText(text);
    setCopiedPrevired(true);
    setTimeout(() => setCopiedPrevired(false), 3000);
  };

  // Helper para generar cabecera corporativa estándar ARANPRO en PDFs
  const renderAranproPdfHeader = (docTypeBadge, titleText, folioText) => (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3.5 border-b-2 border-[#0F3D2E] gap-3">
      <div className="flex items-center space-x-3.5">
        <AranproLogo className="h-11 w-auto shrink-0" />
        <div className="space-y-0.5">
          <div className="text-sm font-black text-[#0F3D2E] tracking-tight">
            {companySettings?.brandName || 'ARANPRO'} • {companySettings?.subtitle || 'Gestión Integral'}
          </div>
          <div className="text-[10px] text-slate-600 font-bold tracking-wide">
            ADMINISTRACIÓN PROFESIONAL DE CONDOMINIOS • LEY N° 21.442
          </div>
          <div className="text-[9px] text-slate-500">
            RUT Empresa: <strong>{companySettings?.companyRut || '76.999.888-8'}</strong> • Reg. MINVU: <strong>RNAC N° {companySettings?.rnacNumber || '48.912'}</strong>
          </div>
        </div>
      </div>

      <div className="text-right space-y-0.5 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-block">
          {docTypeBadge}
        </span>
        <div className="text-xs font-black text-slate-900">
          {titleText}
        </div>
        <div className="text-[10px] text-slate-600 font-mono">
          {currentCommunity?.name} • Folio: {folioText}
        </div>
        <div className="text-[9px] text-slate-400">
          Santiago / Región de Coquimbo • {periodLongName}
        </div>
      </div>
    </div>
  );

  // Helper para generar pie de página institucional estándar ARANPRO en PDFs
  const renderAranproPdfFooter = (pageNumber, totalPages, documentTitle) => {
    const website = companySettings?.website || 'https://aranpro.cl';
    const phone = companySettings?.phone || '+56 9 5811 8504';
    return (
      <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono mt-auto">
        <div>ARANPRO Gestión Integral • {website}</div>
        <div className="font-bold text-[#0F3D2E]">
          Página {pageNumber} de {totalPages} • {documentTitle}
        </div>
        <div>Fono Directo: {phone}</div>
      </div>
    );
  };

  // Helper para membrete de continuidad en páginas 2+
  const renderContinuityHeader = (docTypeBadge, titleText, folioText) => (
    <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
      <div className="flex items-center space-x-2.5">
        <AranproLogo className="h-8 w-auto shrink-0" />
        <div className="space-y-0.5">
          <div className="text-xs font-black text-[#0F3D2E] tracking-tight">
            {companySettings?.brandName || 'ARANPRO'} • {companySettings?.subtitle || 'Gestión Integral'}
          </div>
          <div className="text-[8.5px] text-slate-500 font-mono">
            RUT: {companySettings?.companyRut || '76.999.888-8'} • RNAC MINVU N° {companySettings?.rnacNumber || '48.912'}
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[8.5px] font-black uppercase text-[#0F3D2E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {docTypeBadge} • Continuación
        </span>
        <div className="text-[10px] font-bold text-slate-800">{titleText}</div>
        <div className="text-[8.5px] text-slate-500 font-mono">Folio: {folioText}</div>
      </div>
    </div>
  );

  // Helper para firma del administrador con firma manuscrita digital subida + timbre oficial ARANPRO
  const renderAdminSignatureBlock = (sublabel = 'POR LA ADMINISTRACIÓN DELEGADA (LEY N° 21.442)', compact = false) => {
    const adminSignature = companySettings?.signatureDataUrl || companySettings?.signature || companySettings?.digitalSignature || '';
    const adminScale = Number(companySettings?.signatureScale) || 1.35;
    return (
      <div className="space-y-1 relative text-center min-w-[240px]">
        <div className={`${compact ? 'h-11' : 'h-16'} flex items-end justify-center mb-1 relative overflow-visible`}>
          {adminSignature ? (
            <img
              src={adminSignature}
              alt="Firma Administrador"
              className={`${compact ? 'h-10 max-h-12' : 'h-14 max-h-16'} w-auto max-w-[220px] object-contain mx-auto`}
              style={{ transform: `scale(${adminScale})`, transformOrigin: 'bottom center' }}
            />
          ) : (
            <div className={`${compact ? 'h-9' : 'h-12'} flex items-center justify-center`}>
              <span className="text-[11px] text-slate-400 italic">Firma Administrador Registrada</span>
            </div>
          )}
          <div className="absolute right-0 bottom-0 pointer-events-none">
            <AranproOfficialSeal size={compact ? 44 : 55} showVerificationText={false} />
          </div>
        </div>
        <div className="border-t-[1.5px] border-slate-800 pt-1.5">
          <strong className="block text-slate-900 font-black text-xs leading-tight">
            {companySettings?.adminName || 'John Andrés Arancibia Maureira'}
          </strong>
          <p className="text-[9.5px] text-slate-600 font-mono">
            RUT: {companySettings?.adminRut || '16.012.871-2'} • RNAC Minvu N° {companySettings?.rnacNumber || '48.912'}
          </p>
          <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">
            {sublabel}
          </p>
        </div>
      </div>
    );
  };

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
                RR.HH. & REMUNERACIONES DEL CONDOMINIO • LEY N° 21.442
              </span>
              <span className="text-xs text-emerald-200/80 font-medium">
                {currentCommunity?.name}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Personal, Liquidaciones DT & Leyes Sociales
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Gestión laboral de conserjes, mayordomos y auxiliares de aseo bajo el Código del Trabajo. Cálculo de gratificaciones Art. 50, horas extras, Previred y traspaso automático a Gastos Comunes.
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
                {[2024, 2025, 2026, 2027].map((y) => (
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
            Contratos Ley N° 21.442
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
            Masa Salarial Imponible
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-black text-slate-900">
              {formatCLP(payrollConsolidated.totalTaxable)}
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
              {formatCLP(payrollConsolidated.totalNet)}
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
              {formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}
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

      {/* 3. Sub-Navegación Interna */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1.5">
        {[
          { id: 'nomina', label: '1. Nómina de Personal & Fichas DT', icon: Users, badge: `${staff.length}` },
          { id: 'liquidaciones', label: '2. Cálculo Mensual & Liquidaciones DT', icon: FileSpreadsheet, badge: `${periodLabel}` },
          { id: 'previred', label: '3. Planilla Previred & Leyes Sociales', icon: Landmark, badge: formatCLP(payrollConsolidated.totalPreviredLeyesSociales) },
          { id: 'gastos_comunes', label: '4. Traspaso a Gastos Comunes', icon: DollarSign, badge: alreadyExportedToExpenses ? 'Registrado' : 'Pendiente' },
          { id: 'contratos', label: '5. Contratos & Documentos DT', icon: FileText, badge: 'Ley 21.442' }
        ].map((tab) => {
          const IconC = tab.icon;
          const isActive = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#0F3D2E] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <IconC className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4B895]' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </div>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-[#D4B895]'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================== SUB-PESTAÑA 1: NÓMINA DE PERSONAL & FICHAS DT ==================== */}
      {currentSubTab === 'nomina' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Trabajadores Contratados por el Condominio
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Empleador: <strong className="text-slate-700">{currentCommunity.bankInfo?.holderName || currentCommunity.name}</strong> • RUT Patronal: <strong className="text-slate-700">{currentCommunity.bankInfo?.rut || '65.184.920-K'}</strong>
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
              <h4 className="text-sm font-bold text-slate-700">No hay trabajadores registrados en este condominio</h4>
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
                          {worker.category || 'Conserjería'}
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
                        <span className="font-bold text-slate-800">{worker.weeklyHours || 44} hrs / {worker.shift?.split('(')[0] || 'Diurno'}</span>
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
                  onClick={() => setShowMonthlySheetModal(true)}
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

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPreviredSheetModal(true)}
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
                  B. Aportes Patronales de la Comunidad
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
                Integración de Sueldos con Gastos Comunes del Periodo {periodLabel}
              </h3>
              <p className="text-xs text-slate-500">
                Evita digitar dos veces los gastos en la contabilidad. Con un solo clic, se cargan los sueldos líquidos y las leyes sociales del mes en el módulo de Gastos & Respaldos.
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

      {/* ==================== SUB-PESTAÑA 5: CONTRATOS & DOCUMENTOS LABORALES DT ==================== */}
      {currentSubTab === 'contratos' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Documentación Oficial Ley 21.442 & Código del Trabajo
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Contratos de Trabajo Tipo & Reglamento Interno (RIOHS)
                </h3>
                <p className="text-xs text-slate-500">
                  Instrumentos jurídicos completos con descriptor profundo de cargos, sigilo, medidas de seguridad y normas de higiene laboral.
                </p>
              </div>

              {/* Botón para abrir el RIOHS oficial */}
              <button
                type="button"
                onClick={() => setShowRiohsModal(true)}
                className="py-2.5 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <ScrollText className="w-4 h-4" />
                <span>Ver Reglamento Interno (RIOHS)</span>
              </button>
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
                      Ingreso: {worker.startDate} • {worker.weeklyHours || 44} hrs
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
                      <span>Ver Contrato Detallado DT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: CREAR / EDITAR FICHA DE TRABAJADOR ==================== */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2 py-0.5 rounded-full">
                  {editingStaffId ? 'Actualizar Ficha' : 'Nueva Contratación'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {editingStaffId ? `Editar Ficha: ${staffForm.name}` : 'Contratar Nuevo Trabajador para el Condominio'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffForm} className="space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  1. Datos Personales del Trabajador
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="Ej: Juan Carlos Osorio Morales"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">RUT del Trabajador *</label>
                    <input
                      type="text"
                      required
                      value={staffForm.rut}
                      onChange={(e) => setStaffForm({ ...staffForm, rut: e.target.value })}
                      placeholder="Ej: 14.882.105-8"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="+56 9 8412 9901"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Dirección de Residencia</label>
                    <input
                      type="text"
                      value={staffForm.address}
                      onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                      placeholder="Calle, Número, Comuna"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  2. Cargo, Turno y Contrato (Ley 21.442)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cargo Laboral</label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="Conserje Titular Diurno">Conserje Titular Diurno</option>
                      <option value="Conserje Nocturno & Rondas">Conserje Nocturno & Rondas</option>
                      <option value="Conserje de Reemplazo / Fin de Semana">Conserje de Reemplazo / Fin de Semana</option>
                      <option value="Mayordomo de Edificio">Mayordomo de Edificio</option>
                      <option value="Auxiliar de Aseo & Espacios Comunes">Auxiliar de Aseo & Espacios Comunes</option>
                      <option value="Jardinero & Mantenimiento Áreas Verdes">Jardinero & Mantenimiento Áreas Verdes</option>
                      <option value="Rondero de Seguridad Nocturna">Rondero de Seguridad Nocturna</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Contrato</label>
                    <select
                      value={staffForm.contractType}
                      onChange={(e) => setStaffForm({ ...staffForm, contractType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="Contrato Indefinido">Contrato Indefinido</option>
                      <option value="Contrato Plazo Fijo">Contrato Plazo Fijo</option>
                      <option value="Contrato por Obra o Faena">Contrato por Obra o Faena</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Horas Semanales (Ley 40 Horas)</label>
                    <select
                      value={staffForm.weeklyHours}
                      onChange={(e) => setStaffForm({ ...staffForm, weeklyHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value={44}>44 Horas Semanales (Ordinaria)</option>
                      <option value={40}>40 Horas Semanales (Ley 40 Horas)</option>
                      <option value={30}>30 Horas Semanales (Jornada Parcial)</option>
                      <option value={20}>20 Horas Semanales (Part-time fin de semana)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={staffForm.startDate}
                      onChange={(e) => setStaffForm({ ...staffForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  3. Sueldo Base, Gratificación y Asignaciones
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sueldo Base Mensual (CLP) *</label>
                    <input
                      type="number"
                      required
                      min={CHILE_IMM}
                      step="5000"
                      value={staffForm.baseSalary}
                      onChange={(e) => setStaffForm({ ...staffForm, baseSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400">IMM Vigente: {formatCLP(CHILE_IMM)}</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gratificación Legal Art. 50</label>
                    <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffForm.hasLegalGratification}
                          onChange={(e) => setStaffForm({ ...staffForm, hasLegalGratification: e.target.checked })}
                          className="w-4 h-4 text-[#0F3D2E] rounded"
                        />
                        <span className="font-bold text-slate-800">25% con tope 4.75 IMM</span>
                      </label>
                      <span className="text-[10px] font-mono text-emerald-800 font-bold">
                        Tope: {formatCLP(CHILE_TOPE_GRATIFICACION_MENSUAL)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bono Turno Nocturno (Imponible)</label>
                    <input
                      type="number"
                      step="5000"
                      value={staffForm.contractualNightBonus}
                      onChange={(e) => setStaffForm({ ...staffForm, contractualNightBonus: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bono Responsabilidad (Imponible)</label>
                    <input
                      type="number"
                      step="5000"
                      value={staffForm.contractualResponsibilityBonus}
                      onChange={(e) => setStaffForm({ ...staffForm, contractualResponsibilityBonus: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Asignación Colación (No Imponible)</label>
                    <input
                      type="number"
                      step="5000"
                      value={staffForm.allowanceColacion}
                      onChange={(e) => setStaffForm({ ...staffForm, allowanceColacion: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Asignación Movilización (No Imponible)</label>
                    <input
                      type="number"
                      step="5000"
                      value={staffForm.allowanceMovilizacion}
                      onChange={(e) => setStaffForm({ ...staffForm, allowanceMovilizacion: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  4. Previsión Chilena & Datos Bancarios
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">AFP del Trabajador</label>
                    <select
                      value={staffForm.afpId}
                      onChange={(e) => setStaffForm({ ...staffForm, afpId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      {AFP_RATES_CHILE.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.rate}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sistema de Salud</label>
                    <select
                      value={staffForm.healthId}
                      onChange={(e) => setStaffForm({ ...staffForm, healthId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      {HEALTH_SYSTEMS_CHILE.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Banco para Pago</label>
                    <input
                      type="text"
                      value={staffForm.bankName}
                      onChange={(e) => setStaffForm({ ...staffForm, bankName: e.target.value })}
                      placeholder="Ej: Banco Estado, Banco de Chile"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo y N° de Cuenta</label>
                    <input
                      type="text"
                      value={staffForm.accountNumber}
                      onChange={(e) => setStaffForm({ ...staffForm, accountNumber: e.target.value })}
                      placeholder="Cuenta RUT / Vista / Corriente"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#0F3D2E] text-[#D4B895] font-black hover:bg-[#0A291F] shadow-sm"
                >
                  {editingStaffId ? 'Actualizar Ficha' : 'Guardar y Contratar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: VISOR E IMPRESIÓN DE LIQUIDACIÓN DE SUELDO DT ==================== */}
      {showSlipModal && selectedWorkerForSlip && (() => {
        const inputs = getWorkerInputs(selectedWorkerForSlip.id);
        const slip = calculateMonthlyPayroll(selectedWorkerForSlip, inputs);

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
                        { pdfStyle, fitPage: true, margin: '4mm 6mm 4mm 6mm' }
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
                      {renderAranproPdfHeader('DIRECCIÓN DEL TRABAJO (DT)', 'LIQUIDACIÓN DE REMUNERACIONES', `LIQ-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)}

                {/* Datos del Empleador y Periodo */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10.5px]">
                  <div>
                    <span className="text-slate-500 block uppercase text-[9.5px] font-bold">Empleador (Comunidad):</span>
                    <strong className="text-slate-900 font-bold block">{currentCommunity.bankInfo?.holderName || currentCommunity.name}</strong>
                    <span className="text-slate-600 block">RUT Patronal: <strong className="font-mono">{currentCommunity.bankInfo?.rut || '65.184.920-K'}</strong></span>
                    <span className="text-slate-600 block">Dirección: {currentCommunity.address || 'Camino San Ramón 4500, La Serena'}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block uppercase text-[9.5px] font-bold">Periodo de Liquidación:</span>
                    <strong className="text-xs font-black text-slate-900 block">{periodLongName}</strong>
                    <span className="text-slate-700 block font-bold">Días Trabajados: {slip.daysWorked} Días</span>
                    <span className="text-slate-500 block text-[9.5px]">Giro: Comunidad de Copropietarios (Ley 21.442)</span>
                  </div>
                </div>

                {/* Ficha del Trabajador */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 text-[10.5px]">
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
                <div className="p-2.5 bg-emerald-50 rounded-xl border-2 border-[#0F3D2E] flex flex-col md:flex-row items-center justify-between gap-2">
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
                    Aportes Patronales Empleador (Costo Comunidad): SIS 1.49% ({formatCLP(slip.employerSisAmount)}) • AFC Empleador 2.4% ({formatCLP(slip.employerAfcAmount)}) • Mutual 0.93% ({formatCLP(slip.employerMutualAmount)})
                  </span>
                  <span className="font-mono font-black text-slate-900 shrink-0">
                    Total Costo Comunidad: {formatCLP(slip.totalCommunityCost)}
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
                        "Recibí conforme el líquido indicado en esta liquidación, sin tener cargo ni reclamo alguno que formular respecto de las remuneraciones del periodo."
                      </p>
                    </div>
                  </div>

                  {renderAdminSignatureBlock('EN REPRESENTACIÓN DE LA COMUNIDAD (ART. 20 LEY 21.442)', true)}
                </div>

                {renderAranproPdfFooter(1, 1, 'Liquidación Individual de Remuneraciones DT')}
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
                    printDocumentDirectly(
                      'printable-community-monthly-payroll-sheet',
                      `ARANPRO_Planilla_Remuneraciones_${currentCommunity.name.replace(/\s+/g, '_')}_${periodLabel.replace('/', '_')}`,
                      { pdfStyle, fitPage: true, margin: '4mm 6mm 4mm 6mm' }
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
                  data-pdf-style={pdfStyle}
                >
                  <div className="space-y-4">
                    {renderAranproPdfHeader('LIBRO DE REMUNERACIONES', 'PLANILLA GENERAL DE SUELDOS & LEYES SOCIALES', `REM-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)}

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Comunidad Empleadora:</span>
                  <strong className="text-sm font-black text-slate-900">{currentCommunity.name}</strong>
                  <span className="text-slate-600 block text-[11px]">RUT: {currentCommunity.bankInfo?.rut || '65.184.920-K'} • {currentCommunity.address}</span>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Periodo Contable:</span>
                  <strong className="text-sm font-black text-slate-900">{periodLongName}</strong>
                  <span className="text-emerald-800 font-bold block text-[11px]">{payrollConsolidated.activeCount} Trabajadores en Nómina</span>
                </div>
              </div>

              {/* Tabla Detallada */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border border-slate-200">
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
                      <th className="p-2 text-right">Costo Comunidad</th>
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
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">1. Total Sueldos Líquidos Transferidos:</span>
                  <strong className="text-sm font-black text-emerald-800 font-mono">{formatCLP(payrollConsolidated.totalNet)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">2. Total Leyes Sociales (Previred):</span>
                  <strong className="text-sm font-black text-[#0F3D2E] font-mono">{formatCLP(payrollConsolidated.totalPreviredLeyesSociales)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Total Costo Personal Condominio:</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">{formatCLP(payrollConsolidated.totalCommunityCost)}</strong>
                </div>
              </div>
            </div>

            {/* Firmas de Respaldo y Pie Institucional anclados al fondo */}
            <div className="mt-auto space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-12 text-center text-xs">
                {renderAdminSignatureBlock('ADMINISTRACIÓN TITULAR • LIBRO DE SUELDOS (LEY 21.442)')}

                <div className="space-y-1 text-center">
                  <div className="h-16 flex items-end justify-center mb-1">
                    {/* Espacio para visación del Comité */}
                  </div>
                  <div className="border-t-[1.5px] border-slate-800 pt-1.5">
                    <strong className="block text-slate-900 font-black text-xs leading-tight">Comité de Administración</strong>
                    <p className="text-[9.5px] text-slate-600 font-mono">{currentCommunity.name}</p>
                    <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">VISACIÓN Y REVISIÓN CONFORME (ART. 17 LEY 21.442)</p>
                  </div>
                </div>
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
                    printDocumentDirectly(
                      'printable-community-previred-sheet',
                      `ARANPRO_Previred_${currentCommunity.name.replace(/\s+/g, '_')}_${periodLabel.replace('/', '_')}`,
                      { pdfStyle, fitPage: true, margin: '4mm 6mm 4mm 6mm' }
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
                  data-pdf-style={pdfStyle}
                >
                  <div className="space-y-4">
                    {renderAranproPdfHeader('PLANILLA PREVISIONAL', 'INFORME DE COTIZACIONES LEYES SOCIALES PREVIRED', `PREV-${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)}

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">RUT Patronal / Empresa Pagadora:</span>
                  <strong className="text-sm font-black text-slate-900 font-mono">{currentCommunity.bankInfo?.rut || '65.184.920-K'}</strong>
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
                <table className="w-full text-[11px] text-left">
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
              <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-[#0F3D2E] flex justify-between items-center">
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
                  <span className="text-xs font-bold text-slate-700 block">Cuenta de Cargo: Cuenta Corriente Comunidad</span>
                  <span className="text-xs text-slate-500 font-mono block">{currentCommunity.bankInfo?.bank} • {currentCommunity.bankInfo?.accountNumber}</span>
                </div>
              </div>
            </div>

            {/* Firmas y Pie Institucional anclados al fondo */}
            <div className="mt-auto space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-12 text-center text-xs">
                {renderAdminSignatureBlock('DECLARACIÓN Y PAGO PREVIRED (LEY 21.442)')}

                <div className="space-y-1 text-center">
                  <div className="h-16 flex items-end justify-center mb-1">
                    {/* Espacio visación */}
                  </div>
                  <div className="border-t-[1.5px] border-slate-800 pt-1.5">
                    <strong className="block text-slate-900 font-black text-xs leading-tight">Comité de Administración / Tesorería</strong>
                    <p className="text-[9.5px] text-slate-600 font-mono">{currentCommunity.name}</p>
                    <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">APROBACIÓN DE TRANSFERENCIA PREVIRED</p>
                  </div>
                </div>
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
                  <span className="text-xs text-slate-500">Registro General del Personal del Condominio (Ley 21.442)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AranproPdfStyleSelector />
                <button
                  type="button"
                  onClick={() =>
                    printDocumentDirectly(
                      'printable-community-staff-roster',
                      `ARANPRO_Nomina_Personal_${currentCommunity.name.replace(/\s+/g, '_')}`,
                      { pdfStyle, fitPage: true, margin: '4mm 6mm 4mm 6mm' }
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
                  data-pdf-style={pdfStyle}
                >
                  <div className="space-y-4">
                    {renderAranproPdfHeader('REGISTRO OFICIAL', 'NÓMINA DE TRABAJADORES DEL CONDOMINIO', `NOM-${new Date().getFullYear()}`)}

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <strong className="block text-slate-900 font-bold">{currentCommunity.name}</strong>
                        <span className="text-slate-600 block text-[11px]">RUT Patronal: {currentCommunity.bankInfo?.rut || '65.184.920-K'} • {currentCommunity.address}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-800 font-black block text-sm">{staff.length} Trabajadores Registrados</span>
                        <span className="text-slate-500 block text-[10px]">Actualizado al {new Date().toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>

                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table className="w-full text-[11px] text-left">
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

                  {/* Firmas y Pie Institucional anclados al fondo */}
                  <div className="mt-auto space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-12 text-center text-xs">
                      {renderAdminSignatureBlock('ADMINISTRADOR TITULAR • LEY N° 21.442')}

                      <div className="space-y-1 text-center">
                        <div className="h-16 flex items-end justify-center mb-1">
                          {/* Espacio visación Comité */}
                        </div>
                        <div className="border-t-[1.5px] border-slate-800 pt-1.5">
                          <strong className="block text-slate-900 font-black text-xs leading-tight">Comité de Administración</strong>
                          <p className="text-[9.5px] text-slate-600 font-mono">{currentCommunity.name}</p>
                          <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">REGISTRO Y VISACIÓN DE DOTACIÓN LABORAL</p>
                        </div>
                      </div>
                    </div>

                    {renderAranproPdfFooter(1, 1, 'Nómina Oficial de Trabajadores del Condominio')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 6: VISOR E IMPRESIÓN DE CONTRATO INDIVIDUAL DE TRABAJO DT PROFUNDO ==================== */}
      {showContractModal && selectedWorkerForContract && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F3D2E]" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Contrato Individual de Trabajo • Dirección del Trabajo (DT)
                  </h3>
                  <span className="text-xs text-slate-500">{selectedWorkerForContract.name} • {selectedWorkerForContract.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AranproPdfStyleSelector />
                <button
                  type="button"
                  onClick={() =>
                    printDocumentDirectly(
                      'printable-community-labor-contract',
                      `ARANPRO_Contrato_Trabajo_${selectedWorkerForContract.name.replace(/\s+/g, '_')}`,
                      { pdfStyle, fitPage: false, margin: '4mm 6mm 4mm 6mm' }
                    )
                  }
                  className="py-2 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Contrato Completo (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DOCUMENTO EXHAUSTIVO Y PROFUNDO DEL CONTRATO DE TRABAJO (2 PÁGINAS EDITORIALES) */}
            <div className="bg-slate-100 p-3 md:p-5 rounded-2xl max-h-[75vh] overflow-y-auto">
              <div id="printable-community-labor-contract" className="space-y-6 print-area">
                {/* ==================== PÁGINA 1: COMPARECENCIA Y CLÁUSULAS 1 A 3 ==================== */}
                <div
                  className="dossier-page page-1 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed"
                  data-pdf-style={pdfStyle}
                >
                  <div className="space-y-3.5">
                    {renderAranproPdfHeader('INSTRUMENTO LABORAL', 'CONTRATO INDIVIDUAL DE TRABAJO DE COPROPIEDAD', `CONTR-${selectedWorkerForContract.id}`)}

                    <div className="text-center space-y-0.5 border-b border-slate-200 pb-2">
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                        CONTRATO INDIVIDUAL DE TRABAJO
                      </h2>
                      <p className="text-[10px] text-slate-600 font-bold">
                        PERSONAL DE CONDOMINIO • LEY N° 21.442 Y CÓDIGO DEL TRABAJO DE LA REPÚBLICA DE CHILE
                      </p>
                    </div>

                    <p className="text-justify text-xs leading-relaxed">
                      En la ciudad de <strong>{currentCommunity.city || 'La Serena'}</strong>, República de Chile, a {selectedWorkerForContract.startDate}, entre la <strong>COMUNIDAD {currentCommunity.name.toUpperCase()}</strong>, Rol Único Tributario (RUT) N° <strong>{currentCommunity.bankInfo?.rut || '65.184.920-K'}</strong>, debidamente representada por su Administrador Titular don <strong>{companySettings?.adminName || 'John Andrés Arancibia Maureira'}</strong>, cédula nacional de identidad N° <strong>{companySettings?.adminRut || '16.012.871-2'}</strong>, con inscripción vigente en el Registro Nacional de Administradores de Condominios del MINVU (RNAC N° <strong>{companySettings?.rnacNumber || '48.912'}</strong>), ambos domiciliados para estos efectos en <strong>{currentCommunity.address}</strong>, en adelante denominada indistintamente como "la Comunidad" o "el Empleador"; y por la otra parte don(ña) <strong>{selectedWorkerForContract.name}</strong>, cédula nacional de identidad N° <strong>{selectedWorkerForContract.rut}</strong>, de nacionalidad chilena, fecha de nacimiento registrada, domiciliado(a) en <strong>{selectedWorkerForContract.address || 'domicilio acreditado'}</strong>, en adelante "el Trabajador", se ha convenido celebrar el siguiente Contrato Individual de Trabajo:
                    </p>

                    <div className="space-y-3 text-justify text-xs leading-relaxed">
                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px]">
                          PRIMERO: LUGAR DE PRESTACIÓN DE LOS SERVICIOS
                        </h4>
                        <p>
                          El Trabajador prestará sus servicios en las dependencias, áreas comunes, accesos vehiculares y peatonales, caseta de control y perímetro de la Comunidad <strong>{currentCommunity.name}</strong>, ubicada en <strong>{currentCommunity.address}</strong>, comuna de {currentCommunity.city || 'La Serena'}.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px]">
                          SEGUNDO: DESCRIPTOR EXHAUSTIVO DEL CARGO Y FUNCIONES ESPECÍFICAS
                        </h4>
                        <p>
                          El Trabajador es contratado para desempeñar las funciones de <strong>{selectedWorkerForContract.role}</strong>. En el cumplimiento de sus labores, y de conformidad con el Artículo 18 y siguientes de la Ley N° 21.442 de Copropiedad Inmobiliaria, sus obligaciones específicas comprenden:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                          <li><strong>Control de Accesos Peatonal y Vehicular:</strong> Registrar rigurosamente en el Libro de Control a toda persona, visita o vehículo que ingrese al condominio, verificando autorización previa de la unidad correspondiente.</li>
                          <li><strong>Recepción y Custodia de Encomiendas:</strong> Recibir, catalogar y custodiar paquetes, compras electrónicas y correspondencia en la caseta de conserjería, exigiendo firma y verificación al momento de la entrega al residente.</li>
                          <li><strong>Libro de Novedades de Conserjería:</strong> Llevar de forma prolija, veraz y cronológica el Libro de Novedades físico y digital del condominio, asentando en cada turno los incidentes, rondas, reclamos y estados de los equipos comunitarios.</li>
                          <li><strong>Inspección y Rondas Preventivas:</strong> Efectuar rondas periódicas de vigilancia en áreas comunes, revisando el normal funcionamiento de bombas de agua potable, salas de calderas, portones eléctricos, iluminación común y vías de evacuación.</li>
                          <li><strong>Custodia de Llaves Maestras:</strong> Mantener estricto control y resguardo de las llaves de salas técnicas y recintos comunitarios, prohibiéndose su entrega a terceros sin autorización de la Administración.</li>
                          <li><strong>Activación de Protocolos de Emergencia:</strong> Activar de inmediato los planes de contingencia ante incendios, sismos, fugas de gas, inundaciones o hechos delictuales, coordinando con Bomberos, Carabineros y SAMU.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px]">
                          TERCERO: JORNADA DE TRABAJO Y SISTEMA DE TURNOS
                        </h4>
                        <p>
                          La jornada ordinaria de trabajo será de <strong>{selectedWorkerForContract.weeklyHours || 44} horas semanales</strong>, distribuidas en turnos conforme al <strong>{selectedWorkerForContract.shift}</strong>. En razón de la naturaleza de los servicios de conserjería y vigilancia en copropiedades (Art. 38 N° 2 del Código del Trabajo), la jornada podrá incluir domingos y días festivos, otorgándose en tal caso los descansos compensatorios legales pertinentes.
                        </p>
                      </div>
                    </div>
                  </div>

                  {renderAranproPdfFooter(1, 2, 'Contrato Individual de Trabajo DT')}
                </div>

                {/* ==================== PÁGINA 2: CLÁUSULAS 4 A 8 Y FIRMAS LEGALES ==================== */}
                <div
                  className="dossier-page page-2 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed"
                  data-pdf-style={pdfStyle}
                >
                  <div className="space-y-3.5">
                    {renderContinuityHeader('INSTRUMENTO LABORAL', `CONTRATO INDIVIDUAL DE TRABAJO • ${selectedWorkerForContract.name}`, `CONTR-${selectedWorkerForContract.id}`)}

                    <div className="space-y-3 text-justify text-xs leading-relaxed">
                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px]">
                          CUARTO: REMUNERACIONES Y BENEFICIOS
                        </h4>
                        <p>
                          El Empleador pagará al Trabajador las siguientes remuneraciones mensuales:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-700">
                          <li><strong>Sueldo Base:</strong> La suma de <strong>{formatCLP(selectedWorkerForContract.baseSalary)}</strong> ({numberToSpanishWords(selectedWorkerForContract.baseSalary)}) mensuales.</li>
                          <li><strong>Gratificación Legal:</strong> Conforme al Artículo 50 del Código del Trabajo, la Comunidad pagará mensualmente el 25% de lo devengado por concepto de remuneraciones mensuales, con el tope legal de 4.75 ingresos mínimos mensuales al año.</li>
                          {selectedWorkerForContract.contractualNightBonus > 0 && (
                            <li><strong>Bono Turno Nocturno:</strong> Asignación imponible de {formatCLP(selectedWorkerForContract.contractualNightBonus)} por concepto de turnos de noche.</li>
                          )}
                          {selectedWorkerForContract.contractualResponsibilityBonus > 0 && (
                            <li><strong>Bono de Responsabilidad:</strong> Asignación imponible de {formatCLP(selectedWorkerForContract.contractualResponsibilityBonus)} por custodia y supervisión de accesos.</li>
                          )}
                          <li><strong>Asignación de Colación:</strong> La suma de {formatCLP(selectedWorkerForContract.allowanceColacion)} mensual, de carácter no imponible.</li>
                          <li><strong>Asignación de Movilización:</strong> La suma de {formatCLP(selectedWorkerForContract.allowanceMovilizacion)} mensual, de carácter no imponible.</li>
                        </ul>
                        <p className="mt-1">
                          Las remuneraciones se pagarán el último día hábil de cada mes calendario mediante transferencia electrónica bancaria a la cuenta <strong>{selectedWorkerForContract.accountType} N° {selectedWorkerForContract.accountNumber || 'registrada'}</strong> del <strong>{selectedWorkerForContract.bankName}</strong>.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px]">
                          QUINTO: PREVISIÓN SOCIAL Y SALUD
                        </h4>
                        <p>
                          El Trabajador declara que para los efectos previsionales de pensiones se encuentra afiliado a <strong>{selectedWorkerForContract.afpName}</strong>, y para los efectos de salud a <strong>{selectedWorkerForContract.healthName}</strong>, facultando a la Comunidad para retener y enterar las cotizaciones en las instituciones respectivas y en Previred. Asimismo, la Comunidad cotiza el Seguro de Invalidez y Sobrevivencia (SIS), Seguro de Cesantía (AFC) y la Ley N° 16.744 sobre Accidentes del Trabajo en la <strong>{selectedWorkerForContract.mutualEntity}</strong>.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px]">
                          SEXTO: OBLIGACIONES ESPECIALES, PROHIBICIONES Y CONFIDENCIALIDAD
                        </h4>
                        <p>
                          El Trabajador se compromete a guardar el más estricto secreto y confidencialidad respecto de los datos personales, rutinas, ausencias y bienes de los copropietarios y residentes del condominio (Ley N° 19.628). Se prohíbe expresamente al Trabajador: a) Abandonar la caseta o puesto de conserjería sin reemplazo autorizado; b) Permitir el ingreso de personas ajenas o amistades al interior de la caseta; c) Presentarse a trabajar bajo los efectos del alcohol o estupefacientes; d) Manipular llaves de paso o tableros sin orden técnica.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px]">
                          SÉPTIMO: REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD (RIOHS)
                        </h4>
                        <p>
                          El Trabajador declara haber recibido en este acto un ejemplar íntegro del Reglamento Interno de Orden, Higiene y Seguridad (RIOHS) de la Comunidad, obligándose a acatar sus normas, el uso permanente de sus Elementos de Protección Personal (EPP) y la normativa sobre prevención del acoso laboral y sexual (Ley Karin N° 21.643).
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px]">
                          OCTAVO: VIGENCIA DEL CONTRATO Y EJEMPLARES
                        </h4>
                        <p>
                          El presente contrato rige a contar del día <strong>{selectedWorkerForContract.startDate}</strong> y tendrá una duración de carácter <strong>{selectedWorkerForContract.contractType}</strong>. Se firma en dos ejemplares de idéntico tenor y fecha, quedando uno en poder del Trabajador y el otro en custodia de la Administración de la Comunidad.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Firmas Notariales y Patronales ancladas al fondo */}
                  <div className="mt-auto space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-12 text-center text-xs">
                      <div className="space-y-1 text-center">
                        <div className="h-16 flex items-end justify-center mb-1">
                          {/* Espacio firma trabajador */}
                        </div>
                        <div className="border-t-[1.5px] border-slate-900 pt-1.5">
                          <strong className="block text-slate-900 font-black text-xs leading-tight">{selectedWorkerForContract.name}</strong>
                          <p className="block font-mono text-[9.5px] text-slate-700">RUT: {selectedWorkerForContract.rut}</p>
                          <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">EL TRABAJADOR</p>
                        </div>
                      </div>

                      {renderAdminSignatureBlock('POR LA COMUNIDAD EMPLEADORA (ART. 20 LEY 21.442)')}
                    </div>

                    {renderAranproPdfFooter(2, 2, 'Contrato Individual de Trabajo DT')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 7: REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD (RIOHS) ==================== */}
      {showRiohsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-[#0F3D2E]" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Reglamento Interno de Orden, Higiene y Seguridad (RIOHS)
                  </h3>
                  <span className="text-xs text-slate-500">{currentCommunity.name} • Código del Trabajo & Ley Karin N° 21.643</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AranproPdfStyleSelector />
                <button
                  type="button"
                  onClick={() =>
                    printDocumentDirectly(
                      'printable-community-riohs-document',
                      `ARANPRO_RIOHS_${currentCommunity.name.replace(/\s+/g, '_')}`,
                      { pdfStyle, fitPage: false, margin: '4mm 6mm 4mm 6mm' }
                    )
                  }
                  className="py-2 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir RIOHS Completo (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRiohsModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DOCUMENTO RIOHS IMPRIMIBLE (2 PÁGINAS EDITORIALES) */}
            <div className="bg-slate-100 p-3 md:p-5 rounded-2xl max-h-[75vh] overflow-y-auto">
              <div id="printable-community-riohs-document" className="space-y-6 print-area">
                {/* ==================== PÁGINA 1: DISPOSICIONES, JORNADA Y OBLIGACIONES ==================== */}
                <div
                  className="dossier-page page-1 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed"
                  data-pdf-style={pdfStyle}
                >
                  <div className="space-y-4">
                    {renderAranproPdfHeader('NORMATIVA LABORAL', 'REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD (RIOHS)', 'RIOHS-2026')}

                    <div className="text-center space-y-1 border-b border-slate-200 pb-3">
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                        REGLAMENTO INTERNO DE ORDEN, HIGIENE Y SEGURIDAD
                      </h2>
                      <p className="text-[11px] text-slate-600 font-bold">
                        COMUNIDAD {currentCommunity.name.toUpperCase()} • LEY N° 16.744, LEY N° 21.442 Y LEY KARIN N° 21.643
                      </p>
                    </div>

                    <div className="space-y-4 text-justify text-xs leading-relaxed">
                      <div>
                        <h4 className="font-black text-[#0F3D2E] uppercase text-xs">
                          TÍTULO I: DISPOSICIONES GENERALES, ÁMBITO DE APLICACIÓN Y OBJETIVOS
                        </h4>
                        <p className="mt-1">
                          El presente Reglamento Interno regula las condiciones, requisitos, derechos, deberes y normas de higiene y seguridad laboral que rigen para todos los trabajadores dependientes de la <strong>COMUNIDAD {currentCommunity.name.toUpperCase()}</strong>, en conformidad a lo dispuesto en el Libro I, Título III del Código del Trabajo, en la Ley N° 16.744 sobre Accidentes del Trabajo y Enfermedades Profesionales, y en la Ley N° 21.442 de Copropiedad Inmobiliaria. Su cumplimiento es estrictamente obligatorio para la totalidad de la dotación y personal de reemplazo.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-[#0F3D2E] uppercase text-xs">
                          TÍTULO II: DE LA JORNADA DE TRABAJO, REGISTRO DE ASISTENCIA Y SISTEMA DE TURNOS
                        </h4>
                        <p className="mt-1">
                          El personal cumplirá la jornada pactada en sus contratos individuales de trabajo. El control diario de asistencia, horas de entrada, salida y tiempo de colación se registrará obligatoriamente a través del Libro de Asistencia foliado o sistema electrónico validado por la Dirección del Trabajo (DT). Ningún trabajador podrá hacer abandono de su puesto antes de la llegada de su relevo formal y debida entrega de novedades asentadas en el Libro de Conserjería.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-[#0F3D2E] uppercase text-xs">
                          TÍTULO III: OBLIGACIONES PRIMORDIALES DEL PERSONAL DE CONSERJERÍA, RONDAS Y ASEO
                        </h4>
                        <p className="mt-1">
                          Son obligaciones fundamentales del personal de copropiedad:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                          <li>Mantener un trato de máximo respeto, probidad, prudencia y cortesía hacia copropietarios, arrendatarios, visitas y Comité de Administración.</li>
                          <li>Controlar e individualizar en los registros de acceso a todo peatón y vehículo ajeno al condominio, verificando autorización previa.</li>
                          <li>Operar con celo y diligencia los sistemas de citofonía, circuito cerrado de televisión (CCTV), portones automáticos y barreras de acceso.</li>
                          <li>Custodiar las llaves de salas técnicas y recintos comunitarios, prohibiéndose su entrega sin autorización expresa de la Administración.</li>
                          <li>Utilizar en forma permanente los Elementos de Protección Personal (EPP) suministrados por el Empleador durante toda la jornada.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {renderAranproPdfFooter(1, 2, 'Reglamento Interno de Orden, Higiene y Seguridad (RIOHS)')}
                </div>

                {/* ==================== PÁGINA 2: LEY KARIN, SEGURIDAD, EPP, SANCIONES Y FIRMAS ==================== */}
                <div
                  className="dossier-page page-2 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[780px] md:min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed"
                  data-pdf-style={pdfStyle}
                >
                  <div className="space-y-4">
                    {renderContinuityHeader('NORMATIVA LABORAL', `REGLAMENTO INTERNO RIOHS • ${currentCommunity.name}`, 'RIOHS-2026')}

                    <div className="space-y-4 text-justify text-xs leading-relaxed">
                      <div>
                        <h4 className="font-black text-[#0F3D2E] uppercase text-xs">
                          TÍTULO IV: PROTOCOLO OBLIGATORIO DE PREVENCIÓN DEL ACOSO LABORAL, SEXUAL Y VIOLENCIA EN EL TRABAJO (LEY KARIN N° 21.643)
                        </h4>
                        <p className="mt-1">
                          La Comunidad y la Administración prohíben terminantemente cualquier conducta constitutiva de acoso laboral, acoso sexual o violencia física o psicológica en el trabajo, sea por parte de copropietarios, miembros del Comité, superiores jerárquicos o terceros. Se establecen canales formales y confidenciales para la recepción inmediata de denuncias ante la Administración Titular, adoptándose medidas cautelares de resguardo y derivación a la Dirección del Trabajo y Mutualidad respectiva en los plazos legales.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-[#0F3D2E] uppercase text-xs">
                          TÍTULO V: NORMAS DE SEGURIDAD EN INSTALACIONES CRÍTICAS COMUNITARIAS
                        </h4>
                        <p className="mt-1">
                          Se prohíbe terminantemente el ingreso de personas no autorizadas o residentes a salas de bombas de impulsión de agua potable, calderas, generadores de emergencia, tableros eléctricos de fuerza y fosas de recirculación. El personal de conserjería mantendrá cerrado con candado o llave dichos recintos y reportará cualquier fuga de agua, olor a gas, sobrecalentamiento o caída de fase de manera urgente a la Administración.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-[#0F3D2E] uppercase text-xs">
                          TÍTULO VI: ELEMENTOS DE PROTECCIÓN PERSONAL (EPP), ACCIDENTES DEL TRABAJO Y MUTUALIDAD
                        </h4>
                        <p className="mt-1">
                          La Comunidad proporcionará oportunamente al personal el calzado de seguridad dieléctrico, guantes de nitrilo, chalecos reflectantes de alta visibilidad para turnos nocturnos y protectores auditivos. En caso de siniestro laboral o de trayecto, se aplicará de inmediato el protocolo de derivación a la Mutualidad adherida (Mutual de Seguridad / ACHS / IST) y notificación a la Dirección del Trabajo.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-black text-[#0F3D2E] uppercase text-xs">
                          TÍTULO VII: SANCIONES, PROCEDIMIENTO DE RECLAMOS, VIGENCIA Y EJEMPLARES
                        </h4>
                        <p className="mt-1">
                          Las infracciones a este reglamento serán sancionadas conforme al Código del Trabajo mediante amonestación verbal, censura por escrito con copia a la Inspección del Trabajo, y multas proporcionales a beneficio de fondos de bienestar. El presente instrumento comenzará a regir formalmente transcurridos 30 días desde su notificación y entrega de copias a los trabajadores y al Comité de Administración.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Firmas y Pie Institucional anclados al fondo */}
                  <div className="mt-auto space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-12 text-center text-xs">
                      {renderAdminSignatureBlock('POR LA ADMINISTRACIÓN DELEGADA (LEY N° 21.442)')}

                      <div className="space-y-1 text-center">
                        <div className="h-16 flex items-end justify-center mb-1">
                          {/* Espacio visación Comité */}
                        </div>
                        <div className="border-t-[1.5px] border-slate-900 pt-1.5">
                          <strong className="block text-slate-900 font-black text-xs leading-tight">Comité de Administración</strong>
                          <p className="text-[9.5px] text-slate-600 font-mono">{currentCommunity.name}</p>
                          <p className="text-[9px] text-[#0F3D2E] font-bold uppercase">LEY N° 21.442 DE COPROPIEDAD INMOBILIARIA</p>
                        </div>
                      </div>
                    </div>

                    {renderAranproPdfFooter(2, 2, 'Reglamento Interno de Orden, Higiene y Seguridad (RIOHS)')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
