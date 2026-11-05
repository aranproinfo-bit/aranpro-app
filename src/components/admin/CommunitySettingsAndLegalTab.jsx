import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import {
  Building2, ShieldCheck, Check, Plus, Trash2, Users, BookOpen,
  Landmark, Wrench, ChevronDown, ChevronUp, Scale, Lock, Sparkles,
  ArrowLeft, Calendar, MapPin, Mail, Phone, Award, FileText
} from 'lucide-react';
import { formatCLP } from '../../utils/formatters';

export const CommunitySettingsAndLegalTab = ({
  currentCommunity,
  activeSubTab = 'condominio',
  setActiveSubTab,
  onOpenCompanyHub
}) => {
  const { updateCommunity, updateUnit } = useCommunity();
  const [internalTab, setInternalTab] = useState(activeSubTab || 'condominio');
  const currentTab = activeSubTab || internalTab;

  const handleTabChange = (tab) => {
    setInternalTab(tab);
    if (setActiveSubTab) setActiveSubTab(tab);
  };

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Estado del formulario de habilitación y ajustes del condominio
  const [commForm, setCommForm] = useState({
    name: '',
    communityRut: '',
    type: 'Casas',
    address: '',
    city: 'La Serena / Coquimbo',
    buildingAgeYears: 5,
    constructionYear: 2021,
    totalUnits: 16,
    email: '',
    phone: '',
    monthlyAdminFeeCLP: 450000,
    monthlyAdminFeeUF: 15,
    reserveFundPercentage: 5,
    initialBankBalance: 0,
    accumulatedReserveFund: 0,
    bank: 'Banco Estado',
    accountType: 'Cuenta Corriente',
    accountNumber: '',
    holderName: '',
    bankRut: '',
    bankEmail: '',
    // Equipamiento e instalaciones críticas del condominio
    elevatorsCount: 0,
    pumpRoomsCount: 1,
    boilersCount: 0,
    hasGenerator: false,
    hasPool: false,
    hasClubhouse: true,
    hasPerimeterCctv: true,
    directStaffCount: 2,
    internalRegulationFolio: '',
    insuranceCompany: 'BCI Seguros',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '2027-03-31'
  });

  // Integrantes del Comité de Administración (Art. 17° Ley 21.442)
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    role: 'Presidente(a) del Comité',
    name: '',
    rut: '',
    unitNumber: '',
    phone: '',
    email: '',
    hasBankSignature: true
  });

  // Secciones desplegables de Sobre la Aplicación & Aspectos Legales
  const [aboutOpenSections, setAboutOpenSections] = useState({
    general: true,
    quienesSomos: true,
    terminos: true,
    privacidad: true,
    ley21442: true,
    licencia: false
  });

  const toggleAboutSection = (key) => {
    setAboutOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!currentCommunity) return;
    const currentYear = new Date().getFullYear();
    const age = currentCommunity.buildingAgeYears ?? 5;
    const calcYear = currentCommunity.constructionYear || (currentYear - age);

    setCommForm({
      name: currentCommunity.name || '',
      communityRut: currentCommunity.communityRut || currentCommunity.bankInfo?.rut || '65.120.450-K',
      type: currentCommunity.type || 'Casas',
      address: currentCommunity.address || '',
      city: currentCommunity.city || 'La Serena / Coquimbo',
      buildingAgeYears: age,
      constructionYear: calcYear,
      totalUnits: currentCommunity.totalUnits || currentCommunity.units?.length || 16,
      email: currentCommunity.email || currentCommunity.bankInfo?.email || '',
      phone: currentCommunity.phone || '+56 9 5811 8504',
      monthlyAdminFeeCLP: currentCommunity.monthlyAdminFeeCLP ?? 580000,
      monthlyAdminFeeUF: currentCommunity.monthlyAdminFeeUF ?? 15.2,
      reserveFundPercentage: currentCommunity.reserveFundPercentage ?? 5,
      initialBankBalance: currentCommunity.initialBankBalance ?? 0,
      accumulatedReserveFund: currentCommunity.accumulatedReserveFund ?? 0,
      bank: currentCommunity.bankInfo?.bank || 'Banco Estado',
      accountType: currentCommunity.bankInfo?.accountType || 'Cuenta Corriente',
      accountNumber: currentCommunity.bankInfo?.accountNumber || '',
      holderName: currentCommunity.bankInfo?.holderName || currentCommunity.name || '',
      bankRut: currentCommunity.bankInfo?.rut || currentCommunity.communityRut || '65.120.450-K',
      bankEmail: currentCommunity.bankInfo?.email || currentCommunity.email || '',
      elevatorsCount: currentCommunity.technicalProfile?.elevatorsCount ?? (currentCommunity.type === 'Edificio' ? 2 : 0),
      pumpRoomsCount: currentCommunity.technicalProfile?.pumpRoomsCount ?? 1,
      boilersCount: currentCommunity.technicalProfile?.boilersCount ?? 0,
      hasGenerator: currentCommunity.technicalProfile?.hasGenerator ?? true,
      hasPool: currentCommunity.technicalProfile?.hasPool ?? false,
      hasClubhouse: currentCommunity.technicalProfile?.hasClubhouse ?? true,
      hasPerimeterCctv: currentCommunity.technicalProfile?.hasPerimeterCctv ?? true,
      directStaffCount: currentCommunity.technicalProfile?.directStaffCount ?? 2,
      internalRegulationFolio: currentCommunity.internalRegulationFolio || 'CBR-LS-2023-4410',
      insuranceCompany: currentCommunity.insuranceCompany || 'BCI Seguros Generales',
      insurancePolicyNumber: currentCommunity.insurancePolicyNumber || 'POL-INC-2026-8891',
      insuranceExpiryDate: currentCommunity.insuranceExpiryDate || '2027-03-31'
    });

    // Cargar integrantes del comité desde committeeMembers o desde las unidades marcadas con isCommittee
    if (Array.isArray(currentCommunity.committeeMembers) && currentCommunity.committeeMembers.length > 0) {
      setCommitteeMembers(currentCommunity.committeeMembers);
    } else {
      const fromUnits = (currentCommunity.units || [])
        .filter((u) => u.isCommittee)
        .map((u, idx) => ({
          id: `cm-${u.id || idx}`,
          role: u.committeeRole || (idx === 0 ? 'Presidente(a) del Comité' : idx === 1 ? 'Tesorero(a) del Comité' : 'Secretario(a) del Comité'),
          name: u.owner || `Propietario Unidad ${u.number}`,
          rut: u.rut || '',
          unitNumber: u.number || '',
          phone: u.phone || '',
          email: u.email || '',
          hasBankSignature: idx < 2
        }));
      setCommitteeMembers(fromUnits);
    }
  }, [currentCommunity]);

  const handleSaveCommunitySettings = (e) => {
    if (e) e.preventDefault();
    if (!currentCommunity) return;

    updateCommunity(currentCommunity.id, {
      name: commForm.name,
      communityRut: commForm.communityRut,
      type: commForm.type,
      address: commForm.address,
      city: commForm.city,
      buildingAgeYears: Number(commForm.buildingAgeYears) || 0,
      constructionYear: Number(commForm.constructionYear) || new Date().getFullYear(),
      totalUnits: Number(commForm.totalUnits) || currentCommunity.units?.length || 1,
      email: commForm.email,
      phone: commForm.phone,
      monthlyAdminFeeCLP: Number(commForm.monthlyAdminFeeCLP) || 0,
      monthlyAdminFeeUF: Number(commForm.monthlyAdminFeeUF) || 0,
      reserveFundPercentage: Number(commForm.reserveFundPercentage) || 5,
      initialBankBalance: Number(commForm.initialBankBalance) || 0,
      accumulatedReserveFund: Number(commForm.accumulatedReserveFund) || 0,
      internalRegulationFolio: commForm.internalRegulationFolio,
      insuranceCompany: commForm.insuranceCompany,
      insurancePolicyNumber: commForm.insurancePolicyNumber,
      insuranceExpiryDate: commForm.insuranceExpiryDate,
      bankInfo: {
        bank: commForm.bank,
        accountType: commForm.accountType,
        accountNumber: commForm.accountNumber,
        holderName: commForm.holderName || commForm.name,
        rut: commForm.bankRut || commForm.communityRut,
        email: commForm.bankEmail || commForm.email
      },
      technicalProfile: {
        elevatorsCount: Number(commForm.elevatorsCount) || 0,
        pumpRoomsCount: Number(commForm.pumpRoomsCount) || 0,
        boilersCount: Number(commForm.boilersCount) || 0,
        hasGenerator: Boolean(commForm.hasGenerator),
        hasPool: Boolean(commForm.hasPool),
        hasClubhouse: Boolean(commForm.hasClubhouse),
        hasPerimeterCctv: Boolean(commForm.hasPerimeterCctv),
        directStaffCount: Number(commForm.directStaffCount) || 0
      },
      committeeMembers
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCommitteeMember = (e) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    const created = {
      id: `cm-${Date.now()}`,
      ...newMember
    };
    const updatedList = [...committeeMembers, created];
    setCommitteeMembers(updatedList);

    // Si coincide con una unidad existente, marcar esa unidad como parte del Comité
    if (currentCommunity && newMember.unitNumber) {
      const targetUnit = (currentCommunity.units || []).find(
        (u) => String(u.number).trim() === String(newMember.unitNumber).trim()
      );
      if (targetUnit && updateUnit) {
        updateUnit(currentCommunity.id, targetUnit.id, {
          isCommittee: true,
          committeeRole: newMember.role,
          owner: newMember.name || targetUnit.owner,
          rut: newMember.rut || targetUnit.rut,
          phone: newMember.phone || targetUnit.phone,
          email: newMember.email || targetUnit.email
        });
      }
    }

    if (currentCommunity) {
      updateCommunity(currentCommunity.id, { committeeMembers: updatedList });
    }

    setNewMember({
      role: 'Tesorero(a) del Comité',
      name: '',
      rut: '',
      unitNumber: '',
      phone: '',
      email: '',
      hasBankSignature: false
    });
  };

  const handleRemoveCommitteeMember = (id) => {
    const memberToRemove = committeeMembers.find((m) => m.id === id);
    const updatedList = committeeMembers.filter((m) => m.id !== id);
    setCommitteeMembers(updatedList);

    if (currentCommunity) {
      updateCommunity(currentCommunity.id, { committeeMembers: updatedList });
      if (memberToRemove?.unitNumber && updateUnit) {
        const targetUnit = (currentCommunity.units || []).find(
          (u) => String(u.number).trim() === String(memberToRemove.unitNumber).trim()
        );
        if (targetUnit) {
          updateUnit(currentCommunity.id, targetUnit.id, {
            isCommittee: false,
            committeeRole: ''
          });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* CABECERA DEL MÓDULO DE AJUSTES DE LA COMUNIDAD & ASPECTOS LEGALES */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0F3D2E]/10 text-[#0F3D2E] border border-[#0F3D2E]/20">
                Configuración Exclusiva del Condominio
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Ley N° 21.442 • Art. 17° & Art. 20°
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              Ajustes de {currentCommunity?.name || 'la Comunidad'} & Aspectos Legales de la App
            </h2>
            <p className="text-xs text-slate-500">
              Administra aquí el RUT del condominio, dirección, años de antigüedad, cuenta bancaria, integrantes del Comité de Administración y la información legal de la plataforma.
            </p>
          </div>
        </div>

        {/* Botón rápido para ir al Panel Central de Empresa Administradora */}
        {onOpenCompanyHub && (
          <button
            type="button"
            onClick={onOpenCompanyHub}
            className="px-4 py-2.5 rounded-2xl bg-[#F5F4EF] hover:bg-[#D4B895]/30 text-[#0F3D2E] border border-[#D4B895] font-black text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#0F3D2E]" />
            <span>Ir a Panel Mi Empresa Administradora</span>
          </button>
        )}
      </div>

      {/* BARRA DE LAS 2 PESTAÑAS INTERNAS DE LA COMUNIDAD */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('condominio')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'condominio'
                ? 'bg-[#0F3D2E] text-[#D4B895] shadow-sm'
                : 'text-slate-600 hover:text-[#0F3D2E] hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Ficha, Habilitación & Comité del Condominio</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('sobre_app')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'sobre_app'
                ? 'bg-[#0F3D2E] text-[#D4B895] shadow-sm'
                : 'text-slate-600 hover:text-[#0F3D2E] hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Sobre la Aplicación & Aspectos Legales</span>
          </button>
        </div>

        {currentTab === 'condominio' && (
          <button
            type="button"
            onClick={handleSaveCommunitySettings}
            className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 text-[#D4B895]" />
            <span>Guardar Ajustes del Condominio</span>
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>✅ Los datos oficiales del condominio, cuenta bancaria, equipamiento e integrantes del Comité se han guardado correctamente.</span>
        </div>
      )}

      {/* ==================== PESTAÑA 1: FICHA, HABILITACIÓN Y COMITÉ DEL CONDOMINIO ==================== */}
      {currentTab === 'condominio' && (
        <form onSubmit={handleSaveCommunitySettings} className="space-y-6">
          {/* BLOQUE A: IDENTIFICACIÓN LEGAL, ANTIGÜEDAD Y UBICACIÓN DEL CONDOMINIO */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0F3D2E]/10 text-[#0F3D2E] flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Identificación Legal, Antigüedad & Habilitación de la Comunidad
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Datos oficiales que se estampan en colillas de gasto común, actas de asamblea, certificados y balances.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Comunidad Activa
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre Oficial del Condominio / Comunidad *
                </label>
                <input
                  type="text"
                  required
                  value={commForm.name}
                  onChange={(e) => setCommForm({ ...commForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  RUT de la Comunidad (SII) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 65.120.450-K"
                  value={commForm.communityRut}
                  onChange={(e) => setCommForm({ ...commForm, communityRut: e.target.value, bankRut: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tipo de Copropiedad *
                </label>
                <select
                  value={commForm.type}
                  onChange={(e) => setCommForm({ ...commForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                >
                  <option value="Casas">Condominio de Casas</option>
                  <option value="Edificio">Edificio de Departamentos</option>
                  <option value="Mixto">Condominio Mixto (Torres + Casas)</option>
                  <option value="Locales Comerciales">Centro Comercial / Oficinas</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Años de Antigüedad de la Edificación *
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={commForm.buildingAgeYears}
                  onChange={(e) => {
                    const age = Number(e.target.value) || 0;
                    setCommForm({
                      ...commForm,
                      buildingAgeYears: age,
                      constructionYear: new Date().getFullYear() - age
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Año Recepción Final Municipal (DOM)
                </label>
                <input
                  type="number"
                  min={1950}
                  max={2030}
                  value={commForm.constructionYear}
                  onChange={(e) => {
                    const yr = Number(e.target.value) || new Date().getFullYear();
                    setCommForm({
                      ...commForm,
                      constructionYear: yr,
                      buildingAgeYears: Math.max(0, new Date().getFullYear() - yr)
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Dirección Exacta del Condominio *
                </label>
                <input
                  type="text"
                  required
                  value={commForm.address}
                  onChange={(e) => setCommForm({ ...commForm, address: e.target.value })}
                  placeholder="Ej: Camino San Ramón 4500"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Comuna / Ciudad / Región *
                </label>
                <input
                  type="text"
                  required
                  value={commForm.city}
                  onChange={(e) => setCommForm({ ...commForm, city: e.target.value })}
                  placeholder="Ej: La Serena / Coquimbo"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Cantidad Total de Unidades
                </label>
                <input
                  type="number"
                  min={1}
                  value={commForm.totalUnits}
                  onChange={(e) => setCommForm({ ...commForm, totalUnits: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Correo Oficial de la Comunidad
                </label>
                <input
                  type="email"
                  value={commForm.email}
                  onChange={(e) => setCommForm({ ...commForm, email: e.target.value, bankEmail: e.target.value })}
                  placeholder="comunidad@aranpro.cl"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Honorario Administración Pactado (CLP/Mes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={commForm.monthlyAdminFeeCLP}
                  onChange={(e) => setCommForm({ ...commForm, monthlyAdminFeeCLP: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-300 rounded-xl text-xs font-mono font-black text-[#0F3D2E] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Folio Reglamento Copropiedad (CBR)
                </label>
                <input
                  type="text"
                  value={commForm.internalRegulationFolio}
                  onChange={(e) => setCommForm({ ...commForm, internalRegulationFolio: e.target.value })}
                  placeholder="Ej: Fojas 4120 N° 2190 CBR"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Compañía Seguro Colectivo Incendio (Art. 43°)
                </label>
                <input
                  type="text"
                  value={commForm.insuranceCompany}
                  onChange={(e) => setCommForm({ ...commForm, insuranceCompany: e.target.value })}
                  placeholder="Ej: BCI Seguros / Mapfre"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  N° Póliza & Vencimiento Seguro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={commForm.insurancePolicyNumber}
                    onChange={(e) => setCommForm({ ...commForm, insurancePolicyNumber: e.target.value })}
                    placeholder="N° Póliza"
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                  />
                  <input
                    type="date"
                    value={commForm.insuranceExpiryDate}
                    onChange={(e) => setCommForm({ ...commForm, insuranceExpiryDate: e.target.value })}
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE B: CUENTA BANCARIA EXCLUSIVA DE LA COMUNIDAD & PARÁMETROS CONTABLES */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0F3D2E]/10 text-[#0F3D2E] flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Cuenta Bancaria de la Comunidad & Fondo de Reserva (Art. 23° y 39° Ley N° 21.442)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Estos datos bancarios se imprimen automáticamente en todas las colillas de cobro y cartas de recaudación.
                  </p>
                </div>
              </div>
              <Landmark className="w-5 h-5 text-[#0F3D2E]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Banco de la Comunidad
                </label>
                <select
                  value={commForm.bank}
                  onChange={(e) => setCommForm({ ...commForm, bank: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="Banco Estado">Banco Estado</option>
                  <option value="Banco de Chile">Banco de Chile</option>
                  <option value="Banco Santander">Banco Santander</option>
                  <option value="Banco BCI">Banco BCI</option>
                  <option value="Banco Scotiabank">Banco Scotiabank</option>
                  <option value="Banco Itaú">Banco Itaú</option>
                  <option value="Banco BICE">Banco BICE</option>
                  <option value="Banco Falabella">Banco Falabella</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={commForm.accountType}
                  onChange={(e) => setCommForm({ ...commForm, accountType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                  <option value="Cuenta Vista / Chequera Electrónica">Cuenta Vista / Chequera Electrónica</option>
                  <option value="Cuenta de Ahorro Fondo Reserva">Cuenta de Ahorro Fondo Reserva</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Número de Cuenta Bancaria
                </label>
                <input
                  type="text"
                  value={commForm.accountNumber}
                  onChange={(e) => setCommForm({ ...commForm, accountNumber: e.target.value })}
                  placeholder="Ej: 125-0009843-1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Titular de la Cuenta Bancaria
                </label>
                <input
                  type="text"
                  value={commForm.holderName}
                  onChange={(e) => setCommForm({ ...commForm, holderName: e.target.value })}
                  placeholder={commForm.name}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  % Recargo Fondo de Reserva Legal
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step="0.5"
                  value={commForm.reserveFundPercentage}
                  onChange={(e) => setCommForm({ ...commForm, reserveFundPercentage: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Saldo Inicial en Cuenta Bancaria (CLP)
                </label>
                <input
                  type="number"
                  value={commForm.initialBankBalance}
                  onChange={(e) => setCommForm({ ...commForm, initialBankBalance: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE C: INTEGRANTES DEL COMITÉ DE ADMINISTRACIÓN (ART. 17° LEY 21.442) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0F3D2E]/10 text-[#0F3D2E] flex items-center justify-center font-black text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Integrantes del Comité de Administración ({committeeMembers.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Registra al Presidente(a), Tesorero(a) y Secretario(a) para actas oficiales, visado de egresos y firmas bancarias.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895]">
                Art. 17° Ley N° 21.442
              </span>
            </div>

            {/* Listado actual de miembros del comité */}
            {committeeMembers.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                Aún no se han registrado integrantes del Comité en esta ficha. Agrégalos en el formulario inferior.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {committeeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl bg-[#F5F4EF]/60 border border-[#D4B895]/70 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#0F3D2E] text-[#D4B895] text-[10px] font-black uppercase">
                          {member.role}
                        </span>
                        {member.unitNumber && (
                          <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Unidad {member.unitNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-sm text-slate-900 pt-1">{member.name}</h4>
                      <p className="text-[11px] font-mono text-slate-600">RUT: {member.rut || 'Por informar'}</p>
                      {member.phone && <p className="text-[11px] text-slate-600">Fono: {member.phone}</p>}
                      {member.email && <p className="text-[11px] text-slate-500 truncate">{member.email}</p>}
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                      <span className={`font-bold ${member.hasBankSignature ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {member.hasBankSignature ? '✓ Firma Bancaria Activa' : 'Vocal / Fiscalizador'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCommitteeMember(member.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-formulario para agregar integrante del comité */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0F3D2E] block">
                + Agregar Integrante al Comité de Administración
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="Presidente(a) del Comité">Presidente(a) del Comité</option>
                  <option value="Tesorero(a) del Comité">Tesorero(a) del Comité</option>
                  <option value="Secretario(a) del Comité">Secretario(a) del Comité</option>
                  <option value="Director(a) Suplente">Director(a) Suplente</option>
                </select>
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 md:col-span-2"
                />
                <input
                  type="text"
                  placeholder="RUT (ej: 14.222.333-4)"
                  value={newMember.rut}
                  onChange={(e) => setNewMember({ ...newMember, rut: e.target.value })}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                />
                <input
                  type="text"
                  placeholder="N° Casa / Depto"
                  value={newMember.unitNumber}
                  onChange={(e) => setNewMember({ ...newMember, unitNumber: e.target.value })}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Teléfono / WhatsApp"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMember.hasBankSignature}
                    onChange={(e) => setNewMember({ ...newMember, hasBankSignature: e.target.checked })}
                    className="rounded text-[#0F3D2E]"
                  />
                  <span>Habilitado como apoderado titular de firma bancaria de la comunidad</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddCommitteeMember}
                  className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Incorporar al Comité</span>
                </button>
              </div>
            </div>
          </div>

          {/* BLOQUE D: EQUIPAMIENTO CRÍTICO & DOTACIÓN DEL CONDOMINIO */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0F3D2E]/10 text-[#0F3D2E] flex items-center justify-center font-black text-xs">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Catastro de Equipamiento Crítico & Personal Propio del Condominio
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define la infraestructura instalada para el plan de mantenimiento preventivo y cálculo técnico de complejidad.
                  </p>
                </div>
              </div>
              <Wrench className="w-5 h-5 text-[#0F3D2E]" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  N° de Ascensores
                </label>
                <input
                  type="number"
                  min={0}
                  value={commForm.elevatorsCount}
                  onChange={(e) => setCommForm({ ...commForm, elevatorsCount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Salas de Bombas Agua
                </label>
                <input
                  type="number"
                  min={0}
                  value={commForm.pumpRoomsCount}
                  onChange={(e) => setCommForm({ ...commForm, pumpRoomsCount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Centrales de Calderas
                </label>
                <input
                  type="number"
                  min={0}
                  value={commForm.boilersCount}
                  onChange={(e) => setCommForm({ ...commForm, boilersCount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Conserjes / Personal Directo
                </label>
                <input
                  type="number"
                  min={0}
                  value={commForm.directStaffCount}
                  onChange={(e) => setCommForm({ ...commForm, directStaffCount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { key: 'hasGenerator', label: '⚡ Grupo Electrógeno' },
                { key: 'hasPool', label: '🏊 Piscina Comunitaria' },
                { key: 'hasClubhouse', label: '🏡 Sala Multiuso / Quincho' },
                { key: 'hasPerimeterCctv', label: '📹 CCTV / Cerco Eléctrico' }
              ].map((item) => (
                <label
                  key={item.key}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    commForm[item.key]
                      ? 'bg-[#0F3D2E]/10 border-[#0F3D2E] text-[#0F3D2E]'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(commForm[item.key])}
                    onChange={(e) => setCommForm({ ...commForm, [item.key]: e.target.checked })}
                    className="rounded text-[#0F3D2E]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#D4B895]" />
                <span>Guardar Todos los Datos del Condominio</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ==================== PESTAÑA 2: SOBRE LA APLICACIÓN & ASPECTOS LEGALES ==================== */}
      {currentTab === 'sobre_app' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F3D2E] bg-[#D4B895]/30 px-2.5 py-0.5 rounded-full">
                Información Institucional & Marco Jurídico
              </span>
              <h3 className="text-lg font-black text-slate-900">
                ARANPRO • Suite de Administración & Copropiedad
              </h3>
              <p className="text-xs font-bold text-slate-700">
                Versión 2.0.0 · Edición PWA Multi-Comunidad • Cumplimiento Ley N° 21.442 y Ley N° 19.628
              </p>
            </div>
            <div className="text-xs text-slate-600 space-y-1 sm:text-right">
              <p><strong>Titular de derechos:</strong> ARANPRO Gestión Integral</p>
              <p><strong>Registro Minvu:</strong> RNAC N° 48.912</p>
              <p>
                <strong>Sitio web oficial:</strong>{' '}
                <a href="https://aranpro.cl" target="_blank" rel="noopener noreferrer" className="text-[#0F3D2E] font-bold hover:underline">
                  https://aranpro.cl
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* 1. Información General */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleAboutSection('general')}
                className="w-full px-5 py-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>1. Información General de la Plataforma</span>
                {aboutOpenSections.general ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {aboutOpenSections.general && (
                <div className="px-5 py-4 text-xs text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                  <p>
                    <strong>ARANPRO Suite</strong> es una plataforma integral diseñada para la gestión transparente de condominios y comunidades habitacionales bajo el marco normativo de la <strong>Ley N° 21.442 de Copropiedad Inmobiliaria de la República de Chile</strong>.
                  </p>
                  <p>
                    Su motor contable y documental permite el prorrateo exacto de gastos comunes, control del Fondo de Reserva Legal (Art. 39°), publicación digital de facturas y comprobantes bancarios, registro de mantenimiento preventivo (DS N° 7), asambleas telemáticas con quórum certificado (Art. 15°) y emisión de certificados oficiales foliados.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Cumplimiento Normativo Ley N° 21.442 */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleAboutSection('ley21442')}
                className="w-full px-5 py-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>2. Cumplimiento Estricto de la Ley N° 21.442 de Copropiedad Inmobiliaria</span>
                {aboutOpenSections.ley21442 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {aboutOpenSections.ley21442 && (
                <div className="px-5 py-4 text-xs text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Art. 6° y 23° (Rendición Mensual y Cuenta Bancaria Exclusiva):</strong> Todo ingreso y egreso se respalda con documento tributario y referencia de transferencia bancaria en la cuenta exclusiva de la comunidad.</li>
                    <li><strong>Art. 15° (Participación y Consulta por Escrito / Voto Digital):</strong> Trazabilidad individual por unidad y ponderación por alícuota de dominio común.</li>
                    <li><strong>Art. 17° y 20° (Comité de Administración y Libro Oficial de Reclamos):</strong> Registro foliado de actas, compromisos y reclamos vecinales.</li>
                    <li><strong>Art. 36° (Certificados de Deuda y Morosidad):</strong> Emisión de certificados con fe de administración para trámites notariales y compraventas.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 3. Protección de Datos Personales (Ley N° 19.628) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleAboutSection('privacidad')}
                className="w-full px-5 py-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>3. Política de Privacidad y Protección de Datos Personales (Ley N° 19.628)</span>
                {aboutOpenSections.privacidad ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {aboutOpenSections.privacidad && (
                <div className="px-5 py-4 text-xs text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                  <p>
                    En conformidad con la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong>, los datos personales de los copropietarios, arrendatarios y residentes (nombre, RUT, correo electrónico, teléfono y estado de cuenta individual) son utilizados única y exclusivamente para los fines propios de la administración del condominio, emisión de estados de cobro, citaciones a asamblea y comunicaciones oficiales.
                  </p>
                  <p>
                    Queda estrictamente prohibida la cesión, comercialización o divulgación de las nóminas de residentes a terceros ajenos a la comunidad.
                  </p>
                </div>
              )}
            </div>

            {/* 4. Términos de Uso y Propiedad Intelectual */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleAboutSection('terminos')}
                className="w-full px-5 py-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>4. Términos de Uso, Respaldo Técnico & Licencia de Software</span>
                {aboutOpenSections.terminos ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {aboutOpenSections.terminos && (
                <div className="px-5 py-4 text-xs text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                  <p>
                    Software desarrollado a medida para <strong>ARANPRO Gestión Integral</strong> por <strong>Red-Enlace Soluciones Digitales</strong>. Todos los cálculos contables, colillas de gasto común y reportes financieros se encuentran disponibles para revisión permanente del Comité de Administración.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySettingsAndLegalTab;
