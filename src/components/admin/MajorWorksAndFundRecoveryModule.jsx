import React, { useState, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { 
  Hammer, ShieldCheck, Plus, CheckCircle2, Clock, AlertTriangle, 
  Receipt, Calendar, ArrowRight, Printer, Download, Eye, FileText,
  DollarSign, PieChart, Layers, Building2, UserCheck, ChevronRight, X
} from 'lucide-react';
import { formatCLP, formatDate, formatRut } from '../../utils/formatters';
import { getMajorWorksRecoveryList, generateInstallmentSchedule } from '../../utils/expenseBilling';
import { printDocumentDirectly } from '../../utils/printDocument';
import { AranproLogo, AranproOfficialSeal } from '../common/MauranLogo';

export const MajorWorksAndFundRecoveryModule = ({ currentCommunity }) => {
  const { addExpense, updateExpense, companySettings } = useCommunity();

  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'en_recuperacion' | 'completado'
  const [selectedWork, setSelectedWork] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Obtener lista consolidada de trabajos mayores en cuotas
  const majorWorks = useMemo(() => {
    return getMajorWorksRecoveryList(currentCommunity);
  }, [currentCommunity]);

  // Filtrado
  const filteredWorks = useMemo(() => {
    if (filterStatus === 'ALL') return majorWorks;
    return majorWorks.filter(w => w.status === filterStatus);
  }, [majorWorks, filterStatus]);

  // Métricas globales
  const kpis = useMemo(() => {
    const totalProjects = majorWorks.length;
    const activeProjects = majorWorks.filter(w => w.status === 'en_recuperacion').length;
    const totalDisbursed = majorWorks.reduce((acc, w) => acc + w.totalAmount, 0);
    const totalRecovered = majorWorks.reduce((acc, w) => acc + w.totalRecovered, 0);
    const totalPending = majorWorks.reduce((acc, w) => acc + w.remainingToRecover, 0);
    const overallRecoveryPercent = totalDisbursed > 0 ? Math.round((totalRecovered / totalDisbursed) * 100) : 100;

    return {
      totalProjects,
      activeProjects,
      totalDisbursed,
      totalRecovered,
      totalPending,
      overallRecoveryPercent
    };
  }, [majorWorks]);

  // Formulario nuevo trabajo mayor
  const activeYear = currentCommunity?.activePeriod?.year || new Date().getFullYear();
  const activeMonth = currentCommunity?.activePeriod?.month || (new Date().getMonth() + 1);
  const defaultStartPeriod = `${activeYear}-${String(activeMonth).padStart(2, '0')}`;

  const [newWorkForm, setNewWorkForm] = useState({
    projectName: '',
    description: '',
    category: 'Obras & Reparaciones Mayores',
    provider: '',
    providerRut: '',
    documentType: 'Factura Electrónica',
    documentNumber: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    fundSource: 'fondo_reserva', // de dónde se pagó al proveedor
    recoveryFund: 'fondo_reserva', // fondo al que se reintegra
    billingInstallments: 6, // cuotas
    recoveryStartPeriod: defaultStartPeriod,
    recoveryAgreementNumber: 'Acta de Asamblea Extraordinaria N° / Acuerdo de Comité',
    status: 'pagado', // al proveedor ya se le pagó o se paga de los fondos
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    approvedByCommittee: true,
    receiptUrl: '',
    notes: ''
  });

  const handleCreateMajorWork = (e) => {
    e.preventDefault();
    if (!newWorkForm.projectName.trim() || !newWorkForm.amount || Number(newWorkForm.amount) <= 0) {
      alert('Por favor complete el nombre de la obra y el monto desembolsado.');
      return;
    }

    const installments = Math.max(1, parseInt(newWorkForm.billingInstallments, 10) || 1);
    const amountNum = parseFloat(newWorkForm.amount) || 0;

    const expensePayload = {
      id: `exp-major-${Date.now()}`,
      category: newWorkForm.category,
      description: newWorkForm.description.trim() || newWorkForm.projectName.trim(),
      provider: newWorkForm.provider.trim(),
      providerRut: newWorkForm.providerRut.trim(),
      documentType: newWorkForm.documentType,
      documentNumber: newWorkForm.documentNumber.trim(),
      date: newWorkForm.date,
      amount: amountNum,
      fundSource: newWorkForm.fundSource,
      status: newWorkForm.status,
      paymentDate: newWorkForm.paymentDate,
      paymentReference: newWorkForm.paymentReference.trim(),
      approvedByCommittee: true,
      receiptUrl: newWorkForm.receiptUrl.trim(),
      notes: newWorkForm.notes.trim(),
      // Propiedades de recuperación de fondos en cuotas
      isFundRecovery: true,
      reimburseFund: true,
      recoveryFund: newWorkForm.recoveryFund,
      recoveryProjectName: newWorkForm.projectName.trim(),
      billingInstallments: installments,
      recoveryStartPeriod: newWorkForm.recoveryStartPeriod,
      recoveryAgreementNumber: newWorkForm.recoveryAgreementNumber.trim()
    };

    addExpense(currentCommunity.id, expensePayload);
    setShowNewModal(false);
    alert(`✅ ¡Trabajo Mayor registrado exitosamente!\n\nSe pagó $${amountNum.toLocaleString('es-CL')} al contratista con cargo a ${newWorkForm.fundSource === 'fondo_reserva' ? 'Fondo de Reserva' : 'Fondo Operacional'}.\nSe cobrará a la comunidad en ${installments} cuotas mensuales de aprox. $${Math.round(amountNum / installments).toLocaleString('es-CL')} a partir de ${newWorkForm.recoveryStartPeriod}.`);
  };

  // Impresión de Ficha Oficial de Obra y Reposición de Fondos
  const handlePrintWorkSheet = (work) => {
    const filename = `ARANPRO_Plan_Recuperacion_Fondos_${(work.projectName || 'Obra').replace(/[^a-zA-Z0-9]/g, '_')}_${currentCommunity?.slug || 'comunidad'}`;
    printDocumentDirectly('printable-major-work-sheet', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '8mm 10mm 8mm 10mm'
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. CABECERA CORPORATIVA Y MARCO LEGAL */}
      <div className="bg-gradient-to-r from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white p-6 md:p-8 rounded-3xl shadow-lg border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4B895]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4B895]/20 text-[#D4B895] border border-[#D4B895]/30">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4B895]" />
                LEY N° 21.442 • ARTS. 6°, 14° Y 17°
              </span>
              <span className="text-xs text-emerald-200/80 font-medium">
                FINANCIAMIENTO DE OBRAS Y REPOSICIÓN DE FONDOS
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Trabajos Mayores & Recuperación de Fondos en Cuotas
            </h2>
            <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Gestione obras de infraestructura, reparaciones mayores y renovaciones de equipamiento financiadas inicialmente desde los fondos de la comunidad (Fondo de Reserva o Cta. Cte.) y recupérelas en cuotas mensuales prorrateadas en los gastos comunes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D4B895] hover:bg-[#c2a47e] text-[#0F3D2E] font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Registrar Trabajo Mayor
            </button>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Obras Registradas
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900">{kpis.totalProjects}</span>
              <span className="text-xs font-bold text-emerald-700">({kpis.activeProjects} activas)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Pagado a Proveedores
            </span>
            <span className="text-xl font-black text-slate-900">
              {formatCLP(kpis.totalDisbursed)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Recuperado en GG.CC.
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-black text-emerald-700">{formatCLP(kpis.totalRecovered)}</span>
              <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {kpis.overallRecoveryPercent}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Saldo Pendiente Reponer
            </span>
            <span className="text-xl font-black text-amber-900">
              {formatCLP(kpis.totalPending)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS Y ESTADOS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todas las Obras', count: majorWorks.length },
            { id: 'en_recuperacion', label: 'En Recuperación Activa', count: majorWorks.filter(w => w.status === 'en_recuperacion').length },
            { id: 'completado', label: 'Fondos 100% Repuestos', count: majorWorks.filter(w => w.status === 'completado').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-[#0F3D2E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Período activo: <strong className="text-slate-800">{currentCommunity?.activePeriod?.month}/{currentCommunity?.activePeriod?.year}</strong>
        </div>
      </div>

      {/* 4. LISTADO DE OBRAS MAYORES */}
      {filteredWorks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#0F3D2E]/10 text-[#0F3D2E] flex items-center justify-center mx-auto">
            <Hammer className="w-8 h-8 text-[#0F3D2E]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">No hay trabajos mayores registrados</h3>
            <p className="text-xs text-slate-500">
              Cuando el condominio financie una obra mayor (reparación de techumbres, bombas, calderas, portón) desde el Fondo de Reserva y acuerde cobrarlo en cuotas a los copropietarios, regístrelo aquí.
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Primera Obra Mayor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredWorks.map((work) => {
            const isCompleted = work.status === 'completado';
            return (
              <div
                key={work.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-[#0F3D2E]/40 transition-all space-y-4"
              >
                {/* Cabecera de la Obra */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {isCompleted ? '✔ Fondo 100% Repuesto' : `⏳ En Recuperación • Cuota ${work.currentInstallmentIndex} de ${work.totalInstallments}`}
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F4EF] text-slate-700 border border-[#D4B895]/50">
                        {work.recoveryFund === 'fondo_reserva' ? 'Fondo de Reserva (Art. 14)' : 'Fondo Operacional'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {work.projectName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span><strong>Proveedor:</strong> {work.provider} ({work.providerRut || 'RUT S/I'})</span>
                      <span>•</span>
                      <span><strong>Doc:</strong> {work.documentType} N° {work.documentNumber}</span>
                      <span>•</span>
                      <span><strong>Inicio cobro:</strong> {work.startPeriod}</span>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    <button
                      onClick={() => {
                        setSelectedWork(work);
                        setShowScheduleModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Tabla de Cuotas
                    </button>

                    <button
                      onClick={() => {
                        setSelectedWork(work);
                        setTimeout(() => handlePrintWorkSheet(work), 150);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Ficha Oficial PDF
                    </button>
                  </div>
                </div>

                {/* Barra de Progreso Financiero */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <span className="font-bold text-slate-700">
                      Progreso de Recuperación al Fondo:
                    </span>
                    <span className="font-mono font-black text-[#0F3D2E]">
                      {formatCLP(work.totalRecovered)} recaudados de {formatCLP(work.totalAmount)} ({work.percentRecovered}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-600' : 'bg-[#0F3D2E]'
                      }`}
                      style={{ width: `${work.percentRecovered}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-600 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block font-semibold">Costo Total Obra</span>
                      <strong className="text-slate-900 font-mono">{formatCLP(work.totalAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Cuota Mensual GG.CC.</span>
                      <strong className="text-[#0F3D2E] font-mono">{formatCLP(work.monthlyInstallmentAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Cuotas Facturadas</span>
                      <strong className="text-slate-900">{work.installmentsChargedCount} de {work.totalInstallments}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Saldo por Recuperar</span>
                      <strong className="text-amber-800 font-mono">{formatCLP(work.remainingToRecover)}</strong>
                    </div>
                  </div>
                </div>

                {/* Respaldo Legal de Asamblea / Comité */}
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span><strong>Respaldo Legal:</strong> {work.agreementReference}</span>
                  </div>
                  {work.receiptUrl && (
                    <a
                      href={work.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0F3D2E] hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      Ver Factura / Respaldo
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL REGISTRO DE TRABAJO MAYOR */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="bg-[#0F3D2E] text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Hammer className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="text-base font-black">Registrar Trabajo Mayor con Recuperación</h3>
                  <p className="text-xs text-emerald-200">
                    Pago a proveedor desde fondos y cobro en cuotas a la comunidad
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMajorWork} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Nombre del Proyecto / Trabajo Mayor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Renovación Sistema de Bombas Hidroneumáticas"
                  value={newWorkForm.projectName}
                  onChange={(e) => setNewWorkForm({ ...newWorkForm, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Monto Total Desembolsado a Proveedor ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1"
                    placeholder="Ej: 3600000"
                    value={newWorkForm.amount}
                    onChange={(e) => setNewWorkForm({ ...newWorkForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Fondo de Origen (Financiamiento Inicial)
                  </label>
                  <select
                    value={newWorkForm.fundSource}
                    onChange={(e) => setNewWorkForm({ ...newWorkForm, fundSource: e.target.value, recoveryFund: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                  >
                    <option value="fondo_reserva">Fondo de Reserva Acumulado (Art. 14 Ley 21.442)</option>
                    <option value="fondo_operacional">Fondo Operacional / Cuenta Corriente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Cantidad de Cuotas Mensuales a la Comunidad *
                  </label>
                  <input
                    type="number"
                    required
                    min="2"
                    max="36"
                    value={newWorkForm.billingInstallments}
                    onChange={(e) => setNewWorkForm({ ...newWorkForm, billingInstallments: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                  {Number(newWorkForm.amount) > 0 && (
                    <span className="text-[11px] text-emerald-800 font-bold block">
                      Cuota mensual condominio: {formatCLP(Math.round(Number(newWorkForm.amount) / Math.max(1, Number(newWorkForm.billingInstallments))))}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Período de Inicio de Cobro (Mes/Año) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="YYYY-MM (ej: 2026-11)"
                    value={newWorkForm.recoveryStartPeriod}
                    onChange={(e) => setNewWorkForm({ ...newWorkForm, recoveryStartPeriod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Proveedor / Contratista Ejecutor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: HidroServicios del Norte SpA"
                    value={newWorkForm.provider}
                    onChange={(e) => setNewWorkForm({ ...newWorkForm, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    RUT del Proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 77.892.415-3"
                    value={newWorkForm.providerRut}
                    onChange={(e) => setNewWorkForm({ ...newWorkForm, providerRut: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    N° Factura / Boleta Proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: F-4819"
                    value={newWorkForm.documentNumber}
                    onChange={(e) => setNewWorkForm({ ...newWorkForm, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Referencia de Pago al Proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: TR-994120 Banco Estado"
                    value={newWorkForm.paymentReference}
                    onChange={(e) => setNewWorkForm({ ...newWorkForm, paymentReference: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Respaldo Legal de Asamblea o Comité (Art. 14 Ley 21.442)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Acta Asamblea Extraordinaria N° 03 / Sesión Comité de fecha 15/10/2026"
                  value={newWorkForm.recoveryAgreementNumber}
                  onChange={(e) => setNewWorkForm({ ...newWorkForm, recoveryAgreementNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <strong>Garantía Contable & Legal:</strong>
                <p>
                  El monto pagado al proveedor se descuenta del fondo seleccionado, y cada mes se incluirá automáticamente la cuota respectiva en la colilla de gastos comunes de los copropietarios, reintegrando los recursos al fondo hasta completar el 100%.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar y Activar Cuotas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL TABLA DE AMORTIZACIÓN Y CRONOGRAMA */}
      {showScheduleModal && selectedWork && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in">
            <div className="bg-[#0F3D2E] text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-5 h-5 text-[#D4B895]" />
                <div>
                  <h3 className="text-base font-black">Cronograma de Recuperación de Cuotas</h3>
                  <p className="text-xs text-emerald-200">{selectedWork.projectName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F5F4EF] p-4 rounded-2xl border border-[#D4B895]/50 text-xs">
                <div>
                  <span className="text-slate-500 block">Monto Total</span>
                  <strong className="text-base font-black text-slate-900 font-mono">{formatCLP(selectedWork.totalAmount)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Cuotas Totales</span>
                  <strong className="text-base font-black text-slate-900">{selectedWork.totalInstallments} meses</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Cuota Mensual</span>
                  <strong className="text-base font-black text-[#0F3D2E] font-mono">{formatCLP(selectedWork.monthlyInstallmentAmount)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Fondo de Reposición</span>
                  <strong className="text-xs font-bold text-slate-800">{selectedWork.recoveryFund === 'fondo_reserva' ? 'Fondo de Reserva' : 'Fondo Operacional'}</strong>
                </div>
              </div>

              {/* Tabla de Cuotas */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">N° Cuota</th>
                      <th className="p-3">Período</th>
                      <th className="p-3 text-right">Cuota Comunidad</th>
                      <th className="p-3 text-right">Recuperado Acumulado</th>
                      <th className="p-3 text-right">Saldo Restante</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generateInstallmentSchedule(selectedWork).map((item) => {
                      const isPast = item.installmentNumber < selectedWork.currentInstallmentIndex;
                      const isCurrent = item.installmentNumber === selectedWork.currentInstallmentIndex;
                      return (
                        <tr
                          key={item.installmentNumber}
                          className={isCurrent ? 'bg-emerald-50/80 font-bold' : isPast ? 'bg-slate-50/50 text-slate-500' : 'hover:bg-slate-50'}
                        >
                          <td className="p-3 font-mono">
                            Cuota {item.installmentNumber} de {selectedWork.totalInstallments}
                          </td>
                          <td className="p-3">
                            {item.periodKey}
                          </td>
                          <td className="p-3 text-right font-mono text-[#0F3D2E]">
                            {formatCLP(item.amount)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {formatCLP(item.accumulated)}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">
                            {formatCLP(item.remaining)}
                          </td>
                          <td className="p-3 text-center">
                            {isPast ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                                Cobrada
                              </span>
                            ) : isCurrent ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                En Cobro (Período Activo)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-bold">
                                Programada
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. FICHA OFICIAL IMPRIMIBLE (DOCUMENTO CONTINUO PARA COMITÉ Y ASAMBLEA) */}
      {selectedWork && (
        <div className="hidden">
          <div
            id="printable-major-work-sheet"
            className="p-8 bg-white text-slate-900 space-y-6"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* Membrete Corporativo */}
            <div className="flex items-start justify-between border-b-2 border-[#0F3D2E] pb-4">
              <div className="flex items-center space-x-3.5">
                <AranproLogo variant="principal" className="h-12 w-auto" />
                <div className="border-l border-slate-300 pl-3.5 space-y-0.5">
                  <div className="text-sm font-black tracking-tight text-[#0F3D2E] uppercase">
                    {companySettings?.companyName || 'ARANPRO • GESTIÓN INTEGRAL INMOBILIARIA'}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    Administración Profesional Ley N° 21.442 • RNAC N° {companySettings?.rnacNumber || '48.912'}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  FICHA TÉCNICA Y CONTABLE
                </div>
                <div className="text-base font-black text-[#0F3D2E]">
                  RECUPERACIÓN DE FONDOS
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {currentCommunity?.name}
                </div>
              </div>
            </div>

            {/* Datos Principales */}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                {selectedWork.projectName}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Documento de control y amortización de obra mayor pagada a proveedor desde los fondos de la comunidad y recuperada en cuotas mensuales prorrateadas en los gastos comunes según la Ley N° 21.442.
              </p>
            </div>

            {/* Cuadro Resumen */}
            <div className="grid grid-cols-2 gap-4 border border-slate-300 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 font-bold block">Contratista / Proveedor:</span>
                <span className="font-bold text-slate-900">{selectedWork.provider} (RUT: {selectedWork.providerRut})</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Documento Tributario:</span>
                <span className="font-bold text-slate-900">{selectedWork.documentType} N° {selectedWork.documentNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Monto Total Inversión:</span>
                <span className="text-sm font-black text-[#0F3D2E]">{formatCLP(selectedWork.totalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Fondo de Financiamiento:</span>
                <span className="font-bold text-slate-900">{selectedWork.recoveryFund === 'fondo_reserva' ? 'Fondo de Reserva Acumulado (Art. 14)' : 'Fondo Operacional'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Plan de Cuotas:</span>
                <span className="font-bold text-slate-900">{selectedWork.totalInstallments} cuotas de {formatCLP(selectedWork.monthlyInstallmentAmount)} mensuales</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Estado Actual:</span>
                <span className="font-bold text-slate-900">Cuota {selectedWork.currentInstallmentIndex} de {selectedWork.totalInstallments} ({selectedWork.percentRecovered}% recuperado)</span>
              </div>
            </div>

            {/* Tabla de Amortización */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-[#0F3D2E] tracking-wider">
                Planilla de Cuotas y Reposición Período a Período
              </h3>
              <table className="w-full text-[11px] border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 text-left">N°</th>
                    <th className="p-2 text-left">Período</th>
                    <th className="p-2 text-right">Cuota Comunidad</th>
                    <th className="p-2 text-right">Acumulado</th>
                    <th className="p-2 text-right">Saldo Pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {generateInstallmentSchedule(selectedWork).map((item) => (
                    <tr key={item.installmentNumber}>
                      <td className="p-2 font-mono">Cuota {item.installmentNumber}</td>
                      <td className="p-2">{item.periodKey}</td>
                      <td className="p-2 text-right font-mono">{formatCLP(item.amount)}</td>
                      <td className="p-2 text-right font-mono">{formatCLP(item.accumulated)}</td>
                      <td className="p-2 text-right font-mono">{formatCLP(item.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Firmas de Respaldo */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <div className="font-black text-slate-900">{companySettings?.adminName || 'ARANPRO Administración'}</div>
                <div className="text-[10px] text-slate-500">Administrador / Representante Legal</div>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <div className="font-black text-slate-900">Comité de Administración</div>
                <div className="text-[10px] text-slate-500">{currentCommunity?.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
