import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { 
  Wrench, AlertTriangle, CheckCircle2, Clock, Calendar, ShieldCheck, 
  Phone, Mail, FileText, Plus, ExternalLink, MessageCircle, AlertCircle, 
  RefreshCw, Printer, Download, Sparkles, Shield, Droplets, Zap, Flame, 
  Building2, Check, X, Edit3, ArrowRight
} from 'lucide-react';
import { formatCLP, formatDate, formatRut } from '../../utils/formatters';
import { printDocumentDirectly, downloadHtmlDocument } from '../../utils/printDocument';

export const PreventiveMaintenanceModule = ({ currentCommunity }) => {
  const { updateMaintenanceRecord, addMaintenanceRecord, addExpense } = useCommunity();

  const maintenances = currentCommunity?.preventiveMaintenances || [];

  // Filtros
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'URGENTE' | 'PROXIMO' | 'VIGENTE'
  const [selectedMaint, setSelectedMaint] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showLogPrintModal, setShowLogPrintModal] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Formulario para registrar mantención completada
  const [completeForm, setCompleteForm] = useState({
    executionDate: new Date().toISOString().split('T')[0],
    actualCost: '',
    invoiceNumber: '',
    certificateNumber: '',
    technicianName: '',
    notes: '',
    createExpenseEntry: true
  });

  // Formulario para nueva mantención
  const [newMaintForm, setNewMaintForm] = useState({
    name: '',
    category: 'Acceso & Seguridad',
    frequency: 'Trimestral',
    frequencyMonths: 3,
    lastDate: new Date().toISOString().split('T')[0],
    providerName: '',
    providerRut: '',
    providerContact: '',
    providerEmail: '',
    estimatedCost: '',
    legalRequirement: 'Ley N° 21.442 Art. 40',
    scopeDescription: ''
  });

  // Contadores y métricas
  const urgentCount = maintenances.filter(m => m.status === 'URGENTE' || (m.daysRemaining !== undefined && m.daysRemaining <= 10)).length;
  const upcomingCount = maintenances.filter(m => m.status === 'PROXIMO' || (m.daysRemaining !== undefined && m.daysRemaining > 10 && m.daysRemaining <= 30)).length;
  const validCount = maintenances.filter(m => m.status === 'VIGENTE' && (m.daysRemaining === undefined || m.daysRemaining > 30)).length;
  const totalAnnualBudget = maintenances.reduce((acc, m) => {
    const freqPerYear = m.frequencyMonths ? (12 / m.frequencyMonths) : 1;
    return acc + ((m.estimatedCost || 0) * freqPerYear);
  }, 0);

  // Filtrado de lista
  const filteredMaintenances = maintenances.filter(m => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'URGENTE') return m.status === 'URGENTE' || (m.daysRemaining !== undefined && m.daysRemaining <= 10);
    if (statusFilter === 'PROXIMO') return m.status === 'PROXIMO' || (m.daysRemaining !== undefined && m.daysRemaining > 10 && m.daysRemaining <= 30);
    if (statusFilter === 'VIGENTE') return m.status === 'VIGENTE' && (m.daysRemaining === undefined || m.daysRemaining > 30);
    return true;
  });

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('agua') || cat.includes('bomba')) return <Droplets className="w-4 h-4 text-sky-600" />;
    if (cat.includes('seguridad') || cat.includes('acceso') || cat.includes('portón')) return <Shield className="w-4 h-4 text-emerald-600" />;
    if (cat.includes('incendio') || cat.includes('extintor')) return <Flame className="w-4 h-4 text-rose-600" />;
    if (cat.includes('gas') || cat.includes('sec')) return <Zap className="w-4 h-4 text-amber-600" />;
    return <Wrench className="w-4 h-4 text-slate-600" />;
  };

  const getStatusBadge = (m) => {
    const isUrgent = m.status === 'URGENTE' || (m.daysRemaining !== undefined && m.daysRemaining <= 10);
    const isUpcoming = m.status === 'PROXIMO' || (m.daysRemaining !== undefined && m.daysRemaining > 10 && m.daysRemaining <= 30);

    if (isUrgent) {
      return (
        <span className="px-2.5 py-1 text-xs font-black bg-rose-100 text-rose-800 rounded-lg border border-rose-300 flex items-center space-x-1 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
          <span>¡Urgente! Vence en {m.daysRemaining ?? '<10'} días</span>
        </span>
      );
    }
    if (isUpcoming) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-lg border border-amber-300 flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
          <span>Próxima a Vencer ({m.daysRemaining} días)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 flex items-center space-x-1">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
        <span>Al Día / Vigente</span>
      </span>
    );
  };

  const handleOpenCompleteModal = (maint) => {
    setSelectedMaint(maint);
    setCompleteForm({
      executionDate: new Date().toISOString().split('T')[0],
      actualCost: maint.estimatedCost || '',
      invoiceNumber: '',
      certificateNumber: maint.certificateNumber || '',
      technicianName: '',
      notes: '',
      createExpenseEntry: true
    });
    setShowCompleteModal(true);
  };

  const handleSaveCompletedMaintenance = (e) => {
    e.preventDefault();
    if (!selectedMaint) return;

    // Calcular próxima fecha según frecuencia en meses
    const execDate = new Date(completeForm.executionDate);
    const nextDate = new Date(execDate);
    nextDate.setMonth(nextDate.getMonth() + (selectedMaint.frequencyMonths || 3));
    const nextDueDateStr = nextDate.toISOString().split('T')[0];

    // Días restantes aproximados
    const diffTime = nextDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    updateMaintenanceRecord(currentCommunity.id, selectedMaint.id, {
      lastDate: completeForm.executionDate,
      nextDueDate: nextDueDateStr,
      daysRemaining: diffDays > 0 ? diffDays : 90,
      status: 'VIGENTE',
      certificateNumber: completeForm.certificateNumber || selectedMaint.certificateNumber,
      lastCost: parseFloat(completeForm.actualCost) || selectedMaint.estimatedCost
    });

    // Crear registro de egreso si se seleccionó la casilla
    if (completeForm.createExpenseEntry && parseFloat(completeForm.actualCost) > 0) {
      addExpense(currentCommunity.id, {
        description: `Mantención Preventiva: ${selectedMaint.name} (Fact. ${completeForm.invoiceNumber || 'S/N'})`,
        amount: parseFloat(completeForm.actualCost),
        category: 'Mantención y Reparaciones',
        fundSource: 'ordinario',
        date: completeForm.executionDate,
        documentType: 'Factura Exenta / Afecta',
        documentNumber: completeForm.invoiceNumber || 'S/N',
        notes: `Técnico: ${completeForm.technicianName || 'No informado'}. Certificado: ${completeForm.certificateNumber || 'S/N'}. ${completeForm.notes}`
      });
    }

    setShowCompleteModal(false);
    setSelectedMaint(null);
  };

  const handleSaveNewMaintenance = (e) => {
    e.preventDefault();
    const lastDate = new Date(newMaintForm.lastDate);
    const nextDate = new Date(lastDate);
    const months = parseInt(newMaintForm.frequencyMonths) || 3;
    nextDate.setMonth(nextDate.getMonth() + months);
    const diffTime = nextDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    addMaintenanceRecord(currentCommunity.id, {
      name: newMaintForm.name,
      category: newMaintForm.category,
      frequency: newMaintForm.frequency,
      frequencyMonths: months,
      lastDate: newMaintForm.lastDate,
      nextDueDate: nextDate.toISOString().split('T')[0],
      daysRemaining: diffDays > 0 ? diffDays : 30,
      providerName: newMaintForm.providerName,
      providerRut: newMaintForm.providerRut,
      providerContact: newMaintForm.providerContact,
      providerEmail: newMaintForm.providerEmail,
      estimatedCost: parseFloat(newMaintForm.estimatedCost) || 0,
      legalRequirement: newMaintForm.legalRequirement,
      scopeDescription: newMaintForm.scopeDescription
    });

    setShowNewModal(false);
    setNewMaintForm({
      name: '',
      category: 'Acceso & Seguridad',
      frequency: 'Trimestral',
      frequencyMonths: 3,
      lastDate: new Date().toISOString().split('T')[0],
      providerName: '',
      providerRut: '',
      providerContact: '',
      providerEmail: '',
      estimatedCost: '',
      legalRequirement: 'Ley N° 21.442 Art. 40',
      scopeDescription: ''
    });
  };

  const handleOpenWhatsAppAlert = (maint) => {
    setSelectedMaint(maint);
    setShowWhatsAppModal(true);
  };

  const getWhatsAppMessage = (maint) => {
    if (!maint) return '';
    return `🚨 *ALERTA DE MANTENCIÓN PREVENTIVA - ${currentCommunity.name.toUpperCase()}* 🚨\n\nEstimado Comité de Administración,\n\nConforme a las exigencias de la *Ley N° 21.442 (Art. 40)* sobre seguridad e higiene en bienes comunes, se notifica el estado del siguiente sistema crítico:\n\n🔧 *Sistema:* ${maint.name}\n📋 *Norma Legal:* ${maint.legalRequirement}\n⏱️ *Vencimiento:* ${formatDate(maint.nextDueDate)} (${maint.daysRemaining} días restantes)\n👤 *Proveedor Asignado:* ${maint.providerName} (${maint.providerContact})\n💰 *Presupuesto Estimado:* ${formatCLP(maint.estimatedCost)}\n\n⚠️ *Acción Requerida:* Autorizar la orden de servicio para coordinar fecha de visita técnica con el contratista.\n\n_Administración ARANPRO Gestión Integral_`;
  };

  const copyWhatsAppToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* 1. CABECERA & BARRA RESUMEN LEY 21.442 ART. 40 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2.5 bg-gradient-to-br from-[#0F3D2E] to-[#14533d] text-white rounded-2xl shadow-xs shrink-0">
            <Wrench className="w-5 h-5 text-[#D4B895]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                Mantenciones Preventivas & Certificaciones Técnicas
              </h3>
              <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full border border-[#0F3D2E]/20 uppercase">
                Ley N° 21.442 • Art. 40
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Control de periodicidad, alertas de vencimiento, bitácora de servicios y respaldo de certificaciones de seguridad
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] hover:from-[#0A291F] hover:to-[#0F3D2E] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1 text-[#D4B895]" />
            + Nueva Mantención
          </button>

          <button
            type="button"
            onClick={() => setShowLogPrintModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0F3D2E] border border-slate-300 font-bold text-xs rounded-xl flex items-center shadow-2xs transition-colors cursor-pointer"
            title="Ver e imprimir la Bitácora Oficial con formato legal ARANPRO"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
            Imprimir Bitácora (PDF)
          </button>
        </div>
      </div>

      {/* 2. SEMÁFOROS Y KPIS DE ESTADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Urgentes / Próximos a vencer */}
        <div className={`p-4 rounded-2xl border transition-all ${
          urgentCount > 0 
            ? 'bg-rose-50/80 border-rose-300 text-rose-950 shadow-xs' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
              Urgente (≤ 10 días)
            </span>
            <AlertCircle className={`w-4 h-4 ${urgentCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-rose-700">
            {urgentCount} {urgentCount === 1 ? 'sistema' : 'sistemas'}
          </div>
          <p className="text-[11px] text-rose-800 mt-0.5">
            {urgentCount > 0 ? 'Requiere coordinación inmediata con proveedor' : 'Ninguna mantención vencida'}
          </p>
        </div>

        {/* KPI 2: Próximas a vencer (11 - 30 días) */}
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 text-amber-950 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              Próximas (11 a 30 días)
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-amber-800">
            {upcomingCount} {upcomingCount === 1 ? 'servicio' : 'servicios'}
          </div>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Agendar con anticipación para no perder vigencia
          </p>
        </div>

        {/* KPI 3: Al Día / Vigentes */}
        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-300 text-emerald-950 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
              Vigentes & Al Día
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-800">
            {validCount} de {maintenances.length}
          </div>
          <p className="text-[11px] text-emerald-800 mt-0.5">
            Cumplimiento normativo Ley 21.442 al {(maintenances.length ? ((validCount / maintenances.length) * 100).toFixed(0) : 100)}%
          </p>
        </div>

        {/* KPI 4: Presupuesto Anual Proyectado */}
        <div className="bg-gradient-to-br from-[#0F3D2E] to-[#14533d] p-4 rounded-2xl border border-[#D4B895]/30 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B895]">
              Costo Anual Proyectado
            </span>
            <Sparkles className="w-4 h-4 text-[#D4B895]" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-white">
            {formatCLP(totalAnnualBudget)}
          </div>
          <p className="text-[11px] text-white/80 mt-0.5">
            Aprox. {formatCLP(totalAnnualBudget / 12)} / mes presupuestado
          </p>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({maintenances.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('URGENTE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'URGENTE'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-rose-700 hover:bg-rose-100'
          }`}
        >
          🔴 Urgentes ({urgentCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('PROXIMO')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'PROXIMO'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-amber-800 hover:bg-amber-100'
          }`}
        >
          🟡 Próximas ({upcomingCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('VIGENTE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'VIGENTE'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          🟢 Al Día ({validCount})
        </button>
      </div>

      {/* 4. LISTADO DE MANTENCIONES EN TARJETAS TÉCNICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredMaintenances.map(maint => {
          const isUrgent = maint.status === 'URGENTE' || (maint.daysRemaining !== undefined && maint.daysRemaining <= 10);
          const isUpcoming = maint.status === 'PROXIMO' || (maint.daysRemaining !== undefined && maint.daysRemaining > 10 && maint.daysRemaining <= 30);

          return (
            <div 
              key={maint.id}
              className={`p-4 bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                isUrgent ? 'border-rose-400 ring-2 ring-rose-200' : isUpcoming ? 'border-amber-300' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Encabezado: Categoría y Semáforo */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-slate-100 rounded-xl">
                      {getCategoryIcon(maint.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {maint.category} • Frecuencia {maint.frequency}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight">
                        {maint.name}
                      </h4>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(maint)}
                  </div>
                </div>

                {/* Exigencia legal y alcance */}
                <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-600">Norma Legal:</span>
                    <span className="font-bold text-[#0F3D2E]">{maint.legalRequirement}</span>
                  </div>
                  {maint.scopeDescription && (
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {maint.scopeDescription}
                    </p>
                  )}
                </div>

                {/* Fechas y Cronograma */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Última Realizada:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {maint.lastDate ? formatDate(maint.lastDate) : 'Sin registro'}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    isUrgent ? 'bg-rose-50 border-rose-300' : isUpcoming ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <span className="text-[10px] text-slate-500 block">Próximo Vencimiento:</span>
                    <span className="font-black text-slate-900 font-mono">
                      {maint.nextDueDate ? formatDate(maint.nextDueDate) : 'Por definir'}
                    </span>
                  </div>
                </div>

                {/* Datos del Proveedor y Presupuesto */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-slate-500 block">Proveedor Asignado:</span>
                    <div className="font-bold text-slate-900 truncate">{maint.providerName || 'No asignado'}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{maint.providerContact}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block">Costo Estimado:</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      {formatCLP(maint.estimatedCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción de la Ficha Técnica */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCompleteModal(maint)}
                  className="py-1.5 px-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Registrar Servicio</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppAlert(maint)}
                  className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Alertar Comité</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: REGISTRAR MANTENCIÓN REALIZADA */}
      {showCompleteModal && selectedMaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Registrar Mantención Realizada</h3>
                  <p className="text-xs text-slate-500">{selectedMaint.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompletedMaintenance} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Ejecución</label>
                  <input
                    type="date"
                    required
                    value={completeForm.executionDate}
                    onChange={(e) => setCompleteForm({ ...completeForm, executionDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Costo Real Pagado ($CLP)</label>
                  <input
                    type="number"
                    required
                    placeholder="85000"
                    value={completeForm.actualCost}
                    onChange={(e) => setCompleteForm({ ...completeForm, actualCost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Factura / Boleta</label>
                  <input
                    type="text"
                    placeholder="Ej: Factura 4512"
                    value={completeForm.invoiceNumber}
                    onChange={(e) => setCompleteForm({ ...completeForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Certificado Técnico / Folio</label>
                  <input
                    type="text"
                    placeholder="Ej: CERT-2026-99"
                    value={completeForm.certificateNumber}
                    onChange={(e) => setCompleteForm({ ...completeForm, certificateNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Técnico / Especialista</label>
                <input
                  type="text"
                  placeholder="Ej: Claudio Pavez (Técnico SEC)"
                  value={completeForm.technicianName}
                  onChange={(e) => setCompleteForm({ ...completeForm, technicianName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones Técnicas / Trabajos Realizados</label>
                <textarea
                  rows={2}
                  placeholder="Detalle de trabajos ejecutados, piezas reemplazadas o recomendaciones..."
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Casilla para generar egreso automáticamente */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="createExpenseEntry"
                  checked={completeForm.createExpenseEntry}
                  onChange={(e) => setCompleteForm({ ...completeForm, createExpenseEntry: e.target.checked })}
                  className="mt-0.5 rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                />
                <label htmlFor="createExpenseEntry" className="text-[11px] text-emerald-950">
                  <strong>Crear automáticamente el egreso en Gastos del Mes:</strong> Se registrará el gasto en la categoría "Mantención y Reparaciones" para que forme parte del cobro de gastos comunes.
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4 text-[#D4B895]" />
                  <span>Guardar y Actualizar Vencimiento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALERTAR AL COMITÉ POR WHATSAPP */}
      {showWhatsAppModal && selectedMaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Alerta WhatsApp para Comité</h3>
                  <p className="text-xs text-slate-500">Recordatorio formal de mantención preventiva</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {getWhatsAppMessage(selectedMaint)}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => copyWhatsAppToClipboard(getWhatsAppMessage(selectedMaint))}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppMessage(selectedMaint))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir en WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA MANTENCIÓN PREVENTIVA */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F3D2E] text-white rounded-xl">
                  <Plus className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Agregar Sistema o Certificación Técnica</h3>
                  <p className="text-xs text-slate-500">Ley N° 21.442 Art. 40</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Sistema o Certificación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Calderas de Calefacción Central"
                  value={newMaintForm.name}
                  onChange={(e) => setNewMaintForm({ ...newMaintForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newMaintForm.category}
                    onChange={(e) => setNewMaintForm({ ...newMaintForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Acceso & Seguridad">Acceso & Seguridad (Portones)</option>
                    <option value="Agua & Bombas">Agua & Bombas (Hidroneumático)</option>
                    <option value="Seguridad & Incendio">Seguridad & Contra Incendio</option>
                    <option value="Salud & Sanidad">Salud & Sanidad (Estanques)</option>
                    <option value="Certificación SEC">Certificación SEC (Gas / Eléctrico)</option>
                    <option value="Ascensores">Ascensores (Transporte Vertical)</option>
                    <option value="Otro">Otro Sistema Común</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frecuencia Obligatoria</label>
                  <select
                    value={newMaintForm.frequencyMonths}
                    onChange={(e) => {
                      const m = parseInt(e.target.value);
                      const map = { 1: 'Mensual', 2: 'Bimensual', 3: 'Trimestral', 6: 'Semestral', 12: 'Anual', 24: 'Bianual (2 Años)' };
                      setNewMaintForm({ ...newMaintForm, frequencyMonths: m, frequency: map[m] || `${m} Meses` });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value={1}>Mensual (1 mes)</option>
                    <option value={2}>Bimensual (2 meses)</option>
                    <option value={3}>Trimestral (3 meses)</option>
                    <option value={6}>Semestral (6 meses)</option>
                    <option value={12}>Anual (12 meses)</option>
                    <option value={24}>Bianual (24 meses - Sello Verde)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Última Realizada</label>
                  <input
                    type="date"
                    required
                    value={newMaintForm.lastDate}
                    onChange={(e) => setNewMaintForm({ ...newMaintForm, lastDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Costo Estimado ($CLP)</label>
                  <input
                    type="number"
                    placeholder="90000"
                    value={newMaintForm.estimatedCost}
                    onChange={(e) => setNewMaintForm({ ...newMaintForm, estimatedCost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proveedor / Empresa Asignada</label>
                  <input
                    type="text"
                    placeholder="Ej: Instelec SpA"
                    value={newMaintForm.providerName}
                    onChange={(e) => setNewMaintForm({ ...newMaintForm, providerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp Proveedor</label>
                  <input
                    type="text"
                    placeholder="+56 9 8765 4321"
                    value={newMaintForm.providerContact}
                    onChange={(e) => setNewMaintForm({ ...newMaintForm, providerContact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Norma o Requisito Legal</label>
                <input
                  type="text"
                  placeholder="Ej: Ley N° 21.442 Art. 40 / D.S. N° 44"
                  value={newMaintForm.legalRequirement}
                  onChange={(e) => setNewMaintForm({ ...newMaintForm, legalRequirement: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4 text-[#D4B895]" />
                  <span>Agregar al Calendario Técnico</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VISTA PREVIA E IMPRESIÓN DE LA BITÁCORA OFICIAL (ESTÁNDAR RENDICIÓN PDF) */}
      {/* ========================================================================= */}
      {showLogPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col my-6 max-h-[92vh]">
            {/* Barra superior de control del documento */}
            <div className="p-4 bg-[#0F3D2E] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#D4B895]" />
                  <span>Bitácora Oficial de Mantenciones Preventivas</span>
                </h3>
                <p className="text-xs text-[#D4B895]">
                  Condominio {currentCommunity.name} • Ley N° 21.442 • Art. 40
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
                    const dateStr = new Date().toISOString().slice(0, 10);
                    printDocumentDirectly('maintenance-official-log-printable', `Bitacora_Mantenciones_Art40_${commName}_${dateStr}`);
                  }}
                  className="px-4 py-2 bg-[#D4B895] hover:bg-[#c4a275] text-[#0F3D2E] font-black text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                  title="Imprimir documento oficial o guardar como PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
                    downloadHtmlDocument('maintenance-official-log-printable', `Bitacora_Mantenciones_${commName}.html`);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition-colors cursor-pointer"
                  title="Descargar copia de respaldo HTML"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogPrintModal(false)}
                  className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CUERPO DEL DOCUMENTO IMPRIMIBLE (ESTILO RENDICIÓN DE GASTOS) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
              <div 
                id="maintenance-official-log-printable"
                className="bg-white w-full max-w-3xl rounded-2xl shadow-md border border-slate-200 text-slate-800 font-sans p-6 sm:p-8 space-y-4"
              >
                {/* 1. MEMBRETE OFICIAL ARANPRO */}
                <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png" 
                      alt="ARANPRO Gestión Inmobiliaria" 
                      className="h-9 sm:h-10 w-auto object-contain"
                    />
                    <div className="border-l border-slate-300 pl-3 hidden sm:block">
                      <div className="text-[10px] font-black text-[#0F3D2E] uppercase tracking-wider">
                        Gestión Inmobiliaria Integral
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        RUT: 76.999.888-1 • Reg. MINVU N° 44.201
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-black text-slate-900 text-sm leading-tight">{currentCommunity.name}</div>
                    <div className="text-slate-600 text-[10px]">{currentCommunity.address || 'Camino San Ramón 4500, La Serena'}</div>
                    <div className="text-[9.5px] font-mono text-[#0F3D2E] font-bold">
                      Fecha Emisión: {formatDate(new Date().toISOString().split('T')[0])}
                    </div>
                  </div>
                </div>

                {/* 2. TÍTULO Y MARCO LEGAL */}
                <div className="text-center py-1 space-y-1">
                  <h2 className="text-xs sm:text-sm font-black text-[#0F3D2E] uppercase tracking-wide">
                    Bitácora Oficial de Mantenciones Preventivas & Certificaciones Técnicas
                  </h2>
                  <p className="text-[10px] text-slate-600 max-w-2xl mx-auto leading-tight">
                    Conforme al <strong>Artículo 40° de la Ley N° 21.442</strong> de Copropiedad Inmobiliaria, Decreto Supremo N° 44 (Sistemas contra Incendios) y D.S. N° 66 SEC. Control obligatorio de periodicidad, alertas técnicas de vencimiento y bitácora de inspecciones.
                  </p>
                </div>

                {/* 3. RESUMEN EJECUTIVO (4 KPIS ESTILO RENDICIÓN) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Sistemas Monitoreados</span>
                    <span className="text-sm font-black text-slate-900 block font-mono">{maintenances.length}</span>
                    <span className="text-[8.5px] text-slate-600 font-semibold">Equipamientos críticos</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
                    <span className="text-[9px] text-rose-800 uppercase font-bold block">Urgentes (≤ 10 días)</span>
                    <span className="text-sm font-black text-rose-900 block font-mono">{urgentCount}</span>
                    <span className="text-[8.5px] text-rose-700 font-semibold">Coordinación inmediata</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[9px] text-amber-800 uppercase font-bold block">Próximas (11-30 días)</span>
                    <span className="text-sm font-black text-amber-900 block font-mono">{upcomingCount}</span>
                    <span className="text-[8.5px] text-amber-700 font-semibold">Por agendar</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[9px] text-emerald-800 uppercase font-bold block">Al Día / Vigentes</span>
                    <span className="text-sm font-black text-emerald-900 block font-mono">{okCount} de {maintenances.length}</span>
                    <span className="text-[8.5px] text-emerald-700 font-semibold">Cumplimiento {((okCount / (maintenances.length || 1)) * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* 4. TABLA OFICIAL DE AUDITORÍA Y ESTADO TÉCNICO */}
                <div className="space-y-2 pt-2">
                  <div className="border-b border-[#0F3D2E] pb-1 text-xs font-black text-[#0F3D2E] uppercase tracking-wide flex items-center justify-between">
                    <span>1. Nómina y Bitácora de Sistemas e Instalaciones Comunes</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Presupuesto Anual: {formatCLP(totalAnnualBudget)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10.5px]">
                      <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 uppercase tracking-wider text-[9px]">
                        <tr>
                          <th className="py-2 px-2.5">Sistema / Instalación</th>
                          <th className="py-2 px-2">Normativa</th>
                          <th className="py-2 px-2">Última Realizada</th>
                          <th className="py-2 px-2">Próximo Vencimiento</th>
                          <th className="py-2 px-2">Proveedor Asignado</th>
                          <th className="py-2 px-2 text-right">Costo Est.</th>
                          <th className="py-2 px-2.5 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {maintenances.map(m => {
                          const status = calculateUrgency(m.nextDueDate);
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-2.5">
                                <strong className="block text-slate-900 font-bold">{m.name}</strong>
                                <span className="text-[9.5px] text-slate-500">{m.frequency} • {m.category}</span>
                              </td>
                              <td className="py-2.5 px-2 text-slate-600 font-mono text-[9.5px]">
                                {m.legalRequirement}
                              </td>
                              <td className="py-2.5 px-2 font-mono text-slate-700">
                                {formatDate(m.lastServiceDate)}
                              </td>
                              <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                                {formatDate(m.nextDueDate)}
                              </td>
                              <td className="py-2.5 px-2 text-slate-700">
                                <div className="font-medium">{m.providerName}</div>
                                <div className="text-[9px] text-slate-400 font-mono">{m.providerPhone}</div>
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                                {formatCLP(m.estimatedCost)}
                              </td>
                              <td className="py-2.5 px-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold inline-block ${
                                  status.isUrgent ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black' :
                                  status.isUpcoming ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                  'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}>
                                  {status.isUrgent ? '¡Urgente!' : status.isUpcoming ? 'Próximo' : 'Al Día'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. NOTAS LEGALES AL PIE */}
                <div className="pt-3 border-t border-slate-200 text-[9.5px] text-slate-500 space-y-0.5 leading-tight">
                  <p>
                    • <strong>Art. 40° Ley N° 21.442:</strong> Es obligación legal del Administrador coordinar y mantener vigentes las mantenciones y certificaciones de los sistemas de seguridad, higiene y transporte vertical del condominio.
                  </p>
                  <p>
                    • <strong>Custodia y Respaldo Digital:</strong> Las órdenes de trabajo, facturas, bitácoras de servicio y certificaciones de la SEC y Seremi de Salud se encuentran debidamente archivadas en el repositorio digital de la administración para inspección del Comité y copropietarios.
                  </p>
                </div>

                {/* 6. FIRMAS DE AUDITORÍA */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs page-break-inside-avoid">
                  <div className="space-y-1">
                    <div className="h-10 flex items-center justify-center font-mono text-emerald-800 text-[10px] italic">
                      [Firmado Electrónicamente]
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <strong className="block text-slate-900">Administración General ARANPRO</strong>
                      <span className="text-[10px] text-slate-500">RUT: 76.999.888-1 • Reg. MINVU N° 44.201</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-10 flex items-center justify-center font-mono text-emerald-800 text-[10px] italic">
                      [Firmado Electrónicamente]
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <strong className="block text-slate-900">Presidente Comité de Administración</strong>
                      <span className="text-[10px] text-slate-500">{currentCommunity.name}</span>
                    </div>
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
