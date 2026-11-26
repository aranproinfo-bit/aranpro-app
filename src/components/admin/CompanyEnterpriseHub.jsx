import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { CompanySettingsAndBackupModule } from './CompanySettingsAndBackupModule';
import { LegalLibraryModule } from './LegalLibraryModule';
import { OfficePayrollAndStaffModule } from './OfficePayrollAndStaffModule';
import { PwaInstallButton } from '../layout/PwaPrompt';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector, useAranproPdfStyle } from '../common/MauranLogo';
import { formatCLP } from '../../utils/formatters';
import { printCommunityLabor } from '../../utils/communityLaborPrint';
import { OfficePayrollPrint } from './OfficePayrollPrint';
import LaborContractDraft from './LaborContractDraft';
import { HelpHeaderButtons, ContextualHelpAssistant } from '../common/ContextualHelpAssistant';
import { PlatformOnboardingTour, ONBOARDING_STORAGE_KEY } from '../common/PlatformOnboardingTour';
import {
  Building2, Briefcase, Users, Award, ShieldCheck, ArrowRight, Plus,
  TrendingUp, Target, GraduationCap, Handshake, Wrench, FileText,
  CheckCircle2, Phone, Mail, ExternalLink, LogOut, Sparkles, Printer,
  Trash2, Check, Key, PenTool, HardHat, Scale, Landmark, DollarSign,
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, Globe, Shield, Database, Calculator,
  FolderOpen, Eye, ClipboardCheck, Presentation, QrCode, Send,
  FileSpreadsheet, Palmtree, Clock, UserMinus, ShieldAlert
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
  const [collapsedHubTabs, setCollapsedHubTabs] = useState({});
  useEffect(() => { setCollapsedHubTabs((prev) => (prev[activeHubTab] ? { ...prev, [activeHubTab]: false } : prev)); }, [activeHubTab]);
  const [empresaSubSection, setEmpresaSubSection] = useState('empresa'); // 'empresa' | 'acreditacion'
  const [postulacionSection, setPostulacionSection] = useState('flujo'); // 'flujo' | 'antecedentes' | 'material' | 'pipeline' | 'herramientas'
  const [officeSubTab, setOfficeSubTab] = useState('nomina');
  const [helpOpen, setHelpOpen] = useState(false);
  const [onboardingTourOpen, setOnboardingTourOpen] = useState(() => {
    try {
      return !localStorage.getItem(ONBOARDING_STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toolboxExpanded, setToolboxExpanded] = useState(true);
  const [funnelExpanded, setFunnelExpanded] = useState(true);
  const [activeFunnelStep, setActiveFunnelStep] = useState(null);
  const [funnelStepRequest, setFunnelStepRequest] = useState(null);
  const FUNNEL_STEPS = [
    { n: 1, label: 'Paso 1 · Primer Contacto' },
    { n: 2, label: 'Paso 2 · Cita & Dossier' },
    { n: 3, label: 'Paso 3 · Propuesta Formal' },
    { n: 4, label: 'Paso 4 · Cierre & Demo QR' },
    { n: 5, label: 'Paso 5 · Adjudicación & Traspaso' },
    { n: 6, label: 'Paso 6 · Recepción de Comunidad' }
  ];

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

  const [officeContractWorker, setOfficeContractWorker] = useState(null);
  const openOfficeContract = worker => {
    const afp = String(worker.afpName || '').toLowerCase();
    const knownAfp = ['habitat','provida','modelo','cuprum','capital','planvital','uno'].find(id=>afp.includes(id)) || '';
    const health = String(worker.healthSystem || '').toLowerCase();
    const healthId = health.includes('fonasa') ? 'fonasa' : health.includes('banmédica') || health.includes('banmedica') ? 'isapre_banmedica' : health.includes('consalud') ? 'isapre_consalud' : health.includes('colmena') ? 'isapre_colmena' : health.includes('cruz') ? 'isapre_cruzblanca' : '';
    setOfficeContractWorker({...worker, afpId:worker.afpId || knownAfp, healthId:worker.healthId || healthId});
  };
  const saveOfficeContract = worker => {
    const updated = officeWorkers.map(item=>item.id===worker.id ? {...item,...worker,grossSalary:item.grossSalary,healthSystem:worker.healthName} : item);
    localStorage.setItem('aranpro_office_workers', JSON.stringify(updated));
    setOfficeWorkers(updated);
  };
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

  // Cálculos ejecutivos de cartera (descontando comunidades ya entregadas en archivo histórico)
  const activePortfolioCommunities = communities.filter((c) => c.handoverStatus !== 'ENTREGADA');
  const archivedHandoverCount = communities.length - activePortfolioCommunities.length;
  const totalCommunities = activePortfolioCommunities.length;
  const totalManagedUnits = activePortfolioCommunities.reduce((acc, c) => acc + (Number(c.totalUnits) || c.units?.length || 0), 0);
  const currentMonthlyFeeCLP = activePortfolioCommunities.reduce((acc, c) => {
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
      id: 'biblioteca_legal',
      label: '6. Biblioteca Legal',
      shortLabel: 'Biblioteca Legal',
      icon: Scale,
      badge: 'Leyes'
    },
    {
      id: 'respaldos',
      label: '7. Respaldos & Seguridad',
      shortLabel: 'Respaldos',
      icon: Database,
      badge: 'Backup'
    }
  ];

  const TOOLBOX_ITEMS = [
    { id: 'calculadora', label: 'Calculadora de Honorarios ARANPRO', icon: Calculator },
    { id: 'inspeccion', label: 'Pauta Inspección Inicial', icon: HardHat },
    { id: 'comparativa', label: 'Cuadro Comparativo', icon: Scale },
    { id: 'demo', label: 'Demo en Vivo & QR', icon: QrCode },
    { id: 'pitch', label: 'Libreto Pitch (10 Min)', icon: Presentation },
  ];

  // Submenús organizados jerárquicamente para Postulaciones & CRM
  const POSTULACION_SUB_ITEMS = [
    { id: 'flujo', label: '1. Guía Paso a Paso (Embudo)', icon: Send },
    { id: 'material', label: '2. Bandeja de Documentos Rápidos', icon: FileText },
    { id: 'pipeline', label: '3. CRM de Postulaciones', icon: Briefcase },
    { id: 'preparacion', label: '4. Checklist & Semáforo', icon: ClipboardCheck },
    {
      id: 'herramientas',
      label: '5. Caja de Herramientas',
      icon: Calculator,
      isGroup: true,
      subItems: TOOLBOX_ITEMS
    }
  ];

  const OFFICE_SUB_ITEMS = [
    { id: 'nomina', label: '1. Nómina Personal', badge: 'Equipo', icon: Users },
    { id: 'liquidaciones', label: '2. Liquidaciones DT', badge: 'Mes', icon: FileSpreadsheet },
    { id: 'previred', label: '3. Planilla Previred', badge: 'Día 13', icon: Landmark },
    { id: 'vacaciones', label: '4. Feriado Legal DT', badge: 'Saldos', icon: Palmtree },
    { id: 'contratos', label: '5. Contratos DT', badge: 'Leyes', icon: FileText },
    { id: 'horas_extras', label: '6. Pactos H. Extras', badge: 'Art. 32', icon: Clock },
    { id: 'finiquitos', label: '7. Finiquitos & Término', badge: 'Cálculo', icon: UserMinus },
    { id: 'riohs', label: '8. Reglamento y Ley Karin', badge: 'Norma', icon: ShieldAlert },
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
                  if (isActive) { setCollapsedHubTabs((prev) => ({ ...prev, [tab.id]: !prev[tab.id] })); return; }
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
              {isActive && !collapsedHubTabs[tab.id] && tab.id === 'postulaciones' && (!sidebarCollapsed || isMobile) && (
                <div className="ml-3 pl-2.5 py-1 space-y-0.5 border-l-2 border-[#D4B895]/40 animate-in fade-in duration-150">
                  {POSTULACION_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;

                    // Grupo Anidado (5. Caja de Herramientas)
                    if (sub.isGroup) {
                      const isToolboxChildActive = ['herramientas', 'calculadora', 'inspeccion', 'comparativa', 'demo', 'pitch'].includes(postulacionSection);
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
                      <div key={sub.id} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (sub.id === 'flujo' && postulacionSection === 'flujo') {
                            setFunnelExpanded((v) => !v);
                            return;
                          }
                          setPostulacionSection(sub.id);
                          if (sub.id === 'flujo') setFunnelExpanded(true);
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
                      {sub.id === 'flujo' && postulacionSection === 'flujo' && funnelExpanded && (
                        <div className="ml-3 pl-2 space-y-0.5 border-l border-[#D4B895]/30">
                          {FUNNEL_STEPS.map((st) => (
                            <button
                              key={st.n}
                              type="button"
                              onClick={() => {
                                setActiveFunnelStep(st.n);
                                setFunnelStepRequest({ step: st.n, nonce: Date.now() });
                                if (isMobile) setMobileSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-[10.5px] font-semibold text-left transition-all cursor-pointer ${
                                activeFunnelStep === st.n
                                  ? 'bg-[#D4B895]/20 text-[#D4B895] font-black'
                                  : 'text-white/70 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 ${activeFunnelStep === st.n ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-white/15 text-white/80'}`}>{st.n}</span>
                              <span className="truncate">{st.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              )}

                              {/* Sub-menú para Mi Oficina (RR.HH.) */}
                {isActive && !collapsedHubTabs[tab.id] && tab.id === 'rrhh_oficina' && (!sidebarCollapsed || isMobile) && (
                  <div className="ml-3 pl-2.5 py-1 space-y-0.5 border-l-2 border-[#D4B895]/40 animate-in fade-in duration-150">
                    {OFFICE_SUB_ITEMS.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = officeSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setOfficeSubTab(sub.id);
                            if (isMobile) setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-[#0A291F] text-[#D4B895] font-black shadow-2xs border border-[#D4B895]/40'
                              : 'text-white/75 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <SubIcon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSubActive ? 'text-[#D4B895]' : 'text-[#D4B895]/70'
                              }`}
                            />
                            <span className="truncate">{sub.label}</span>
                          </div>
                          {sub.badge && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                              isSubActive
                                ? 'bg-[#D4B895] text-[#0F3D2E]'
                                : 'bg-white/10 text-white/70'
                            }`}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Sub-menú para Datos Empresa & RNAC */}
              {isActive && !collapsedHubTabs[tab.id] && tab.id === 'empresa' && (!sidebarCollapsed || isMobile) && (
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
          <HelpHeaderButtons
            isOpen={helpOpen}
            onToggleHelp={() => setHelpOpen((v) => !v)}
            theme="dark"
            compact
          />
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
            <HelpHeaderButtons
              isOpen={helpOpen}
              onToggleHelp={() => setHelpOpen((v) => !v)}
              onOpenOnboardingTour={() => setOnboardingTourOpen(true)}
              theme="dark"
            />
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
                  <span className="text-[11px] text-slate-500">
                    {archivedHandoverCount > 0 ? `Activos (${archivedHandoverCount} en archivo histórico)` : 'Bajo tu administración'}
                  </span>
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
                    const isHandedOver = c.handoverStatus === 'ENTREGADA';
                    return (
                      <div
                        key={c.id}
                        className={`group p-6 rounded-3xl border-2 shadow-xs hover:shadow-xl transition-all space-y-4 flex flex-col justify-between ${
                          isHandedOver
                            ? 'bg-slate-50 border-amber-300/80 opacity-90 hover:opacity-100'
                            : 'bg-[#FDFBF7] hover:bg-white border-slate-200 hover:border-[#0F3D2E]'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E]/10 group-hover:bg-[#0F3D2E] text-[#0F3D2E] group-hover:text-[#D4B895] flex items-center justify-center transition-all shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {c.type} • {totalUnits} Unidades
                              </span>
                              {isHandedOver && (
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                  Archivo Histórico • Entregada
                                </span>
                              )}
                            </div>
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

                        <div className="pt-3 border-t border-slate-200/80 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectCommunityToManage(c.id, 'resumen')}
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
                          <button
                            type="button"
                            onClick={() => onSelectCommunityToManage(c.id, 'traspaso')}
                            className="w-full py-1.5 px-3 rounded-xl border border-[#D4B895]/60 bg-[#D4B895]/15 hover:bg-[#D4B895]/30 text-[#0F3D2E] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-[#0F3D2E]" />
                            <span>Rendición & Traspaso (Ley 21.442)</span>
                          </button>
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
                funnelStepRequest={funnelStepRequest}
                postulacionSection={postulacionSection}
                setPostulacionSection={setPostulacionSection}
                hideHeader={true}
                hideNavBar={true}
                hidePostulacionSubNav={true}
                onSelectCommunityToManage={onSelectCommunityToManage}
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
          {/* ==================== MÓDULO 4: MI OFICINA (RR.HH., CONTRATOS, LIQUIDACIONES & PREVIRED) ==================== */}
          {activeHubTab === 'rrhh_oficina' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <OfficePayrollAndStaffModule activeSubTab={officeSubTab} onSubTabChange={setOfficeSubTab} />
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

          {/* ==================== MÓDULO 6: BIBLIOTECA LEGAL (ayuda del administrador) ==================== */}
          {activeHubTab === 'biblioteca_legal' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <LegalLibraryModule />
            </div>
          )}

          {/* ==================== MÓDULO 7: RESPALDOS & SEGURIDAD ==================== */}
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
      {officeContractWorker && <LaborContractDraft
        key={officeContractWorker.id}
        worker={officeContractWorker}
        employerKind="company"
        community={{id:'aranpro-office',name:companySettings?.brandName || 'Mi oficina',address:companySettings?.legalAddress || '',city:companySettings?.city || '',bankInfo:{holderName:companySettings?.legalName || '',rut:companySettings?.companyRut || ''}}}
        settings={companySettings || {}}
        onSaveWorker={saveOfficeContract}
        onClose={()=>setOfficeContractWorker(null)}
      />}

      <ContextualHelpAssistant
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        workspace="empresa"
        activeTab={activeHubTab}
        activeSubTab={
          activeHubTab === 'empresa'
            ? empresaSubSection
            : activeHubTab === 'postulaciones'
            ? postulacionSection
            : activeHubTab === 'rrhh_oficina'
            ? officeSubTab
            : ''
        }
        onOpenOnboardingTour={() => setOnboardingTourOpen(true)}
        onNavigateToModule={(tabKey) => setActiveHubTab(tabKey)}
      />

      <PlatformOnboardingTour
        isOpen={onboardingTourOpen}
        onClose={() => setOnboardingTourOpen(false)}
        onOpenContextualHelp={() => setHelpOpen(true)}
        onQuickAction={() => {
          setActiveHubTab('empresa');
          setEmpresaSubSection('empresa');
        }}
      />
    </div>
  );
};

export default CompanyEnterpriseHub;
