import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { CompanySettingsAndBackupModule } from './CompanySettingsAndBackupModule';
import { PwaInstallButton } from '../layout/PwaPrompt';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector, useAranproPdfStyle } from '../common/MauranLogo';
import { formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import {
  Building2, Briefcase, Users, Award, ShieldCheck, ArrowRight, Plus,
  TrendingUp, Target, GraduationCap, Handshake, Wrench, FileText,
  CheckCircle2, Phone, Mail, ExternalLink, LogOut, Sparkles, Printer,
  Trash2, Check, Key, PenTool, HardHat, Scale, Landmark, DollarSign,
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, Globe, Shield, Database, Calculator,
  FolderOpen, Eye, ClipboardCheck, Presentation, QrCode, Send
} from 'lucide-react';

const DEFAULT_OFFICE_WORKERS = [
  {
    id: 'ow-1',
    name: 'Camila Andrea Soto Valenzuela',
    rut: '18.452.910-3',
    role: 'Asistente de Administración & Atención Vecinos',
    contractType: 'Contrato Indefinido',
    startDate: '2025-03-01',
    grossSalary: 680000,
    afpName: 'AFP Habitat (11.27%)',
    afpRate: 11.27,
    healthSystem: 'Fonasa (7.0%)',
    healthRate: 7.0,
    afcEmployerRate: 2.4,
    mutualRate: 0.93,
    previredStatus: 'AL DÍA',
    assignedCommunities: 'Todas las comunidades'
  },
  {
    id: 'ow-2',
    name: 'Roberto Ignacio Morales Tapia',
    rut: '15.890.231-K',
    role: 'Inspector Técnico de Terreno (Bombas & Mantención)',
    contractType: 'Boleta de Honorarios',
    startDate: '2025-06-15',
    grossSalary: 350000,
    afpName: 'Retención SII (13.75%)',
    afpRate: 13.75,
    healthSystem: 'Independiente',
    healthRate: 0,
    afcEmployerRate: 0,
    mutualRate: 0,
    previredStatus: 'AL DÍA',
    assignedCommunities: 'Visitas técnicas semanales'
  }
];

const DEFAULT_PARTNER_ALLIANCES = [
  {
    id: 'al-1',
    category: 'Gremio & Estándar Tarifario',
    name: 'AGACECH • Asociación Gremial de Administradores de Condominios de Chile',
    contact: 'Mesa Técnica & Matriz Oficial de Honorarios',
    phone: '+56 2 2345 6789',
    website: 'https://agacech.cl',
    benefit: 'Acceso a matriz de honorarios en UF, defensa gremial, seminarios de actualización Ley N° 21.442 y red nacional.',
    status: 'Acreditado'
  },
  {
    id: 'al-2',
    category: 'Colegio Profesional',
    name: 'CGAI Chile • Colegio de Gestión y Administración Inmobiliaria (Socio N° 13-563)',
    contact: 'Comisión Legal & Capacitación Continua',
    phone: '+56 2 2633 4400',
    website: 'https://cgai.cl',
    benefit: 'Respaldo institucional colegiado, biblioteca de contratos tipo, circulares normativas y comité de ética.',
    status: 'Socio Activo'
  },
  {
    id: 'al-3',
    category: 'Asesoría Jurídica & Cobranza',
    name: 'Estudio Jurídico Copropiedad & Cobranza Judicial Ley N° 21.442',
    contact: 'Abogados Especialistas en Juicios Ejecutivos de Gastos Comunes',
    phone: '+56 9 5811 8504',
    website: 'https://aranpro.cl',
    benefit: 'Convenio para cobro judicial de morosidad crítica (Art. 36°) y actualización de Reglamentos de Copropiedad en el CBR.',
    status: 'Alianza Activa'
  },
  {
    id: 'al-4',
    category: 'Capacitación & Certificación OTEC',
    name: 'Centro de Capacitación Técnica & Certificación OS-10 / Calderas',
    contact: 'Coordinación de Cursos con Franquicia SENCE',
    phone: '+56 9 5811 8504',
    website: 'https://sence.gob.cl',
    benefit: 'Capacitación para conserjes (OS-10, primeros auxilios, uso de extintores) y formación continua del administrador.',
    status: 'Convenio Disponible'
  }
];

const DEFAULT_TRUSTED_PROVIDERS = [
  {
    id: 'tp-1',
    specialty: 'Seguridad Privada & Conserjería OS-10',
    companyName: 'Seguridad Integral Norte SpA',
    rut: '76.412.890-1',
    contactPerson: 'Marcelo Vega (Jefe de Operaciones)',
    phone: '+56984123456',
    email: 'operaciones@seguridadnorte.cl',
    rating: '5.0 ★',
    notes: 'Guardias y conserjes con curso OS-10 al día, reemplazos inmediatos en menos de 2 horas.'
  },
  {
    id: 'tp-2',
    specialty: 'Salas de Bombas & Hidroneumáticos',
    companyName: 'Hidráulica & Bombas Coquimbo Ltda.',
    rut: '77.109.432-8',
    contactPerson: 'Patricio Rojas (Ingeniero Hidráulico)',
    phone: '+56976543210',
    email: 'contacto@hidraulicacoquimbo.cl',
    rating: '5.0 ★',
    notes: 'Atención de emergencias 24/7, mantención preventiva mensual de tableros de alternancia y sellos mecánicos.'
  },
  {
    id: 'tp-3',
    specialty: 'Ascensores & Certificación MINVU',
    companyName: 'Vertical Lift Certificaciones SpA',
    rut: '76.889.120-K',
    contactPerson: 'Andrés Fuentes (Certificador Inscrito MINVU)',
    phone: '+56965439876',
    email: 'servicio@verticallift.cl',
    rating: '4.9 ★',
    notes: 'Precios preferentes para comunidades administradas por ARANPRO sin contratos abusivos de amarre.'
  }
];

export const CompanyEnterpriseHub = ({
  onBackToWeb,
  onSelectCommunityToManage,
  onSelectResidentPreview,
  onLogout
}) => {
  const { communities, addCommunity, companySettings, setCompanySettings } = useCommunity();
  const [pdfStyle, setPdfStyle] = useAranproPdfStyle();

  // Navegación modular limpia sin duplicados:
  // 'comunidades' | 'postulaciones' | 'rrhh_oficina' | 'firma' | 'empresa' | 'alianzas' | 'respaldos'
  const [activeHubTab, setActiveHubTab] = useState('comunidades');
  const [empresaSubSection, setEmpresaSubSection] = useState('empresa'); // 'empresa' | 'acreditacion'
  const [postulacionSection, setPostulacionSection] = useState('flujo'); // 'flujo' | 'antecedentes' | 'material' | 'pipeline' | 'herramientas'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toolboxExpanded, setToolboxExpanded] = useState(true);

  // Meta referencial
  const ufValue = Number(companySettings?.ufReferenceValue) || 38650;
  const monthlyGoalUF = Number(companySettings?.monthlyFeeGoalUF) || 60;

  // Estado de trabajadores propios de la oficina administradora
  const [officeWorkers, setOfficeWorkers] = useState(() => {
    try {
      const saved = localStorage.getItem('aranpro_office_workers');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_OFFICE_WORKERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('aranpro_office_workers', JSON.stringify(officeWorkers));
    } catch {
      // ignore
    }
  }, [officeWorkers]);

  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    rut: '',
    role: 'Asistente de Administración',
    contractType: 'Contrato Indefinido',
    startDate: new Date().toISOString().split('T')[0],
    grossSalary: 650000,
    afpName: 'AFP Modelo (10.58%)',
    afpRate: 10.58,
    healthSystem: 'Fonasa (7.0%)',
    healthRate: 7.0,
    afcEmployerRate: 2.4,
    mutualRate: 0.93,
    previredStatus: 'AL DÍA',
    assignedCommunities: 'Todas las comunidades'
  });

  // Estado de Proveedores Preferentes del Administrador
  const [trustedProviders, setTrustedProviders] = useState(() => {
    try {
      const saved = localStorage.getItem('aranpro_trusted_providers');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_TRUSTED_PROVIDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('aranpro_trusted_providers', JSON.stringify(trustedProviders));
    } catch {
      // ignore
    }
  }, [trustedProviders]);

  const [newProviderForm, setNewProviderForm] = useState({
    specialty: 'Seguridad Privada & Conserjería',
    companyName: '',
    rut: '',
    contactPerson: '',
    phone: '',
    email: '',
    rating: '5.0 ★',
    notes: ''
  });

  // Modal para dar de alta una nueva comunidad
  const [showNewCommunityModal, setShowNewCommunityModal] = useState(false);
  const [newCommData, setNewCommData] = useState({
    name: '',
    communityRut: '',
    type: 'Casas',
    address: '',
    city: 'La Serena / Coquimbo',
    totalUnits: 24,
    reserveFundPercentage: 5
  });

  // Cálculos ejecutivos de cartera
  const totalCommunities = communities.length;
  const totalManagedUnits = communities.reduce((acc, c) => acc + (Number(c.totalUnits) || c.units?.length || 0), 0);
  const currentMonthlyFeeCLP = communities.reduce((acc, c) => {
    if (c.monthlyAdminFeeCLP && Number(c.monthlyAdminFeeCLP) > 0) {
      return acc + Number(c.monthlyAdminFeeCLP);
    }
    const units = Number(c.totalUnits) || c.units?.length || 15;
    return acc + Math.max(550000, units * 12500);
  }, 0);
  const currentMonthlyFeeUF = +(currentMonthlyFeeCLP / ufValue).toFixed(1);

  // Métricas de RR.HH. Oficina
  const officePayrollMetrics = officeWorkers.reduce(
    (acc, w) => {
      const gross = Number(w.grossSalary) || 0;
      if (w.contractType === 'Boleta de Honorarios') {
        const retention = Math.round(gross * ((Number(w.afpRate) || 13.75) / 100));
        const net = gross - retention;
        acc.totalGross += gross;
        acc.totalPreviredAndTax += retention;
        acc.totalNet += net;
        acc.totalEmployerCost += gross;
      } else {
        const afp = Math.round(gross * ((Number(w.afpRate) || 11) / 100));
        const health = Math.round(gross * ((Number(w.healthRate) || 7) / 100));
        const afcWorker = Math.round(gross * 0.006);
        const employerCosts = Math.round(gross * (((Number(w.afcEmployerRate) || 2.4) + (Number(w.mutualRate) || 0.93) + 1.49) / 100));
        const totalImposiciones = afp + health + afcWorker + employerCosts;
        const net = gross - afp - health - afcWorker;
        acc.totalGross += gross;
        acc.totalPreviredAndTax += totalImposiciones;
        acc.totalNet += net;
        acc.totalEmployerCost += gross + employerCosts;
      }
      return acc;
    },
    { totalGross: 0, totalPreviredAndTax: 0, totalNet: 0, totalEmployerCost: 0 }
  );

  const handleCreateWorker = (e) => {
    e.preventDefault();
    if (!workerForm.name.trim()) return;
    setOfficeWorkers((prev) => [
      ...prev,
      {
        id: `ow-${Date.now()}`,
        ...workerForm,
        grossSalary: Number(workerForm.grossSalary) || 0
      }
    ]);
    setShowAddWorkerModal(false);
    setWorkerForm({
      name: '',
      rut: '',
      role: 'Asistente de Administración',
      contractType: 'Contrato Indefinido',
      startDate: new Date().toISOString().split('T')[0],
      grossSalary: 650000,
      afpName: 'AFP Modelo (10.58%)',
      afpRate: 10.58,
      healthSystem: 'Fonasa (7.0%)',
      healthRate: 7.0,
      afcEmployerRate: 2.4,
      mutualRate: 0.93,
      previredStatus: 'AL DÍA',
      assignedCommunities: 'Todas las comunidades'
    });
  };

  const handleCreateNewCommunity = (e) => {
    e.preventDefault();
    if (!newCommData.name.trim()) return;
    const created = addCommunity({
      name: newCommData.name,
      type: newCommData.type,
      address: newCommData.address,
      city: newCommData.city,
      totalUnits: Number(newCommData.totalUnits) || 16,
      reserveFundPercentage: Number(newCommData.reserveFundPercentage) || 5,
      bankInfo: {
        bank: 'Banco Estado',
        accountType: 'Cuenta Corriente',
        accountNumber: '',
        holderName: newCommData.name,
        rut: newCommData.communityRut,
        email: ''
      }
    });
    setShowNewCommunityModal(false);
    if (created && onSelectCommunityToManage) {
      onSelectCommunityToManage(created.id);
    }
  };

  const handleAddTrustedProvider = (e) => {
    e.preventDefault();
    if (!newProviderForm.companyName.trim()) return;
    setTrustedProviders((prev) => [
      ...prev,
      { id: `tp-${Date.now()}`, ...newProviderForm }
    ]);
    setNewProviderForm({
      specialty: 'Seguridad Privada & Conserjería',
      companyName: '',
      rut: '',
      contactPerson: '',
      phone: '',
      email: '',
      rating: '5.0 ★',
      notes: ''
    });
  };

  // Módulos ordenados según el flujo de trabajo guiado para el Administrador
  const hubNavTabs = [
    {
      id: 'comunidades',
      label: '1. Mis Comunidades',
      shortLabel: 'Mis Comunidades',
      icon: Building2,
      badge: `${totalCommunities}`
    },
    {
      id: 'empresa',
      label: '2. Datos Empresa, Firma & MINVU',
      shortLabel: 'Datos Empresa',
      icon: ShieldCheck,
      badge: 'MINVU'
    },
    {
      id: 'postulaciones',
      label: '3. Postulaciones & CRM',
      shortLabel: 'Postulaciones',
      icon: Target,
      badge: 'Licitaciones'
    },
    {
      id: 'rrhh_oficina',
      label: '4. Mi Oficina (RR.HH.)',
      shortLabel: 'Mi Oficina',
      icon: Users,
      badge: `${officeWorkers.length}`
    },
    {
      id: 'alianzas',
      label: '5. Convenios & Proveedores',
      shortLabel: 'Proveedores',
      icon: Handshake,
      badge: `${trustedProviders.length}`
    },
    {
      id: 'respaldos',
      label: '6. Respaldos & Seguridad',
      shortLabel: 'Respaldos',
      icon: Database,
      badge: 'Backup'
    }
  ];

  const TOOLBOX_ITEMS = [
    { id: 'calculadora', label: 'Calculadora AGACECH', icon: Calculator },
    { id: 'inspeccion', label: 'Pauta Inspección Inicial', icon: HardHat },
    { id: 'comparativa', label: 'Cuadro Comparativo', icon: Scale },
    { id: 'demo', label: 'Demo en Vivo & QR', icon: QrCode },
    { id: 'pitch', label: 'Libreto Pitch (10 Min)', icon: Presentation },
    { id: 'preparacion', label: 'Checklist & Semáforo', icon: ClipboardCheck },
  ];

  // Submenús organizados jerárquicamente para Postulaciones & CRM
  const POSTULACION_SUB_ITEMS = [
    { id: 'flujo', label: '1. Guía Paso a Paso (Embudo)', icon: Send },
    { id: 'material', label: '2. Documentos & Cartas PDF', icon: FileText },
    { id: 'pipeline', label: '3. CRM de Postulaciones', icon: Briefcase },
    {
      id: 'herramientas',
      label: '4. Caja de Herramientas',
      icon: Calculator,
      isGroup: true,
      subItems: TOOLBOX_ITEMS
    }
  ];

  const EMPRESA_SUB_ITEMS = [
    { id: 'empresa', label: '1. Datos de Empresa & Rep. Legal', icon: Building2 },
    { id: 'firma', label: '2. Firma Manuscrita & Timbre Oficial', icon: PenTool },
    { id: 'acreditacion', label: '3. Títulos, Diplomas & RNAC Minvu', icon: ShieldCheck },
  ];

  const activeHubTabObj = hubNavTabs.find((t) => t.id === activeHubTab) || hubNavTabs[0];

  // Barra lateral izquierda del Panel Empresa (colores invertidos: Dorado Ejecutivo + Verde Bosque)
  const renderEnterpriseSidebar = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#0F3D2E] text-white border-r border-[#D4B895]/35 shadow-xl">
      {/* 1. Cabecera Ejecutiva en Dorado (#D4B895) */}
      <div className="bg-gradient-to-br from-[#D4B895] via-[#dfc7a7] to-[#c7a67b] text-[#0F3D2E] p-3.5 border-b border-[#0F3D2E]/20 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0 shadow-xs">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-[9px] font-black tracking-wider uppercase text-[#0F3D2E]/80 block leading-none">
                  Backoffice Administrador
                </span>
                <h1 className="text-xs font-black text-[#0F3D2E] truncate mt-0.5">
                  Panel Mi Empresa
                </h1>
              </div>
            </div>
          )}

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 text-[#0F3D2E]/80 hover:text-[#0F3D2E] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-[#0F3D2E] hover:bg-[#0F3D2E]/10 rounded-lg transition-colors mx-auto sm:mx-0 cursor-pointer"
              title={sidebarCollapsed ? 'Expandir panel de empresa' : 'Contraer panel de empresa'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {(!sidebarCollapsed || isMobile) && (
          <div className="space-y-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (isMobile) setMobileSidebarOpen(false);
                setShowNewCommunityModal(true);
              }}
              className="w-full py-2 px-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Habilitar Nueva Comunidad</span>
            </button>

            {/* Selector rápido para entrar a una comunidad */}
            <select
              value=""
              onChange={(e) => {
                const commId = e.target.value;
                if (commId) {
                  if (isMobile) setMobileSidebarOpen(false);
                  onSelectCommunityToManage(commId);
                }
              }}
              className="w-full bg-[#0F3D2E]/90 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-[#0F3D2E] cursor-pointer"
            >
              <option value="">🏢 Entrar directo a comunidad...</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.totalUnits} {c.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Menú Vertical de Módulos (7 Módulos limpios, sin sub-menús repetitivos) */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1.5">
        {(!sidebarCollapsed || isMobile) && (
          <span className="px-2 text-[9px] font-black uppercase tracking-widest text-[#D4B895]/80 block mb-1">
            Módulos de Empresa
          </span>
        )}

        {hubNavTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeHubTab === tab.id;
          return (
            <div key={tab.id} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveHubTab(tab.id);
                  if (tab.id === 'empresa' && !empresaSubSection) {
                    setEmpresaSubSection('empresa');
                  }
                  if (tab.id === 'postulaciones' && !postulacionSection) {
                    setPostulacionSection('flujo');
                  }
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                title={sidebarCollapsed && !isMobile ? tab.label : undefined}
                className={`w-full flex items-center ${
                  sidebarCollapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                } rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#D4B895] text-[#0F3D2E] font-black shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-[#D4B895]'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <IconComponent
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#0F3D2E]' : 'text-[#D4B895]'
                    }`}
                  />
                  {(!sidebarCollapsed || isMobile) && (
                    <span className="truncate">{tab.label}</span>
                  )}
                </div>

                {(!sidebarCollapsed || isMobile) && tab.badge && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                      isActive
                        ? 'bg-[#0F3D2E] text-[#D4B895]'
                        : 'bg-[#0A291F] text-[#D4B895] border border-[#D4B895]/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>

              {/* Sub-menú para Postulaciones & CRM (Organizado con Acordeón Anidado para Herramientas) */}
              {isActive && tab.id === 'postulaciones' && (!sidebarCollapsed || isMobile) && (
                <div className="ml-3 pl-2.5 py-1 space-y-0.5 border-l-2 border-[#D4B895]/40 animate-in fade-in duration-150">
                  {POSTULACION_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;

                    // Grupo Anidado (4. Caja de Herramientas)
                    if (sub.isGroup) {
                      const isToolboxChildActive = ['herramientas', 'calculadora', 'inspeccion', 'comparativa', 'demo', 'pitch', 'preparacion'].includes(postulacionSection);
                      const isGroupOpen = toolboxExpanded || isToolboxChildActive;

                      return (
                        <div key={sub.id} className="space-y-0.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isGroupOpen && !isToolboxChildActive) {
                                setToolboxExpanded(false);
                              } else {
                                setToolboxExpanded(true);
                                if (!isToolboxChildActive) {
                                  setPostulacionSection('calculadora');
                                }
                              }
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer ${
                              isToolboxChildActive
                                ? 'bg-[#0A291F] text-[#D4B895] font-black shadow-2xs border border-[#D4B895]/40'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SubIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isToolboxChildActive ? 'text-[#D4B895]' : 'text-[#D4B895]/70'
                                }`}
                              />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 shrink-0 text-[#D4B895] transition-transform duration-200 ${
                                isGroupOpen ? 'rotate-0' : '-rotate-90'
                              }`}
                            />
                          </button>

                          {/* Sub-herramientas anidadas dentro de Caja de Herramientas */}
                          {isGroupOpen && (
                            <div className="ml-2.5 pl-2 py-0.5 space-y-0.5 border-l-2 border-[#D4B895]/25 animate-in fade-in duration-150">
                              {sub.subItems.map((tool) => {
                                const ToolIcon = tool.icon;
                                const isToolActive =
                                  postulacionSection === tool.id ||
                                  (tool.id === 'calculadora' && postulacionSection === 'herramientas');
                                return (
                                  <button
                                    key={tool.id}
                                    type="button"
                                    onClick={() => {
                                      setPostulacionSection(tool.id);
                                      if (isMobile) setMobileSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-[10.5px] font-bold text-left transition-all cursor-pointer ${
                                      isToolActive
                                        ? 'bg-[#D4B895] text-[#0F3D2E] font-black shadow-xs'
                                        : 'text-white/70 hover:text-[#D4B895] hover:bg-white/10'
                                    }`}
                                  >
                                    <ToolIcon
                                      className={`w-3 h-3 shrink-0 ${
                                        isToolActive ? 'text-[#0F3D2E]' : 'text-[#D4B895]/60'
                                      }`}
                                    />
                                    <span className="truncate">{tool.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isSubActive = postulacionSection === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setPostulacionSection(sub.id);
                          if (isMobile) setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-[#0A291F] text-[#D4B895] font-black shadow-2xs border border-[#D4B895]/40'
                            : 'text-white/75 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSubActive ? 'text-[#D4B895]' : 'text-[#D4B895]/70'
                          }`}
                        />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-menú para Datos Empresa & RNAC */}
              {isActive && tab.id === 'empresa' && (!sidebarCollapsed || isMobile) && (
                <div className="ml-3 pl-2.5 py-1 space-y-0.5 border-l-2 border-[#D4B895]/40 animate-in fade-in duration-150">
                  {EMPRESA_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = empresaSubSection === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setEmpresaSubSection(sub.id);
                          if (isMobile) setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-[#0A291F] text-[#D4B895] font-black shadow-2xs border border-[#D4B895]/40'
                            : 'text-white/75 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSubActive ? 'text-[#D4B895]' : 'text-[#D4B895]/70'
                          }`}
                        />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Pie de la Barra Lateral: Cerrar Sesión y Firma Red-Enlace */}
      <div className="p-2.5 bg-[#0A291F] border-t border-[#D4B895]/25 space-y-2">
        {onLogout && (!sidebarCollapsed || isMobile) && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        )}

        {(!sidebarCollapsed || isMobile) && (
          <div className="text-center pt-1">
            <a
              href="https://redenlace.cl/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-white/60 hover:text-[#D4B895] font-medium transition-colors"
            >
              <img
                src="/red-enlace-logo.png"
                alt="Logo Red-Enlace"
                width={12}
                height={12}
                className="h-3 w-auto opacity-70"
              />
              <span>Desarrollado por Red-Enlace</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col lg:flex-row pb-20 lg:pb-0">
      {/* BARRA SUPERIOR COMPACTA PARA CELULAR / TABLET */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#0A291F] text-white px-4 py-2.5 border-b border-[#D4B895]/40 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 bg-[#D4B895] text-[#0F3D2E] rounded-xl flex items-center shrink-0 font-black"
            aria-label="Abrir panel de empresa"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="truncate">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D4B895] block leading-tight truncate">
              Panel Mi Empresa
            </span>
            <span className="text-xs font-black text-white truncate block">
              {activeHubTabObj.shortLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowNewCommunityModal(true)}
            className="px-2.5 py-1.5 bg-[#D4B895] text-[#0F3D2E] text-[11px] font-black rounded-lg flex items-center"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nueva
          </button>
        </div>
      </div>

      {/* DRAWER LATERAL PARA CELULAR */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full z-10 shadow-2xl">
            {renderEnterpriseSidebar(true)}
          </div>
        </div>
      )}

      {/* PANEL LATERAL IZQUIERDO FIJO EN COMPUTADOR (lg+) */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-64 xl:w-72'
        }`}
      >
        <div className="sticky top-0 h-screen">
          {renderEnterpriseSidebar(false)}
        </div>
      </aside>

      {/* COLUMNA DERECHA: BARRA SUPERIOR EJECUTIVA + ÁREA DE CONTENIDO */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* BARRA SUPERIOR EJECUTIVA OSCURA CON ACENTOS DORADOS */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-[#0A291F] text-white border-b border-[#D4B895]/35 px-6 h-16 items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-[#D4B895] text-[#0F3D2E] rounded-lg shrink-0 flex items-center gap-1.5 shadow-2xs">
              <Briefcase className="w-3.5 h-3.5" />
              Panel Mi Empresa
            </span>
            <span className="text-white/30">•</span>
            <span className="text-sm font-black text-white truncate">
              {activeHubTabObj.label}
            </span>
            <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-mono bg-white/10 text-[#D4B895] border border-[#D4B895]/30 rounded-md shrink-0">
              RNAC MINVU N° {companySettings?.rnacNumber || '48.912'}
            </span>
          </div>

          <div
            onClick={onBackToWeb}
            className="cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
            title="Ir al sitio web oficial aranpro.cl"
          >
            <AranproLogo variant="horizontal" size="sm" theme="dark" />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <PwaInstallButton variant="compact" label="Instalar App" />
            {onBackToWeb && (
              <button
                type="button"
                onClick={onBackToWeb}
                className="px-3 py-1.5 text-xs font-bold text-white/85 hover:text-[#D4B895] hover:bg-white/10 rounded-xl transition-colors flex items-center cursor-pointer"
                title="Volver a la página web corporativa aranpro.cl"
              >
                <Globe className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                Web aranpro.cl
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowNewCommunityModal(true)}
              className="px-3.5 py-1.5 bg-[#D4B895] hover:bg-[#c8a982] text-[#0F3D2E] text-xs font-black rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Comunidad</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-white/70 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer"
                title="Cerrar sesión de Administrador"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL POR MÓDULO */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 max-w-7xl w-full mx-auto">
          {/* ==================== MÓDULO 1: MIS COMUNIDADES (ORDENADO Y ENFOCADO EN COMUNIDADES) ==================== */}
          {activeHubTab === 'comunidades' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Barra de Resumen Ejecutivo de Cartera */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Comunidades Activas</span>
                  <strong className="text-xl font-black text-[#0F3D2E] mt-0.5 block">{totalCommunities} Condominios</strong>
                  <span className="text-[11px] text-slate-500">Bajo tu administración</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Unidades Gestionadas</span>
                  <strong className="text-xl font-black text-slate-900 mt-0.5 block">{totalManagedUnits} Viviendas</strong>
                  <span className="text-[11px] text-slate-500">Casas y departamentos</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Honorarios Estimados</span>
                  <strong className="text-xl font-black text-[#0F3D2E] mt-0.5 block">{currentMonthlyFeeUF} UF / mes</strong>
                  <span className="text-[11px] font-mono text-slate-500">{formatCLP(currentMonthlyFeeCLP)}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Estado Operativo</span>
                    <strong className="text-base font-black text-emerald-950 mt-0.5 block">SaaS Multi-Comunidad</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCommunityModal(true)}
                    className="text-[11px] font-black text-[#0F3D2E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Habilitar Nueva</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sección Principal: Tarjetas de las Comunidades */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F3D2E] bg-[#D4B895]/30 px-2.5 py-0.5 rounded-full">
                      Cartera de Condominios
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                      Mis Comunidades en Gestión
                    </h2>
                    <p className="text-xs text-slate-500">
                      Selecciona la comunidad donde deseas trabajar para abrir sus gastos comunes, nómina de pagos, asambleas y comité:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewCommunityModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Habilitar Nueva Comunidad</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {communities.map((c) => {
                    const paidUnits = c.units?.filter((u) => u.paid).length || 0;
                    const totalUnits = c.totalUnits || c.units?.length || 0;
                    return (
                      <div
                        key={c.id}
                        className="group bg-[#FDFBF7] hover:bg-white p-6 rounded-3xl border-2 border-slate-200 hover:border-[#0F3D2E] shadow-xs hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E]/10 group-hover:bg-[#0F3D2E] text-[#0F3D2E] group-hover:text-[#D4B895] flex items-center justify-center transition-all shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {c.type} • {totalUnits} Unidades
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0F3D2E] transition-colors">
                              {c.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {c.address}, {c.city}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
                            <span className="text-slate-600">
                              Período:{' '}
                              <strong className="text-slate-900">
                                {c.activePeriod?.month || '11'}/{c.activePeriod?.year || '2026'}
                              </strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-700 font-bold">
                              {paidUnits} / {totalUnits} al día
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectCommunityToManage(c.id)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>Ingresar a Administrar</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#D4B895]" />
                          </button>
                          {onSelectResidentPreview && (
                            <button
                              type="button"
                              onClick={() => onSelectResidentPreview(c.slug)}
                              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-[#0F3D2E] transition-colors cursor-pointer"
                              title="Ver portal como vecino"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Tarjeta para dar de alta nueva comunidad */}
                  <div
                    onClick={() => setShowNewCommunityModal(true)}
                    className="p-6 rounded-3xl border-2 border-dashed border-[#0F3D2E]/30 hover:border-[#0F3D2E] bg-emerald-50/20 hover:bg-emerald-50/60 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer min-h-[220px]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shadow-xs">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#0F3D2E] uppercase">
                        + Habilitar Nueva Comunidad
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Crea un nuevo condominio en segundos con su RUT, dirección, unidades y comité.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== MÓDULO 2: DATOS EMPRESA, FIRMA & MINVU ==================== */}
          {activeHubTab === 'empresa' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <CompanySettingsAndBackupModule
                currentCommunity={communities[0]}
                activeSubTab={empresaSubSection}
                setActiveSubTab={setEmpresaSubSection}
                hideHeader={true}
                hideNavBar={true}
                onNavigateToModule={(hubTab, subSection, targetElementId) => {
                  if (hubTab) setActiveHubTab(hubTab);
                  if (subSection) setEmpresaSubSection(subSection);
                  if (targetElementId) {
                    setTimeout(() => {
                      const el = document.getElementById(targetElementId);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 200);
                  }
                }}
              />
            </div>
          )}

          {/* ==================== MÓDULO 3: POSTULACIONES & CRM ==================== */}
          {activeHubTab === 'postulaciones' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <CompanySettingsAndBackupModule
                currentCommunity={communities[0]}
                activeSubTab="postulaciones"
                postulacionSection={postulacionSection}
                setPostulacionSection={setPostulacionSection}
                hideHeader={true}
                hideNavBar={true}
                hidePostulacionSubNav={true}
                onNavigateToModule={(hubTab, subSection, targetElementId) => {
                  if (hubTab) setActiveHubTab(hubTab);
                  if (subSection) setEmpresaSubSection(subSection);
                  if (targetElementId) {
                    setTimeout(() => {
                      const el = document.getElementById(targetElementId);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 200);
                  }
                }}
              />
            </div>
          )}

          {/* ==================== MÓDULO 4: MI OFICINA (RR.HH., CONTRATOS & PREVIRED) ==================== */}
          {activeHubTab === 'rrhh_oficina' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#0F3D2E]/10 text-[#0F3D2E]">
                      Gestión Interna de la Administradora
                    </span>
                    <h2 className="text-lg font-black text-slate-900">
                      RR.HH. de Mi Oficina: Trabajadores Propios, Contratos e Imposiciones (Previred / SII)
                    </h2>
                    <p className="text-xs text-slate-500 max-w-3xl">
                      Centraliza aquí los contratos laborales, liquidaciones de sueldo, boletas de honorarios e imposiciones previsionales de tus propios asistentes y colaboradores de oficina.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        printDocumentDirectly('printable-office-payroll-sheet', 'ARANPRO_Nomina_Imposiciones_Oficina', {
                          fitPage: true
                        })
                      }
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#0F3D2E]" />
                      <span>Imprimir Planilla RR.HH. Oficina (PDF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddWorkerModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#D4B895]" />
                      <span>+ Registrar Trabajador</span>
                    </button>
                  </div>
                </div>

                {/* KPIs de Nómina de la Oficina */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Dotación de Mi Oficina</span>
                    <strong className="text-xl font-black text-slate-900 mt-0.5 block">{officeWorkers.length} Colaboradores</strong>
                    <span className="text-[11px] text-slate-500">Contrato directo y honorarios</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Haberes / Bruto Mes</span>
                    <strong className="text-xl font-black text-slate-900 mt-0.5 block">{formatCLP(officePayrollMetrics.totalGross)}</strong>
                    <span className="text-[11px] text-slate-500">Base imponible mensual</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[10px] font-bold uppercase text-amber-900 block">Imposiciones Previred & SII</span>
                    <strong className="text-xl font-black text-amber-950 mt-0.5 block">{formatCLP(officePayrollMetrics.totalPreviredAndTax)}</strong>
                    <span className="text-[11px] text-amber-800">AFP + Fonasa/Isapre + AFC + Retención</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">Líquido a Pagar Equipo</span>
                    <strong className="text-xl font-black text-[#0F3D2E] mt-0.5 block">{formatCLP(officePayrollMetrics.totalNet)}</strong>
                    <span className="text-[11px] text-emerald-800">Costo empresa: {formatCLP(officePayrollMetrics.totalEmployerCost)}</span>
                  </div>
                </div>

                {/* Tabla de Nómina e Imposiciones de la Empresa Administradora */}
                <div
                  id="printable-office-payroll-sheet"
                  data-pdf-style={pdfStyle}
                  className="p-6 bg-white rounded-2xl border border-slate-200 space-y-5"
                >
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3">
                    <div className="flex items-center space-x-3.5">
                      <AranproLogo variant="principal" className="h-12 w-auto" />
                      <div className="border-l border-slate-300 pl-3.5 space-y-0.5">
                        <div className="text-xs font-black text-[#0F3D2E] uppercase">
                          {companySettings?.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL INMOBILIARIA'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600 font-bold">
                          {companySettings?.companyRut && !String(companySettings.companyRut).includes('76.999.888') ? `RUT Empresa: ${companySettings.companyRut} • ` : ''}Ley N° 21.442 de Copropiedad Inmobiliaria
                        </div>
                        <div className="text-[9.5px] text-slate-500">
                          Departamento de Recursos Humanos Internos & Cumplimiento Previsional de Oficina
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F4EF] border border-[#D4B895] text-[#0F3D2E] text-[10px] font-mono font-bold">
                        NÓMINA INTERNA OFICINA
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        Control de Contratos e Imposiciones
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#0F3D2E] text-white">
                          <th className="p-2.5 rounded-tl-lg">Colaborador / RUT</th>
                          <th className="p-2.5">Cargo & Función</th>
                          <th className="p-2.5">Vínculo / Previsión</th>
                          <th className="p-2.5 text-right">Sueldo Bruto</th>
                          <th className="p-2.5 text-right">Imposiciones / Ret.</th>
                          <th className="p-2.5 text-right">Líquido a Pago</th>
                          <th className="p-2.5 text-center">Estado Previred</th>
                          <th className="p-2.5 rounded-tr-lg text-center no-print">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {officeWorkers.map((w) => {
                          const gross = Number(w.grossSalary) || 0;
                          const isHonorarios = w.contractType === 'Boleta de Honorarios';
                          const imp = isHonorarios
                            ? Math.round(gross * ((Number(w.afpRate) || 13.75) / 100))
                            : Math.round(gross * (((Number(w.afpRate) || 11) + (Number(w.healthRate) || 7) + 0.6) / 100));
                          const net = gross - imp;
                          return (
                            <tr key={w.id} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <strong className="text-slate-900 block">{w.name}</strong>
                                <span className="font-mono text-[10px] text-slate-500">RUT: {w.rut}</span>
                              </td>
                              <td className="p-2.5">
                                <span className="font-semibold text-slate-800 block">{w.role}</span>
                                <span className="text-[10px] text-slate-500">{w.assignedCommunities}</span>
                              </td>
                              <td className="p-2.5">
                                <span className="font-bold text-[#0F3D2E] block text-[11px]">{w.contractType}</span>
                                <span className="text-[10px] text-slate-500">{w.afpName} • {w.healthSystem}</span>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-800">{formatCLP(gross)}</td>
                              <td className="p-2.5 text-right font-mono text-amber-800 font-semibold">{formatCLP(imp)}</td>
                              <td className="p-2.5 text-right font-mono font-black text-[#0F3D2E]">{formatCLP(net)}</td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ✓ {w.previredStatus}
                                </span>
                              </td>
                              <td className="p-2.5 text-center no-print">
                                <button
                                  type="button"
                                  onClick={() => setOfficeWorkers((prev) => prev.filter((item) => item.id !== w.id))}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                  title="Eliminar registro"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
                    <AranproOfficialSeal size="sm" />
                    <div className="text-center min-w-[230px]">
                      {companySettings?.signatureDataUrl && (
                        <img
                          src={companySettings.signatureDataUrl}
                          alt="Firma Administrador"
                          className="h-14 max-h-16 w-auto object-contain mx-auto mb-1"
                        />
                      )}
                      <div className="border-t border-slate-800 pt-1 text-[10px]">
                        <strong className="text-slate-900 block">{companySettings?.adminName || 'John Andrés Arancibia Maureira'}</strong>
                        <span className="text-slate-500 font-mono">Representante Legal ARANPRO • RNAC N° {companySettings?.rnacNumber || '48.912'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal para agregar colaborador */}
              {showAddWorkerModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-900 uppercase">
                        Registrar Trabajador / Colaborador de Mi Empresa
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddWorkerModal(false)}
                        className="text-slate-400 hover:text-slate-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <form onSubmit={handleCreateWorker} className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                          <input
                            type="text"
                            required
                            value={workerForm.name}
                            onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">RUT *</label>
                          <input
                            type="text"
                            required
                            value={workerForm.rut}
                            onChange={(e) => setWorkerForm({ ...workerForm, rut: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Modalidad Contractual</label>
                          <select
                            value={workerForm.contractType}
                            onChange={(e) => setWorkerForm({ ...workerForm, contractType: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                          >
                            <option value="Contrato Indefinido">Contrato Indefinido</option>
                            <option value="Contrato Plazo Fijo">Contrato Plazo Fijo</option>
                            <option value="Boleta de Honorarios">Boleta de Honorarios (SII)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Cargo en tu Administradora</label>
                          <input
                            type="text"
                            value={workerForm.role}
                            onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Sueldo Bruto / Honorario (CLP)</label>
                          <input
                            type="number"
                            value={workerForm.grossSalary}
                            onChange={(e) => setWorkerForm({ ...workerForm, grossSalary: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                          />
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddWorkerModal(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-[#0F3D2E] text-white font-bold"
                        >
                          Guardar en Mi Oficina
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== MÓDULO 5: CONVENIOS, GREMIOS & PROVEEDORES ==================== */}
          {activeHubTab === 'alianzas' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Convenios con Gremios y Abogados */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0F3D2E] bg-[#D4B895]/30 px-2.5 py-0.5 rounded-full">
                    Ecosistema Gremial
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-1">
                    Convenios con Asociaciones Gremiales, Abogados & OTEC
                  </h2>
                  <p className="text-xs text-slate-500">
                    Red de apoyo institucional para respaldar tu gestión ante comités de administración y juicios de cobranza.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_PARTNER_ALLIANCES.map((al) => (
                    <div key={al.id} className="p-5 rounded-2xl bg-[#FDFBF7] border border-slate-200 space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#0F3D2E] text-[#D4B895]">
                            {al.category}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ {al.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">{al.name}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{al.benefit}</p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">{al.contact}</span>
                        <a
                          href={al.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-black text-[#0F3D2E] hover:underline flex items-center gap-1"
                        >
                          <span>Abrir Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cartera Personal de Proveedores de Confianza */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Directorio Maestro
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    Mi Cartera Personal de Proveedores y Contratistas de Confianza ({trustedProviders.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Empresas de seguridad, bombas, ascensores y técnicos recomendados para tus comunidades.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trustedProviders.map((tp) => (
                    <div key={tp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#D4B895]/30 px-2 py-0.5 rounded">
                            {tp.specialty}
                          </span>
                          <span className="text-[10px] font-black text-amber-600">{tp.rating}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 pt-1">{tp.companyName}</h4>
                        <p className="text-[11px] text-slate-600">Contacto: <strong>{tp.contactPerson}</strong></p>
                        <p className="text-[11px] font-mono text-slate-500">Fono: {tp.phone}</p>
                        <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200 mt-1">
                          "{tp.notes}"
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <a
                          href={`https://wa.me/${(tp.phone || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          💬 WhatsApp
                        </a>
                        <button
                          type="button"
                          onClick={() => setTrustedProviders((prev) => prev.filter((item) => item.id !== tp.id))}
                          className="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulario rápido para agregar proveedor */}
                <form onSubmit={handleAddTrustedProvider} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-[11px] font-black uppercase text-[#0F3D2E] block">
                    + Incorporar Nuevo Proveedor a mi Cartera
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Rubro (ej: Seguridad OS-10)"
                      value={newProviderForm.specialty}
                      onChange={(e) => setNewProviderForm({ ...newProviderForm, specialty: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Nombre Empresa *"
                      value={newProviderForm.companyName}
                      onChange={(e) => setNewProviderForm({ ...newProviderForm, companyName: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Persona de Contacto"
                      value={newProviderForm.contactPerson}
                      onChange={(e) => setNewProviderForm({ ...newProviderForm, contactPerson: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="WhatsApp / Teléfono"
                      value={newProviderForm.phone}
                      onChange={(e) => setNewProviderForm({ ...newProviderForm, phone: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold cursor-pointer"
                    >
                      Guardar Proveedor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================== MÓDULO 6: RESPALDOS & SEGURIDAD ==================== */}
          {activeHubTab === 'respaldos' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <CompanySettingsAndBackupModule
                currentCommunity={communities[0]}
                activeSubTab="respaldos"
                hideHeader={true}
                hideNavBar={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA HABILITAR NUEVA COMUNIDAD */}
      {showNewCommunityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#0F3D2E] block">
                  Incorporación de Cartera ARANPRO
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Habilitar Nueva Comunidad en el Sistema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCommunityModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewCommunity} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Condominio / Edificio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Condominio Mirador del Faro"
                    value={newCommData.name}
                    onChange={(e) => setNewCommData({ ...newCommData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RUT de la Comunidad</label>
                  <input
                    type="text"
                    placeholder="Ej: 65.210.890-2"
                    value={newCommData.communityRut}
                    onChange={(e) => setNewCommData({ ...newCommData, communityRut: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Comunidad</label>
                  <select
                    value={newCommData.type}
                    onChange={(e) => setNewCommData({ ...newCommData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Casas">Condominio de Casas</option>
                    <option value="Edificio">Edificio de Departamentos</option>
                    <option value="Mixto">Mixto</option>
                    <option value="Locales Comerciales">Locales / Oficinas</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Dirección Exacta</label>
                  <input
                    type="text"
                    placeholder="Ej: Av. del Mar 3400"
                    value={newCommData.address}
                    onChange={(e) => setNewCommData({ ...newCommData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Comuna / Ciudad</label>
                  <input
                    type="text"
                    value={newCommData.city}
                    onChange={(e) => setNewCommData({ ...newCommData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad de Unidades</label>
                  <input
                    type="number"
                    min={1}
                    value={newCommData.totalUnits}
                    onChange={(e) => setNewCommData({ ...newCommData, totalUnits: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCommunityModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black"
                >
                  Crear y Abrir Comunidad →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyEnterpriseHub;
