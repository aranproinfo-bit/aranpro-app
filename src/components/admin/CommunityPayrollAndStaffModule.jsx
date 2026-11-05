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
import { AranproOfficialSeal, useAranproPdfStyle } from '../common/MauranLogo';
import {
  Users, UserPlus, FileText, Printer, CheckCircle2, AlertCircle,
  Building2, ShieldCheck, DollarSign, Calendar, Clock, Download,
  ExternalLink, Copy, Check, ChevronRight, ArrowRight, Eye, Edit3,
  Trash2, Plus, Sparkles, AlertTriangle, Briefcase, FileSpreadsheet,
  Award, Landmark, HelpCircle, X
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

  // Inputs mensuales variables por trabajador (días, horas extras, bonos, anticipos)
  // Almacenados en el estado de la comunidad o localmente
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

  // Modal para agregar o editar trabajador
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

  // Modal para Ver Contrato de Trabajo DT
  const [selectedWorkerForContract, setSelectedWorkerForContract] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);

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

    // Total Leyes Sociales (Previred = Descuentos de trabajadores + Aportes patronales)
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
            <button
              type="button"
              onClick={handleOpenCreateStaff}
              className="py-2 px-3.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Contratar Nuevo Trabajador</span>
            </button>
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

              <div className="flex items-center gap-2">
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

              <button
                type="button"
                onClick={handleCopyPreviredSummary}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                {copiedPrevired ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{copiedPrevired ? '¡Copiado al Portapapeles!' : 'Copiar Resumen Previred'}</span>
              </button>
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
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Documentación Oficial Ley 21.442
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                Contratos de Trabajo Tipo & Certificados Laborales
              </h3>
              <p className="text-xs text-slate-500">
                Plantillas legales validadas bajo el Código del Trabajo y la Dirección del Trabajo (DT) para personal de edificios y condominios.
              </p>
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
                      Ingreso: {worker.startDate}
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
                      <span>Ver Contrato DT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREAR / EDITAR FICHA DE TRABAJADOR ==================== */}
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
              {/* Sección 1: Datos Personales */}
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

              {/* Sección 2: Cargo y Jornada */}
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

              {/* Sección 3: Remuneración y Asignaciones */}
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

              {/* Sección 4: Previsión y Banco */}
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

      {/* ==================== MODAL: VISOR E IMPRESIÓN DE LIQUIDACIÓN DE SUELDO DT ==================== */}
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
                  <button
                    type="button"
                    onClick={() =>
                      printDocumentDirectly(
                        'printable-community-payroll-slip',
                        `Liquidacion_${selectedWorkerForSlip.name.replace(/\s+/g, '_')}_${periodLabel.replace('/', '_')}`,
                        { pdfStyle }
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

              {/* CONTENEDOR IMPRIMIBLE FORMAL DE LA LIQUIDACIÓN DE SUELDO */}
              <div
                id="printable-community-payroll-slip"
                className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm text-slate-900 text-xs space-y-5 print-wrapper"
              >
                {/* Cabecera Documento */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      EMPLEADOR (COMUNIDAD DE COPROPIETARIOS - LEY N° 21.442)
                    </span>
                    <h2 className="text-base font-black text-slate-900">
                      {currentCommunity.bankInfo?.holderName || currentCommunity.name}
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      RUT Patronal: <strong className="font-mono">{currentCommunity.bankInfo?.rut || '65.184.920-K'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Dirección: {currentCommunity.address || 'Camino San Ramón 4500, La Serena'}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Giro: Comunidad de Copropietarios Inmobiliaria
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
                      DIRECCIÓN DEL TRABAJO (DT)
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      LIQUIDACIÓN DE REMUNERACIONES
                    </h3>
                    <p className="text-xs font-bold text-slate-700">
                      PERIODO: {periodLabel}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      DÍAS TRABAJADOS: {slip.daysWorked} DÍAS
                    </p>
                  </div>
                </div>

                {/* Ficha del Trabajador */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Trabajador:</span>
                    <strong className="text-slate-900 font-bold block">{selectedWorkerForSlip.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">RUT Trabajador:</span>
                    <strong className="font-mono text-slate-900 block">{selectedWorkerForSlip.rut}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cargo / Función:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.role}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fecha Ingreso:</span>
                    <strong className="font-mono text-slate-900 block">{selectedWorkerForSlip.startDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">AFP:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.afpName} ({slip.afpRate}%)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Salud:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.healthName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Jornada Semanal:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.weeklyHours || 44} Horas</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tipo Contrato:</span>
                    <strong className="text-slate-900 block">{selectedWorkerForSlip.contractType}</strong>
                  </div>
                </div>

                {/* Detalle de Haberes vs Descuentos */}
                <div className="grid grid-cols-2 gap-4">
                  {/* HABERES */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-black text-slate-900 uppercase text-[11px]">
                      1. Haberes (Imponibles y No Imponibles)
                    </div>
                    <table className="w-full text-[11px]">
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2 text-slate-700">Sueldo Base Mensual ({slip.daysWorked} Días)</td>
                          <td className="p-2 text-right font-mono font-bold">{formatCLP(slip.proratedBase)}</td>
                        </tr>
                        {slip.gratification > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Gratificación Legal Art. 50 (25% Tope)</td>
                            <td className="p-2 text-right font-mono font-bold">{formatCLP(slip.gratification)}</td>
                          </tr>
                        )}
                        {slip.overtimeAmount > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Horas Extraordinarias al 50% ({slip.overtimeHours} hrs)</td>
                            <td className="p-2 text-right font-mono font-bold">{formatCLP(slip.overtimeAmount)}</td>
                          </tr>
                        )}
                        {slip.contractualNightBonus > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Bono Turno Nocturno</td>
                            <td className="p-2 text-right font-mono font-bold">{formatCLP(slip.contractualNightBonus)}</td>
                          </tr>
                        )}
                        {slip.contractualResponsibilityBonus > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Bono de Responsabilidad</td>
                            <td className="p-2 text-right font-mono font-bold">{formatCLP(slip.contractualResponsibilityBonus)}</td>
                          </tr>
                        )}
                        {slip.extraTaxableBonus > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Otros Bonos Imponibles</td>
                            <td className="p-2 text-right font-mono font-bold">{formatCLP(slip.extraTaxableBonus)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-black text-slate-900">
                          <td className="p-2 uppercase text-[10px]">Total Imponible:</td>
                          <td className="p-2 text-right font-mono">{formatCLP(slip.totalTaxable)}</td>
                        </tr>
                        {slip.colacion > 0 && (
                          <tr>
                            <td className="p-2 text-slate-600">Asignación de Colación (No Imponible)</td>
                            <td className="p-2 text-right font-mono">{formatCLP(slip.colacion)}</td>
                          </tr>
                        )}
                        {slip.movilizacion > 0 && (
                          <tr>
                            <td className="p-2 text-slate-600">Asignación de Movilización (No Imponible)</td>
                            <td className="p-2 text-right font-mono">{formatCLP(slip.movilizacion)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-100/80 font-black text-slate-900 border-t border-slate-300">
                          <td className="p-2.5 uppercase">TOTAL HABERES:</td>
                          <td className="p-2.5 text-right font-mono text-xs">{formatCLP(slip.totalGross)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* DESCUENTOS */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-black text-slate-900 uppercase text-[11px]">
                      2. Descuentos Legales y Varios
                    </div>
                    <table className="w-full text-[11px]">
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2 text-slate-700">Cotización Previsional AFP ({slip.afpRate}%)</td>
                          <td className="p-2 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.afpAmount)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-700">Cotización Salud ({slip.healthRate}%)</td>
                          <td className="p-2 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.healthAmount)}</td>
                        </tr>
                        {slip.afcWorkerAmount > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Seguro de Cesantía AFC Trabajador (0.6%)</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.afcWorkerAmount)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-black text-slate-900">
                          <td className="p-2 uppercase text-[10px]">Total Leyes Sociales:</td>
                          <td className="p-2 text-right font-mono text-rose-800">-{formatCLP(slip.totalPrevisionalDiscounts)}</td>
                        </tr>
                        {slip.advances > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Anticipo de Sueldo / Quincena</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.advances)}</td>
                          </tr>
                        )}
                        {slip.otherDiscounts > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Otros Descuentos Autorizados</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-700">-{formatCLP(slip.otherDiscounts)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-100/80 font-black text-slate-900 border-t border-slate-300">
                          <td className="p-2.5 uppercase">TOTAL DESCUENTOS:</td>
                          <td className="p-2.5 text-right font-mono text-xs text-rose-800">-{formatCLP(slip.totalDiscounts)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recuadro Destacado: Líquido a Pagar en Palabras */}
                <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-600 flex flex-col md:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block">
                      ALCANCE LÍQUIDO A PAGAR (NETO):
                    </span>
                    <strong className="text-lg font-black text-emerald-900 font-mono block">
                      {formatCLP(slip.netSalary)}
                    </strong>
                    <span className="text-[11px] text-emerald-800 font-medium block">
                      SON: {slip.netSalaryInWords}
                    </span>
                  </div>

                  <div className="text-right text-[11px] text-slate-600">
                    <span>Medio de Pago: Transferencia Electrónica</span>
                    <strong className="block text-slate-900">{selectedWorkerForSlip.bankName} • {selectedWorkerForSlip.accountNumber || 'Cuenta Registrada'}</strong>
                  </div>
                </div>

                {/* Aportes Patronales (Costo Empleador - No descontables al trabajador) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-700">
                    Aportes Patronales Empleador (Costo Comunidad): SIS 1.49% ({formatCLP(slip.employerSisAmount)}) • AFC Empleador 2.4% ({formatCLP(slip.employerAfcAmount)}) • Mutual 0.93% ({formatCLP(slip.employerMutualAmount)})
                  </span>
                  <span className="font-mono font-black text-slate-900 shrink-0">
                    Total Costo Comunidad: {formatCLP(slip.totalCommunityCost)}
                  </span>
                </div>

                {/* Firmas Legales */}
                <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs">
                  <div className="space-y-1">
                    <div className="h-16 flex items-end justify-center mb-1">
                      {/* Espacio para firma manuscrita del trabajador */}
                    </div>
                    <div className="border-t border-slate-800 pt-1.5">
                      <strong className="block text-slate-900">{selectedWorkerForSlip.name}</strong>
                      <span className="text-slate-600 font-mono">RUT: {selectedWorkerForSlip.rut}</span>
                      <span className="text-[10px] text-slate-500 block">FIRMA DEL TRABAJADOR</span>
                      <p className="text-[9px] text-slate-400 mt-1 italic">
                        "Recibí conforme el líquido indicado en esta liquidación, sin tener cargo ni reclamo alguno que formular respecto de las remuneraciones del periodo."
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-16 flex items-end justify-center mb-1">
                      {companySettings?.signatureDataUrl ? (
                        <img
                          src={companySettings.signatureDataUrl}
                          alt="Firma Administrador"
                          className="h-14 max-h-16 w-auto object-contain mx-auto"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">Firma Administrador ARANPRO</span>
                      )}
                    </div>
                    <div className="border-t border-slate-800 pt-1.5">
                      <strong className="block text-slate-900">
                        {companySettings?.adminName || 'John Andrés Arancibia Maureira'}
                      </strong>
                      <span className="text-slate-600">
                        Administrador Titular (RNAC Minvu N° {companySettings?.rnacNumber || '48.912'})
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        EN REPRESENTACIÓN DE LA COMUNIDAD (ART. 20 LEY 21.442)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center text-[9px] text-slate-400 border-t border-slate-100">
                  Documento emitido conforme al Código del Trabajo y la Ley N° 21.442 de Copropiedad Inmobiliaria • Sistema ARANPRO SpA
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== MODAL: VISOR DE CONTRATO DE TRABAJO TIPO DT ==================== */}
      {showContractModal && selectedWorkerForContract && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F3D2E]" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Contrato Individual de Trabajo • Dirección del Trabajo
                  </h3>
                  <span className="text-xs text-slate-500">{selectedWorkerForContract.name} • {selectedWorkerForContract.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printDocumentDirectly(
                      'printable-community-labor-contract',
                      `Contrato_Trabajo_${selectedWorkerForContract.name.replace(/\s+/g, '_')}`,
                      { pdfStyle }
                    )
                  }
                  className="py-2 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Contrato</span>
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

            {/* DOCUMENTO DEL CONTRATO */}
            <div
              id="printable-community-labor-contract"
              className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm text-slate-900 text-xs space-y-4 font-serif leading-relaxed print-wrapper"
            >
              <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  CONTRATO INDIVIDUAL DE TRABAJO
                </h2>
                <p className="text-[11px] text-slate-600">
                  PERSONAL DE CONDOMINIO • LEY N° 21.442 Y CÓDIGO DEL TRABAJO
                </p>
              </div>

              <p className="text-justify">
                En la ciudad de <strong>{currentCommunity.city || 'La Serena'}</strong>, República de Chile, a {selectedWorkerForContract.startDate}, entre la <strong>COMUNIDAD {currentCommunity.name.toUpperCase()}</strong>, RUT N° <strong>{currentCommunity.bankInfo?.rut || '65.184.920-K'}</strong>, representada por su Administrador Titular don <strong>{companySettings?.adminName || 'John Andrés Arancibia Maureira'}</strong>, RUT N° <strong>{companySettings?.adminRut || '16.012.871-2'}</strong>, domiciliados en <strong>{currentCommunity.address}</strong>, en adelante "el Empleador"; y don(ña) <strong>{selectedWorkerForContract.name}</strong>, cédula nacional de identidad N° <strong>{selectedWorkerForContract.rut}</strong>, de nacionalidad chilena, domiciliado(a) en <strong>{selectedWorkerForContract.address || 'domicilio registrado'}</strong>, en adelante "el Trabajador", se ha convenido el siguiente contrato de trabajo:
              </p>

              <div className="space-y-2 text-justify">
                <p>
                  <strong>PRIMERO (Funciones):</strong> El Trabajador se compromete a desempeñar las funciones de <strong>{selectedWorkerForContract.role}</strong> para la Comunidad, realizando labores de control de acceso de visitas, recepción de encomiendas, fiscalización del buen uso de bienes comunes, custodia de llaves maestras y rondas de vigilancia preventiva en conformidad con la Ley N° 21.442 de Copropiedad Inmobiliaria.
                </p>

                <p>
                  <strong>SEGUNDO (Jornada de Trabajo):</strong> La jornada ordinaria de trabajo será de <strong>{selectedWorkerForContract.weeklyHours || 44} horas semanales</strong>, distribuidas según el turno <strong>{selectedWorkerForContract.shift}</strong> establecido por la Administración.
                </p>

                <p>
                  <strong>TERCERO (Remuneración):</strong> El Empleador pagará al Trabajador un Sueldo Base mensual de <strong>{formatCLP(selectedWorkerForContract.baseSalary)}</strong> ({numberToSpanishWords(selectedWorkerForContract.baseSalary)}). Asimismo, se conviene el pago de gratificación legal mensual conforme al Artículo 50 del Código del Trabajo, con tope de 4.75 ingresos mínimos mensuales al año, además de una asignación de colación de {formatCLP(selectedWorkerForContract.allowanceColacion)} y asignación de movilización de {formatCLP(selectedWorkerForContract.allowanceMovilizacion)}.
                </p>

                <p>
                  <strong>CUARTO (Previsión):</strong> El Trabajador declara encontrarse afiliado a <strong>{selectedWorkerForContract.afpName}</strong> para efectos previsionales de pensiones, y a <strong>{selectedWorkerForContract.healthName}</strong> para prestaciones de salud.
                </p>

                <p>
                  <strong>QUINTO (Plazo y Vigencia):</strong> El presente contrato rige a contar del día <strong>{selectedWorkerForContract.startDate}</strong> y tendrá una duración de carácter <strong>{selectedWorkerForContract.contractType}</strong>.
                </p>
              </div>

              <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-slate-800 pt-2">
                    <strong>{selectedWorkerForContract.name}</strong>
                    <span className="block font-mono">RUT: {selectedWorkerForContract.rut}</span>
                    <span className="text-[10px] text-slate-500 block">EL TRABAJADOR</span>
                  </div>
                </div>

                <div>
                  <div className="border-t border-slate-800 pt-2">
                    <strong>{companySettings?.adminName || 'John Andrés Arancibia Maureira'}</strong>
                    <span className="block">Administrador Titular (RNAC Minvu N° {companySettings?.rnacNumber || '48.912'})</span>
                    <span className="text-[10px] text-slate-500 block">POR LA COMUNIDAD EMPLEADORA</span>
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
