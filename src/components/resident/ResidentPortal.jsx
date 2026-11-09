import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { formatCLP, formatDate, getMonthName } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { AranproLogo } from '../common/MauranLogo';
import { ExpenseReportModal } from '../common/ExpenseReportModal';
import { 
  Building2, Home, User, CheckCircle2, AlertCircle, Eye, 
  Download, ArrowUpRight, DollarSign, FileText, Send, 
  CreditCard, Copy, Check, ShieldCheck, ChevronDown, ChevronUp, LogOut,
  Megaphone, FolderOpen, KeyRound, Printer, Menu, X, Globe, Shield, Plus,
  FileCheck
} from 'lucide-react';

export const ResidentPortal = ({ onBack, onOpenCertificates, isDemo = false }) => {
  const { currentUser, communities, getUnitFinancials, setActiveReceipt, reportPayment, addAnnouncement, calculateCommunityTotals, changeResidentPassword, logout, companySettings, loginResident } = useCommunity();
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'gastos' | 'mis-pagos' | 'comunicados' | 'cuenta-bancaria'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCommitteeAnnForm, setShowCommitteeAnnForm] = useState(false);
  const [committeeAnnForm, setCommitteeAnnForm] = useState({ title: '', content: '', priority: 'Importante' });
  const [showPayModal, setShowPayModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showExpenseReportModal, setShowExpenseReportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [activePaymentReceipt, setActivePaymentReceipt] = useState(null);
  const [copiedBank, setCopiedBank] = useState(false);

  // Formulario para informar pago
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    transferNumber: '',
    receiptImg: '',
    notes: ''
  });
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  if (!currentUser || currentUser.role !== 'resident') {
    return (
      <div className="p-8 text-center text-slate-500">
        No has iniciado sesión como residente.
      </div>
    );
  }

  const community = communities.find(c => c.id === currentUser.communityId);
  if (!community) return null;

  const unit = community.units.find(u => u.id === currentUser.unitId || u.number === currentUser.unitNumber);
  if (!unit) return null;

  const isDemoActive = Boolean(
    isDemo || 
    currentUser?.isDemo || 
    (typeof window !== 'undefined' && window.location.search.includes('demo'))
  );
  const displayCommunityName = isDemoActive ? 'Comunidad Demostración ARANPRO' : community.name;
  const displayCommunityAddress = isDemoActive ? 'Condominio Piloto Interactivo • Ley N° 21.442' : `${community.address}, ${community.city}`;

  // Cálculos de la comunidad
  const commTotals = calculateCommunityTotals(community);
  const totalExpenses = commTotals.totalExpenses;
  const reserveFundAmount = commTotals.reserveFundAmount;
  const grandTotal = commTotals.grandTotal;
  const totalCollected = commTotals.totalCollected;
  const communityCashBalance = commTotals.financialBalance;

  // Cálculos integrales de la unidad (incluyendo saldo a favor, saldo en contra y convenio de deuda histórica repactada)
  const fin = getUnitFinancials(unit);
  const previousDebt = fin.previousDebt;
  const currentCharge = fin.currentCharge;
  const extraCharge = fin.extraCharge;
  const paidSoFar = fin.paidAmount;
  const totalToPay = fin.pendingDebt;
  const favorBalance = fin.favorBalance;
  const isUpToDate = fin.isFullyPaid;

  // Historial de pagos de esta casa
  const unitPayments = (community.paymentReports || []).filter(p => p.unitNumber === unit.number);

  const handleCopyBankInfo = () => {
    const text = `Datos de Transferencia Condominio:\nBanco: ${community.bankInfo?.bank}\nTipo: ${community.bankInfo?.accountType}\nN° Cuenta: ${community.bankInfo?.accountNumber}\nTitular: ${community.bankInfo?.holderName}\nRUT: ${community.bankInfo?.rut}\nCorreo: ${community.bankInfo?.email}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    reportPayment(community.id, {
      unitNumber: unit.number,
      owner: unit.owner,
      amount: paymentForm.amount || totalToPay,
      date: paymentForm.date,
      transferNumber: paymentForm.transferNumber,
      receiptImg: paymentForm.receiptImg || 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
      notes: paymentForm.notes
    });
    setPaymentSubmitted(true);
  };

  const totalDocsAndAnn = (community.announcements?.length || 0) + (community.documents?.length || 0);

  const residentTabs = [
    { id: 'resumen', label: 'Mi Vivienda & Resumen', shortLabel: 'Mi Casa', icon: Home, badge: null },
    { id: 'gastos', label: 'Gastos y Boletas', shortLabel: 'Boletas', icon: FileText, badge: community.expenses?.length || 0 },
    { id: 'mis-pagos', label: 'Mis Pagos y Recibos', shortLabel: 'Mis Pagos', icon: CheckCircle2, badge: unitPayments.length },
    { id: 'comunicados', label: 'Mural & Documentos', shortLabel: 'Mural', icon: Megaphone, badge: totalDocsAndAnn },
    { id: 'cuenta-bancaria', label: 'Datos para Pagar', shortLabel: 'Banco', icon: CreditCard, badge: null }
  ];

  const activeResTabObj = residentTabs.find(t => t.id === activeTab) || residentTabs[0];

  const renderResidentSidebar = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white border-r border-[#E9EBE8]">
      {/* Cabecera de la Comunidad y Casa del Copropietario */}
      <div className="bg-[#0F3D2E] text-white p-4 border-b border-[#D4B895]/25 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D4B895]/20 border border-[#D4B895]/40 flex items-center justify-center text-[#D4B895] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-[9px] font-bold text-[#D4B895] tracking-wider uppercase block leading-tight">
                Portal Copropietario • ARANPRO
              </span>
              <h1 className="text-xs font-black text-white truncate">
                {displayCommunityName}
              </h1>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 text-white/70 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="bg-[#0A291F]/90 border border-white/15 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#D4B895] flex items-center">
              <Home className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
              Unidad N° {unit.number}
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full ${
              isUpToDate ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {isUpToDate ? 'AL DÍA' : 'PENDIENTE'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-white truncate">{unit.owner}</p>
          {unit.isCommittee && (
            <div className="pt-0.5">
              <span className="px-2 py-0.5 text-[9px] font-black bg-[#D4B895] text-[#0F3D2E] rounded-md inline-flex items-center">
                🛡️ {unit.committeeRole || 'Comité de Administración'}
              </span>
            </div>
          )}
          <p className="text-[10px] text-white/60 truncate">{community.address}, {community.city}</p>
        </div>
      </div>

      {/* Navegación Vertical */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Menú del Copropietario
        </span>
        {residentTabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (isMobile) setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#0F3D2E] text-white shadow-xs'
                  : 'text-[#4A4F4F] hover:bg-[#F5F4EF] hover:text-[#0F3D2E]'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4B895]' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </div>
              {tab.badge !== null && (
                <span className={`ml-2 px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                  isActive ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Acciones Rápidas del Vecino en Cuadrícula 2x2 Compacta */}
      <div className="p-2.5 bg-[#F5F4EF]/90 border-t border-[#E9EBE8] space-y-1.5">
        <span className="px-1 text-[9px] font-bold uppercase tracking-wider text-[#4A4F4F] block">
          Acciones Rápidas • Casa N° {unit.number}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              setMobileSidebarOpen(false);
              setPaymentSubmitted(false);
              setPaymentForm(prev => ({ ...prev, amount: totalToPay > 0 ? totalToPay : '' }));
              setShowPayModal(true);
            }}
            className="px-2 py-2 text-[11px] font-bold bg-[#0F3D2E] hover:bg-[#0A291F] text-white rounded-xl transition-colors flex items-center justify-center shadow-2xs"
          >
            <Send className="w-3.5 h-3.5 mr-1.5 text-[#D4B895] shrink-0" />
            <span className="truncate">Informar Pago</span>
          </button>

          <button
            onClick={() => {
              setMobileSidebarOpen(false);
              setShowBillModal(true);
            }}
            className="px-2 py-2 text-[11px] font-bold bg-white hover:bg-slate-50 text-[#0F3D2E] border border-[#D4B895] rounded-xl transition-colors flex items-center justify-center cursor-pointer"
            title="Ver e imprimir su Colilla Individual de Cobro"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E] shrink-0" />
            <span className="truncate">Colilla PDF</span>
          </button>

          <button
            onClick={() => {
              setMobileSidebarOpen(false);
              setShowExpenseReportModal(true);
            }}
            className="px-2 py-2 text-[11px] font-bold bg-[#F5F4EF] hover:bg-[#eae7dd] text-[#0F3D2E] border border-[#D4B895] rounded-xl transition-colors flex items-center justify-center cursor-pointer"
            title="Ver Informe Oficial de Rendición de Gastos Comunes (Ley N° 21.442)"
          >
            <FileCheck className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E] shrink-0" />
            <span className="truncate">Rendición PDF</span>
          </button>

          <button
            onClick={() => {
              setMobileSidebarOpen(false);
              setPasswordSaved(false);
              setNewPasswordInput('');
              setShowPasswordModal(true);
            }}
            className="px-2 py-2 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors flex items-center justify-center"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E] shrink-0" />
            <span className="truncate">Mi Clave</span>
          </button>

          <button
            onClick={() => { logout(); onBack(); }}
            className="px-2 py-2 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-xl transition-colors flex items-center justify-center"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <span className="truncate">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      {/* BARRA SUPERIOR FIJA DE CONTROL DE DEMOSTRACIÓN EN VIVO */}
      {isDemoActive && (
        <div className="bg-[#0F3D2E] text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 border-b-2 border-[#D4B895]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[#D4B895] text-[#0F3D2E] font-black text-[10px] tracking-wider uppercase">
              ★ DEMOSTRACIÓN ARANPRO
            </span>
            <span className="text-xs text-white/95">
              Evaluando: <strong className="text-[#D4B895]">{unit.isCommittee ? `🛡️ ${unit.committeeRole || 'Comité'} (Casa ${unit.number})` : `🏠 Copropietario al Día (Casa ${unit.number})`}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {!unit.isCommittee ? (
              <button
                type="button"
                onClick={() => loginResident(community.slug, '1', '1')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#0F3D2E] font-black rounded-xl text-xs shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Cambiar con 1 clic a la vista de Integrante del Comité"
              >
                <span>🛡️ Cambiar a Vista Comité (Casa 1)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => loginResident(community.slug, '6', '6')}
                className="px-3 py-1.5 bg-[#D4B895] hover:bg-[#c4a885] text-[#0F3D2E] font-black rounded-xl text-xs shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Cambiar con 1 clic a la vista de Copropietario / Residente"
              >
                <span>🏠 Cambiar a Vista Copropietario (Casa 6)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (logout) logout();
                if (onBack) onBack();
              }}
              className="px-2.5 py-1.5 bg-[#0A291F] hover:bg-rose-900 text-white/80 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
            >
              Salir de Demo
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row pb-20 lg:pb-0">
      
      {/* Barra Superior Compacta en Celular (< lg) */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#0F3D2E] text-white px-4 py-2.5 border-b border-[#D4B895]/30 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 bg-white/10 hover:bg-white/20 text-[#D4B895] rounded-xl flex items-center shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="truncate">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B895] block leading-tight truncate">
              Casa N° {unit.number} • {displayCommunityName}
            </span>
            <span className="text-xs font-black text-white truncate block">
              {activeResTabObj.label}
            </span>
          </div>
        </div>

        <button
          onClick={() => { setPasswordSaved(false); setNewPasswordInput(''); setShowPasswordModal(true); }}
          className="px-2.5 py-1.5 bg-white/10 text-[#D4B895] rounded-lg text-[11px] font-bold flex items-center shrink-0"
        >
          <KeyRound className="w-3.5 h-3.5 mr-1" />
          Clave
        </button>
      </div>

      {/* Drawer Lateral en Celular (< lg) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full z-10 shadow-2xl">
            {renderResidentSidebar(true)}
          </div>
        </div>
      )}

      {/* Panel Lateral Izquierdo Fijo desde el Tope de la Página en Computador (lg+) */}
      <aside className="hidden lg:block w-68 xl:w-72 shrink-0">
        <div className="sticky top-0 h-screen">
          {renderResidentSidebar(false)}
        </div>
      </aside>

      {/* Columna Derecha: Barra Superior del Software + Área Principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E9EBE8] px-6 h-16 items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="text-sm font-black text-[#0F3D2E] truncate">{activeResTabObj.label}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600 truncate">
              Casa N° {unit.number} ({unit.owner})
            </span>
          </div>

          <div
            onClick={onBack}
            className="cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
            title="Ir a la página principal de ARANPRO"
          >
            <AranproLogo variant="horizontal" size="sm" />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onBack}
              className="px-3 py-1.5 text-xs font-bold text-[#4A4F4F] hover:text-[#0F3D2E] hover:bg-[#F5F4EF] rounded-xl transition-colors flex items-center"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
              Ver Web Pública
            </button>
            <span className="px-3.5 py-1.5 bg-[#0F3D2E] text-[#F5F4EF] text-xs font-bold rounded-xl flex items-center">
              <Home className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
              Casa N° {unit.number}
            </span>
            <button
              onClick={() => { logout(); onBack(); }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-6">

        {activeTab === 'resumen' && (
          <div className="space-y-6">

            {/* 0. RECUADRO DESTACADO DE AVISOS / COMUNICADOS RECIENTES Y PANEL EXCLUSIVO DEL COMITÉ */}
            <div className="bg-white p-5 rounded-3xl border-2 border-[#D4B895]/80 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-[#0F3D2E]">
                        Avisos y Comunicados de {displayCommunityName}
                      </h3>
                      {unit.isCommittee && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-[#0F3D2E] text-[#D4B895] rounded-full">
                          🛡️ Habilitado como {unit.committeeRole || 'Comité'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Notificaciones oficiales de la Administración y del Comité de Administración.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {unit.isCommittee && (
                    <button
                      onClick={() => setShowCommitteeAnnForm(!showCommitteeAnnForm)}
                      className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold rounded-xl flex items-center shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                      {showCommitteeAnnForm ? 'Cerrar' : 'Publicar Aviso Comité'}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('comunicados')}
                    className="px-3 py-2 bg-[#F5F4EF] hover:bg-[#D4B895]/30 text-[#0F3D2E] text-xs font-bold rounded-xl transition-colors"
                  >
                    Ver Todos ({(community.announcements || []).length}) →
                  </button>
                </div>
              </div>

              {/* Formulario exclusivo habilitado solo si el vecino es Integrante del Comité */}
              {unit.isCommittee && showCommitteeAnnForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addAnnouncement(community.id, {
                      ...committeeAnnForm,
                      author: `Comité de Administración (${unit.committeeRole || 'Miembro'} • Unidad ${unit.number} ${unit.owner})`
                    });
                    setCommitteeAnnForm({ title: '', content: '', priority: 'Importante' });
                    setShowCommitteeAnnForm(false);
                  }}
                  className="bg-[#F5F4EF] p-4 rounded-2xl border border-[#D4B895] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0F3D2E]">
                      📢 Publicar Comunicado Oficial como {unit.committeeRole || 'Comité de Administración'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Llegará de inmediato a toda la comunidad y al Administrador
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        required
                        placeholder="Título del aviso (ej: Citación reunión / Aviso seguridad)"
                        value={committeeAnnForm.title}
                        onChange={(e) => setCommitteeAnnForm({ ...committeeAnnForm, title: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <select
                        value={committeeAnnForm.priority}
                        onChange={(e) => setCommitteeAnnForm({ ...committeeAnnForm, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                      >
                        <option value="Informativo">Informativo</option>
                        <option value="Importante">Importante</option>
                        <option value="Urgente">🚨 Urgente</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Escribe el comunicado para los vecinos de la comunidad..."
                      value={committeeAnnForm.content}
                      onChange={(e) => setCommitteeAnnForm({ ...committeeAnnForm, content: e.target.value })}
                      className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#F5F4EF] font-bold text-xs rounded-xl shrink-0"
                    >
                      Publicar a la Comunidad
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de los últimos comunicados activos */}
              {(community.announcements && community.announcements.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {community.announcements.slice(0, 2).map((ann) => {
                    const isFromCommittee = (ann.author || '').toLowerCase().includes('comité') || (ann.author || '').toLowerCase().includes('comite');
                    return (
                      <div
                        key={ann.id}
                        className={`p-3.5 rounded-2xl border space-y-1 ${
                          ann.priority === 'Urgente'
                            ? 'bg-rose-50/80 border-rose-200'
                            : isFromCommittee
                            ? 'bg-[#F5F4EF] border-[#D4B895]'
                            : 'bg-slate-50/90 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                              ann.priority === 'Urgente'
                                ? 'bg-rose-600 text-white'
                                : ann.priority === 'Importante'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {ann.priority}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              isFromCommittee
                                ? 'bg-[#0F3D2E] text-[#D4B895]'
                                : 'bg-white text-[#0F3D2E] border border-slate-200'
                            }`}>
                              {isFromCommittee ? `👥 ${ann.author}` : `🛡️ ${ann.author || 'Administración ARANPRO'}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">{formatDate(ann.date)}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900">{ann.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No hay comunicados recientes.</p>
              )}
            </div>
            
            {/* 1. ESTADO DE MI VIVIENDA (CARD DESTACADA CON MONTO A FAVOR / EN CONTRA Y CONVENIO REPACTADO) */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-md transition-all ${
              favorBalance > 0
                ? 'bg-emerald-950/20 border-emerald-400 text-slate-900'
                : isUpToDate
                ? 'bg-emerald-950/15 border-emerald-300/80 text-slate-900'
                : 'bg-rose-950/20 border-rose-300/80 text-slate-900'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {favorBalance > 0 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                        ¡AL DÍA + SALDO A FAVOR!
                      </span>
                    ) : isUpToDate ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                        ¡ESTADO AL DÍA!
                      </span>
                    ) : paidSoFar > 0 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center shadow-2xs">
                        <AlertCircle className="w-4 h-4 mr-1 text-amber-600" />
                        ABONO PARCIAL • SALDO EN CONTRA
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center shadow-2xs animate-pulse">
                        <AlertCircle className="w-4 h-4 mr-1 text-rose-600" />
                        MONTO EN CONTRA • PENDIENTE DE PAGO
                      </span>
                    )}
                    <span className="text-xs text-slate-600 font-semibold">
                      Dueño: <strong>{unit.owner}</strong>
                    </span>
                    {currentUser.loggedUserName && currentUser.loggedUserName !== unit.owner && (
                      <span className="px-2 py-0.5 rounded-md bg-[#0F3D2E] text-[#D4B895] text-[10px] font-bold">
                        Sesión activa: {currentUser.loggedUserName} ({currentUser.loggedUserRole})
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${
                      favorBalance > 0
                        ? 'text-emerald-700'
                        : totalToPay > 0
                        ? 'text-rose-700'
                        : 'text-slate-900'
                    }`}>
                      {favorBalance > 0
                        ? `+ ${formatCLP(favorBalance)} a Favor`
                        : totalToPay > 0
                        ? `- ${formatCLP(totalToPay)} por Pagar`
                        : '$ 0 (Al Día)'}
                    </h2>
                    {paidSoFar > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-white/80 border border-emerald-300 text-emerald-800 text-xs font-bold">
                        Pagado este mes: {formatCLP(paidSoFar)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600">
                    {favorBalance > 0
                      ? `Pagaste ${formatCLP(paidSoFar)} sobre un cobro de ${formatCLP(fin.totalBilledThisPeriod)}. Te queda un saldo a favor de ${formatCLP(favorBalance)} que se descontará automáticamente en tu próxima colilla.`
                      : isUpToDate
                      ? 'No registras montos pendientes en tu unidad para este período.'
                      : `Gasto del Mes: ${formatCLP(currentCharge)}${extraCharge > 0 ? ` + Cobro Extra: ${formatCLP(extraCharge)}` : ''}${previousDebt > 0 ? ` + Saldo Anterior: ${formatCLP(previousDebt)}` : ''}${fin.repactacionActive && fin.repactedInstallment > 0 ? ` + Cuota Deuda Histórica Repactada: ${formatCLP(fin.repactedInstallment)}` : ''}${paidSoFar > 0 ? ` - Abonado: ${formatCLP(paidSoFar)}` : ''}`
                    }
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  <button
                    onClick={() => {
                      setPaymentSubmitted(false);
                      setPaymentForm(prev => ({ ...prev, amount: totalToPay > 0 ? totalToPay : '' }));
                      setShowPayModal(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Informar Transferencia
                  </button>

                  <button
                    onClick={() => setShowBillModal(true)}
                    className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm rounded-2xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                    title="Ver su Colilla Individual de Cobro foliada"
                  >
                    <FileText className="w-4 h-4 mr-2 text-[#0F3D2E]" />
                    Ver Colilla de Cobro
                  </button>

                  <button
                    onClick={() => setShowExpenseReportModal(true)}
                    className="w-full sm:w-auto px-5 py-3 bg-[#F5F4EF] hover:bg-[#eae7dd] text-[#0F3D2E] border border-[#D4B895] font-bold text-sm rounded-2xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                    title="Ver Rendición Oficial de Gastos Comunes de la Comunidad (Ley N° 21.442)"
                  >
                    <FileCheck className="w-4 h-4 mr-2 text-[#0F3D2E]" />
                    Ver Rendición de Gastos
                  </button>
                </div>

              </div>

              {/* Desglose separado: Gasto del Mes | Saldo Anterior | Cuota Deuda Repactada | Pagado / Saldo */}
              <div className="mt-6 pt-5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block">Gasto del Mes:</span>
                  <span className="font-black text-slate-900 text-sm">{formatCLP(currentCharge)}</span>
                </div>
                <div className="bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block">Saldo Anterior:</span>
                  <span className={`font-black text-sm ${previousDebt > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {formatCLP(previousDebt)}
                  </span>
                </div>
                {fin.repactacionActive ? (
                  <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-300">
                    <span className="text-amber-900 font-bold block">
                      Cuota Repactada ({Math.min(fin.repactacionPaidInstallments + 1, fin.repactacionTotalInstallments)}/{fin.repactacionTotalInstallments}):
                    </span>
                    <span className="font-black text-amber-950 text-sm">{formatCLP(fin.repactedInstallment)}</span>
                  </div>
                ) : (
                  <div className="bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="text-slate-500 block">Cobro Individual:</span>
                    <span className="font-bold text-amber-800 text-sm">{formatCLP(extraCharge)}</span>
                  </div>
                )}
                <div className="bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block">Total Mes Exigible:</span>
                  <span className="font-black text-[#0F3D2E] text-sm">{formatCLP(fin.totalBilledThisPeriod)}</span>
                </div>
                <div className="bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block">Monto Pagado:</span>
                  <span className="font-black text-emerald-700 text-sm">{formatCLP(paidSoFar)}</span>
                </div>
                <div className="bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block">Vencimiento:</span>
                  <span className="font-bold text-slate-800 text-sm">{formatDate(community.activePeriod.dueDate)}</span>
                </div>
              </div>

              {/* RECUADRO ESPECIAL: EVOLUCIÓN DE DEUDA HISTÓRICA REPACTADA (SOLO PARA VECINOS CON CONVENIO ACTIVO) */}
              {fin.repactacionActive && (
                <div className="mt-5 p-4 bg-white rounded-2xl border-2 border-amber-300 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        Convenio de Deuda Histórica Repactada (Separada de tu Gasto del Mes)
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        Evolución y Rebaja de tu Deuda Histórica • {unit.repactacion?.notes || 'Convenio en cuotas'}
                      </h4>
                    </div>
                    <span className="text-xs font-black text-[#0F3D2E] bg-[#F5F4EF] px-3 py-1 rounded-xl border border-[#D4B895]">
                      Cuota Actual: {Math.min(fin.repactacionPaidInstallments + 1, fin.repactacionTotalInstallments)} de {fin.repactacionTotalInstallments} ({formatCLP(fin.repactedInstallment)}/mes)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Deuda Histórica Inicial:</span>
                      <span className="font-black text-slate-900 text-sm">{formatCLP(fin.repactacionTotal)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-700 font-semibold block">Total Ya Rebajado ({fin.repactacionPaidInstallments} cuotas):</span>
                      <span className="font-black text-emerald-800 text-sm">- {formatCLP(fin.repactacionAlreadyPaidAmount)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-amber-800 font-semibold block">Cuota Cobrada este Mes:</span>
                      <span className="font-black text-amber-950 text-sm">{formatCLP(fin.repactedInstallment)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F5F4EF] border border-[#D4B895]">
                      <span className="text-[#0F3D2E] font-semibold block">Saldo Convenio tras este mes:</span>
                      <span className="font-black text-[#0F3D2E] text-sm">
                        {formatCLP(Math.max(0, fin.repactacionRemainingBeforeThisMonth - fin.repactedInstallment))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Usuarios / Pagadores registrados en esta unidad */}
              {Array.isArray(unit.additionalUsers) && unit.additionalUsers.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">
                    👥 Usuarios habilitados en esta unidad (Dueño y Pagador/Arrendatario/Familiar):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800">
                      Dueño: {unit.owner} ({unit.rut || 'S/RUT'})
                    </span>
                    {unit.additionalUsers.map((sub, i) => (
                      <span key={sub.id || i} className="px-2.5 py-1 rounded-lg bg-[#F5F4EF] border border-[#D4B895] font-bold text-[#0F3D2E]">
                        {sub.role}: {sub.name} ({sub.rut || 'S/RUT'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. DASHBOARD FINANCIERO DE LA COMUNIDAD (NÚMEROS ROJOS O VERDES REALES) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F3D2E]">
                    Transparencia Comunitaria
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    Estado Real de las Cuentas del Condominio
                  </h3>
                  <p className="text-xs text-slate-500">
                    Período {getMonthName(community.activePeriod.month)} {community.activePeriod.year}
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Balance del período:</span>
                  <span className={`px-2.5 py-1 rounded-full font-bold ${
                    communityCashBalance >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {communityCashBalance >= 0 ? 'Superávit Operacional' : 'Déficit Temporal'}
                  </span>
                </div>
              </div>

              {/* Macro Indicators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Gastos Totales */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs text-slate-500 font-medium block">Total Gastos Operacionales</span>
                  <span className="text-xl font-black text-slate-900 block mt-1">
                    {formatCLP(totalExpenses)}
                  </span>
                  <span className="text-[11px] text-slate-400">Suma de todas las facturas</span>
                </div>

                {/* Fondo de Reserva */}
                <div className="p-4 rounded-2xl bg-[#F5F4EF]/60 border border-[#D4B895]/60">
                  <span className="text-xs text-[#0A291F] font-semibold block">Fondo de Reserva ({community.reserveFundPercentage}%)</span>
                  <span className="text-xl font-black text-indigo-950 block mt-1">
                    {formatCLP(reserveFundAmount)}
                  </span>
                  <span className="text-[11px] text-[#0F3D2E]/80">Ahorro legal Ley 21.442</span>
                </div>

                {/* Recaudado */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                  <span className="text-xs text-emerald-700 font-semibold block">Total Recaudado</span>
                  <span className="text-xl font-black text-emerald-900 block mt-1">
                    {formatCLP(totalCollected)}
                  </span>
                  <span className="text-[11px] text-emerald-600/80">
                    {community.units.filter(u => u.paid).length} de {community.totalUnits} casas al día
                  </span>
                </div>

                {/* Saldo en Caja / Números rojos o verdes */}
                <div className={`p-4 rounded-2xl border ${
                  communityCashBalance >= 0
                    ? 'bg-emerald-100/50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-100/50 border-rose-300 text-rose-950'
                }`}>
                  <span className="text-xs font-semibold block">
                    {communityCashBalance >= 0 ? 'Saldo a Favor (Verde)' : 'Diferencia por Recaudar (Rojo)'}
                  </span>
                  <span className="text-xl font-black block mt-1">
                    {formatCLP(communityCashBalance)}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {communityCashBalance >= 0 ? 'Cuentas cubiertas' : 'Pendiente pago de vecinos morosos'}
                  </span>
                </div>

              </div>

              {/* Enlace directo a ver todos los respaldos */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('gastos')}
                  className="text-xs font-bold text-[#0F3D2E] hover:text-indigo-800 flex items-center"
                >
                  Ver el detalle y boletas de cada gasto →
                </button>
              </div>
            </div>

            {/* 3. TRÁMITES RÁPIDOS */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white rounded-xl text-[#0F3D2E] border border-slate-200 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">¿Necesitas un Certificado de Residencia?</h4>
                  <p className="text-xs text-slate-500">Genera una solicitud oficial timbrada para trámites escolares o bancarios.</p>
                </div>
              </div>
              <button
                onClick={onOpenCertificates}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs shrink-0"
              >
                Solicitar Certificado
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: DETALLE DE GASTOS CON RESPALDOS 100% VISIBLES */}
        {activeTab === 'gastos' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Desglose de Gastos del Mes y Comprobantes
                </h3>
                <p className="text-xs text-slate-500">
                  Transparencia radical: haz clic en "Ver Respaldo" para inspeccionar la factura real emitida por cada proveedor.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Total Gasto Común Emitido</span>
                  <span className="text-xl font-black text-[#0F3D2E]">{formatCLP(grandTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExpenseReportModal(true)}
                  className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer"
                  title="Ver y descargar el Informe Oficial de Rendición de Gastos Comunes en PDF (1 Página Legal)"
                >
                  <FileCheck className="w-4 h-4 mr-1.5 text-[#D4B895]" />
                  Rendición Oficial (PDF)
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Categoría</th>
                      <th className="px-5 py-3">Descripción</th>
                      <th className="px-5 py-3">Proveedor / Doc</th>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3 text-right">Monto</th>
                      <th className="px-5 py-3 text-center">Respaldo Oficial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {community.expenses?.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#F5F4EF] text-[#0A291F]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800 max-w-xs">
                          {exp.description}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          <div className="font-semibold text-slate-700">{exp.provider}</div>
                          <div className="text-[10px] text-slate-400">{exp.documentType} • {exp.documentNumber}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {formatDate(exp.date)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 text-sm">
                          {formatCLP(exp.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setActiveReceipt(exp)}
                            className="inline-flex items-center px-3 py-1.5 bg-[#F5F4EF] hover:bg-[#F5F4EF] text-[#0A291F] font-semibold text-xs rounded-xl border border-[#D4B895] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Ver Respaldo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NUEVA PESTAÑA: MIS PAGOS Y RECIBOS OFICIALES */}
        {activeTab === 'mis-pagos' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Historial de Mis Pagos y Recibos Oficiales
                </h3>
                <p className="text-xs text-slate-500">
                  Revisa el estado de tus transferencias informadas y descarga tu Comprobante Oficial de Pago Foliado.
                </p>
              </div>
              <button
                onClick={() => { setPaymentSubmitted(false); setShowPayModal(true); }}
                className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
              >
                + Informar Nueva Transferencia
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Folio Recibo</th>
                      <th className="px-5 py-3">Fecha Transferencia</th>
                      <th className="px-5 py-3">N° Operación</th>
                      <th className="px-5 py-3 text-right">Monto</th>
                      <th className="px-5 py-3 text-center">Estado</th>
                      <th className="px-5 py-3 text-center">Comprobante Oficial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unitPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-[#0F3D2E]">
                          {pay.receiptFolio || 'EN REVISIÓN'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {formatDate(pay.date)}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">
                          {pay.transferNumber}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-emerald-700 text-sm">
                          {formatCLP(pay.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            pay.status === 'APROBADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {pay.status === 'APROBADO' ? (
                            <button
                              onClick={() => setActivePaymentReceipt({ ...pay, communityName: community.name })}
                              className="inline-flex items-center px-3 py-1.5 bg-[#F5F4EF] hover:bg-[#D4B895]/30 text-[#0F3D2E] font-bold text-xs rounded-xl border border-[#D4B895]"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1.5" />
                              Ver Recibo Oficial
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Pendiente validación</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {unitPayments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                          Aún no registras transferencias informadas en este período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NUEVA PESTAÑA: MURAL DE AVISOS Y CARPETA DE DOCUMENTOS DE LA COMUNIDAD */}
        {activeTab === 'comunicados' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Mural de Avisos Oficiales */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-[#F5F4EF] text-[#0F3D2E] rounded-xl">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Mural de Avisos y Comunicados</h3>
                      <p className="text-xs text-slate-500">Informaciones oficiales de la Administración y del Comité para {displayCommunityName}</p>
                    </div>
                  </div>
                  {unit.isCommittee && (
                    <span className="px-2.5 py-1 text-[10px] font-black bg-[#0F3D2E] text-[#D4B895] rounded-full shrink-0">
                      🛡️ {unit.committeeRole || 'Comité'}
                    </span>
                  )}
                </div>

                {unit.isCommittee && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addAnnouncement(community.id, {
                        ...committeeAnnForm,
                        author: `Comité de Administración (${unit.committeeRole || 'Miembro'} • Unidad ${unit.number} ${unit.owner})`
                      });
                      setCommitteeAnnForm({ title: '', content: '', priority: 'Importante' });
                    }}
                    className="bg-[#F5F4EF] p-4 rounded-2xl border border-[#D4B895] space-y-3"
                  >
                    <span className="text-xs font-black text-[#0F3D2E] block">
                      📢 Publicar Nuevo Comunicado del Comité a la Comunidad
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Título del comunicado..."
                          value={committeeAnnForm.title}
                          onChange={(e) => setCommitteeAnnForm({ ...committeeAnnForm, title: e.target.value })}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <select
                          value={committeeAnnForm.priority}
                          onChange={(e) => setCommitteeAnnForm({ ...committeeAnnForm, priority: e.target.value })}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                        >
                          <option value="Informativo">Informativo</option>
                          <option value="Importante">Importante</option>
                          <option value="Urgente">🚨 Urgente</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      placeholder="Escribe el mensaje que se mostrará de inmediato en el Dashboard de la comunidad..."
                      value={committeeAnnForm.content}
                      onChange={(e) => setCommitteeAnnForm({ ...committeeAnnForm, content: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl transition-colors"
                    >
                      Publicar Comunicado Oficial del Comité
                    </button>
                  </form>
                )}
              </div>

              {([...(community.announcements || [])].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))).map(ann => (
                <div key={ann.id} className={`bg-white p-5 rounded-2xl border shadow-xs space-y-2 ${ann.isPinned ? 'border-2 border-[#D4B895] bg-amber-50/15' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                        ann.priority === 'Urgente'
                          ? 'bg-rose-100 text-rose-800'
                          : ann.priority === 'Importante'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {ann.priority}
                      </span>
                      {ann.isPinned && (
                        <span className="px-2 py-0.5 text-[9.5px] font-black rounded-md bg-[#0F3D2E] text-[#D4B895]">
                          📌 FIJADO
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(ann.date)}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{ann.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  <div className="pt-1 text-[11px] font-semibold text-[#0F3D2E] flex justify-between">
                    <span>Publicado por: {ann.author || 'Administración ARANPRO'}</span>
                    {ann.expiresAt && <span className="text-amber-700 font-bold">Vigente hasta: {formatDate(ann.expiresAt)}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Carpeta de Documentos Oficiales */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
                <div className="p-2.5 bg-[#F5F4EF] text-[#0F3D2E] rounded-xl">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Biblioteca Legal de la Comunidad</h3>
                  <p className="text-xs text-slate-500">Reglamento de Copropiedad, Plan de Emergencia y Actas (Ley 21.442)</p>
                </div>
              </div>

              <div className="space-y-3">
                {(community.documents || []).map(doc => (
                  <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-[#0F3D2E] shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                        <p className="text-[11px] text-slate-400">{doc.category} • Actualizado: {formatDate(doc.date)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveReceipt({
                        documentType: doc.category,
                        documentNumber: doc.date,
                        provider: community.name,
                        date: doc.date,
                        amount: 0,
                        category: doc.category,
                        description: doc.title,
                        receiptUrl: doc.fileUrl
                      })}
                      className="px-3 py-1.5 bg-[#F5F4EF] hover:bg-[#D4B895]/30 text-[#0F3D2E] border border-[#D4B895] rounded-xl text-xs font-bold shrink-0"
                    >
                      Consultar
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: DATOS DE CUENTA BANCARIA PARA TRANSFERENCIAS */}
        {activeTab === 'cuenta-bancaria' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#F5F4EF] text-[#0F3D2E] rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Cuenta Bancaria de la Comunidad</h3>
                  <p className="text-xs text-slate-500">Exclusiva para el pago de gastos comunes del condominio</p>
                </div>
              </div>
              <button
                onClick={handleCopyBankInfo}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center transition-colors"
              >
                {copiedBank ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copiedBank ? '¡Copiado!' : 'Copiar Datos'}
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Banco:</span>
                <span className="font-bold text-slate-900">{community.bankInfo?.bank || 'Banco Estado'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Tipo de Cuenta:</span>
                <span className="font-bold text-slate-900">{community.bankInfo?.accountType || 'Cuenta Corriente'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">N° de Cuenta:</span>
                <span className="font-bold text-[#0F3D2E] font-mono text-base">{community.bankInfo?.accountNumber || 'Sin configurar'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Titular:</span>
                <span className="font-bold text-slate-900">{community.bankInfo?.holderName || community.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">RUT Titular:</span>
                <span className="font-bold text-slate-900">{community.bankInfo?.rut || 'Sin RUT'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Email Comprobantes:</span>
                <span className="font-bold text-slate-900">{community.bankInfo?.email || 'pagos@comunidad.cl'}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <p className="font-bold">⚠️ Muy importante al realizar la transferencia:</p>
              <p>Indica en el asunto o mensaje de la transferencia tu <strong>Número de Casa ({unit.number})</strong> para que podamos identificar y validar tu pago con mayor rapidez.</p>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => { setPaymentSubmitted(false); setShowPayModal(true); }}
                className="w-full py-3.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-sm rounded-2xl shadow-md transition-colors"
              >
                Ya transferí: Informar mi pago a la administración
              </button>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* BARRA INFERIOR DE ACCESO RÁPIDO MÓVIL PWA (< lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 grid grid-cols-5 gap-1 shadow-lg">
        {residentTabs.map((item) => {
          const IconComp = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition-colors ${
                active ? 'text-[#0F3D2E] bg-[#F5F4EF]' : 'text-slate-500'
              }`}
            >
              <IconComp className={`w-4 h-4 mb-0.5 ${active ? 'text-[#0F3D2E]' : 'text-slate-400'}`} />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL INFORMAR PAGO */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              ✕
            </button>

            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Informar Comprobante de Pago</h3>
              <p className="text-xs text-slate-500">Casa N° {unit.number} • {unit.owner}</p>
            </div>

            {paymentSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">¡Pago Informado con Éxito!</h4>
                <p className="text-sm text-slate-600">
                  La administración cotejará la transferencia con la cartola bancaria de la comunidad y emitirá tu Recibo Oficial de Pago.
                </p>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="px-6 py-2.5 bg-[#0F3D2E] text-white border-b border-[#0F3D2E] text-xs font-semibold rounded-xl"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monto Transferido ($ CLP) *</label>
                  <input
                    type="number"
                    required
                    placeholder={totalToPay.toString()}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Transferencia *</label>
                    <input
                      type="date"
                      required
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">N° de Operación / Folio</label>
                    <input
                      type="text"
                      placeholder="Ej: 9948210"
                      value={paymentForm.transferNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transferNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Adjuntar Comprobante (Foto, Captura o PDF desde tu celular/PC)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex-1 cursor-pointer flex items-center justify-center px-3.5 py-2.5 rounded-xl border-2 border-dashed border-[#D4B895] bg-[#F5F4EF]/60 hover:bg-[#F5F4EF] text-[#0F3D2E] text-xs font-bold transition-colors">
                      <span>📎 Subir Foto / PDF del Comprobante</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setPaymentForm(prev => ({ ...prev, receiptImg: ev.target.result, fileName: file.name }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {paymentForm.receiptImg && (
                      <button
                        type="button"
                        onClick={() => setPaymentForm(prev => ({ ...prev, receiptImg: '', fileName: '' }))}
                        className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl border border-rose-200"
                      >
                        Quitar archivo
                      </button>
                    )}
                  </div>
                  {paymentForm.fileName && (
                    <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      ✓ Archivo adjunto: {paymentForm.fileName}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="O pega un enlace URL al comprobante (opcional)"
                    value={paymentForm.receiptImg?.startsWith('data:') ? '' : paymentForm.receiptImg}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receiptImg: e.target.value, fileName: '' })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Comentarios / Observaciones</label>
                  <textarea
                    rows={2}
                    placeholder="Indica cualquier detalle relevante para la administración..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-sm rounded-xl shadow-md transition-colors"
                >
                  Registrar Notificación de Pago
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL COLILLA DE COBRO (IMPRIMIBLE / DESCARGABLE) */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div 
            id="resident-bill-printable-doc"
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-8 space-y-6"
          >
            
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#0F3D2E]">
              <div className="flex items-center space-x-3.5">
                <AranproLogo className="h-10 w-auto" />
                <div>
                  <h3 className="text-base font-black text-slate-900">{displayCommunityName}</h3>
                  <p className="text-xs text-slate-500">Cobro de Gasto Común Oficial • Ley N° 21.442</p>
                </div>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Unidad:</span>
                <span className="font-bold text-slate-900 text-sm">Casa N° {unit.number}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Propietario Titular:</span>
                <span className="font-bold text-slate-900">{unit.owner}</span>
              </div>
              {(!unit.payerSameAsOwner && unit.additionalUsers?.length > 0) && (
                <div className="col-span-2 pt-1 border-t border-slate-200/70">
                  <span className="text-slate-400 block">Pagador / Arrendatario Registrado:</span>
                  <span className="font-bold text-[#0F3D2E]">
                    {unit.additionalUsers.map(su => `${su.name} (${su.role} • ${su.rut || 'S/RUT'})`).join(' | ')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block">RUT Propietario:</span>
                <span className="font-bold text-slate-900">{unit.rut || 'No informado'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Prorrateo:</span>
                <span className="font-bold text-slate-900">{unit.sharePercentage}%</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Total Gastos Operacionales Comunidad:</span>
                <span className="font-semibold text-slate-900">{formatCLP(totalExpenses)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Fondo de Reserva ({community.reserveFundPercentage}%):</span>
                <span className="font-semibold text-slate-900">{formatCLP(reserveFundAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-800 font-bold">1. Gasto Común del Mes ({unit.sharePercentage}%):</span>
                <span className="font-bold text-[#0F3D2E] text-sm">{formatCLP(currentCharge)}</span>
              </div>
              {extraCharge > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-amber-800 font-bold">
                  <span>Cobro Individual ({unit.extraChargeDescription || 'Cargo Extra'}):</span>
                  <span>{formatCLP(extraCharge)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-700 font-semibold">2. Saldo Anterior (No Repactado):</span>
                <span className={`font-bold ${previousDebt > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {formatCLP(previousDebt)}
                </span>
              </div>
              {fin.repactacionActive && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <div className="flex justify-between font-black text-amber-950">
                    <span>
                      3. Cuota Deuda Histórica Repactada (Cuota {Math.min(fin.repactacionPaidInstallments + 1, fin.repactacionTotalInstallments)} de {fin.repactacionTotalInstallments}):
                    </span>
                    <span>{formatCLP(fin.repactedInstallment)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-amber-800">
                    <span>Deuda Histórica Inicial: {formatCLP(fin.repactacionTotal)} | Ya Rebajado: -{formatCLP(fin.repactacionAlreadyPaidAmount)}</span>
                    <span className="font-bold">
                      Saldo Convenio tras este pago: {formatCLP(Math.max(0, fin.repactacionRemainingBeforeThisMonth - fin.repactedInstallment))}
                    </span>
                  </div>
                </div>
              )}
              {fin.creditBalance > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-emerald-700 font-bold">
                  <span>Saldo a Favor Período Anterior:</span>
                  <span>- {formatCLP(fin.creditBalance)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-200 font-bold text-slate-900">
                <span>Total Exigible en este Período:</span>
                <span>{formatCLP(fin.totalBilledThisPeriod)}</span>
              </div>
              {paidSoFar > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-emerald-700 font-bold">
                  <span>Monto Pagado / Abonado Registrado:</span>
                  <span>- {formatCLP(paidSoFar)}</span>
                </div>
              )}
              {favorBalance > 0 ? (
                <div className="flex justify-between py-3 text-sm font-black text-emerald-800 bg-emerald-50 px-3 rounded-xl border border-emerald-200">
                  <span>SALDO A FAVOR DISPONIBLE (SE DESCUENTA EL PRÓXIMO MES):</span>
                  <span className="text-base">+ {formatCLP(favorBalance)}</span>
                </div>
              ) : (
                <div className="flex justify-between py-3 text-sm font-black text-slate-900 border-t border-slate-200">
                  <span>MONTO EN CONTRA / TOTAL PENDIENTE A PAGAR:</span>
                  <span className="text-base text-[#0A291F]">{formatCLP(totalToPay)}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#F5F4EF] rounded-xl text-center text-xs text-[#0F3D2E] border border-[#D4B895]">
              Fecha de Vencimiento: <strong>{formatDate(community.activePeriod.dueDate)}</strong>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const commName = (community?.name || 'Condominio').replace(/\s+/g, '_');
                  printDocumentDirectly('resident-bill-printable-doc', `Colilla_Gasto_Comun_Casa_${unit.number}_${commName}`, { fitPage: true });
                }}
                className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                Imprimir / Guardar PDF
              </button>
              <button
                onClick={() => setShowBillModal(false)}
                className="px-5 py-2 bg-[#0F3D2E] text-white border-b border-[#0F3D2E] font-semibold text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL RECIBO OFICIAL DE PAGO FOLIADO PARA EL VECINO */}
      {activePaymentReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div 
            id="resident-payment-receipt-printable-doc"
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#D4B895] overflow-hidden p-7 space-y-5"
          >
            <div className="flex justify-between items-start border-b-2 border-[#0F3D2E] pb-4">
              <div className="flex items-center space-x-3">
                <AranproLogo className="h-9 w-auto" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F3D2E] block">
                    ARANPRO • Gestión Integral
                  </span>
                  <h3 className="text-base font-black text-slate-900">Comprobante Oficial de Pago</h3>
                  <p className="text-xs font-mono font-bold text-emerald-700">
                    Folio: {activePaymentReceipt.receiptFolio || 'REC-OFICIAL'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePaymentReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F5F4EF] p-4 rounded-2xl border border-[#D4B895] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Comunidad:</span>
                <span className="font-bold text-slate-900">{activePaymentReceipt.communityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unidad Pagadora:</span>
                <span className="font-bold text-slate-900">Casa N° {activePaymentReceipt.unitNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Copropietario:</span>
                <span className="font-bold text-slate-900">{activePaymentReceipt.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de Pago:</span>
                <span className="font-bold text-slate-900">{formatDate(activePaymentReceipt.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">N° Operación:</span>
                <span className="font-mono font-bold text-slate-900">{activePaymentReceipt.transferNumber}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#D4B895] text-sm">
                <span className="font-black text-[#0F3D2E]">MONTO PAGADO:</span>
                <span className="font-black text-emerald-700">{formatCLP(activePaymentReceipt.amount)}</span>
              </div>
            </div>

            {/* Timbre y Firma Digital de Emisión */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-mono block">Recaudado y Validado</span>
                <span className="font-bold text-[#0F3D2E] text-[11px] block">{companySettings?.adminName || companySettings?.administratorName || 'Administración ARANPRO'}</span>
                <span className="text-[9px] text-slate-500 font-mono">RNAC MINVU N° {companySettings?.rnacNumber || '48.912'}</span>
              </div>
              <div className="text-right">
                {companySettings?.signatureDataUrl ? (
                  <img src={companySettings.signatureDataUrl} alt="Firma" className="max-h-11 object-contain ml-auto" />
                ) : (
                  <div className="h-6"></div>
                )}
                <span className="text-[9px] font-mono text-emerald-800 font-bold block">✓ Timbre Digital Verificado</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const commName = (community?.name || 'Condominio').replace(/\s+/g, '_');
                  const folio = (activePaymentReceipt.receiptFolio || 'REC').replace(/[^a-zA-Z0-9_-]/g, '_');
                  printDocumentDirectly('resident-payment-receipt-printable-doc', `Recibo_Pago_${folio}_Casa_${unit.number}_${commName}`, { fitPage: true });
                }}
                className="px-4 py-2 bg-[#0F3D2E] text-white font-bold text-xs rounded-xl flex items-center cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                Imprimir / Guardar PDF
              </button>
              <button
                onClick={() => setActivePaymentReceipt(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAMBIAR MI CLAVE (VECINO) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#D4B895] overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Cambiar Mi Contraseña</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {passwordSaved ? (
              <div className="py-4 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-900">¡Contraseña actualizada con éxito!</p>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-5 py-2 bg-[#0F3D2E] text-white text-xs font-bold rounded-xl"
                >
                  Listo
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPasswordInput.trim()) return;
                  changeResidentPassword(community.id, unit.id, newPasswordInput.trim());
                  setPasswordSaved(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nueva Contraseña para Casa {unit.number} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Escribe tu nueva clave..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl"
                >
                  Guardar Nueva Contraseña
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL INFORME OFICIAL DE RENDICIÓN DE GASTOS COMUNES (LEY N° 21.442) */}
      <ExpenseReportModal
        isOpen={showExpenseReportModal}
        onClose={() => setShowExpenseReportModal(false)}
        community={community}
      />
      </div>
    </div>
  );
};
